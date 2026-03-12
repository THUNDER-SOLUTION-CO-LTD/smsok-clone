// @vitest-environment node

import { readFileSync } from "fs";
import jwt from "jsonwebtoken";
import { resolve } from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveApiKeyRoutePermission } from "@/lib/api-key-permissions";

const ROOT = resolve(__dirname, "..");
const apiAuthSource = readFileSync(resolve(ROOT, "lib/api-auth.ts"), "utf-8");
const requestAuthSource = readFileSync(resolve(ROOT, "lib/request-auth.ts"), "utf-8");

const state = vi.hoisted(() => {
  const cookieValues = new Map<string, string>();
  const setCalls: Array<{ name: string; value: string }> = [];

  return {
    cookieValues,
    setCalls,
    redisGet: vi.fn<(key: string) => Promise<string | null>>(),
    redisSet: vi.fn(),
    redisTtl: vi.fn<(key: string) => Promise<number>>(),
    redisSadd: vi.fn(),
    redisExpire: vi.fn(),
    redisDel: vi.fn(),
    redisSrem: vi.fn(),
    redisSmembers: vi.fn<(key: string) => Promise<string[]>>(),
    userFindUnique: vi.fn(),
    membershipFindFirst: vi.fn(),
    userSessionUpdateMany: vi.fn(),
    userSessionDeleteMany: vi.fn(),
    cookies: vi.fn(async () => ({
      get(name: string) {
        const value = cookieValues.get(name);
        return value ? { value } : undefined;
      },
      set(name: string, value: string) {
        setCalls.push({ name, value });
        cookieValues.set(name, value);
      },
      delete(name: string) {
        cookieValues.delete(name);
      },
    })),
  };
});

vi.mock("next/headers", () => ({
  cookies: state.cookies,
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    get: state.redisGet,
    set: state.redisSet,
    ttl: state.redisTtl,
    sadd: state.redisSadd,
    expire: state.redisExpire,
    del: state.redisDel,
    srem: state.redisSrem,
    smembers: state.redisSmembers,
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: state.userFindUnique,
    },
    membership: {
      findFirst: state.membershipFindFirst,
    },
    userSession: {
      updateMany: state.userSessionUpdateMany,
      deleteMany: state.userSessionDeleteMany,
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/env", () => ({
  env: {
    JWT_SECRET: "test-jwt-secret-1867",
  },
}));

vi.mock("@/lib/session-utils", () => ({
  getClientIp: () => "127.0.0.1",
  hashToken: (token: string) => `hash:${token}`,
  parseUserAgent: () => ({
    deviceName: "Test Browser",
    deviceType: "desktop",
    browser: "Vitest",
    os: "Node",
  }),
}));

describe("Task #1867: session renewal + organization route mapping", () => {
  beforeEach(() => {
    state.cookieValues.clear();
    state.setCalls.length = 0;
    vi.clearAllMocks();
    state.redisGet.mockResolvedValue(null);
    state.redisTtl.mockResolvedValue(60 * 60);
    state.redisSmembers.mockResolvedValue([]);
    state.userSessionUpdateMany.mockResolvedValue({ count: 1 });
    state.userSessionDeleteMany.mockResolvedValue({ count: 0 });
  });

  it("renews access session from a valid refresh token when access token is missing or expired", async () => {
    const refreshToken = jwt.sign(
      {
        uid: "user_1867",
        orgId: "org_1867",
        role: "admin",
        sid: "sid_1867",
        jti: "jti_refresh_1867",
        securityVersion: 7,
        type: "refresh",
      },
      "test-jwt-secret-1867",
      { expiresIn: "30d" },
    );

    state.cookieValues.set("refresh_token", refreshToken);
    state.userFindUnique.mockResolvedValue({
      id: "user_1867",
      name: "Reviewer Fix",
      email: "user1867@example.com",
      role: "admin",
      securityVersion: 7,
    });
    state.membershipFindFirst.mockResolvedValue({
      organizationId: "org_1867",
    });
    state.redisGet.mockImplementation(async (key: string) => {
      if (key === "user:user_1867:session:sid_1867") {
        return JSON.stringify({
          userId: "user_1867",
          sessionId: "sid_1867",
          refreshTokenHash: `hash:${refreshToken}`,
          ip: "127.0.0.1",
          userAgent: "Vitest",
          deviceName: "Test Browser",
          deviceType: "desktop",
          browser: "Vitest",
          os: "Node",
          createdAt: "2026-03-12T00:00:00.000Z",
          lastActiveAt: "2026-03-12T00:00:00.000Z",
          organizationId: "org_1867",
          role: "admin",
          securityVersion: 7,
        });
      }
      return null;
    });

    const { getSession } = await import("@/lib/auth");
    const session = await getSession({
      headers: new Headers({ "user-agent": "Vitest Agent", "x-forwarded-for": "127.0.0.1" }),
    });

    expect(session).toMatchObject({
      id: "user_1867",
      organizationId: "org_1867",
      sessionId: "sid_1867",
    });
    expect(state.setCalls.some((call) => call.name === "session")).toBe(true);
  });

  it("marks organization APIs as session-only for API key auth", () => {
    expect(resolveApiKeyRoutePermission("/api/v1/organizations", "GET")).toBe("session-only");
    expect(resolveApiKeyRoutePermission("/api/v1/organizations/default/roles", "GET")).toBe("session-only");
    expect(resolveApiKeyRoutePermission("/api/v1/organizations/org_1/invites", "POST")).toBe("session-only");
  });

  it("passes request headers into getSession() before falling back to API key auth", () => {
    expect(apiAuthSource).toContain("getSession({ headers: req.headers })");
    expect(requestAuthSource).toContain("getSession({ headers: req.headers })");
  });
});
