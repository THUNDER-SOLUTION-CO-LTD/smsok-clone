"use server";

import { revalidatePath } from "next/cache";
import { prisma as db } from "../db";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อกลุ่ม").max(100),
});

export async function getGroups(userId: string) {
  return db.contactGroup.findMany({
    where: { userId },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createGroup(userId: string, data: unknown) {
  const input = createGroupSchema.parse(data);
  const group = await db.contactGroup.create({
    data: { userId, name: input.name },
  });
  revalidatePath("/dashboard/groups");
  return group;
}

export async function updateGroup(userId: string, groupId: string, data: unknown) {
  const input = createGroupSchema.parse(data);
  const existing = await db.contactGroup.findFirst({ where: { id: groupId, userId } });
  if (!existing) throw new Error("ไม่พบกลุ่ม");
  const updated = await db.contactGroup.update({
    where: { id: groupId },
    data: { name: input.name },
  });
  revalidatePath("/dashboard/groups");
  return updated;
}

export async function deleteGroup(userId: string, groupId: string) {
  const existing = await db.contactGroup.findFirst({ where: { id: groupId, userId } });
  if (!existing) throw new Error("ไม่พบกลุ่ม");
  await db.contactGroup.delete({ where: { id: groupId } });
  revalidatePath("/dashboard/groups");
}
