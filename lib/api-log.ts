import { AsyncLocalStorage } from "node:async_hooks";
import { NextRequest } from "next/server";
import { prisma } from "./db";

// ==========================================
// Error code mapping
// ==========================================

export const ERROR_CODES = {
  VALIDATION: "1001",      // Zod validation error
  BAD_REQUEST: "1002",     // Missing/invalid fields
  NOT_FOUND: "2004",       // Resource not found
  AUTH_MISSING: "3001",    // No auth header/key
  AUTH_INVALID: "3002",    // Invalid API key
  AUTH_DISABLED: "3003",   // API key disabled
  AUTH_FAILED: "3004",     // Wrong password
  FORBIDDEN: "3005",       // Insufficient permissions
  RATE_LIMIT: "4001",      // Rate limit exceeded
  CREDITS: "4002",         // Insufficient credits
  BUSINESS: "4003",        // Business logic error (Thai validation)
  INTERNAL: "5001",        // Unexpected server error
  GATEWAY: "5002",         // SMS gateway error
} as const;

// ==========================================
// Masking utilities
// ==========================================

const SENSITIVE_HEADERS = new Set(["authorization", "x-api-key", "cookie"]);
const SENSITIVE_BODY_FIELDS = new Set([
  "password", "newPassword", "confirmPassword", "token",
  "apiKey", "key", "secret", "otpCode", "code",
]);
const MAX_FIELD_LENGTH = 4000;

function maskValue(value: string): string {
  if (value.startsWith("Bearer ")) {
    const key = value.slice(7);
    return key.length > 8
      ? `Bearer ${key.slice(0, 4)}****${key.slice(-4)}`
      : "Bearer ****";
  }
  return value.length > 8
    ? `${value.slice(0, 4)}****${value.slice(-4)}`
    : "****";
}

function maskHeaders(req: NextRequest): Record<string, string> {
  const masked: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    masked[key] = SENSITIVE_HEADERS.has(key.toLowerCase()) ? maskValue(value) : value;
  });
  return masked;
}

function maskBody(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;
  if (Array.isArray(body)) return body.map(maskBody);

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (SENSITIVE_BODY_FIELDS.has(key)) {
      masked[key] = typeof value === "string" && value.length > 0 ? "****" : value;
    } else if (typeof value === "object" && value !== null) {
      masked[key] = maskBody(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

function truncate(str: string | null): string | null {
  if (!str) return null;
  return str.length > MAX_FIELD_LENGTH
    ? str.slice(0, MAX_FIELD_LENGTH) + "...[truncated]"
    : str;
}

function extractIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// ==========================================
// AsyncLocalStorage context per request
// ==========================================

type ApiLogContext = {
  startTime: number;
  method: string;
  url: string;       // full URL with query
  endpoint: string;  // path only
  ipAddress: string;
  source: "WEB" | "API";
  reqHeaders: Record<string, string>;
  reqBody: unknown;
  userId: string | null;
};

const logStore = new AsyncLocalStorage<ApiLogContext>();

/** Call at the start of request handling (inside authenticateApiKey or startApiLog). */
export function startApiLog(req: NextRequest) {
  const parsed = new URL(req.url);

  // Detect source: WEB if session cookie or Next.js server action headers present
  const hasSessionCookie = req.headers.has("cookie") && (req.headers.get("cookie")?.includes("session") ?? false);
  const hasServerActionHeader = req.headers.has("next-action");
  const hasApiKeyAuth = req.headers.has("authorization") || req.headers.has("x-api-key");
  const source: "WEB" | "API" = (hasSessionCookie || hasServerActionHeader) && !hasApiKeyAuth ? "WEB" : "API";

  const ctx: ApiLogContext = {
    startTime: Date.now(),
    method: req.method,
    url: parsed.pathname + parsed.search,
    endpoint: parsed.pathname,
    ipAddress: extractIp(req),
    source,
    reqHeaders: maskHeaders(req),
    reqBody: null,
    userId: null,
  };

  logStore.enterWith(ctx);

  // Read body async (fire and forget)
  if (req.method !== "GET" && req.method !== "HEAD") {
    req
      .clone()
      .json()
      .then((body) => { ctx.reqBody = maskBody(body); })
      .catch(() => {});
  }

  return ctx;
}

/** Set userId after authentication succeeds. */
export function setApiLogUser(userId: string) {
  const ctx = logStore.getStore();
  if (ctx) ctx.userId = userId;
}

/** Log the API response. Called from apiResponse/apiError. */
export function finishApiLog(
  resStatus: number,
  resBody: unknown,
  errorCode?: string | null,
  errorMsg?: string | null,
  stackTrace?: string | null,
) {
  const ctx = logStore.getStore();
  if (!ctx) return;

  const latencyMs = Date.now() - ctx.startTime;

  prisma.apiLog
    .create({
      data: {
        userId: ctx.userId,
        method: ctx.method,
        url: ctx.url,
        endpoint: ctx.endpoint,
        source: ctx.source,
        reqHeaders: truncate(JSON.stringify(ctx.reqHeaders)),
        reqBody: truncate(JSON.stringify(ctx.reqBody)),
        resStatus,
        resBody: truncate(JSON.stringify(resBody)),
        latencyMs,
        ipAddress: ctx.ipAddress,
        errorCode: errorCode || null,
        errorMsg: errorMsg || null,
        stackTrace: stackTrace ? truncate(stackTrace) : null,
      },
    })
    .catch((err) => {
      console.error("[api-log] save failed:", err);
    });
}

// ==========================================
// withApiLog wrapper (for non-authenticated routes)
// ==========================================

type RouteHandler = (
  req: NextRequest,
  ctx?: { params: Promise<Record<string, string>> }
) => Promise<Response>;

export function withApiLog(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    startApiLog(req);
    return handler(req, ctx);
  };
}
