/**
 * Package Quota Management — FIFO SMS deduction
 * Replaces credit system entirely
 */

import { prisma as db } from "@/lib/db";
import { throwInsufficientCredits } from "@/lib/quota-errors";
export { calculateSmsSegments, getSmsSegmentMetrics } from "@/lib/sms-segmentation";

/**
 * Get total remaining SMS across all active packages for a user (FIFO order)
 */
export async function getRemainingQuota(userId: string) {
  const packages = await db.packagePurchase.findMany({
    where: {
      userId,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
    include: { tier: { select: { name: true, tierCode: true, senderNameLimit: true } } },
    orderBy: { expiresAt: "asc" }, // FIFO — earliest expiry first
  });

  let totalSms = 0;
  let totalUsed = 0;
  let totalRemaining = 0;
  let maxSenderNames = 0;

  for (const pkg of packages) {
    const remaining = pkg.smsTotal - pkg.smsUsed;
    totalSms += pkg.smsTotal;
    totalUsed += pkg.smsUsed;
    totalRemaining += remaining;
    // Sender name limit: take max across all active packages, null = unlimited
    if (pkg.tier.senderNameLimit === null) {
      maxSenderNames = -1; // unlimited
    } else if (maxSenderNames !== -1) {
      maxSenderNames = Math.max(maxSenderNames, pkg.tier.senderNameLimit);
    }
  }

  return {
    packages,
    totalSms,
    totalUsed,
    totalRemaining,
    senderNameLimit: maxSenderNames === -1 ? null : maxSenderNames,
  };
}

export async function ensureSufficientQuota(userId: string, smsRequired: number) {
  const quota = await getRemainingQuota(userId);
  if (quota.totalRemaining < smsRequired) {
    throwInsufficientCredits(smsRequired, quota.totalRemaining);
  }
  return quota;
}

/**
 * Deduct SMS quota from packages using FIFO (earliest expiry first)
 * Must be called inside a $transaction
 */
export async function deductQuota(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  userId: string,
  smsCount: number,
): Promise<{ success: boolean; deductions: Array<{ purchaseId: string; amount: number }> }> {
  const now = new Date();
  const packages = await tx.packagePurchase.findMany({
    where: {
      userId,
      isActive: true,
      expiresAt: { gt: now },
    },
    orderBy: { expiresAt: "asc" }, // FIFO
  });

  const availableTotal = packages.reduce(
    (sum, pkg) => sum + Math.max(0, pkg.smsTotal - pkg.smsUsed),
    0,
  );

  if (availableTotal < smsCount) {
    throwInsufficientCredits(smsCount, availableTotal);
  }

  let remaining = smsCount;
  const deductions: Array<{ purchaseId: string; amount: number }> = [];

  for (const pkg of packages) {
    if (remaining <= 0) break;
    while (remaining > 0) {
      const currentPackage = await tx.packagePurchase.findUnique({
        where: { id: pkg.id },
        select: {
          id: true,
          smsTotal: true,
          smsUsed: true,
          isActive: true,
          expiresAt: true,
        },
      });

      if (
        !currentPackage ||
        !currentPackage.isActive ||
        currentPackage.expiresAt.getTime() <= now.getTime()
      ) {
        break;
      }

      const available = currentPackage.smsTotal - currentPackage.smsUsed;
      if (available <= 0) break;

      const deduct = Math.min(available, remaining);
      const deductionResult = await tx.packagePurchase.updateMany({
        where: {
          id: currentPackage.id,
          isActive: true,
          expiresAt: { gt: now },
          smsUsed: { lte: currentPackage.smsTotal - deduct },
        },
        data: { smsUsed: { increment: deduct } },
      });

      if (deductionResult.count !== 1) {
        continue;
      }

      deductions.push({ purchaseId: currentPackage.id, amount: deduct });
      remaining -= deduct;
      break;
    }
  }

  if (remaining > 0) {
    throwInsufficientCredits(smsCount, smsCount - remaining);
  }

  return { success: true, deductions };
}

/**
 * Refund quota for delivery failures (Business tier D+ only)
 * Must be called inside a $transaction
 */
export async function refundQuota(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  purchaseId: string,
  smsCount: number,
): Promise<void> {
  await tx.packagePurchase.update({
    where: { id: purchaseId },
    data: { smsUsed: { decrement: smsCount } },
  });
}

/**
 * Check if a purchase tier qualifies for delivery-failure refund (tier D+)
 */
const REFUND_ELIGIBLE_TIERS = new Set(["D", "E", "F", "G", "H"]);
export function isRefundEligible(tierCode: string): boolean {
  return REFUND_ELIGIBLE_TIERS.has(tierCode);
}

/**
 * Refund quota only if the package tier is eligible (D+ Business tier).
 * Use this for delivery/send failures where tier check is required.
 * Returns true if refund was applied, false if tier ineligible.
 */
export async function refundQuotaIfEligible(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  purchaseId: string,
  smsCount: number,
): Promise<boolean> {
  const purchase = await tx.packagePurchase.findUnique({
    where: { id: purchaseId },
    include: { tier: { select: { tierCode: true } } },
  });
  if (!purchase || !isRefundEligible(purchase.tier.tierCode)) {
    return false;
  }
  await refundQuota(tx, purchaseId, smsCount);
  return true;
}

/**
 * Create trial package for new user signup
 */
export async function createTrialPackage(userId: string) {
  // Find the trial tier
  let trialTier = await db.packageTier.findFirst({
    where: { isTrial: true, isActive: true },
  });

  // Fallback: create trial tier if not exists
  if (!trialTier) {
    trialTier = await db.packageTier.upsert({
      where: { tierCode: "TRIAL" },
      update: {},
      create: {
        name: "Trial",
        tierCode: "TRIAL",
        price: 0,
        smsQuota: 15,
        bonusPercent: 0,
        totalSms: 15,
        senderNameLimit: 1,
        expiryMonths: 1,
        isTrial: true,
        isActive: true,
        sortOrder: -1,
      },
    });
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + trialTier.expiryMonths);

  return db.packagePurchase.create({
    data: {
      userId,
      tierId: trialTier.id,
      smsTotal: trialTier.totalSms,
      smsUsed: 0,
      expiresAt,
      isActive: true,
    },
  });
}
