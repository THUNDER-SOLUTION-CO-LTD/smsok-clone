import { NextRequest } from "next/server";
import { apiError, apiResponse } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { createTag, getTags } from "@/lib/actions/tags";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticatePublicApiKey(req);
    const tags = await getTags(user.id);
    return apiResponse({ tags });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticatePublicApiKey(req);
    const limit = checkRateLimit(user.id, "api");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    const body = await req.json();
    const tag = await createTag(user.id, body);
    return apiResponse(tag, 201);
  } catch (error) {
    return apiError(error);
  }
}
