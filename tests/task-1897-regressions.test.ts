import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { resolveApiKeyRoutePermission } from "@/lib/api-key-permissions";

const ROOT = resolve(__dirname, "..");

const sendersRoute = readFileSync(
  resolve(ROOT, "app/api/v1/senders/route.ts"),
  "utf-8",
);

const sendersRequestRoute = readFileSync(
  resolve(ROOT, "app/api/v1/senders/request/route.ts"),
  "utf-8",
);

const sendersNameRoute = readFileSync(
  resolve(ROOT, "app/api/v1/senders/name/route.ts"),
  "utf-8",
);

const sendersNameDetailRoute = readFileSync(
  resolve(ROOT, "app/api/v1/senders/name/[id]/route.ts"),
  "utf-8",
);

describe("Task #1897 sender API key permission mapping", () => {
  it("maps sender endpoints to SMS read/write permissions", () => {
    expect(resolveApiKeyRoutePermission("/api/v1/senders", "GET")).toBe("sms:read");
    expect(resolveApiKeyRoutePermission("/api/v1/senders", "POST")).toBe("sms:send");
    expect(resolveApiKeyRoutePermission("/api/v1/senders/request", "GET")).toBe("sms:read");
    expect(resolveApiKeyRoutePermission("/api/v1/senders/request", "POST")).toBe("sms:send");
    expect(resolveApiKeyRoutePermission("/api/v1/senders/name", "GET")).toBe("sms:read");
    expect(resolveApiKeyRoutePermission("/api/v1/senders/name/abc", "DELETE")).toBe("sms:send");
  });

  it("keeps sender API routes on dual auth via authenticateRequest", () => {
    expect(sendersRoute).toContain("authenticateRequest");
    expect(sendersRequestRoute).toContain("authenticateRequest");
    expect(sendersNameRoute).toContain("authenticateRequest");
    expect(sendersNameDetailRoute).toContain("authenticateRequest");
  });
});
