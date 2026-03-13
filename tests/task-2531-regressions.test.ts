import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  createCampaignSchema,
  createContactSchema,
  createWebhookSchema,
} from "@/lib/validations";

const ROOT = resolve(__dirname, "..");

const apiAuthSource = readFileSync(resolve(ROOT, "lib/api-auth.ts"), "utf-8");
const requestAuthSource = readFileSync(resolve(ROOT, "lib/request-auth.ts"), "utf-8");
const loginRouteSource = readFileSync(resolve(ROOT, "app/api/auth/login/route.ts"), "utf-8");

describe("Task #2531: XSS validation regressions", () => {
  it("rejects HTML tags in contact names instead of silently stripping them", () => {
    expect(() =>
      createContactSchema.parse({
        name: "<script>alert(1)</script>",
        phone: "0891234567",
      }),
    ).toThrow("ชื่อมีอักขระไม่อนุญาต");
  });

  it("rejects HTML tags in campaign names instead of silently stripping them", () => {
    expect(() =>
      createCampaignSchema.parse({
        name: "<script>alert(1)</script>",
      }),
    ).toThrow("ชื่อมีอักขระไม่อนุญาต");
  });

  it("rejects webhook URLs that contain angle brackets", () => {
    expect(() =>
      createWebhookSchema.parse({
        url: "http://evil.com/<script>alert(1)</script>",
        events: ["sms.sent"],
      }),
    ).toThrow("URL ไม่ถูกต้อง");
  });
});

describe("Task #2531: Thai auth messages regressions", () => {
  it("localizes API key auth failures to Thai", () => {
    expect(apiAuthSource).toContain("กรุณาระบุ API Key");
    expect(apiAuthSource).toContain("รูปแบบ API Key ไม่ถูกต้อง");
    expect(apiAuthSource).toContain("API Key ไม่ถูกต้อง");
    expect(apiAuthSource).toContain("API Key ถูกปิดใช้งาน");
    expect(apiAuthSource).toContain("API Key ไม่มีสิทธิ์เข้าถึง");
  });

  it("localizes session-required auth failures to Thai", () => {
    expect(requestAuthSource).toContain("กรุณาเข้าสู่ระบบ");
    expect(apiAuthSource).toContain("ปลายทางนี้ต้องใช้การเข้าสู่ระบบ");
  });

  it("localizes CSRF origin failures to Thai", () => {
    expect(loginRouteSource).toContain("คำขอไม่ถูกต้อง กรุณาลองใหม่");
  });
});
