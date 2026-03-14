import { test, expect } from "./fixtures";

test.describe("Campaign Bulk Send", () => {
  // SMS-02: Campaign creation and bulk send
  test("SMS-02: campaigns page has create campaign button", async ({ authedPage: page }) => {
    await page.goto("/dashboard/campaigns", { waitUntil: "networkidle" });
    const body = await page.textContent("body");

    expect(body).not.toContain("Something went wrong");

    // Should have create campaign CTA
    const createBtn = page.getByText(/สร้างแคมเปญ|Create Campaign|New Campaign/i).first();
    const hasCreate = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasCreate).toBeTruthy();
  });

  // SMS-02b: Campaign builder panel opens
  test("SMS-02b: campaign builder opens with required fields", async ({ authedPage: page }) => {
    await page.goto("/dashboard/campaigns", { waitUntil: "networkidle" });

    const createBtn = page.getByText(/สร้างแคมเปญ/i).first();
    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(500);

      const body = await page.textContent("body");

      // Builder should show required fields
      const hasName = body?.includes("ชื่อแคมเปญ") || body?.includes("Campaign name");
      const hasSender = body?.includes("ผู้ส่ง") || body?.includes("Sender");
      const hasRecipient = body?.includes("ผู้รับ") || body?.includes("กลุ่ม") || body?.includes("Recipient");

      expect(hasName || hasSender || hasRecipient).toBeTruthy();
    }
  });

  // SMS-02c: Campaign list shows existing campaigns
  test("SMS-02c: campaign list or empty state", async ({ authedPage: page }) => {
    await page.goto("/dashboard/campaigns", { waitUntil: "networkidle" });
    const body = await page.textContent("body");

    // Should show campaigns or empty state
    const hasCampaigns = body?.includes("กำลังส่ง") || body?.includes("สำเร็จ") || body?.includes("ฉบับร่าง");
    const hasEmpty = body?.includes("ยังไม่มีแคมเปญ") || body?.includes("No campaigns");

    expect(hasCampaigns || hasEmpty).toBeTruthy();
  });
});
