"use server";

import { prisma as db } from "../db";
import { revalidatePath } from "next/cache";
import { changePasswordSchema } from "../validations";
import { hashPassword, verifyPassword } from "../auth";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร").max(100).trim(),
  phone: z
    .string()
    .regex(/^0[689]\d{8}$/, "เบอร์โทรไม่ถูกต้อง")
    .optional()
    .or(z.literal("")),
});

// ==========================================
// Update profile (name, phone)
// ==========================================

export async function updateProfile(userId: string, data: unknown) {
  const input = updateProfileSchema.parse(data);

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      phone: input.phone || null,
    },
    select: { id: true, name: true, email: true, phone: true },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return updated;
}

// ==========================================
// Change password
// ==========================================

export async function changePassword(userId: string, data: unknown) {
  const input = changePasswordSchema.parse(data);

  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { password: true },
  });

  const isValid = await verifyPassword(input.currentPassword, user.password);
  if (!isValid) {
    throw new Error("รหัสผ่านปัจจุบันไม่ถูกต้อง");
  }

  const hashed = await hashPassword(input.newPassword);
  await db.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ==========================================
// Get profile
// ==========================================

export async function getProfile(userId: string) {
  return db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      credits: true,
      role: true,
      createdAt: true,
    },
  });
}
