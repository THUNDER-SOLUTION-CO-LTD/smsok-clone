"use server";

import { prisma } from "@/lib/db";
import { sendSingleSms } from "@/lib/sms-gateway";

const MAX_SCHEDULE_DAYS_AHEAD = 30;

export async function createScheduledSms(
  userId: string,
  data: {
    senderName: string;
    recipient: string;
    message: string;
    scheduledAt: string; // ISO 8601
  }
) {
  // Validate phone
  if (!/^0[689]\d{8}$/.test(data.recipient)) {
    throw new Error("หมายเลขโทรศัพท์ไม่ถูกต้อง");
  }

  if (!data.message || data.message.length === 0) {
    throw new Error("กรุณาระบุข้อความ");
  }

  const scheduledAt = new Date(data.scheduledAt);
  const now = new Date();

  if (isNaN(scheduledAt.getTime())) {
    throw new Error("วันเวลาไม่ถูกต้อง");
  }

  if (scheduledAt <= now) {
    throw new Error("เวลาต้องเป็นอนาคต");
  }

  const maxDate = new Date(now.getTime() + MAX_SCHEDULE_DAYS_AHEAD * 24 * 60 * 60 * 1000);
  if (scheduledAt > maxDate) {
    throw new Error(`ตั้งเวลาล่วงหน้าได้ไม่เกิน ${MAX_SCHEDULE_DAYS_AHEAD} วัน`);
  }

  // Calculate credit cost
  const smsCount = Math.ceil(data.message.length / 70);

  // Check credits
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user || user.credits < smsCount) {
    throw new Error(`เครดิตไม่เพียงพอ (ต้องการ ${smsCount} เครดิต)`);
  }

  // HOLD: deduct credits now
  const [scheduled] = await prisma.$transaction([
    prisma.scheduledSms.create({
      data: {
        userId,
        senderName: data.senderName || "EasySlip",
        recipient: data.recipient,
        content: data.message,
        scheduledAt,
        creditCost: smsCount,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: smsCount } },
    }),
  ]);

  return {
    id: scheduled.id,
    recipient: scheduled.recipient,
    scheduledAt: scheduled.scheduledAt.toISOString(),
    status: scheduled.status,
    creditCost: smsCount,
  };
}

export async function getScheduledSms(userId: string) {
  return prisma.scheduledSms.findMany({
    where: { userId },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      senderName: true,
      recipient: true,
      content: true,
      scheduledAt: true,
      status: true,
      creditCost: true,
      errorCode: true,
      createdAt: true,
    },
  });
}

export async function cancelScheduledSms(userId: string, id: string) {
  const sms = await prisma.scheduledSms.findUnique({ where: { id } });

  if (!sms || sms.userId !== userId) {
    throw new Error("ไม่พบข้อความ");
  }

  if (sms.status !== "pending") {
    throw new Error("ยกเลิกได้เฉพาะข้อความที่ยังไม่ได้ส่ง");
  }

  // Cancel + REFUND credits
  await prisma.$transaction([
    prisma.scheduledSms.update({
      where: { id },
      data: { status: "cancelled" },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: sms.creditCost } },
    }),
  ]);

  return { success: true, creditsRefunded: sms.creditCost };
}

/**
 * Process due scheduled messages — called by cron job
 * Finds all pending messages where scheduledAt <= now, sends them
 */
export async function processScheduledSms() {
  const now = new Date();

  const dueMessages = await prisma.scheduledSms.findMany({
    where: {
      status: "pending",
      scheduledAt: { lte: now },
    },
    take: 50, // batch size
  });

  const results = { sent: 0, failed: 0 };

  for (const sms of dueMessages) {
    try {
      const result = await sendSingleSms(sms.recipient, sms.content, sms.senderName);

      if (result.success) {
        await prisma.scheduledSms.update({
          where: { id: sms.id },
          data: {
            status: "sent",
            messageId: result.jobId || null,
          },
        });
        results.sent++;
      } else {
        // REFUND on failure
        await prisma.$transaction([
          prisma.scheduledSms.update({
            where: { id: sms.id },
            data: {
              status: "failed",
              errorCode: result.error?.slice(0, 100) || "unknown",
            },
          }),
          prisma.user.update({
            where: { id: sms.userId },
            data: { credits: { increment: sms.creditCost } },
          }),
        ]);
        results.failed++;
      }
    } catch (err) {
      // REFUND on exception
      await prisma.$transaction([
        prisma.scheduledSms.update({
          where: { id: sms.id },
          data: {
            status: "failed",
            errorCode: err instanceof Error ? err.message.slice(0, 100) : "unknown",
          },
        }),
        prisma.user.update({
          where: { id: sms.userId },
          data: { credits: { increment: sms.creditCost } },
        }),
      ]);
      results.failed++;
    }
  }

  return { processed: dueMessages.length, ...results };
}
