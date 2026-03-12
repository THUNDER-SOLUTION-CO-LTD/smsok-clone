import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { verifySlipByBase64 } from "@/lib/easyslip";
import { COMPANY_ACCOUNT_DIGITS } from "@/lib/constants/bank-account";
import {
  calculatePaymentAmounts,
  generatePaymentDocumentNumber,
  getUserPrimaryOrganizationId,
} from "@/lib/payments/documents";
import { z } from "zod";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const TOPUP_STATUSES = [
  "PENDING",
  "PROCESSING",
  "PENDING_REVIEW",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
  "EXPIRED",
] as const;

const legacyTopupSchema = z.object({
  packageId: z.string().trim().min(1).optional(),
  credits: z.preprocess(
    (value) => (value === "" || value == null ? undefined : Number(value)),
    z.number().int().positive().optional(),
  ),
  amount: z.preprocess(
    (value) => (value === "" || value == null ? undefined : Number(value)),
    z.number().positive().optional(),
  ),
  date: z.string().trim().optional(),
  time: z.string().trim().optional(),
  note: z.string().trim().max(500).optional(),
});

type LegacyTopupInput = z.infer<typeof legacyTopupSchema>;

type TierRecord = {
  id: string;
  name: string;
  tierCode: string;
  price: { toNumber(): number } | number;
  smsQuota: number;
  totalSms: number;
  bonusPercent: number;
  expiryMonths: number;
  isActive: boolean;
};

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

async function readUpload(req: NextRequest): Promise<{
  payload: string;
  slipUrl: string;
  fileName: string | null;
  fileSize: number | null;
  input: LegacyTopupInput;
}> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("slip");
    if (!(file instanceof File)) {
      throw new ApiError(400, "กรุณาแนบไฟล์สลิป");
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new ApiError(400, "รองรับเฉพาะ JPG, PNG, PDF");
    }

    const payload = await fileToBase64(file);
    const input = legacyTopupSchema.parse({
      packageId: formData.get("packageId"),
      credits: formData.get("credits"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      time: formData.get("time"),
      note: formData.get("note"),
    });

    return {
      payload,
      slipUrl: `data:${file.type};base64,${payload}`,
      fileName: file.name,
      fileSize: file.size,
      input,
    };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "กรุณาส่งข้อมูล JSON หรือ multipart/form-data");
  }

  const payload = typeof (body as { payload?: unknown }).payload === "string"
    ? (body as { payload: string }).payload
    : null;
  if (!payload) {
    throw new ApiError(400, "กรุณาแนบสลิปแบบ base64 ใน field 'payload'");
  }

  const input = legacyTopupSchema.parse(body);
  const approxBytes = Math.ceil((payload.length * 3) / 4);

  return {
    payload,
    slipUrl: `data:application/octet-stream;base64,${payload}`,
    fileName: "slip-base64",
    fileSize: approxBytes,
    input,
  };
}

function toBahtNumber(value: { toNumber(): number } | number) {
  return typeof value === "number" ? value : value.toNumber();
}

function buildCompatResponse(payment: {
  id: string;
  status: string;
  invoiceNumber?: string | null;
  invoiceUrl?: string | null;
  packageTier?: { name: string; tierCode: string; totalSms: number } | null;
}) {
  return {
    slipId: payment.id,
    paymentId: payment.id,
    transactionId: payment.id,
    status: payment.status,
    verified: payment.status === "COMPLETED",
    matchedPackage: payment.packageTier?.name ?? null,
    tierCode: payment.packageTier?.tierCode ?? null,
    smsAdded: payment.status === "COMPLETED" ? payment.packageTier?.totalSms ?? 0 : 0,
    invoiceNumber: payment.invoiceNumber ?? null,
    invoiceUrl: payment.invoiceUrl ?? null,
  };
}

