import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { generateOtp_, verifyOtp_ } from "@/lib/actions/otp";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

// POST /api/v1/otp — generate or verify OTP
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const body = await req.json();

    if (body.action === "verify") {
      // Verify OTP — stricter rate limit
      const limit = checkRateLimit(user.id, "otp_verify");
      if (!limit.allowed) return rateLimitResponse(limit.resetIn);

      const result = await verifyOtp_(user.id, body.phone, body.code);
      return apiResponse(result);
    }

    // Generate OTP
    const limit = checkRateLimit(user.id, "otp_generate");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    const result = await generateOtp_(user.id, body.phone, body.purpose);
    return apiResponse(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
