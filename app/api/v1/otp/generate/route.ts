import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { generateOtp_ } from "@/lib/actions/otp";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

// POST /api/v1/otp/generate
// Body: { phone: "0891234567", purpose?: "verify" | "login" | "transaction" }
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);

    const limit = checkRateLimit(user.id, "otp_generate");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    const body = await req.json();
    const result = await generateOtp_(user.id, body.phone, body.purpose);
    return apiResponse(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