function checkReceiverAccount(account: string | null | undefined) {
  if (!account) {
    return {
      matches: false,
      error: "receiver_account_missing",
      note: "Receiver account missing from slip payload",
    };
  }

  const normalized = account.replace(/\D/g, "");
  if (normalized !== COMPANY_ACCOUNT_DIGITS) {
    return {
      matches: false,
      error: "receiver_mismatch",
      note: "Receiver account mismatch",
    };
  }

  return {
    matches: true,
    error: null,
    note: null,
  };
}

async function resolveTier(input: LegacyTopupInput): Promise<TierRecord | null> {
  const select = {
    id: true,
    name: true,
    tierCode: true,
    price: true,
    smsQuota: true,
    totalSms: true,
    bonusPercent: true,
    expiryMonths: true,
    isActive: true,
  } as const;

  if (input.packageId) {
    const packageId = input.packageId.trim();
    const byId = packageId.length > 10
      ? await db.packageTier.findUnique({ where: { id: packageId }, select })
      : await db.packageTier.findUnique({
          where: { tierCode: packageId.toUpperCase() },
          select,
        });
    if (byId?.isActive) {
      return byId as TierRecord;
    }
  }

  if (input.credits) {
    const byCredits = await db.packageTier.findFirst({
      where: {
        isActive: true,
        isTrial: false,
        OR: [{ totalSms: input.credits }, { smsQuota: input.credits }],
      },
      orderBy: { sortOrder: "asc" },
      select,
    });
    if (byCredits) {
      return byCredits as TierRecord;
    }
  }

  if (input.amount) {
    const tiers = await db.packageTier.findMany({
      where: { isActive: true, isTrial: false },
      orderBy: { sortOrder: "asc" },
      select,
    });

    const postedTotalSatang = Math.round(input.amount * 100);
    const matched = tiers.find((tier) => {
      const priceSatang = Math.round(toBahtNumber(tier.price) * 100);
      const totals = calculatePaymentAmounts(priceSatang, false);
      return Math.abs(totals.totalAmount - postedTotalSatang) <= 100;
    });

    if (matched) {
      return matched as TierRecord;
    }
  }

  return null;
}

