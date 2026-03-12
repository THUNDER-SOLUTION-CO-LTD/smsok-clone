import { NextRequest } from "next/server";
import { apiError, apiResponse, ApiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { z } from "zod";

const purchaseSchema = z.object({
  slipId: z.string().min(1, "กรุณาระบุ slipId"),
  credits: z.coerce.number().int().positive().optional(),
  amount: z.coerce.number().positive().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const body = await req.json().catch(() => {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    });
    const input = purchaseSchema.parse(body);

    const payment = await db.payment.findFirst({
      where: {
        id: input.slipId,
        userId: session.id,
      },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        invoiceNumber: true,
        invoiceUrl: true,
        packageTier: {
          select: {
            id: true,
            name: true,
            tierCode: true,
            totalSms: true,
          },
        },
      },
    });

    if (!payment) {
      throw new ApiError(404, "ไม่พบรายการเติมเครดิตที่ยืนยันสลิปแล้ว");
    }

    return apiResponse({
      transactionId: payment.id,
      paymentId: payment.id,
      status: payment.status,
      verified: payment.status === "COMPLETED",
      matchedPackage: payment.packageTier?.name ?? null,
      tierCode: payment.packageTier?.tierCode ?? null,
      smsAdded: payment.packageTier?.totalSms ?? input.credits ?? 0,
      amount: (payment.totalAmount ?? 0) / 100,
      invoiceNumber: payment.invoiceNumber,
      invoiceUrl: payment.invoiceUrl,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function GET() {
  return apiError(new ApiError(405, "Method not allowed"));
}
