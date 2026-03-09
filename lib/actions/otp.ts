"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendSingleSms } from "@/lib/sms-gateway";
import { normalizePhone, sendOtpSchema, verifyOtpSchema } from "@/lib/validations";
import crypto from "crypto";
import { Prisma } from "@prisma/client";

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const MAX_OTP_PER_PHONE_PER_WINDOW = 3; // 3 per 5 min (architect spec #100)
const OTP_RATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const OTP_CREDIT_COST = 1;

type GenerateOtpOptions = {
  debug?: boolean;
};

function getOtpHashSecret(): string {
  const explicitSecret = process.env.OTP_HASH_SECRET?.trim();
  if (explicitSecret) return explicitSecret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("OTP_HASH_SECRET is not configured");
  }

  return process.env.JWT_SECRET || "smsok-otp-dev-secret";
}

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function generateRefCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

function hashOtp(code: string, refCode: string): string {
  return crypto
    .createHmac("sha256", getOtpHashSecret())
    .update(`${refCode}:${code}`)
    .digest("hex");
}

function timingSafeMatch(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function hasSmsGatewayCredentials(): boolean {
  return Boolean(
    process.env.SMS_API_USERNAME?.trim() &&
    process.env.SMS_API_PASSWORD?.trim()
  );
}

async function requireSessionUserId() {
  const user = await getSession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user.id;
}

export async function generateOtp_(
  userId: string,
  phone: string,
  purpose: string = "verify",
  options: GenerateOtpOptions = {}
) {
  const input = sendOtpSchema.parse({ phone, purpose });
  const normalizedPhone = normalizePhone(input.phone);
  const debugMode = options.debug === true && process.env.NODE_ENV !== "production";

  // Rate limit: max 3 OTPs per phone per 5 min (architect spec #100)
  const windowStart = new Date(Date.now() - OTP_RATE_WINDOW_MS);
  const recentCount = await prisma.otpRequest.count({
    where: { phone: normalizedPhone, createdAt: { gte: windowStart } },
  });

  if (recentCount >= MAX_OTP_PER_PHONE_PER_WINDOW) {
    throw new Error("ส่ง OTP มากเกินไป กรุณารอ 5 นาที");
  }

  // Check user credits
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user || user.credits < OTP_CREDIT_COST) {
    throw new Error("เครดิตไม่เพียงพอ");
  }

  const code = generateOtp();
  const refCode = generateRefCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  const codeHash = hashOtp(code, refCode);

  // Create OTP record + deduct credit in transaction
  let otpRecord: { id: string; refCode: string; phone: string; purpose: string; expiresAt: Date };
  let updatedUser: { credits: number };

  try {
    [otpRecord, updatedUser] = await prisma.$transaction([
      prisma.otpRequest.create({
        data: {
          userId,
          refCode,
          phone: normalizedPhone,
          code: codeHash,
          purpose: input.purpose,
          expiresAt,
        },
        select: {
          id: true,
          refCode: true,
          phone: true,
          purpose: true,
          expiresAt: true,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: OTP_CREDIT_COST } },
        select: { credits: true },
      }),
    ]);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("สร้าง OTP ไม่สำเร็จ กรุณาลองใหม่");
    }
    throw error;
  }

  // Send OTP via SMS
  const message = `รหัส OTP ของคุณคือ ${code} (หมดอายุใน 5 นาที)`;
  let delivery: "sms" | "debug" = "sms";
  if (debugMode && !hasSmsGatewayCredentials()) {
    // Localhost testing path: keep Prisma flow real, expose the OTP instead of requiring SMS infra.
    delivery = "debug";
  } else {
    try {
      const result = await sendSingleSms(input.phone, message, "EasySlip");
      if (!result.success) {
        throw new Error(result.error || "ส่ง OTP ไม่สำเร็จ กรุณาลองใหม่");
      }
    } catch {
      // Refund credit on send failure
      await prisma.$transaction([
        prisma.otpRequest.delete({ where: { id: otpRecord.id } }),
        prisma.user.update({
          where: { id: userId },
          data: { credits: { increment: OTP_CREDIT_COST } },
        }),
      ]);
      throw new Error("ส่ง OTP ไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  return {
    id: otpRecord.id,
    ref: otpRecord.refCode,
    phone: otpRecord.phone,
    purpose: otpRecord.purpose,
    expiresAt: otpRecord.expiresAt.toISOString(),
    expiresIn: Math.floor(OTP_EXPIRY_MS / 1000),
    creditUsed: OTP_CREDIT_COST,
    creditsRemaining: updatedUser.credits,
    delivery,
    ...(debugMode && { debugCode: code }),
  };
}

export async function verifyOtp_(
  userId: string,
  ref: string,
  code: string
) {
  const input = verifyOtpSchema.parse({ ref, code });

  const otp = await prisma.otpRequest.findFirst({
    where: {
      userId,
      refCode: input.ref,
    },
    select: {
      id: true,
      refCode: true,
      phone: true,
      code: true,
      purpose: true,
      attempts: true,
      verified: true,
      expiresAt: true,
    },
  });

  if (!otp) {
    throw new Error("ไม่พบ OTP นี้");
  }

  if (otp.verified) {
    throw new Error("OTP นี้ถูกใช้งานแล้ว");
  }

  if (otp.expiresAt.getTime() < Date.now()) {
    throw new Error("OTP หมดอายุแล้ว");
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    throw new Error("OTP ถูกล็อคแล้ว กรุณาขอรหัสใหม่");
  }

  const isValid = timingSafeMatch(hashOtp(input.code, otp.refCode), otp.code);

  if (!isValid) {
    const updated = await prisma.otpRequest.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });
    const remaining = Math.max(0, MAX_ATTEMPTS - updated.attempts);
    if (remaining === 0) {
      throw new Error("OTP ไม่ถูกต้อง และถูกล็อคแล้ว กรุณาขอรหัสใหม่");
    }
    throw new Error(`OTP ไม่ถูกต้อง (เหลือ ${remaining} ครั้ง)`);
  }

  await prisma.otpRequest.update({
    where: { id: otp.id },
    data: { verified: true },
  });

  return {
    valid: true,
    verified: true,
    ref: otp.refCode,
    phone: otp.phone,
    purpose: otp.purpose,
  };
}

export async function generateOtpForSession(data: unknown) {
  const userId = await requireSessionUserId();
  const input = sendOtpSchema.parse(data);
  return generateOtp_(userId, input.phone, input.purpose);
}

export async function verifyOtpForSession(data: unknown) {
  const userId = await requireSessionUserId();
  const input = verifyOtpSchema.parse(data);
  return verifyOtp_(userId, input.ref, input.code);
}
