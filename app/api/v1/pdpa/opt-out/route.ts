import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { prisma as db } from "@/lib/db";
import { env } from "@/lib/env";
import { processOptOut, getOptOutLogs } from "@/lib/actions/pdpa";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (token) {
      const payload = verifyOptOutToken(token);
      const contact = await db.contact.findFirst({
        where: { userId: payload.userId, phone: payload.phone },
        select: {
          phone: true,
          consentStatus: true,
          optOutAt: true,
        },
      });

      return apiResponse({
        valid: true,
        phone: maskPhone(payload.phone),
        optedOut: contact?.consentStatus === "OPTED_OUT",
        optOutAt: contact?.optOutAt ?? null,
      });
    }

    const user = await authenticatePublicApiKey(req);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const logs = await getOptOutLogs(user.id, null, page, limit);
    return apiResponse(logs);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (token) {
      const payload = verifyOptOutToken(token);
      let body: Record<string, unknown> = {};
      try {
        body = await req.json() as Record<string, unknown>;
      } catch {}

      const result = await processOptOut(payload.userId, payload.orgId ?? null, {
        phone: payload.phone,
        method: typeof body.method === "string" ? body.method : "link",
        keyword: typeof body.keyword === "string" ? body.keyword : undefined,
      });
      return apiResponse(result, 200);
    }

    const user = await authenticatePublicApiKey(req);
    const body = await req.json();
    const result = await processOptOut(user.id, null, body);
    return apiResponse(result, 201);
  } catch (error) {
    return apiError(error);
  }
}

type OptOutTokenPayload = {
  userId: string;
  phone: string;
  orgId?: string | null;
  purpose?: string;
};

function verifyOptOutToken(token: string): OptOutTokenPayload {
  let payload: unknown;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new ApiError(401, "ลิงก์ opt-out ไม่ถูกต้องหรือหมดอายุ");
  }

  if (!payload || typeof payload !== "object") {
    throw new ApiError(401, "ลิงก์ opt-out ไม่ถูกต้อง");
  }

  const record = payload as Record<string, unknown>;
  if (record.purpose !== undefined && record.purpose !== "pdpa-opt-out") {
    throw new ApiError(401, "ลิงก์ opt-out ไม่ถูกต้อง");
  }

  if (typeof record.userId !== "string" || typeof record.phone !== "string") {
    throw new ApiError(401, "ลิงก์ opt-out ไม่ถูกต้อง");
  }

  return {
    userId: record.userId,
    phone: record.phone,
    orgId: typeof record.orgId === "string" ? record.orgId : null,
    purpose: typeof record.purpose === "string" ? record.purpose : undefined,
  };
}

function maskPhone(phone: string) {
  if (phone.length < 4) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
}
