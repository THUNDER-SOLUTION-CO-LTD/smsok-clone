import { NextRequest } from "next/server";
import { apiSensitiveError } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";
import { getJobStatus } from "@/lib/sms-gateway";
import { dispatchWebhookEvent } from "@/lib/webhook-dispatch";
import { logger } from "@/lib/logger";

const CRON_SECRET = process.env.CRON_SECRET;

// GET /api/cron/sms/status — poll EasyThunder for delivery status of sent messages
// Call every 5–10 minutes via cron: curl -H "Authorization: Bearer $CRON_SECRET" .../api/cron/sms/status
export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
      return Response.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
    }

    // Find messages still in "sent" state with a gatewayId, sent within last 24h
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pendingMessages = await db.message.findMany({
      where: {
        status: "sent",
        gatewayId: { not: null },
        sentAt: { gte: cutoff },
      },
      select: {
        id: true,
        userId: true,
        gatewayId: true,
        recipient: true,
      },
      take: 100, // process max 100 per run
      orderBy: { sentAt: "asc" },
    });

    if (pendingMessages.length === 0) {
      return Response.json({ processed: 0, message: "No sent messages to check" });
    }

    let delivered = 0;
    let failed = 0;
    let skipped = 0;

    for (const msg of pendingMessages) {
      if (!msg.gatewayId) continue;

      try {
        const jobStatus = await getJobStatus(msg.gatewayId);

        if ((jobStatus.totalDelivered ?? 0) > 0) {
          // Delivered
          await db.message.update({
            where: { id: msg.id },
            data: { status: "delivered", deliveredAt: new Date() },
          });
          dispatchWebhookEvent(msg.userId, "sms.delivered", {
            messageId: msg.id,
            phone: msg.recipient,
            providerMsgId: msg.gatewayId,
          });
          delivered++;
        } else if ((jobStatus.totalFailed ?? 0) > 0) {
          // Failed
          await db.message.update({
            where: { id: msg.id },
            data: { status: "failed", errorCode: "DELIVERY_FAILED" },
          });
          dispatchWebhookEvent(msg.userId, "sms.failed", {
            messageId: msg.id,
            phone: msg.recipient,
            providerMsgId: msg.gatewayId,
          });
          failed++;
        } else {
          // Still in progress
          skipped++;
        }
      } catch (err) {
        logger.warn("cron/sms/status: failed to check job", {
          messageId: msg.id,
          gatewayId: msg.gatewayId,
          error: err instanceof Error ? err.message : String(err),
        });
        skipped++;
      }
    }

    return Response.json({
      processed: pendingMessages.length,
      delivered,
      failed,
      skipped,
    });
  } catch (error) {
    return apiSensitiveError(error);
  }
}
