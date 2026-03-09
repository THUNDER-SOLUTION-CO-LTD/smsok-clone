import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { getProfile, updateProfile, changePassword } from "@/lib/actions/settings";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const profile = await getProfile(user.id);
    return apiResponse(profile);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const body = await req.json();

    if (body.currentPassword) {
      const result = await changePassword(user.id, body);
      return apiResponse(result);
    }

    const updated = await updateProfile(user.id, body);
    return apiResponse(updated);
  } catch (error) {
    return apiError(error);
  }
}
