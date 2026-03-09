import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    return apiResponse({ credits: user.credits });
  } catch (error) {
    return apiError(error);
  }
}
