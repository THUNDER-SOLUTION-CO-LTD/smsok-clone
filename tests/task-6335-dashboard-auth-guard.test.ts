import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { middleware } from "@/middleware";

const ROOT = process.cwd();

describe("Task #6335: dashboard auth bypass guard", () => {
  it("redirects unauthenticated /dashboard requests to /login", async () => {
    const response = await middleware(
      new NextRequest("http://localhost/dashboard"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login");
    expect(response.cookies.get("session")?.value ?? "").toBe("");
    expect(response.cookies.get("refresh_token")?.value ?? "").toBe("");
  });

  it("redirects unauthenticated nested dashboard pages to /login", async () => {
    const response = await middleware(
      new NextRequest("http://localhost/dashboard/settings"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login");
  });

  it("keeps the explicitly exempt dashboard API docs page reachable without a session", async () => {
    const apiDocs = await middleware(
      new NextRequest("http://localhost/dashboard/api-docs"),
    );

    expect(apiDocs.status).toBe(200);
    expect(apiDocs.headers.get("location")).toBeNull();
  });

  it("keeps middleware wired to verify dashboard routes", () => {
    const middlewareSource = readFileSync(
      resolve(ROOT, "middleware.ts"),
      "utf8",
    );

    expect(middlewareSource).toContain('if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return true;');
    expect(middlewareSource).toContain("const requiresSessionVerification = shouldVerifySession(pathname, hasApiKeyAuth);");
    expect(middlewareSource).toContain("if (!hasSessionCookies) {");
    expect(middlewareSource).toContain("return unauthorizedResponse(req, response, pathname);");
  });
});
