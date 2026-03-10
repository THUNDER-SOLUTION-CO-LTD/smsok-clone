import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

// POST /api/v1/admin/backfill-refunds
// One-time backfill: find all failed messages without a matching REFUND creditTransaction
// and create refund records + restore user credits.
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    if (user.role !== "admin") {
      throw new ApiError(403, "Admin only");
    }

    // Find all REFUND transactions to know which messages are already refunded
    const existingRefunds = await prisma.creditTransaction.findMany({
      where: { type: "REFUND", refId: { not: null } },
      select: { refId: true },
    });
    const refundedMessageIds = new Set(existingRefunds.map((r) => r.refId));

    // Find all failed messages that have no refund
    const failedMessages = await prisma.message.findMany({
      where: { status: "failed" },
      select: { id: true, userId: true, creditCost: true, recipient: true, createdAt: true },
    });

    const unrefunded = failedMessages.filter((m) => !refundedMessageIds.has(m.id));

    if (unrefunded.length === 0) {
      return apiResponse({ message: "No unrefunded failed messages found", backfilled: 0 });
    }

    // Group by userId for batch credit restore
    const byUser = new Map<string, typeof unrefunded>();
    for (const m of unrefunded) {
      const list = byUser.get(m.userId) || [];
      list.push(m);
      byUser.set(m.userId, list);
    }

    let totalBackfilled = 0;

    for (const [userId, messages] of byUser) {
      const totalRefund = messages.reduce((sum, m) => sum + m.creditCost, 0);

      // Get current balance for ledger
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      });
      if (!currentUser) continue;

      const newBalance = currentUser.credits + totalRefund;

      // Create refund transactions + restore credits in one transaction
      await prisma.$transaction([
        // Restore credits
        prisma.user.update({
          where: { id: userId },
          data: { credits: { increment: totalRefund } },
        }),
        // Create individual refund ledger entries
        ...messages.map((m) =>
          prisma.creditTransaction.create({
            data: {
              userId,
              amount: m.creditCost,
              balance: newBalance, // approximate — all entries share final balance
              type: "REFUND",
              description: `Backfill refund: SMS failed to ${m.recipient}`,
              refId: m.id,
            },
          })
        ),
      ]);

      totalBackfilled += messages.length;
    }

    return apiResponse({
      message: `Backfilled ${totalBackfilled} refunds across ${byUser.size} users`,
      backfilled: totalBackfilled,
      users: byUser.size,
    });
  } catch (error) {
    return apiError(error);
  }
}
