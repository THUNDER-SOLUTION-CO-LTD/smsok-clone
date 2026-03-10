import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { getContactActivity } from "@/lib/actions/activity";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/v1/contacts/:id/activity?page=1&limit=20&type=sms|otp|credit
export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await authenticateApiKey(req);
    const { id: contactId } = await ctx.params;
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const type = searchParams.get("type") || undefined;

    if (type && !["sms", "otp", "credit"].includes(type)) {
      throw new Error("type ต้องเป็น sms, otp, หรือ credit");
    }

    const result = await getContactActivity(user.id, contactId, { page, limit, type });
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
