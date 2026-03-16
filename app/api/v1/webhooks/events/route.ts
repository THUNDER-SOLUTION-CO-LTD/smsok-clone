import { NextRequest } from "next/server";
import { apiResponse, apiError, authenticateRequest } from "@/lib/api-auth";
import { EVENT_PRESETS, WEBHOOK_EVENT_GROUPS, WEBHOOK_EVENT_REGISTRY } from "@/lib/webhook-events";

// GET /api/v1/webhooks/events — canonical event registry
export async function GET(req: NextRequest) {
  try {
    await authenticateRequest(req);
    return apiResponse({
      events: WEBHOOK_EVENT_REGISTRY,
      groups: WEBHOOK_EVENT_GROUPS,
      presets: EVENT_PRESETS,
    });
  } catch (error) {
    return apiError(error);
  }
}
