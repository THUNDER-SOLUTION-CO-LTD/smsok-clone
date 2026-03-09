import { NextRequest } from "next/server";
import { apiError } from "@/lib/api-auth";
import { handleSendOtp, handleVerifyOtp, isVerifyOtpRequest } from "@/lib/otp-api";

// POST /api/v1/otp — generate or verify OTP
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (isVerifyOtpRequest(body)) {
      return handleVerifyOtp(req, body);
    }
    return handleSendOtp(req, body);
  } catch (error) {
    return apiError(error);
  }
}
