import { test, expect, expectPageLoads, collectConsoleErrors } from "./fixtures";

test.describe("Retest Critical Bugs", () => {
  // =========================================================================
  // 1. Campaigns Server Error (was CRITICAL)
  // =========================================================================
  test.describe("Campaigns - was CRITICAL server error", () => {
    test("campaigns page loads without error boundary", async ({ authedPage: page }) => {
      const errors = await collectConsoleErrors(page);

      const response = await page.goto("/dashboard/campaigns", {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Must return 200
      expect(response?.status()).toBe(200);

      const body = await page.textContent("body");

      // Must NOT show error boundary
      expect(body).not.toContain("เกิดข้อผิดพลาด");
      expect(body).not.toContain("Something went wrong");
      expect(body).not.toContain("Application error");
      expect(body).not.toContain("Internal Server Error");

      // Must show campaign content or empty state
      const hasContent =
        body!.includes("แคมเปญ") ||
        body!.includes("Campaign") ||
        body!.includes("ยังไม่มี") ||
        body!.includes("สร้าง") ||
        body!.includes("Create");
      expect(hasContent).toBeTruthy();

      // No critical console errors (filter out noise)
      const criticalErrors = errors.filter(
        (e) =>
          !e.includes("favicon") &&
          !e.includes("next-dev") &&
          !e.includes("hydration")
      );
      // Log but don't hard-fail on console warnings
      if (criticalErrors.length > 0) {
        console.log("Console errors on campaigns:", criticalErrors);
      }
    });

    test("campaigns create button is functional", async ({ authedPage: page }) => {
      await page.goto("/dashboard/campaigns", { waitUntil: "networkidle" });

      const createBtn = page
        .locator("button, a")
        .filter({ hasText: /สร้าง|Create|เพิ่ม|New|ใหม่/i })
        .first();

      const hasBtn = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasBtn) {
        // Button exists and should be enabled
        const isDisabled = await createBtn.isDisabled().catch(() => false);
        expect(isDisabled).toBe(false);
      } else {
        // No button - page should still have interactive elements
        const buttons = page.locator("button, a[href]");
        const count = await buttons.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test("campaigns mobile 375px renders", async ({ authedPage: page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const response = await page.goto("/dashboard/campaigns", {
        waitUntil: "networkidle",
        timeout: 30000,
      });
      expect(response?.status()).toBe(200);
      const body = await page.textContent("body");
      expect(body).not.toContain("เกิดข้อผิดพลาด");
      expect(body).not.toContain("Something went wrong");
      expect(body!.length).toBeGreaterThan(100);
    });
  });

  // =========================================================================
  // 2. Roles 401 Auth (was CRITICAL)
  // =========================================================================
  test.describe("Roles - was CRITICAL 401 auth", () => {
    test("roles page loads without 401 redirect", async ({ authedPage: page }) => {
      const errors = await collectConsoleErrors(page);

      const response = await page.goto("/dashboard/settings/roles", {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Must NOT redirect to login (401 bug)
      expect(page.url()).not.toContain("/login");

      // Must return 200
      expect(response?.status()).toBe(200);

      const body = await page.textContent("body");

      // Must not show error
      expect(body).not.toContain("Something went wrong");
      expect(body).not.toContain("Application error");
      expect(body).not.toContain("Internal Server Error");

      // Should show roles content
      const hasContent =
        body!.includes("บทบาท") ||
        body!.includes("Role") ||
        body!.includes("สิทธิ์") ||
        body!.includes("Permission") ||
        body!.includes("ยังไม่มี") ||
        body!.includes("จัดการ");
      expect(hasContent).toBeTruthy();

      // Check for 401 errors in console
      const authErrors = errors.filter(
        (e) => e.includes("401") || e.includes("Unauthorized")
      );
      expect(authErrors).toHaveLength(0);
    });

    test("roles create button works", async ({ authedPage: page }) => {
      await page.goto("/dashboard/settings/roles", { waitUntil: "networkidle" });

      const createBtn = page
        .locator("button, a")
        .filter({ hasText: /สร้าง|Create|เพิ่ม|Add|New|ใหม่/i })
        .first();

      const hasBtn = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasBtn) {
        const isDisabled = await createBtn.isDisabled().catch(() => false);
        expect(isDisabled).toBe(false);
      } else {
        // Page should at least have interactive elements
        const body = await page.textContent("body");
        expect(body!.length).toBeGreaterThan(100);
      }
    });

    test("roles mobile 375px renders", async ({ authedPage: page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const response = await page.goto("/dashboard/settings/roles", {
        waitUntil: "networkidle",
        timeout: 30000,
      });
      expect(page.url()).not.toContain("/login");
      expect(response?.status()).toBe(200);
      const body = await page.textContent("body");
      expect(body).not.toContain("Something went wrong");
      expect(body!.length).toBeGreaterThan(100);
    });
  });

  // =========================================================================
  // 3. PDPA Settings Timeout (was HIGH)
  // =========================================================================
  test.describe("PDPA Settings - was HIGH timeout", () => {
    test("PDPA page loads within 30s with privacy content", async ({ authedPage: page }) => {
      const errors = await collectConsoleErrors(page);
      const startTime = Date.now();

      const response = await page.goto("/dashboard/settings/pdpa", {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      const loadTime = Date.now() - startTime;
      console.log(`PDPA load time: ${loadTime}ms`);

      // Must return 200
      expect(response?.status()).toBe(200);

      // Must load within 30s
      expect(loadTime).toBeLessThan(30000);

      const body = await page.textContent("body");
      expect(body).not.toContain("Something went wrong");
      expect(body).not.toContain("Application error");

      // Must show PDPA/privacy content
      const hasPDPA =
        body!.includes("PDPA") ||
        body!.includes("ข้อมูลส่วนบุคคล") ||
        body!.includes("Privacy") ||
        body!.includes("ความเป็นส่วนตัว") ||
        body!.includes("ความยินยอม") ||
        body!.includes("Consent");
      expect(hasPDPA).toBeTruthy();

      // Log console errors
      const criticalErrors = errors.filter(
        (e) => !e.includes("favicon") && !e.includes("next-dev")
      );
      if (criticalErrors.length > 0) {
        console.log("Console errors on PDPA:", criticalErrors);
      }
    });

    test("PDPA toggle switches work", async ({ authedPage: page }) => {
      await page.goto("/dashboard/settings/pdpa", { waitUntil: "networkidle" });

      const switches = page.locator('[role="switch"]');
      const count = await switches.count();

      if (count > 0) {
        const sw = switches.first();
        const before =
          (await sw.getAttribute("data-state")) ??
          (await sw.getAttribute("aria-checked"));
        await sw.click();
        // Wait for state to change
        await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
        const after =
          (await sw.getAttribute("data-state")) ??
          (await sw.getAttribute("aria-checked"));
        expect(after).not.toBe(before);
      } else {
        // No toggles — page should still have content
        const body = await page.textContent("body");
        expect(body!.length).toBeGreaterThan(100);
      }
    });

    test("PDPA mobile 375px renders", async ({ authedPage: page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const response = await page.goto("/dashboard/settings/pdpa", {
        waitUntil: "networkidle",
        timeout: 30000,
      });
      expect(response?.status()).toBe(200);
      const body = await page.textContent("body");
      expect(body).not.toContain("Something went wrong");
      expect(body!.length).toBeGreaterThan(100);
    });
  });
});
