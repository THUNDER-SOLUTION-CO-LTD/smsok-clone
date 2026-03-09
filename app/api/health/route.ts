import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};

  // Database check
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latency: Date.now() - dbStart };
  } catch (e) {
    const error = e instanceof Error ? e.message : "unknown";
    checks.database = { status: "error", error };
    logger.error("Health check: database unreachable", { error });
  }

  // Memory usage
  const mem = process.memoryUsage();
  const memoryMB = {
    rss: Math.round(mem.rss / 1024 / 1024),
    heap: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
  };

  const allHealthy = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      latency: Date.now() - start,
      memory: memoryMB,
      checks,
      version: env.COMMIT_SHA,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
