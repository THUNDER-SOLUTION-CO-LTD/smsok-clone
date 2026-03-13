import { ApiError, apiError, apiResponse, authenticateRequest } from "@/lib/api-auth";
import { NextRequest } from "next/server";
import { prisma as db } from "@/lib/db";
import { orderDetailSelect } from "@/lib/orders/api";
import { serializeOrder } from "@/lib/orders/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await authenticateRequest(req);

    const { id } = await ctx.params;
    const order = await db.order.findFirst({
      where: { id, userId: user.id },
      select: orderDetailSelect,
    });
    if (!order) throw new ApiError(404, "ไม่พบคำสั่งซื้อ");

    return apiResponse(serializeOrder(order));
  } catch (error) {
    return apiError(error);
  }
}
