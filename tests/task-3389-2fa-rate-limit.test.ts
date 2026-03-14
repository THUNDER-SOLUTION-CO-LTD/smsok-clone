import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const rateLimitSource = readFileSync(resolve(ROOT, "lib/rate-limit.ts"), "utf-8");
const apiLogSource = readFileSync(resolve(ROOT, "lib/api-log.ts"), "utf-8");
const adminAuthSource = readFileSync(resolve(ROOT, "lib/admin-auth.ts"), "utf-8");
const adminLogoutSource = readFileSync(
  resolve(ROOT, "app/api/v1/admin/auth/logout/route.ts"),
  "utf-8",
);
const verify2FaRouteSource = readFileSync(
  resolve(ROOT, "app/api/auth/2fa/verify/route.ts"),
  "utf-8",
);
const recovery2FaRouteSource = readFileSync(
  resolve(ROOT, "app/api/auth/2fa/recovery/route.ts"),
  "utf-8",
);
const otpWorkerSource = readFileSync(resolve(ROOT, "lib/queue/workers/otp-worker.ts"), "utf-8");
const singleWorkerSource = readFileSync(resolve(ROOT, "lib/queue/workers/single-worker.ts"), "utf-8");
const logMaskingSource = readFileSync(resolve(ROOT, "lib/log-masking.ts"), "utf-8");

describe("Task #3389: clone 2FA login security hardening", () => {
  it("defines a dedicated auth_2fa rate-limit bucket", () => {
    expect(rateLimitSource).toContain("auth_2fa: { windowMs: 5 * 60_000, maxRequests: 5 }");
  });

  it("uses the auth_2fa bucket on both 2FA login endpoints", () => {
    expect(verify2FaRouteSource).toContain('applyRateLimit(`2fa:${ip}`, "auth_2fa")');
    expect(recovery2FaRouteSource).toContain('applyRateLimit(`2fa:${ip}`, "auth_2fa")');
    expect(verify2FaRouteSource).not.toContain('applyRateLimit(ip, "auth")');
    expect(recovery2FaRouteSource).not.toContain('applyRateLimit(ip, "auth")');
  });

  it("masks currentPassword in API logs", () => {
    expect(apiLogSource).toContain('"currentPassword"');
  });

  it("uses strict admin cookies for session issue and logout", () => {
    expect(adminAuthSource).toContain('sameSite: "strict" as const');
    expect(adminLogoutSource).toContain('sameSite: "strict"');
  });

  it("masks phone numbers before writing worker logs", () => {
    expect(logMaskingSource).toContain("export function maskPhoneForLog");
    expect(otpWorkerSource).toContain("maskPhoneForLog(phone)");
    expect(singleWorkerSource).toContain("maskPhoneForLog(phone)");
  });
});
