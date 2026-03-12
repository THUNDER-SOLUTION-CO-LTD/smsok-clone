import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { orderDetailSelect } from "@/lib/orders/api";
import { serializeOrder } from "@/lib/orders/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const { id } = await ctx.params;
    const order = await db.order.findFirst({
      where: { id, userId: session.id },
      select: orderDetailSelect,
    });
    if (!order) throw new ApiError(404, "ไม่พบคำสั่งซื้อ");

    return apiResponse(serializeOrder(order));
  } catch (error) {
    return apiError(error);
  }
}
