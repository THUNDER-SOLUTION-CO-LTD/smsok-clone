import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError, authenticateRequest } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/v1/invoices/:id — get invoice detail
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const user = await authenticateRequest(req);

    const { id } = await ctx.params;

    const invoice = await db.invoice.findFirst({
      where: { id, userId: user.id },
    });
    if (!invoice) throw new ApiError(404, "ไม่พบใบแจ้งหนี้");

    return apiResponse(invoice);
  } catch (error) {
    return apiError(error);
  }
}
