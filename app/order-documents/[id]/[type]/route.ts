import { NextRequest } from "next/server";
import { buildOrderDocumentDownloadResponse } from "@/lib/orders/document-download";

type RouteContext = {
  params: Promise<{ id: string; type: string }>;
};

export async function GET(req: NextRequest, ctx: RouteContext) {
  return buildOrderDocumentDownloadResponse(req, await ctx.params);
}
