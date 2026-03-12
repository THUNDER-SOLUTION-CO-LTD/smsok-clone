import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { createContactSchema } from "@/lib/validations";
import { validateSenderName } from "@/lib/sender-name-validation";

const ROOT = resolve(__dirname, "..");

const campaignListRoute = readFileSync(
  resolve(ROOT, "app/api/v1/campaigns/route.ts"),
  "utf-8",
);
const campaignDetailRoute = readFileSync(
  resolve(ROOT, "app/api/v1/campaigns/[id]/route.ts"),
  "utf-8",
);
const campaignActions = readFileSync(
  resolve(ROOT, "lib/actions/campaigns.ts"),
  "utf-8",
);
const logsRoute = readFileSync(
  resolve(ROOT, "app/api/v1/logs/route.ts"),
  "utf-8",
);
const contactActions = readFileSync(
  resolve(ROOT, "lib/actions/contacts.ts"),
  "utf-8",
);

describe("Task #2062: campaign API fixes", () => {
  it("adds a campaign detail route with auth and permission checks", () => {
    expect(campaignDetailRoute).toContain("authenticateRequest");
    expect(campaignDetailRoute).toContain("requireApiPermission");
    expect(campaignDetailRoute).toContain("db.campaign.findFirst");
    expect(campaignDetailRoute).toContain("contactGroup");
    expect(campaignDetailRoute).toContain("template");
  });

  it("passes the status query param through the list route", () => {
    expect(campaignListRoute).toContain('const status = searchParams.get("status") || undefined;');
    expect(campaignListRoute).toContain("getCampaigns(user.id, { page, limit, status })");
  });

  it("applies a case-insensitive status filter in getCampaigns", () => {
    expect(campaignActions).toContain("campaignFilterSchema");
    expect(campaignActions).toContain('status: { equals: pagination.status, mode: "insensitive" as const }');
  });
});

describe("Task #2062: logs/contact/sender fixes", () => {
  it("rejects non-numeric log status filters before Prisma", () => {
    expect(logsRoute).toContain('if (!/^\\d{3}$/.test(normalizedStatus))');
    expect(logsRoute).toContain("status ต้องเป็นรหัส HTTP 3 หลัก");
    expect(logsRoute).toContain("status ต้องอยู่ระหว่าง 100-599");
  });

  it("disallows whitespace in sender names", () => {
    expect(validateSenderName("DROP TABLE").valid).toBe(false);
    expect(validateSenderName("EasySlip").valid).toBe(true);
  });

  it("accepts smsConsent on contact create and persists consent metadata", () => {
    const parsed = createContactSchema.parse({
      name: "ลูกค้าใหม่",
      phone: "0812345678",
      smsConsent: false,
    });

    expect(parsed.smsConsent).toBe(false);
    expect(contactActions).toContain("input.smsConsent === undefined");
    expect(contactActions).toContain('consentStatus: "OPTED_OUT"');
    expect(contactActions).toContain('consentStatus: "OPTED_IN"');
  });
});
