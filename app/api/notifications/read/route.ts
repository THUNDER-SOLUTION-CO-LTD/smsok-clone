import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Mark all notifications as read (client-side state only — no persistent read state in DB)
export async function POST() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ success: true });
}
