import { test, expect } from "./fixtures";

test.describe("PDPA Consent Management", () => {
  // SET-04: PDPA consent management in settings
  test("SET-04: privacy settings page loads with consent toggles", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings/privacy", { waitUntil: "networkidle" });
    const body = await page.textContent("body");

    // Page loads without error
    expect(body).not.toContain("Something went wrong");

    // Should show privacy/PDPA content
    const hasPrivacy = body?.includes("ความเป็นส่วนตัว") || body?.includes("Privacy") || body?.includes("PDPA");
    expect(hasPrivacy).toBeTruthy();
  });

  // SET-04b: PDPA consent page accessible
  test("SET-04b: PDPA consent page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings/pdpa", { waitUntil: "networkidle" });
    const body = await page.textContent("body");

    expect(body).not.toContain("Something went wrong");

    // Should show consent-related content
    const hasPdpa = body?.includes("PDPA") || body?.includes("consent") || body?.includes("ยินยอม") || body?.includes("ความยินยอม");
    expect(hasPdpa).toBeTruthy();
  });

  // AUTH-03: Register requires PDPA consent
  test("AUTH-03: register page has consent checkboxes", async ({ page }) => {
    await page.goto("/register", { waitUntil: "networkidle" });

    // Find consent checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    // Should have at least 2 consent checkboxes (terms + data sharing)
    expect(count).toBeGreaterThanOrEqual(2);

    // Terms checkbox should link to /terms
    const termsLink = page.locator('a[href="/terms"]');
    await expect(termsLink).toBeVisible({ timeout: 5000 });

    // Privacy link should exist
    const privacyLink = page.locator('a[href="/privacy"]');
    await expect(privacyLink).toBeVisible({ timeout: 5000 });
  });
});
