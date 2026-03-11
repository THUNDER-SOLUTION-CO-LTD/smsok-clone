import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { getAutoTopup, updateAutoTopup } from "@/lib/actions/auto-topup";

// GET /api/v1/auto-topup — get auto-topup config
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const config = await getAutoTopup(user.id);
    return apiResponse({ autoTopup: config });
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/v1/auto-topup — update auto-topup config
export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const body = await req.json();
    const result = await updateAutoTopup(user.id, body);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
