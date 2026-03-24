// @vitest-environment node

import { readFileSync } from "fs";
import jwt from "jsonwebtoken";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import { verifySessionJwt } from "@/lib/session-jwt";

const ROOT = resolve(__dirname, "..");
const middlewareSource = readFileSync(resolve(ROOT, "middleware.ts"), "utf-8");
const TEST_SECRET = process.env.JWT_SECRET || "test-jwt-secret-for-vitest-session-jwt-tests";

const basePayload = {
  uid: "user_123",
  orgId: "org_123",
  role: "admin",
  sid: "session_123",
  jti: "jti_123",
  securityVersion: 1,
} as const;

describe("session JWT verification", () => {
  it("verifies a valid access token with jose", async () => {
    const token = jwt.sign(
      { ...basePayload, type: "access" },
      TEST_SECRET,
      { expiresIn: "15m" },
    );

    await expect(
      verifySessionJwt(token, "access", { secret: TEST_SECRET }),
    ).resolves.toMatchObject({
      ...basePayload,
      type: "access",
    });
  });

  it("rejects a token with the wrong session type", async () => {
    const token = jwt.sign(
      { ...basePayload, type: "refresh" },
      TEST_SECRET,
      { expiresIn: "30d" },
    );

    await expect(
      verifySessionJwt(token, "access", { secret: TEST_SECRET }),
    ).resolves.toBeNull();
  });

  it("rejects expired tokens", async () => {
    const token = jwt.sign(
      { ...basePayload, type: "access" },
      TEST_SECRET,
      { expiresIn: -1 },
    );

    await expect(
      verifySessionJwt(token, "access", { secret: TEST_SECRET }),
    ).resolves.toBeNull();
  });

  it("rejects malformed payloads", async () => {
    const token = jwt.sign(
      { userId: "user_123" },
      TEST_SECRET,
      { expiresIn: "15m" },
    );

    await expect(
      verifySessionJwt(token, "access", { secret: TEST_SECRET }),
    ).resolves.toBeNull();
  });
});

describe("middleware session verification regression", () => {
  it("does not self-fetch /api/auth/verify-session anymore", () => {
    expect(middlewareSource).not.toContain("/api/auth/verify-session");
  });

  it("uses direct JWT verification helper", () => {
    expect(middlewareSource).toContain("verifySessionJwt");
  });
});
