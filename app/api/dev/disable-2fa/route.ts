import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { reset2FARateLimit } from "@/lib/two-factor";

const DEFAULT_TEST_EMAIL = "demo@smsok.local";

const disable2FaSchema = z.object({
  challengeToken: z.string().min(1).optional(),
  email: z.string().email().optional(),
}).refine(
  (value) => Boolean(value.challengeToken || value.email),
  { message: "challengeToken หรือ email จำเป็นต้องมีอย่างน้อย 1 ค่า" },
);

function hasValidDevSecret(req: NextRequest) {
  const devSecret = process.env.E2E_DEV_SECRET ?? process.env.DEV_SECRET;
  if (!devSecret) return false;

  return req.headers.get("x-dev-secret") === devSecret;
}

function resolveUserIdFromChallengeToken(challengeToken: string) {
  const payload = jwt.verify(challengeToken, env.JWT_SECRET);
  if (
    !payload ||
    typeof payload !== "object" ||
    payload.purpose !== "2fa-challenge" ||
    typeof payload.userId !== "string"
  ) {
    throw new Error("challengeToken ไม่ถูกต้อง");
  }

  return payload.userId;
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 },
    );
  }

  try {
    if (!hasValidDevSecret(req)) {
      return NextResponse.json(
        { error: "DEV_SECRET required" },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const input = disable2FaSchema.parse(body);

    const userId = input.challengeToken
      ? resolveUserIdFromChallengeToken(input.challengeToken)
      : null;
    const email = input.email?.trim().toLowerCase() || DEFAULT_TEST_EMAIL;

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    const result = await prisma.twoFactorAuth.deleteMany({
      where: { userId: user.id },
    });

    await reset2FARateLimit(user.id);

    return NextResponse.json({
      ok: true,
      userId: user.id,
      email: user.email,
      disabled: result.count > 0,
      guardMode: "dev_secret",
    });
  } catch (error) {
    console.error("[dev/disable-2fa]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
