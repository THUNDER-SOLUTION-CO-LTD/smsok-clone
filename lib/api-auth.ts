import { prisma as db } from "./db";
import { NextRequest } from "next/server";

/**
 * Authenticate API request via Bearer token
 * Checks ApiKey model first, then falls back to User.apiKey
 */
export async function authenticateApiKey(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing or invalid Authorization header");
  }

  const key = authHeader.slice(7);

  const apiKey = await db.apiKey.findUnique({
    where: { key },
    select: { id: true, isActive: true, userId: true, user: { select: { id: true, credits: true, role: true } } },
  });

  if (!apiKey) {
    throw new ApiError(401, "Invalid API key");
  }

  if (!apiKey.isActive) {
    throw new ApiError(401, "API key is disabled");
  }

  // Update lastUsed (fire and forget)
  db.apiKey.update({ where: { id: apiKey.id }, data: { lastUsed: new Date() } }).catch(() => {});

  return apiKey.user;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export function apiResponse(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "Internal server error";
  return Response.json({ error: message }, { status: 500 });
}
