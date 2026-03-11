"use server";

import { prisma as db } from "../db";
import { updateAutoTopupSchema } from "../validations";

// ==========================================
// Get auto-topup config
// ==========================================

export async function getAutoTopup(userId: string) {
  const config = await db.autoTopup.findUnique({
    where: { userId },
    select: {
      id: true,
      enabled: true,
      threshold: true,
      packageId: true,
      maxPerMonth: true,
      usedThisMonth: true,
      package: {
        select: { id: true, name: true, credits: true, price: true },
      },
    },
  });

  return config;
}

// ==========================================
// Update auto-topup config (upsert)
// ==========================================

export async function updateAutoTopup(userId: string, data: unknown) {
  const input = updateAutoTopupSchema.parse(data);

  // Verify package exists and is active
  const pkg = await db.creditPackage.findFirst({
    where: { id: input.packageId, active: true },
  });
  if (!pkg) throw new Error("ไม่พบแพ็กเกจที่เลือก");

  const config = await db.autoTopup.upsert({
    where: { userId },
    create: {
      userId,
      enabled: input.enabled,
      threshold: input.threshold,
      packageId: input.packageId,
      maxPerMonth: input.maxPerMonth,
    },
    update: {
      enabled: input.enabled,
      threshold: input.threshold,
      packageId: input.packageId,
      maxPerMonth: input.maxPerMonth,
    },
    select: {
      id: true,
      enabled: true,
      threshold: true,
      packageId: true,
      maxPerMonth: true,
      usedThisMonth: true,
    },
  });

  return config;
}
