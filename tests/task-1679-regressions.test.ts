import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

const smsActions = readFileSync(
  resolve(ROOT, "lib/actions/sms.ts"),
  "utf-8",
);
const disable2FaRoute = readFileSync(
  resolve(ROOT, "app/api/dev/disable-2fa/route.ts"),
  "utf-8",
);

describe("Task #1679: SMS server actions ignore caller-supplied userId", () => {
  it("rebinds explicit userId through the session-aware resolver", () => {
    expect(smsActions).toContain("resolveActionUserId(dataOrUserId)");
    expect(smsActions).toContain("userId = await requireSessionUserId()");
    expect(smsActions).toContain("Client call: get userId from session");
  });
});

describe("Task #1679: dev disable-2fa route exists for QA setup", () => {
  it("requires a dev secret and supports challenge tokens", () => {
    expect(disable2FaRoute).toContain("x-dev-secret");
    expect(disable2FaRoute).toContain("resolveUserIdFromChallengeToken");
    expect(disable2FaRoute).toContain("reset2FARateLimit(user.id)");
  });
});
