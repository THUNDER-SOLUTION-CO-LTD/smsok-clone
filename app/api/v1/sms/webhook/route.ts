import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { logger } from "@/lib/logger";

/* ─── EasyThunder DLR Webhook ───────────────────────────────────────────────
   POST /api/v1/sms/webhook
   Called by EasyThunder when a message is delivered or failed.
   Payload:
     { event: "sms.completed" | "sms.failed", data: { jobId: string, ... } }
   ─────────────────────────────────────────────────────────────────────────── */

// Optional shared secret — set SMS_WEBHOOK_SECRET in env and configure
// the same value in EasyThunder's webhook settings.
const WEBHOOK_SECRET = process.env.SMS_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  // Verify secret if configured
  if (WEBHOOK_SECRET) {
    const incomingSecret =
      req.headers.get("x-webhook-secret") ??
      req.headers.get("x-secret") ??
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (incomingSecret !== WEBHOOK_SECRET) {
      logger.warn("SMS webhook: invalid secret");
      // Return 200 anyway to prevent EasyThunder from spamming retries
      return NextResponse.json({ ok: false }, { status: 200 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 200 });
  }

  const payload = body as {
    event?: string;
    data?: { jobId?: string; failReason?: string };
  };

  const event = payload?.event;
  const jobId = payload?.data?.jobId;

  if (!jobId) {
    logger.warn("SMS webhook: missing jobId", { event });
    return NextResponse.json({ ok: false, error: "missing jobId" }, { status: 200 });
  }

  try {
    if (event === "sms.completed") {
      await db.message.updateMany({
        where: { gatewayId: jobId },
        data: {
          status: "delivered",
          deliveredAt: new Date(),
        },
      });
      logger.info("SMS webhook: delivered", { jobId });
    } else if (event === "sms.failed") {
      await db.message.updateMany({
        where: { gatewayId: jobId },
        data: {
          status: "failed",
          errorCode: payload?.data?.failReason?.slice(0, 100) ?? "delivery_failed",
        },
      });
      logger.info("SMS webhook: failed", { jobId, reason: payload?.data?.failReason });
    } else {
      // Unknown event — ignore silently
      logger.info("SMS webhook: unknown event, ignored", { event, jobId });
    }
  } catch (err) {
    logger.error("SMS webhook: db update failed", {
      jobId,
      event,
      error: err instanceof Error ? err.message : String(err),
    });
    // Still return 200 so EasyThunder doesn't flood retries
    return NextResponse.json({ ok: false, error: "internal error" }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}
