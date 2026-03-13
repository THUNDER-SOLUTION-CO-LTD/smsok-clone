import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiError, apiResponse, ApiError } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/session-utils";
import { normalizePhone } from "@/lib/validations";

const emailSchema = z.string().trim().email();
const phoneSchema = z.string().trim().min(9).max(20);

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = await applyRateLimit(ip, "auth_register");
  if (rl.blocked) return rl.blocked;

  try {
    const emailRaw = req.nextUrl.searchParams.get("email");
    const phoneRaw = req.nextUrl.searchParams.get("phone");

    if (!emailRaw && !phoneRaw) {
      throw new ApiError(400, "กรุณาระบุ email หรือ phone");
    }
    if (emailRaw && phoneRaw) {
      throw new ApiError(400, "ตรวจสอบได้ทีละ field");
    }

    if (emailRaw) {
      const email = emailSchema.parse(emailRaw);
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      return apiResponse({
        field: "email",
        available: !existing,
        message: existing ? "อีเมลนี้ถูกใช้แล้ว" : "อีเมลนี้ใช้ได้",
      });
    }

    const normalizedPhone = normalizePhone(phoneSchema.parse(phoneRaw));
    const existing = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
      select: { id: true },
    });

    return apiResponse({
      field: "phone",
      available: !existing,
      message: existing ? "เบอร์นี้ถูกใช้แล้ว" : "เบอร์นี้ใช้ได้",
    });
  } catch (error) {
    return apiError(error);
  }
}
