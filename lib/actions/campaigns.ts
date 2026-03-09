"use server";

import { revalidatePath } from "next/cache";
import { prisma as db } from "../db";
import { createCampaignSchema, paginationSchema } from "../validations";

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
