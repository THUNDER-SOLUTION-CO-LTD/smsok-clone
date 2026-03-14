import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const otpRateLimitSource = readFileSync(resolve(ROOT, "lib/otp-rate-limit.ts"), "utf-8");
const otpApiSource = readFileSync(resolve(ROOT, "lib/otp-api.ts"), "utf-8");
const otpActionsSource = readFileSync(resolve(ROOT, "lib/actions/otp.ts"), "utf-8");
const duplicateRouteSource = readFileSync(resolve(ROOT, "app/api/auth/check-duplicate/route.ts"), "utf-8");
const adminAuthSource = readFileSync(resolve(ROOT, "lib/admin-auth.ts"), "utf-8");
const apiTypesSource = readFileSync(resolve(ROOT, "lib/types/api-responses.ts"), "utf-8");

describe("Task #3514: security fixes", () => {
  it("reduces OTP backoff to a maximum of 120s before final 5-minute cooldown", () => {
    expect(otpRateLimitSource).toContain("const BACKOFF_TIERS = [0, 30, 60, 120, 300]");
    expect(otpRateLimitSource).toContain("const BACKOFF_TTL = 300");
    expect(otpRateLimitSource).not.toContain("[0, 60, 300, 900, 1800]");
  });

  it("returns a generic duplicate-check response with minimum delay", () => {
    expect(duplicateRouteSource).toContain("const DUPLICATE_CHECK_MIN_DELAY_MS = 150");
    expect(duplicateRouteSource).toContain("GENERIC_CHECK_DUPLICATE_MESSAGE");
    expect(duplicateRouteSource).toContain("await waitForMinimumResponseTime(startedAt);");
    expect(duplicateRouteSource).toContain("available: true");
    expect(duplicateRouteSource).not.toContain("อีเมลนี้ถูกใช้แล้ว");
    expect(duplicateRouteSource).not.toContain("เบอร์นี้ถูกใช้แล้ว");
  });

  it("adds a dummy hash path for admin login constant-time comparison", () => {
    expect(adminAuthSource).toContain('const DUMMY_HASH = "$2b$12$qF1xea/GGCtjbQ6FC32FAu0YSQWxmgOuBDgvb4IVBhTrnjXPVYwoC";');
    expect(adminAuthSource).toContain("const passwordHash = admin?.isActive ? admin.password : DUMMY_HASH;");
    expect(adminAuthSource).toContain("const valid = await bcrypt.compare(password, passwordHash);");
    expect(adminAuthSource).toContain("if (!admin || !admin.isActive || !valid)");
  });

  it("stops exposing OTP daily quota to clients and shared response types", () => {
    expect(otpApiSource).not.toContain("remainingToday:");
    expect(otpApiSource).not.toContain("X-RateLimit-Remaining");
    expect(otpActionsSource).not.toContain("remainingToday:");
    expect(apiTypesSource).not.toContain("remainingToday: number");
  });
});
