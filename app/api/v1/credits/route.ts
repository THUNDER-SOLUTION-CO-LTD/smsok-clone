import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";

// GET /api/v1/credits — check credit balance
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    return apiResponse({
      credits: user.credits,
      userId: user.id,
    });
  } catch (error) {
    return apiError(error);
  }
}
