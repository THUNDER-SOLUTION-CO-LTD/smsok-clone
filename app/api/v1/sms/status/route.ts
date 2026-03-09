import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { getMessageStatus } from "@/lib/actions/sms";

// GET /api/v1/sms/status?id=xxx
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiResponse({ error: "Missing message id" }, 400);
    }

    const message = await getMessageStatus(user.id, id);
    return apiResponse(message);
  } catch (error) {
    return apiError(error);
  }
}
