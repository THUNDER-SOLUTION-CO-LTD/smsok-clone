import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { loginAdmin } from "@/lib/admin-auth";
import { getClientIp } from "@/lib/session-utils";
import { loginSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);

    const { applyRateLimit } = await import("@/lib/rate-limit");
    const rl = await applyRateLimit(ip, "admin_login");
    if (rl.blocked) return rl.blocked;

    const body = await req.json();
    const { email, password } = loginSchema.parse(body);
    const result = await loginAdmin(email, password);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
