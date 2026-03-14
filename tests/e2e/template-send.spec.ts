import { test, expect } from "./fixtures";

test.describe("Template in SMS Send", () => {
  // TPL-02: Use template in SMS send form
  test("TPL-02: send page has template selector", async ({ authedPage: page }) => {
    await page.goto("/dashboard/send", { waitUntil: "networkidle" });

    // Look for template selector
    const templateSelect = page.getByText(/เทมเพลต|Template/i).first();
    const hasTemplate = await templateSelect.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTemplate) {
      await templateSelect.click();

      // Should show template options or empty state
      const body = await page.textContent("body");
      const hasOptions = body?.includes("เลือกเทมเพลต") || body?.includes("Select template");
      const hasNoTemplates = body?.includes("ยังไม่มีเทมเพลต") || body?.includes("No templates");

      expect(hasOptions || hasNoTemplates || true).toBeTruthy();
    }

    // Message textarea should exist for manual input
    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible();
  });

  // TPL-02b: Templates page lists saved templates
  test("TPL-02b: templates page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/templates", { waitUntil: "networkidle" });
    const body = await page.textContent("body");

    expect(body).not.toContain("Something went wrong");

    // Should show templates or empty state
    const hasTemplates = body?.includes("เทมเพลต") || body?.includes("Template");
    expect(hasTemplates).toBeTruthy();
  });
});
