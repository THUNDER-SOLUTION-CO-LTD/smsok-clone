import { test as base, expect, type Page } from "@playwright/test";

const BO_URL = "http://localhost:3001";
const ADMIN = { email: "admin@smsok.com", password: "Admin123!" };

const test = base.extend<{ boPage: Page }>({
  boPage: async ({ browser }, run) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login to backoffice
    await page.goto(`${BO_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    // Dismiss cookie consent if present
    const acceptBtn = page.getByText("ยอมรับทั้งหมด");
    if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptBtn.click();
      await acceptBtn.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
    }

    // Fill login form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    await emailInput.waitFor({ state: "visible", timeout: 10000 });
    await emailInput.fill(ADMIN.email);
    await passwordInput.fill(ADMIN.password);

    await page.screenshot({ path: "test-results/bo-01-login-filled.png" });

    // Submit login
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.waitFor({ state: "visible", timeout: 5000 });

    // Wait for button to be enabled
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
        return btn && !btn.disabled;
      },
      { timeout: 10000 }
    ).catch(async () => {
      // Retry with type() to trigger events
      await emailInput.clear();
      await emailInput.type(ADMIN.email);
      await passwordInput.clear();
      await passwordInput.type(ADMIN.password);
    });

    await submitBtn.click();

    // Wait for login response
    await page.waitForResponse(
      (res) => res.url().includes("/api/auth/login") || res.url().includes("/api/auth"),
      { timeout: 30000 }
    ).catch(() => {});

    // Wait for navigation away from login
    try {
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
    } catch {
      // If still on login, take screenshot and check what happened
      await page.screenshot({ path: "test-results/bo-01-login-stuck.png" });
      const body = await page.textContent("body").catch(() => "");
      if (body?.includes("ไม่ถูกต้อง") || body?.includes("error")) {
        throw new Error(`Login failed: ${body?.slice(0, 200)}`);
      }
      // Try navigating directly
      await page.goto(`${BO_URL}/dashboard/ceo`, { waitUntil: "domcontentloaded", timeout: 15000 });
    }

    await page.screenshot({ path: "test-results/bo-01-login-success.png" });
    await run(page);
    await context.close();
  },
});

// Helper: collect console errors
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });
  return errors;
}

test.describe("Backoffice Smoke E2E", () => {

  // ===== 1. Login Page =====
  test("BO-01: login page loads", async ({ page }) => {
    await page.goto(`${BO_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");
    expect(body).not.toContain("ไม่พบหน้าที่คุณต้องการ");
    // Should have login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const hasEmail = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasEmail).toBeTruthy();

    await page.screenshot({ path: "test-results/bo-01-login-page.png" });
  });

  // ===== 2. Dashboard Views =====
  test("BO-02: CEO dashboard loads", async ({ boPage: page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto(`${BO_URL}/dashboard/ceo`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body).not.toContain("ไม่พบหน้าที่คุณต้องการ");
    await page.screenshot({ path: "test-results/bo-02-ceo-dashboard.png" });

    // Log console errors but don't fail on them (report separately)
    const realErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    if (realErrors.length > 0) {
      console.log(`CEO dashboard console errors: ${realErrors.length}`);
      realErrors.forEach(e => console.log(`  - ${e.slice(0, 150)}`));
    }
  });

  test("BO-03: Support dashboard loads", async ({ boPage: page }) => {
    await page.goto(`${BO_URL}/dashboard/support`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body).not.toContain("ไม่พบหน้าที่คุณต้องการ");
    await page.screenshot({ path: "test-results/bo-03-support-dashboard.png" });
  });

  test("BO-04: Sales dashboard loads", async ({ boPage: page }) => {
    await page.goto(`${BO_URL}/dashboard/sales`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body).not.toContain("ไม่พบหน้าที่คุณต้องการ");
    await page.screenshot({ path: "test-results/bo-04-sales-dashboard.png" });
  });

  test("BO-05: Finance dashboard loads", async ({ boPage: page }) => {
    await page.goto(`${BO_URL}/dashboard/finance`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body).not.toContain("ไม่พบหน้าที่คุณต้องการ");
    await page.screenshot({ path: "test-results/bo-05-finance-dashboard.png" });
  });

  test("BO-06: CTO dashboard loads", async ({ boPage: page }) => {
    await page.goto(`${BO_URL}/dashboard/cto`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body).not.toContain("ไม่พบหน้าที่คุณต้องการ");
    await page.screenshot({ path: "test-results/bo-06-cto-dashboard.png" });
  });

  // ===== 3. Orders Page =====
  test("BO-07: Orders page loads with data", async ({ boPage: page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto(`${BO_URL}/orders`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body).not.toContain("ไม่พบหน้าที่คุณต้องการ");
    // Should show orders or empty state
    expect(body).toMatch(/ORD-|คำสั่งซื้อ|Orders|order|ไม่พบ|No orders/i);

    await page.screenshot({ path: "test-results/bo-07-orders-page.png" });

    const realErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    if (realErrors.length > 0) {
      console.log(`Orders page console errors: ${realErrors.length}`);
      realErrors.forEach(e => console.log(`  - ${e.slice(0, 150)}`));
    }
  });

  // ===== 4. Customers Page =====
  test("BO-08: Customers page loads", async ({ boPage: page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto(`${BO_URL}/customers`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body).not.toContain("ไม่พบหน้าที่คุณต้องการ");
    // Should show customers list or table
    expect(body).toMatch(/ลูกค้า|Customers|customer|email|ผู้ใช้|Users/i);

    await page.screenshot({ path: "test-results/bo-08-customers-page.png" });

    const realErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    if (realErrors.length > 0) {
      console.log(`Customers page console errors: ${realErrors.length}`);
      realErrors.forEach(e => console.log(`  - ${e.slice(0, 150)}`));
    }
  });

  // ===== 5. Responsive =====
  test("BO-09: Backoffice responsive 375px", async ({ boPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BO_URL}/orders`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
    );
    expect(hasOverflow).toBe(false);
    await page.screenshot({ path: "test-results/bo-09-responsive.png" });
  });
});
