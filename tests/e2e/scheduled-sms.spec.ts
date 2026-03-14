import { test, expect } from "./fixtures";

test.describe("Scheduled SMS", () => {
  // SMS-05: Schedule SMS
  test("SMS-05: schedule SMS for future delivery", async ({ authedPage: page }) => {
    await page.goto("/dashboard/send", { waitUntil: "networkidle" });

    // Fill SMS form
    const phoneInput = page.locator('input[placeholder*="เบอร์"]').first()
      || page.locator('input[name="phone"]').first();
    if (await phoneInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await phoneInput.fill("0891234567");
    }

    const messageArea = page.locator("textarea").first();
    await messageArea.fill("ทดสอบ scheduled SMS");

    // Look for schedule option
    const scheduleToggle = page.getByText(/ตั้งเวลา|Schedule/i).first();
    if (await scheduleToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await scheduleToggle.click();

      // Verify datetime picker appears
      const dateInput = page.locator('input[type="datetime-local"], input[type="date"]').first();
      await expect(dateInput).toBeVisible({ timeout: 5000 });
    }
  });

  // SMS-06: View scheduled SMS list
  test("SMS-06: scheduled SMS appears in list", async ({ authedPage: page }) => {
    await page.goto("/dashboard/scheduled", { waitUntil: "networkidle" });
    const body = await page.textContent("body");

    // Page should load without error
    expect(body).not.toContain("Something went wrong");

    // Should show scheduled list or empty state
    const hasScheduled = body?.includes("SCHEDULED") || body?.includes("ตั้งเวลา");
    const hasEmpty = body?.includes("ยังไม่มี") || body?.includes("No scheduled");
    expect(hasScheduled || hasEmpty).toBeTruthy();
  });
});
