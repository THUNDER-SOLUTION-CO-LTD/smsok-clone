import { NextRequest } from "next/server";
import { ApiError, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { renderOrderInvoicePdf } from "@/lib/orders/pdf";
import { applyRateLimit } from "@/lib/rate-limit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const orderSelect = {
  id: true,
  orderNumber: true,
  customerType: true,
  packageName: true,
  smsCount: true,
  taxName: true,
  taxId: true,
  taxAddress: true,
  taxBranchType: true,
  taxBranchNumber: true,
  netAmount: true,
  vatAmount: true,
  totalAmount: true,
  hasWht: true,
  whtAmount: true,
  payAmount: true,
  invoiceNumber: true,
  paidAt: true,
  createdAt: true,
  user: {
    select: {
      email: true,
      phone: true,
    },
  },
} as const;

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(session.id, "invoice_pdf");
    if (rl.blocked) return rl.blocked;

    const { id } = await ctx.params;
    const order = await db.order.findFirst({
      where: { id, userId: session.id },
      select: orderSelect,
    });
    if (!order || !order.invoiceNumber) {
      throw new ApiError(404, "ไม่พบใบกำกับภาษี");
    }

    const pdfBuffer = await renderOrderInvoicePdf(order);
    const download = req.nextUrl.searchParams.get("download") === "1";

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        ...rl.headers,
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${order.invoiceNumber}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
