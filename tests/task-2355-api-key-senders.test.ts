import { describe, expect, it } from "vitest";
import { resolveApiKeyRoutePermission } from "../lib/api-key-permissions";

describe("Task #2355: API key senders route permissions", () => {
  it("maps sender read routes to sms:read", () => {
    expect(resolveApiKeyRoutePermission("/api/v1/senders", "GET")).toBe("sms:read");
    expect(resolveApiKeyRoutePermission("/api/v1/senders", "HEAD")).toBe("sms:read");
    expect(resolveApiKeyRoutePermission("/api/v1/senders/request", "GET")).toBe("sms:read");
    expect(resolveApiKeyRoutePermission("/api/v1/senders/example", "GET")).toBe("sms:read");
  });

  it("maps sender write routes to sms:send", () => {
    expect(resolveApiKeyRoutePermission("/api/v1/senders", "POST")).toBe("sms:send");
    expect(resolveApiKeyRoutePermission("/api/v1/senders/request", "POST")).toBe("sms:send");
    expect(resolveApiKeyRoutePermission("/api/v1/senders/example", "PATCH")).toBe("sms:send");
    expect(resolveApiKeyRoutePermission("/api/v1/senders/example", "DELETE")).toBe("sms:send");
  });
});
