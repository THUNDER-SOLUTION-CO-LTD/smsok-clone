import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [recentMessages, recentTopups] = await Promise.all([
    prisma.message.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, recipient: true, status: true, createdAt: true, content: true },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id, status: "verified" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, credits: true, amount: true, createdAt: true },
    }),
  ]);

  const items = [
    ...recentMessages.map((m) => ({
      id: `msg_${m.id}`,
      type: m.status === "sent" || m.status === "delivered" ? "sms_success" : m.status === "failed" ? "sms_failed" : "sms_pending",
      message:
        m.status === "sent" || m.status === "delivered"
          ? `ส่ง SMS ถึง ${m.recipient} สำเร็จ`
          : m.status === "failed"
          ? `ส่ง SMS ถึง ${m.recipient} ล้มเหลว`
          : `กำลังส่ง SMS ถึง ${m.recipient}`,
      createdAt: m.createdAt.toISOString(),
      read: false,
    })),
    ...recentTopups.map((t) => ({
      id: `txn_${t.id}`,
      type: "topup",
      message: `เติมเครดิต ${t.credits.toLocaleString()} เครดิต สำเร็จ`,
      createdAt: t.createdAt.toISOString(),
      read: false,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return NextResponse.json({ items, unreadCount: items.length });
}
