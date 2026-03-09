import { NextRequest } from "next/server";
import { getSession } from "./auth";
import { ApiError, authenticateApiKey } from "./api-auth";

export async function authenticateRequestUser(req: NextRequest) {
  const sessionUser = await getSession();
  if (sessionUser) {
    return sessionUser;
  }

  try {
    return await authenticateApiKey(req);
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(401, "Unauthorized");
    }
    throw error;
  }
}
