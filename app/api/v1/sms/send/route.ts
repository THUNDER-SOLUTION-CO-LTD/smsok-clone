import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { sendSms, sendBatchSms } from "@/lib/actions/sms";

// POST /api/v1/sms/send — send single or batch SMS (exposes real errors vs Server Action digest)
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const body = await req.json();

    const isBatch = Array.isArray(body.recipients);

    const result = isBatch
      ? await sendBatchSms(user.id, body)
      : await sendSms(user.id, body);

    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
