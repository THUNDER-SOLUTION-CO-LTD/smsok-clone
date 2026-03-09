import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { uploadSlip } from "@/lib/actions/payments";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);

    const limit = checkRateLimit(user.id, "slip");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    const body = await req.json();

    const result = await uploadSlip(body.transactionId, body.slipUrl);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
