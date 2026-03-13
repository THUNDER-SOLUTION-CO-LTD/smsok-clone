import { NextRequest } from "next/server";
import { handleSendOtp } from "@/lib/otp-api";
import { getClientIp } from "@/lib/session-utils";

// POST /api/v1/otp/send
// Body: { phone: "0891234567", purpose?: "verify" | "login" | "transaction" }
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const { applyRateLimit } = await import("@/lib/rate-limit");
  const rl = await applyRateLimit(ip, "otp_send");
  if (rl.blocked) return rl.blocked;

  return handleSendOtp(req);
}
