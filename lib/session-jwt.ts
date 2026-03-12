import { jwtVerify, type JWTPayload } from "jose";

export const ACCESS_COOKIE_NAME = "session";
export const REFRESH_COOKIE_NAME = "refresh_token";

export type TokenKind = "access" | "refresh";

export type SessionTokenPayload = {
  uid: string;
  orgId: string | null;
  role: string;
  sid: string;
  jti: string;
  securityVersion: number;
  type: TokenKind;
  iat?: number;
  exp?: number;
};

function isSessionTokenPayload(value: JWTPayload | unknown, type: TokenKind): value is SessionTokenPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;

  return (
    typeof payload.uid === "string" &&
    (typeof payload.orgId === "string" || payload.orgId === null) &&
    typeof payload.role === "string" &&
    typeof payload.sid === "string" &&
    typeof payload.jti === "string" &&
    typeof payload.securityVersion === "number" &&
    payload.type === type
  );
}

function encodeSecret(secret = process.env.JWT_SECRET) {
  const normalized = secret?.trim();
  if (!normalized) return null;
  return new TextEncoder().encode(normalized);
}

export async function verifySessionJwt(
  token: string,
  type: TokenKind,
  options?: { secret?: string },
): Promise<SessionTokenPayload | null> {
  const secret = encodeSecret(options?.secret);
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    return isSessionTokenPayload(payload, type) ? payload : null;
  } catch {
    return null;
  }
}