// POST /api/v1/payments/topup/verify-slip — verify slip image
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const { applyRateLimit } = await import("@/lib/rate-limit");
    const rl = await applyRateLimit(session.id, "topup_verify");
    if (rl.blocked) return rl.blocked;

    const upload = await readUpload(req);
    const tier = await resolveTier(upload.input);
    if (!tier) {
      throw new ApiError(400, "ไม่พบแพ็กเกจที่ตรงกับยอดหรือจำนวน SMS ที่เลือก");
    }

    const baseAmountSatang = Math.round(toBahtNumber(tier.price) * 100);
    const totals = calculatePaymentAmounts(baseAmountSatang, false);
    if (upload.input.amount) {
      const postedTotalSatang = Math.round(upload.input.amount * 100);
      if (Math.abs(totals.totalAmount - postedTotalSatang) > 100) {
        throw new ApiError(400, "ยอดโอนไม่ตรงกับแพ็กเกจที่เลือก");
      }
    }

    const verification = await verifySlipByBase64(upload.payload);
    const duplicateRef = verification.success && verification.data?.transRef
      ? await Promise.all([
          db.payment.findFirst({
            where: { idempotencyKey: verification.data.transRef },
            select: { id: true },
          }),
          db.transaction.findFirst({
            where: {
              reference: verification.data.transRef,
              status: { in: ["verified", "VERIFIED"] },
            },
            select: { id: true },
          }),
        ])
      : [null, null] as const;

    const duplicateId = duplicateRef[0]?.id ?? duplicateRef[1]?.id ?? null;
    const receiverCheck = verification.success
      ? checkReceiverAccount(verification.data?.receiver.account)
      : { matches: false, error: null, note: null };
    const detectedSatang = verification.success && verification.data
      ? Math.round(verification.data.amount * 100)
      : null;
    const amountMatch = detectedSatang != null
      ? Math.abs(detectedSatang - totals.totalAmount) <= 100
      : false;

    const status: (typeof TOPUP_STATUSES)[number] =
      verification.success && verification.data
        ? duplicateId
          ? "PENDING_REVIEW"
          : amountMatch && receiverCheck.matches
            ? "COMPLETED"
            : "PENDING_REVIEW"
        : verification.error === "fake"
          ? "FAILED"
          : "PENDING_REVIEW";

    const organizationId = await getUserPrimaryOrganizationId(session.id);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const preInvoiceNumber = await generatePaymentDocumentNumber("pre-invoice");
    const invoiceNumber = status === "COMPLETED"
      ? await generatePaymentDocumentNumber("invoice")
      : null;
    const historyNote =
      status === "COMPLETED"
        ? "EasySlip verified from legacy v1 topup flow"
        : duplicateId
          ? `Duplicate slip reference already used by ${duplicateId}`
          : verification.success && verification.data
            ? amountMatch
              ? receiverCheck.note ?? "Receiver account verification failed"
              : `Amount mismatch: expected ${totals.totalAmount}, got ${detectedSatang}`
            : `EasySlip: ${verification.error ?? "verification pending manual review"}`;

    const payment = await db.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          userId: session.id,
          organizationId,
          packageTierId: tier.id,
          amount: totals.amountSatang,
          vatAmount: totals.vatAmount,
          totalAmount: totals.totalAmount,
          method: "BANK_TRANSFER",
          status,
          slipUrl: upload.slipUrl,
          slipFileName: upload.fileName,
          slipFileSize: upload.fileSize,
          easyslipVerified: verification.success,
          easyslipResponse: verification as never,
          easyslipAmount: detectedSatang,
          easyslipBank: verification.data?.receiver.bank ?? null,
          easyslipDate: verification.data?.date ? new Date(verification.data.date) : null,
          hasWht: false,
          whtAmount: 0,
          netPayAmount: totals.totalAmount,
          expiresAt,
          preInvoiceNumber,
          invoiceNumber,
          paidAt: status === "COMPLETED" ? now : null,
          creditsAdded: tier.totalSms,
          idempotencyKey: verification.data?.transRef ?? null,
          metadata: {
            source: "legacy-v1-topup",
            submittedDate: upload.input.date ?? null,
            submittedTime: upload.input.time ?? null,
            note: upload.input.note ?? null,
          },
        },
        select: {
          id: true,
          status: true,
          invoiceNumber: true,
          invoiceUrl: true,
          packageTier: {
            select: {
              name: true,
              tierCode: true,
              totalSms: true,
            },
          },
        },
      });

      const preInvoiceUrl = `/api/payments/${created.id}/pre-invoice?download=1`;
      const invoiceUrl =
        status === "COMPLETED" && invoiceNumber
          ? `/api/payments/${created.id}/invoice?download=1`
          : null;

      const updated = await tx.payment.update({
        where: { id: created.id },
        data: {
          preInvoiceUrl,
          ...(invoiceUrl ? { invoiceUrl } : {}),
        },
        select: {
          id: true,
          status: true,
          invoiceNumber: true,
          invoiceUrl: true,
          packageTier: {
            select: {
              name: true,
              tierCode: true,
              totalSms: true,
            },
          },
        },
      });

      await tx.paymentHistory.create({
        data: {
          paymentId: created.id,
          toStatus: "PENDING",
          changedBy: "system",
          note: "Legacy v1 topup created payment record",
        },
      });

      await tx.paymentHistory.create({
        data: {
          paymentId: created.id,
          fromStatus: "PENDING",
          toStatus: status,
          changedBy: "system",
          note: historyNote,
        },
      });

      if (status === "COMPLETED") {
        const purchaseExpiresAt = new Date(now);
        purchaseExpiresAt.setMonth(purchaseExpiresAt.getMonth() + tier.expiryMonths);

        await tx.packagePurchase.create({
          data: {
            userId: session.id,
            organizationId,
            tierId: tier.id,
            smsTotal: tier.totalSms,
            smsUsed: 0,
            expiresAt: purchaseExpiresAt,
            isActive: true,
            transactionId: created.id,
          },
        });
      }

      return updated;
    });

    return apiResponse(buildCompatResponse(payment));
  } catch (error) {
    return apiError(error);
  }
}
