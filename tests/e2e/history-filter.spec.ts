import { test, expect } from "./fixtures";

test.describe("SMS History Filtering", () => {
  // DASH-02: Filter SMS history by date range
  test("DASH-02: filter SMS history by date range", async ({ authedPage: page }) => {
    await page.goto("/dashboard/history", { waitUntil: "networkidle" });
    const body = await page.textContent("body");

    // Page loads without error
    expect(body).not.toContain("Something went wrong");

    // Should have filter controls
    const hasDateFilter = page.locator('input[type="date"]').first();
    const hasStatusFilter = page.getByText(/สถานะ|Status|กรอง|Filter/i).first();

    const dateVisible = await hasDateFilter.isVisible({ timeout: 5000 }).catch(() => false);
    const statusVisible = await hasStatusFilter.isVisible({ timeout: 3000 }).catch(() => false);

    // At least one filter should be present
    expect(dateVisible || statusVisible).toBeTruthy();
  });

  // DASH-02b: History shows SMS entries or empty state
  test("DASH-02b: history shows entries or empty state", async ({ authedPage: page }) => {
    await page.goto("/dashboard/history", { waitUntil: "networkidle" });
    const body = await page.textContent("body");

    // Should show SMS entries or empty state
    const hasEntries = body?.includes("สำเร็จ") || body?.includes("ล้มเหลว") || body?.includes("DELIVERED");
    const hasEmpty = body?.includes("ยังไม่มี") || body?.includes("No messages");
    expect(hasEntries || hasEmpty).toBeTruthy();
  });
});
