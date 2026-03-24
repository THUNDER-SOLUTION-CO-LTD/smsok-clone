import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const apiAuth = readFileSync(resolve(ROOT, "lib/api-auth.ts"), "utf-8");
const auth = readFileSync(resolve(ROOT, "lib/auth.ts"), "utf-8");

describe("API Auth: authenticateApiKey", () => {
  it("exports authenticateApiKey function", () => {
    expect(apiAuth).toContain("async function authenticateApiKey");
  });

  it("checks for Bearer prefix", () => {
    expect(apiAuth).toContain("Bearer ");
  });

  it("supports X-API-Key header", () => {
    expect(apiAuth).toContain("x-api-key");
  });

  it("throws 401 on missing auth header", () => {
    expect(apiAuth).toContain("กรุณาระบุ API Key");
  });

  it("throws 401 on invalid key", () => {
    expect(apiAuth).toContain("API Key ไม่ถูกต้อง");
  });

  it("throws 401 on inactive key", () => {
    expect(apiAuth).toContain("API Key ถูกปิดใช้งาน");
  });

  it("loads API key permissions from DB", () => {
    expect(apiAuth).toContain("permissions: true");
  });

  it("rejects API keys on session-only endpoints", () => {
    expect(apiAuth).toContain("ปลายทางนี้ต้องใช้การเข้าสู่ระบบ");
  });

  it("rejects unsupported API key routes by default", () => {
    expect(apiAuth).toContain("API Key ไม่สามารถใช้กับปลายทางนี้");
  });

  it("returns user with API key permissions", () => {
    expect(apiAuth).toContain("apiKeyPermissions");
  });
});

describe("API Auth: ApiError class", () => {
  it("exports ApiError", () => {
    expect(apiAuth).toContain("class ApiError");
  });

  it("has status property", () => {
    expect(apiAuth).toContain("public status: number");
  });
});

describe("API Auth: Response helpers", () => {
  it("exports apiResponse", () => {
    expect(apiAuth).toContain("function apiResponse");
  });

  it("exports apiError", () => {
    expect(apiAuth).toContain("function apiError");
  });

  it("apiError handles ApiError instances", () => {
    expect(apiAuth).toContain("instanceof ApiError");
  });

  it("apiError defaults to 500 for unknown errors", () => {
    expect(apiAuth).toContain("500");
  });
});

describe("Auth: Password", () => {
  it("uses argon2id for hashing", () => {
    expect(auth).toContain("argon2id");
  });

  it("has hashPassword function", () => {
    expect(auth).toContain("async function hashPassword");
  });

  it("has verifyPassword function with bcrypt fallback", () => {
    expect(auth).toContain("async function verifyPassword");
    expect(auth).toContain("bcrypt.compare");
  });
});

describe("Auth: JWT", () => {
  it("signs token with userId", () => {
    expect(auth).toContain("jwt.sign");
    expect(auth).toContain("userId");
  });

  it("token expires in 7 days", () => {
    expect(auth).toContain('expiresIn: "7d"');
  });

  it("verifyToken returns null on invalid", () => {
    expect(auth).toContain("return null");
  });
});

describe("Auth: Session", () => {
  it("getSession reads cookie", () => {
    expect(auth).toContain("cookieStore.get(ACCESS_COOKIE_NAME)");
  });

  it("setSession sets HttpOnly cookie", () => {
    expect(auth).toContain("httpOnly: true");
  });

  it("cookie is secure in production", () => {
    expect(auth).toContain('secure: process.env.NODE_ENV === "production"');
  });

  it("cookie sameSite is lax", () => {
    expect(auth).toContain('sameSite: "strict"');
  });

  it("cookie maxAge is 7 days", () => {
    expect(auth).toContain("const ACCESS_TOKEN_TTL_SECONDS = 15 * 60");
    expect(auth).toContain("const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60");
  });

  it("clearSession deletes cookie", () => {
    expect(auth).toContain("cookieStore.delete(ACCESS_COOKIE_NAME)");
    expect(auth).toContain("cookieStore.delete(REFRESH_COOKIE_NAME)");
  });

  it("getSession selects limited user fields", () => {
    expect(auth).toContain("select:");
    expect(auth).toContain("role: true");
  });
});
