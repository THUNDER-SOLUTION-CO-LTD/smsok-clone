import { NextRequest, NextResponse } from "next/server";

// REMOVED: Legacy route — all group operations now use /api/v1/groups
// Redirect clients to canonical endpoint

export async function POST() {
  return NextResponse.json(
    { error: "ใช้ POST /api/v1/groups แทน", redirect: "/api/v1/groups" },
    { status: 301 },
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");
  if (groupId) {
    return NextResponse.json(
      { error: "ใช้ GET /api/v1/groups/:id/members แทน", redirect: `/api/v1/groups/${groupId}/members` },
      { status: 301 },
    );
  }
  return NextResponse.json(
    { error: "ใช้ GET /api/v1/groups แทน", redirect: "/api/v1/groups" },
    { status: 301 },
  );
}
