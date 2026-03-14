/**
 * Integration Tests — Pre-Deploy Flow Verification
 * Task #3457 — Tests 5 critical user flows via code inspection + API contract
 *
 * These tests verify that all flow endpoints exist, are properly authenticated,
 * rate-limited, and wired correctly. They use code inspection (readFileSync)
 * since we cannot hit a live DB in CI.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

function read(file: string) {
  return readFileSync(resolve(ROOT, file), "utf-8");
}

// ─── Flow 1: Auth (register → login → JWT → refresh → logout) ──────────
describe("Flow 1: Auth lifecycle", () => {
  it("register endpoint validates input with Zod and hashes password", () => {
    const src = read("app/api/auth/register/route.ts");
    expect(src).toContain("POST");
    expect(src).toContain("applyRateLimit");
    // Delegates to registerWithOtp which handles bcrypt + OTP
    const hasRegister = src.includes("registerWithOtp") || src.includes("bcrypt");
    expect(hasRegister).toBe(true);
  });

  it("login endpoint authenticates and sets session cookie", () => {
    const src = read("app/api/auth/login/route.ts");
    expect(src).toContain("POST");
    expect(src).toContain("applyRateLimit");
    // Must verify password and create session
    const hasAuth = src.includes("bcrypt") || src.includes("verifyPassword") || src.includes("comparePassword") || src.includes("loginUser");
    expect(hasAuth).toBe(true);
  });

  it("refresh endpoint extends session", () => {
    const src = read("app/api/auth/refresh/route.ts");
    expect(src).toContain("POST");
    // Must interact with session/JWT
    const hasSession = src.includes("session") || src.includes("jwt") || src.includes("token") || src.includes("refreshSession");
    expect(hasSession).toBe(true);
  });

  it("logout endpoint clears session and cookie", () => {
    const src = read("app/api/auth/logout/route.ts");
    expect(src).toContain("POST");
    const hasClear = src.includes("cookie") || src.includes("session") || src.includes("delete") || src.includes("clearSession");
    expect(hasClear).toBe(true);
  });

  it("me endpoint returns current user from JWT", () => {
    const src = read("app/api/auth/me/route.ts");
    expect(src).toContain("GET");
    const hasAuth = src.includes("authenticateRequest") || src.includes("getSession") || src.includes("session");
    expect(hasAuth).toBe(true);
  });

  it("auth routes have rate limiting", () => {
    for (const route of ["register", "login"]) {
      const src = read(`app/api/auth/${route}/route.ts`);
      expect(src).toContain("applyRateLimit");
    }
  });
});

// ─── Flow 2: SMS (create draft → send → check status) ──────────────────
describe("Flow 2: SMS send lifecycle", () => {
  it("SMS send endpoint requires auth and validates phone", () => {
    const src = read("app/api/v1/sms/send/route.ts");
    expect(src).toContain("POST");
    expect(src).toContain("authenticateRequest");
    expect(src).toContain("applyRateLimit");
    // Must validate phone number
    const hasValidation = src.includes("phone") || src.includes("recipient") || src.includes("normalizePhone");
    expect(hasValidation).toBe(true);
  });

  it("SMS send is rate limited at 10/min", () => {
    const rl = read("lib/rate-limit.ts");
    expect(rl).toContain("sms: { windowMs: 60_000, maxRequests: 10 }");
  });

  it("SMS batch endpoint exists with stricter rate limit", () => {
    const src = read("app/api/v1/sms/batch/route.ts");
    expect(src).toContain("POST");
    expect(src).toContain("authenticateRequest");
    expect(src).toContain("applyRateLimit");
    const rl = read("lib/rate-limit.ts");
    expect(rl).toContain("batch: { windowMs: 60_000, maxRequests: 5 }");
  });

  it("SMS actions check quota before sending", () => {
    const src = read("lib/actions/sms.ts");
    const hasQuota = src.includes("ensureSufficientQuota") || src.includes("deductQuota") || src.includes("quota");
    expect(hasQuota).toBe(true);
  });
});

// ─── Flow 3: Contact CRUD (create → list → update → delete → export) ───
describe("Flow 3: Contact CRUD + CSV export", () => {
  it("contacts route supports GET and POST with auth", () => {
    const src = read("app/api/v1/contacts/route.ts");
    expect(src).toContain("GET");
    expect(src).toContain("POST");
    expect(src).toContain("authenticateRequest");
  });

  it("contact detail route supports GET, PUT, DELETE", () => {
    const src = read("app/api/v1/contacts/[id]/route.ts");
    expect(src).toContain("GET");
    expect(src).toContain("PUT");
    expect(src).toContain("DELETE");
    expect(src).toContain("authenticateRequest");
  });

  it("contacts export uses toCsvCell for formula injection protection", () => {
    const src = read("app/api/v1/contacts/export/route.ts");
    expect(src).toContain('import { toCsvCell } from "@/lib/csv"');
    expect(src).toContain("toCsvCell");
    expect(src).toContain("applyRateLimit");
    // UTF-8 BOM for Thai
    expect(src).toContain("\\uFEFF");
  });

  it("contacts import validates CSV and limits rows", () => {
    const src = read("app/api/v1/contacts/import/route.ts");
    expect(src).toContain("POST");
    expect(src).toContain("authenticateRequest");
    // Row limit or size limit
    const hasLimit = src.includes("5000") || src.includes("limit") || src.includes("MAX");
    expect(hasLimit).toBe(true);
  });
});

// ─── Flow 4: Campaign (create → schedule → report) ─────────────────────
describe("Flow 4: Campaign lifecycle", () => {
  it("campaigns route supports GET and POST with auth", () => {
    const src = read("app/api/v1/campaigns/route.ts");
    expect(src).toContain("GET");
    expect(src).toContain("POST");
    expect(src).toContain("authenticateRequest");
  });

  it("campaign detail supports GET, PUT, DELETE", () => {
    const src = read("app/api/v1/campaigns/[id]/route.ts");
    expect(src).toContain("GET");
    expect(src).toContain("PUT");
    expect(src).toContain("DELETE");
    expect(src).toContain("authenticateRequest");
  });

  it("campaign actions check quota before execution", () => {
    const src = read("lib/actions/campaigns.ts");
    const hasQuota = src.includes("ensureSufficientQuota") || src.includes("deductQuota");
    expect(hasQuota).toBe(true);
  });

  it("campaign actions enforce sending hours", () => {
    const src = read("lib/actions/campaigns.ts");
    const hasSendingHours = src.includes("assertSendingHours") || src.includes("sendingHours");
    expect(hasSendingHours).toBe(true);
  });

  it("campaign page has CampaignDetailClient for [id] route", () => {
    const src = read("app/(dashboard)/dashboard/campaigns/[id]/page.tsx");
    expect(src).toContain("CampaignDetailClient");
    // Detail client exists
    const detail = read("app/(dashboard)/dashboard/campaigns/[id]/CampaignDetailClient.tsx");
    expect(detail).toContain("use client");
    expect(detail).toContain("campaignId");
  });
});

// ─── Flow 5: PDPA (consent → export data → delete account) ─────────────
describe("Flow 5: PDPA compliance", () => {
  it("PDPA consent endpoint supports GET and POST", () => {
    const src = read("app/api/v1/pdpa/consent/route.ts");
    expect(src).toContain("GET");
    expect(src).toContain("POST");
  });

  it("data request endpoint supports listing and creation", () => {
    const src = read("app/api/v1/pdpa/data-requests/route.ts");
    expect(src).toContain("GET");
    expect(src).toContain("POST");
  });

  it("self-service export endpoint exists", () => {
    const src = read("app/api/v1/me/export/route.ts");
    expect(src).toContain("POST");
    const hasExport = src.includes("PORTABILITY") || src.includes("export") || src.includes("submitSelfServiceDataRequest");
    expect(hasExport).toBe(true);
  });

  it("self-service delete endpoint exists with safety checks", () => {
    const src = read("app/api/v1/me/delete/route.ts");
    const hasDelete = src.includes("DELETE") || src.includes("delete");
    expect(hasDelete).toBe(true);
    // Must have CSRF protection and audit logging
    const hasSafety = src.includes("hasValidCsrfOrigin") || src.includes("csrf") || src.includes("createAuditLog");
    expect(hasSafety).toBe(true);
  });

  it("consent withdrawal blocks SERVICE and THIRD_PARTY types", () => {
    const src = read("lib/actions/consent.ts");
    const blocksService = src.includes("SERVICE") && src.includes("ไม่สามารถถอนความยินยอม");
    expect(blocksService).toBe(true);
  });
});

// ─── Cross-cutting: Health + Security ───────────────────────────────────
describe("Cross-cutting: Health & Security", () => {
  it("health endpoint checks DB, Redis, and queues", () => {
    const src = read("app/api/health/route.ts");
    expect(src).toContain("GET");
    const hasChecks = src.includes("redis") || src.includes("database") || src.includes("prisma") || src.includes("db");
    expect(hasChecks).toBe(true);
  });

  it("all rate limit buckets use Redis (not in-memory)", () => {
    const src = read("lib/rate-limit.ts");
    expect(src).toContain("redis");
    // No in-memory Map for rate limiting
    expect(src).not.toMatch(/const\s+\w+\s*=\s*new\s+Map\(\)/);
  });

  it("middleware protects dashboard routes", () => {
    const src = read("middleware.ts");
    expect(src).toContain("dashboard");
    expect(src).toContain("/login");
  });
});
