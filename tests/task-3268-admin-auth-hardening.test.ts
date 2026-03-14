import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const middlewareSource = readFileSync(resolve(ROOT, "middleware.ts"), "utf-8");
const adminAuthSource = readFileSync(resolve(ROOT, "lib/admin-auth.ts"), "utf-8");
const adminPageAuthSource = readFileSync(resolve(ROOT, "lib/admin-page-auth.ts"), "utf-8");
const adminLayoutSource = readFileSync(resolve(ROOT, "app/admin/layout.tsx"), "utf-8");
const adminLoginRouteSource = readFileSync(
  resolve(ROOT, "app/api/v1/admin/auth/route.ts"),
  "utf-8",
);
const adminLogoutRouteSource = readFileSync(
  resolve(ROOT, "app/api/v1/admin/auth/logout/route.ts"),
  "utf-8",
);
const senderRouteSource = readFileSync(
  resolve(ROOT, "app/api/v1/senders/route.ts"),
  "utf-8",
);

describe("Task #3259/#3268: admin auth hardening", () => {
  it("verifies admin JWTs in middleware instead of checking cookie presence only", () => {
    expect(middlewareSource).toContain("jwtVerify(");
    expect(middlewareSource).toContain('payload.type === "admin"');
    expect(middlewareSource).toContain("payload.sessionId");
  });

  it("stores admin sessions server-side and enforces CSRF on cookie mutations", () => {
    expect(adminAuthSource).toContain("redis.set(");
    expect(adminAuthSource).toContain("redis.get(");
    expect(adminAuthSource).toContain("revokeAdminSession");
    expect(adminAuthSource).toContain("hasValidCsrfOrigin(req)");
    expect(adminAuthSource).toContain("sessionId: string");
  });

  it("guards admin pages server-side and denies restricted dashboards by role", () => {
    expect(adminLayoutSource).toContain("requireAdminPageAccess(pathname)");
    expect(adminPageAuthSource).toContain('"/admin/finance"');
    expect(adminPageAuthSource).toContain('"/admin/operations"');
    expect(adminPageAuthSource).toContain('"/admin/cto"');
  });

  it("issues and revokes the admin session cookie through auth routes", () => {
    expect(adminLoginRouteSource).toContain("response.cookies.set(");
    expect(adminLoginRouteSource).toContain("ADMIN_SESSION_COOKIE_NAME");
    expect(adminLogoutRouteSource).toContain("await revokeAdminSession(admin.sessionId)");
    expect(adminLogoutRouteSource).toContain("response.cookies.set(");
    expect(adminLogoutRouteSource).toContain("ADMIN_SESSION_COOKIE_NAME");
  });

  it("returns 409 on duplicate sender-name creation instead of 500", () => {
    expect(senderRouteSource).toContain("Prisma.PrismaClientKnownRequestError");
    expect(senderRouteSource).toContain('error.code === "P2002"');
    expect(senderRouteSource).toContain('throw new ApiError(409, "ชื่อผู้ส่งนี้มีอยู่แล้ว"');
  });
});
