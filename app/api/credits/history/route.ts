import { NextRequest } from "next/server";
import { apiError, apiResponse } from "@/lib/api-auth";
import { authenticateRequestUser } from "@/lib/request-auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequestUser(req);
    const { searchParams } = new URL(req.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const type = searchParams.get("type");
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100);
    const offset = (page - 1) * limit;

    const where = {
      userId: user.id,
      ...(from || to ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}) } } : {}),
      ...(type ? { type } : {}),
    };

    const [entries, total] = await Promise.all([
      prisma.creditTransaction.findMany({ where, orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
      prisma.creditTransaction.count({ where }),
    ]);

    return apiResponse({ entries, total });
  } catch (error) {
    return apiError(error);
  }
}
