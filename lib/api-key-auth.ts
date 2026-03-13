import { NextRequest } from "next/server";
import { ApiError, authenticateApiKey } from "./api-auth";
import { ApiKeyPermission, hasApiKeyPermission } from "./api-key-permissions";
import { ERROR_CODES } from "./api-log";

export function extractPublicApiKey(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  const headerApiKey = req.headers.get("x-api-key")?.trim();
  return headerApiKey || null;
}

export async function authenticatePublicApiKey(req: NextRequest) {
  return authenticateApiKey(req);
}

export function checkApiKeyPermission(
  grantedPermissions: readonly string[] | null | undefined,
  requiredPermission: ApiKeyPermission,
) {
  if (!hasApiKeyPermission(grantedPermissions, requiredPermission)) {
    throw new ApiError(403, "API Key ไม่มีสิทธิ์เข้าถึง", ERROR_CODES.FORBIDDEN);
  }
}

export async function requireAdminPublicApiKey(req: NextRequest) {
  const user = await authenticatePublicApiKey(req);
  if (user.role !== "admin") {
    throw new ApiError(403, "Admin access required");
  }
  return user;
}
