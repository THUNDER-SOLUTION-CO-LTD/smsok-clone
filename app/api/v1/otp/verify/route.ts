import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { verifyOtp_ } from "@/lib/actions/otp";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

// POST /api/v1/otp/verify
// Body: { phone: "0891234567", code: "123456" }
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);

    const limit = checkRateLimit(user.id, "otp_verify");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    const body = await req.json();
    const result = await verifyOtp_(user.id, body.phone, body.code);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
