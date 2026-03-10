import { NextRequest } from "next/server";
import { authenticateApiKey, ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { sendSms } from "@/lib/actions/sms";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sendSmsApiSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);

    const limit = checkRateLimit(user.id, "sms");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const input = sendSmsApiSchema.parse(body);
    const message = await sendSms(user.id, {
      senderName: input.sender,
      recipient: input.to,
      message: input.message,
    }, "API");

    return apiResponse({
      id: message.id,
      status: message.status,
      credits_used: message.creditCost,
      credits_remaining: user.credits - message.creditCost,
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}
