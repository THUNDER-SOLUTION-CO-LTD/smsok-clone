import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { getApprovedSenderNames } from "@/lib/actions/sender-names";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const senders = await getApprovedSenderNames(user.id);
    return apiResponse({ senders: senders.map((s) => s.name) });
  } catch (error) {
    return apiError(error);
  }
}
