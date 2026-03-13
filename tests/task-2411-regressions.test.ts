import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

const webhookItemRoute = readFileSync(resolve(ROOT, "app/api/v1/webhooks/[id]/route.ts"), "utf-8");
const webhookActions = readFileSync(resolve(ROOT, "lib/actions/webhooks.ts"), "utf-8");
const campaignsRoute = readFileSync(resolve(ROOT, "app/api/v1/campaigns/route.ts"), "utf-8");
const campaignSendRoute = readFileSync(resolve(ROOT, "app/api/v1/campaigns/[id]/send/route.ts"), "utf-8");
const apiDocsPage = readFileSync(resolve(ROOT, "app/docs/api/page.tsx"), "utf-8");

describe("Task #2411: webhook detail GET, campaign auth, docs consistency", () => {
  it("adds a webhook detail getter with masked secret output", () => {
    expect(webhookItemRoute).toContain("export async function GET");
    expect(webhookItemRoute).toContain("const webhook = await getWebhook(id, user.id)");
    expect(webhookActions).toContain("export async function getWebhook(id: string, apiUserId?: string)");
    expect(webhookActions).toContain('status: webhook.active ? "active" : "disabled"');
    expect(webhookActions).toContain("secret: maskWebhookSecret(plaintextSecret)");
  });

  it("uses authenticateRequest for campaign routes so sessions and API keys both work", () => {
    expect(campaignsRoute).toContain("const user = await authenticateRequest(req);");
    expect(campaignSendRoute).toContain("const user = await authenticateRequest(req);");
    expect(campaignsRoute).not.toContain("authenticatePublicApiKey(req)");
    expect(campaignSendRoute).not.toContain("authenticatePublicApiKey(req)");
  });

  it("updates quota docs to smsRemaining and /sms/remaining", () => {
    expect(apiDocsPage).toContain('path: "/sms/remaining"');
    expect(apiDocsPage).toContain('"smsRemaining": 1500');
    expect(apiDocsPage).toContain("https://api.smsok.io/v1/sms/remaining");
    expect(apiDocsPage).not.toContain('path: "/credits/balance"');
    expect(apiDocsPage).not.toContain('"balance": 1500');
  });
});
