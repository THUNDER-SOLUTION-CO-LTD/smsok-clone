import { NextRequest } from "next/server";
import { apiError, apiResponse } from "@/lib/api-auth";
import { authenticateRequestUser } from "@/lib/request-auth";
import { prisma } from "@/lib/db";
import { creditHistoryQuerySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequestUser(req);
    const { searchParams } = new URL(req.url);
    const query = creditHistoryQuerySchema.parse({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    const page = query.page;
    const limit = query.limit;
    const offset = (page - 1) * limit;

    const where = {
      userId: user.id,
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(`${query.to}T23:59:59`) } : {}),
            },
          }
        : {}),
      ...(query.type ? { type: query.type } : {}),
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
