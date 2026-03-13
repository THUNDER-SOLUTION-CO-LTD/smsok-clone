import { NextRequest } from "next/server";
import { getSession } from "./auth";
import { ApiError, authenticateApiKey } from "./api-auth";

export async function authenticateRequestUser(req: NextRequest) {
  const sessionUser = await getSession({ headers: req.headers });
  if (sessionUser) {
    return sessionUser;
  }

  try {
    return await authenticateApiKey(req);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    }
    throw error;
  }
}
