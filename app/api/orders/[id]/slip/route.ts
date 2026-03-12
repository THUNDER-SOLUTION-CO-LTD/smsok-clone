import { verifySlipByBase64 } from "@/lib/easyslip";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import {
  buildSlipDataUrl,
  buildSlipFileKey,
  orderSummarySelect,
} from "@/lib/orders/api";
import { createOrderHistory, serializeOrderSlip, serializeOrderV2 } from "@/lib/orders/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const { id } = await ctx.params;
    const order = await db.order.findFirst({
      where: { id, userId: session.id },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        payAmount: true,
        hasWht: true,
        whtCertUrl: true,
      },
    });
    if (!order) throw new ApiError(404, "ไม่พบคำสั่งซื้อ");
    if (order.status === "EXPIRED" || order.expiresAt < new Date()) {
      throw new ApiError(400, "คำสั่งซื้อนี้หมดอายุแล้ว");
    }
    if (!["PENDING_PAYMENT", "VERIFYING"].includes(order.status)) {
      throw new ApiError(400, "คำสั่งซื้อนี้ไม่สามารถแนบสลิปได้");
    }

    const formData = await req.formData();
    const slip = formData.get("slip");
    const whtCert = formData.get("wht_cert");

    if (!(slip instanceof File) || slip.size === 0) {
      throw new ApiError(400, "กรุณาแนบสลิป");
    }
    if (!["image/jpeg", "image/png"].includes(slip.type)) {
      throw new ApiError(400, "รองรับเฉพาะไฟล์ JPEG หรือ PNG");
    }
    if (slip.size > 5 * 1024 * 1024) {
      throw new ApiError(400, "ไฟล์สลิปต้องไม่เกิน 5MB");
    }
    if (order.hasWht && (!(whtCert instanceof File) || whtCert.size === 0) && !order.whtCertUrl) {
      throw new ApiError(400, "กรุณาแนบใบหัก ณ ที่จ่าย (50 ทวิ)");
    }

    const slipBuffer = Buffer.from(await slip.arrayBuffer());
    const slipUrl = buildSlipDataUrl(slip, slip.type || "image/png", slipBuffer);
    const slipKey = buildSlipFileKey(order.id, slip);

    let whtCertUrl: string | null = order.whtCertUrl;
    if (whtCert instanceof File && whtCert.size > 0) {
      const whtBuffer = Buffer.from(await whtCert.arrayBuffer());
      whtCertUrl = buildSlipDataUrl(whtCert, whtCert.type || "application/pdf", whtBuffer);
    }

    const verification = await verifySlipByBase64(slipUrl);
    const amountMatch =
      verification.success && verification.data
        ? Math.abs(verification.data.amount - Number(order.payAmount)) <= 1
        : false;

    const result = await db.$transaction(async (tx) => {
      const createdSlip = await tx.orderSlip.create({
        data: {
          orderId: order.id,
          fileUrl: slipUrl,
          fileKey: slipKey,
          fileSize: slip.size,
          fileType: slip.type || "image/png",
        },
        select: {
          id: true,
          fileUrl: true,
          fileKey: true,
          fileSize: true,
          fileType: true,
          uploadedAt: true,
          verifiedAt: true,
          verifiedBy: true,
          deletedAt: true,
        },
      });

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "VERIFYING",
          slipUrl,
          slipFileName: slip.name,
          slipFileSize: slip.size,
          whtCertUrl,
          whtCertVerified: whtCertUrl ? null : false,
          easyslipVerified: amountMatch,
          easyslipResponse: verification.success ? verification.data : { error: verification.error ?? "verification_failed" },
        },
        select: orderSummarySelect,
      });

      await createOrderHistory(tx, order.id, "VERIFYING", {
        fromStatus: order.status,
        changedBy: session.id,
        note: amountMatch
          ? "Slip uploaded and matched amount, awaiting verification"
          : "Slip uploaded and awaiting verification",
      });

      return { createdSlip, updatedOrder };
    });

    return apiResponse({
      ...serializeOrderV2(result.updatedOrder),
      latest_slip: serializeOrderSlip(result.createdSlip),
    });
  } catch (error) {
    return apiError(error);
  }
}
