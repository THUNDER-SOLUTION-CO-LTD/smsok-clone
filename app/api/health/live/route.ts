import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Liveness probe — always returns 200 if process is alive
export async function GET() {
  return NextResponse.json({ alive: true });
}
