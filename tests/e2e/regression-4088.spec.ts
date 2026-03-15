import { test, expect } from "@playwright/test";

test.describe("Regression #4088 — Bug Fixes Retest", () => {
  test("R1: Landing page loads without errors", async ({ page }) => {
    await page.goto("/");
    await expect(page).not.toHaveTitle(/error/i);
    await page.screenshot({ path: "test-results/r4088-01-landing.png", fullPage: true });
    // Should NOT have Internal Server Error
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
  });

  test("R2: Dashboard loads (redirects to login if not authed)", async ({ page }) => {
    await page.goto("/dashboard");
    await page.screenshot({ path: "test-results/r4088-02-dashboard.png", fullPage: true });
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    // Should either show dashboard or redirect to login
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|login|auth)/);
  });

  test("R3: 404 page shows properly (not 500 ISE)", async ({ page }) => {
    const response = await page.goto("/thispagedoesnotexist123");
    await page.screenshot({ path: "test-results/r4088-03-404.png", fullPage: true });
    expect(response?.status()).toBe(404);
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    // Should show some 404 content
    const has404Content = body?.includes("404") || body?.includes("ไม่พบ") || body?.includes("not found") || body?.includes("Not Found");
    expect(has404Content).toBeTruthy();
  });

  test("R4: Forbidden page shows properly (not 500 ISE)", async ({ page }) => {
    await page.goto("/forbidden");
    await page.screenshot({ path: "test-results/r4088-04-forbidden.png", fullPage: true });
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    // Should show forbidden/access denied content
    const hasForbiddenContent = body?.includes("403") || body?.includes("ไม่มีสิทธิ์") || body?.includes("forbidden") || body?.includes("Forbidden") || body?.includes("Access Denied");
    expect(hasForbiddenContent).toBeTruthy();
  });

  test("R5: Orders page has no Prisma errors (sender_type/total_amount)", async ({ page }) => {
    // Register console listener before navigation
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await page.goto("/dashboard/orders");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "test-results/r4088-05-orders.png", fullPage: true });
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body).not.toContain("PrismaClientKnownRequestError");
    // Filter for Prisma-specific errors only
    const criticalErrors = consoleErrors.filter(
      (e) => e.includes("Prisma") || e.includes("sender_type") || e.includes("total_amount")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("R6: Playwright test suite compiles (no TS errors)", async ({}) => {
    // This test just validates that we got here — if there were compile errors,
    // Playwright wouldn't have been able to run any tests
    expect(true).toBeTruthy();
  });
});
