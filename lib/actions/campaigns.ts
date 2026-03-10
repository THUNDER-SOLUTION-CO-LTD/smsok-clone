"use server";

import { revalidatePath } from "next/cache";
import { prisma as db } from "../db";
import { createCampaignSchema, paginationSchema, calculateSmsCount, normalizePhone } from "../validations";
import { sendSmsBatch } from "../sms-gateway";

export async function getCampaigns(userId: string, filters?: unknown) {
  const pagination = filters ? paginationSchema.parse(filters) : { page: 1, limit: 20 };
  const skip = (pagination.page - 1) * pagination.limit;

  const [campaigns, total] = await db.$transaction([
    db.campaign.findMany({
      where: { userId },
      include: {
        contactGroup: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pagination.limit,
    }),
    db.campaign.count({ where: { userId } }),
  ]);

  return {
    campaigns,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

export async function createCampaign(userId: string, data: unknown) {
  const payload = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const input = createCampaignSchema.parse({
    ...payload,
    contactGroupId: payload.contactGroupId || undefined,
    templateId: payload.templateId || undefined,
    scheduledAt: payload.scheduledAt || undefined,
  });

  let totalRecipients = 0;

  if (input.contactGroupId) {
    const group = await db.contactGroup.findFirst({
      where: { id: input.contactGroupId, userId },
      include: { _count: { select: { members: true } } },
    });
    if (!group) throw new Error("ไม่พบกลุ่มรายชื่อ");
    totalRecipients = group._count.members;
  }

  if (input.templateId) {
    const template = await db.messageTemplate.findFirst({
      where: { id: input.templateId, userId },
      select: { id: true },
    });
    if (!template) throw new Error("ไม่พบเทมเพลตข้อความ");
  }

  if (input.senderName && input.senderName !== "EasySlip") {
    const sender = await db.senderName.findFirst({
      where: { userId, name: input.senderName, status: "approved" },
      select: { id: true },
    });
    if (!sender) throw new Error("ชื่อผู้ส่งยังไม่ได้รับอนุมัติ");
  }

  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { credits: true },
  });

  if (totalRecipients > user.credits) {
    throw new Error(`เครดิตไม่เพียงพอสำหรับแคมเปญนี้ (ต้องใช้ ${totalRecipients} เครดิต)`);
  }

  const campaign = await db.campaign.create({
    data: {
      userId,
      name: input.name,
      contactGroupId: input.contactGroupId,
      templateId: input.templateId,
      senderName: input.senderName || "EasySlip",
      status: input.scheduledAt ? "scheduled" : "draft",
      scheduledAt: input.scheduledAt,
      totalRecipients,
      creditReserved: totalRecipients,
    },
    include: {
      contactGroup: { select: { id: true, name: true } },
      template: { select: { id: true, name: true } },
    },
  });

  revalidatePath("/dashboard/campaigns");
  return campaign;
}

export async function executeCampaign(userId: string, campaignId: string) {
  // 1. Fetch campaign with contacts and template
  const campaign = await db.campaign.findFirst({
    where: { id: campaignId, userId },
    include: {
      contactGroup: {
        include: {
          members: { include: { contact: { select: { id: true, phone: true } } } },
        },
      },
      template: { select: { content: true } },
    },
  });

  if (!campaign) throw new Error("ไม่พบแคมเปญ");
  if (campaign.status !== "draft" && campaign.status !== "scheduled") {
    throw new Error("แคมเปญนี้ไม่อยู่ในสถานะที่สามารถส่งได้");
  }
  if (!campaign.contactGroup) throw new Error("แคมเปญนี้ไม่มีกลุ่มรายชื่อ");
  if (!campaign.template) throw new Error("แคมเปญนี้ไม่มีเทมเพลตข้อความ");

  const phones = campaign.contactGroup.members.map((m) => m.contact.phone);
  if (phones.length === 0) throw new Error("กลุ่มรายชื่อไม่มีสมาชิก");

  const message = campaign.template.content;
  const senderName = campaign.senderName || "EasySlip";
  const smsCount = calculateSmsCount(message);
  const totalCredits = smsCount * phones.length;

  // 2. Check credits
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { credits: true },
  });

  if (user.credits < totalCredits) {
    throw new Error(`เครดิตไม่เพียงพอ (ต้องใช้ ${totalCredits} เครดิต, คงเหลือ ${user.credits})`);
  }

  // 3. Mark as running + deduct credits + create messages
  await db.$transaction(async (tx) => {
    await tx.campaign.update({
      where: { id: campaignId },
      data: { status: "running", startedAt: new Date() },
    });

    await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: totalCredits } },
    });

    await tx.message.createMany({
      data: phones.map((phone) => ({
        userId,
        campaignId,
        recipient: normalizePhone(phone),
        content: message,
        senderName,
        creditCost: smsCount,
        status: "pending",
      })),
    });
  });

  // 4. Send SMS in batches of 1000
  const normalizedPhones = phones.map(normalizePhone);
  let sentCount = 0;
  let failedCount = 0;
  const sentRecipients: string[] = [];
  const failedRecipients: string[] = [];

  for (let i = 0; i < normalizedPhones.length; i += 1000) {
    const batch = normalizedPhones.slice(i, i + 1000);
    try {
      const result = await sendSmsBatch({
        recipients: batch,
        message,
        sender: senderName,
      });
      if (result.success) {
        sentCount += batch.length;
        sentRecipients.push(...batch);
      } else {
        failedCount += batch.length;
        failedRecipients.push(...batch);
      }
    } catch {
      failedCount += batch.length;
      failedRecipients.push(...batch);
    }
  }

  // 5. Update message statuses
  if (sentRecipients.length > 0) {
    await db.message.updateMany({
      where: { campaignId, recipient: { in: sentRecipients }, status: "pending" },
      data: { status: "sent", sentAt: new Date() },
    });
  }
  if (failedRecipients.length > 0) {
    await db.message.updateMany({
      where: { campaignId, recipient: { in: failedRecipients }, status: "pending" },
      data: { status: "failed" },
    });
  }

  // 6. Refund failed credits + create ledger entries
  const refundCredits = smsCount * failedCount;
  const consumedCredits = smsCount * sentCount;
  const finalBalance = user.credits - totalCredits;

  const ops = [];
  if (failedCount > 0) {
    ops.push(
      db.user.update({
        where: { id: userId },
        data: { credits: { increment: refundCredits } },
      }),
      db.creditTransaction.create({
        data: {
          userId,
          amount: refundCredits,
          balance: finalBalance + refundCredits,
          type: "REFUND",
          description: `Campaign "${campaign.name}" — ${failedCount} failed, credits refunded`,
        },
      })
    );
  }
  if (sentCount > 0) {
    ops.push(
      db.creditTransaction.create({
        data: {
          userId,
          amount: -consumedCredits,
          balance: finalBalance,
          type: "SMS_SEND",
          description: `Campaign "${campaign.name}" — sent to ${sentCount} recipients`,
        },
      })
    );
  }
  if (ops.length > 0) {
    await db.$transaction(ops);
  }

  // 7. Update campaign status + counts
  const finalStatus = failedCount === phones.length ? "failed" : "completed";
  await db.campaign.update({
    where: { id: campaignId },
    data: {
      status: finalStatus,
      sentCount,
      failedCount,
      creditUsed: consumedCredits,
      completedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/campaigns");
  return {
    status: finalStatus,
    totalRecipients: phones.length,
    sentCount,
    failedCount,
    creditUsed: consumedCredits,
    creditRefunded: refundCredits,
  };
}

export async function getCampaignProgress(userId: string, campaignId: string) {
  const campaign = await db.campaign.findFirst({
    where: { id: campaignId, userId },
    select: {
      status: true,
      totalRecipients: true,
      sentCount: true,
      deliveredCount: true,
      failedCount: true,
      creditUsed: true,
    },
  });

  if (!campaign) throw new Error("ไม่พบแคมเปญ");
  return campaign;
}
