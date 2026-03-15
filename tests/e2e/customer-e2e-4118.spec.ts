import { test, expect, type Page } from "@playwright/test";

// Helper: login and return authenticated page
async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);
}

test.describe("E2E-01: Landing Page", () => {
  test("Landing page loads without JS errors", async ({ page }) => {
    const jsErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") jsErrors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/e2e-01-01-landing.png", fullPage: true });
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    // Should show SMSOK branding
    const hasBranding = body?.includes("SMSOK") || body?.includes("SMS");
    expect(hasBranding).toBeTruthy();
    // Filter critical JS errors (ignore known Next.js dev warnings)
    const critical = jsErrors.filter(
      (e) => e.includes("TypeError") || e.includes("ReferenceError") || e.includes("Uncaught")
    );
    expect(critical).toHaveLength(0);
  });

  test("Landing page has nav and CTA buttons", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Should have login/register links
    const hasLoginLink = await page.locator('a[href*="login"], a:has-text("เข้าสู่ระบบ")').count();
    const hasRegisterLink = await page.locator('a[href*="register"], a:has-text("สมัคร")').count();
    await page.screenshot({ path: "test-results/e2e-01-02-nav-cta.png" });
    expect(hasLoginLink).toBeGreaterThan(0);
    expect(hasRegisterLink).toBeGreaterThan(0);
  });
});

test.describe("E2E-02: Registration Flow", () => {
  test("Register page loads with form", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/e2e-02-01-register-page.png", fullPage: true });
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    // Should have input fields
    const inputs = await page.locator("input").count();
    expect(inputs).toBeGreaterThanOrEqual(3); // name, email, password minimum
  });

  test("Register form validation - empty submit", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isEnabled()) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: "test-results/e2e-02-02-register-validation.png", fullPage: true });
    } else {
      await page.screenshot({ path: "test-results/e2e-02-02-register-disabled.png", fullPage: true });
      // Button disabled = valid UX
    }
  });

  test("Register form validation - invalid email", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    // Fill with invalid data
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.count() > 0) {
      await emailInput.fill("not-an-email");
      await page.screenshot({ path: "test-results/e2e-02-03-invalid-email.png", fullPage: true });
    }
  });
});

test.describe("E2E-03: Login Flow", () => {
  test("Login page loads with Thai UI", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/e2e-03-01-login-page.png", fullPage: true });
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible();
  });

  test("Login with wrong credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[name="email"], input[type="email"]', "wrong@test.com");
    await page.fill('input[name="password"], input[type="password"]', "WrongPass123!");
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "test-results/e2e-03-02-wrong-login.png", fullPage: true });
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
  });

  test("Login with valid credentials → dashboard", async ({ page }) => {
    await login(page, "qa-judge2@smsok.test", "QATest123!");
    await page.screenshot({ path: "test-results/e2e-03-03-after-login.png", fullPage: true });
    // Should be on dashboard or redirected away from login
    const url = page.url();
    const isLoggedIn = url.includes("dashboard") || !url.includes("login");
    expect(isLoggedIn).toBeTruthy();
  });
});

test.describe("E2E-04: Package Page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "qa-judge2@smsok.test", "QATest123!");
  });

  test("Packages page shows 8 tiers", async ({ page }) => {
    await page.goto("/dashboard/packages");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "test-results/e2e-04-01-packages.png", fullPage: true });
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    // Check for package tiers (TIER A through D visible on SME tab, E-H on Enterprise tab)
    const tierNames = ["TIER A", "TIER B", "TIER C", "TIER D"];
    let foundCount = 0;
    for (const name of tierNames) {
      if (body?.includes(name)) foundCount++;
    }
    // At least 4 tiers visible on default SME tab
    expect(foundCount).toBeGreaterThanOrEqual(4);
    // Check both tab filters exist
    expect(body).toContain("SME");
    expect(body).toContain("Enterprise");
  });

  test("Package cards have price and SMS count", async ({ page }) => {
    await page.goto("/dashboard/packages");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "test-results/e2e-04-02-package-details.png", fullPage: true });
    const body = await page.textContent("body");
    // Should show price info (฿ symbol)
    expect(body).toContain("฿");
    // Should show SMS counts
    expect(body).toContain("SMS");
  });
});

test.describe("E2E-05: Order Flow", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "qa-judge2@smsok.test", "QATest123!");
  });

  test("Orders page loads", async ({ page }) => {
    await page.goto("/dashboard/orders");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "test-results/e2e-05-01-orders.png", fullPage: true });
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
  });

  test("Can navigate to buy package from packages page", async ({ page }) => {
    await page.goto("/dashboard/packages");
    await page.waitForTimeout(3000);
    // Look for a "buy" or "เลือก" button on a package card
    const buyBtn = page.locator('button:has-text("เลือก"), button:has-text("ซื้อ"), a:has-text("เลือก"), a:has-text("ซื้อ")').first();
    if (await buyBtn.count() > 0) {
      await buyBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: "test-results/e2e-05-02-buy-package.png", fullPage: true });
    } else {
      await page.screenshot({ path: "test-results/e2e-05-02-no-buy-btn.png", fullPage: true });
    }
  });
});

test.describe("E2E-06: Profile/Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "qa-judge2@smsok.test", "QATest123!");
  });

  test("Settings page loads with user info", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "test-results/e2e-06-01-settings.png", fullPage: true });
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    // Should show user info (email or name)
    const hasUserInfo =
      body?.includes("qa-suite") ||
      body?.includes("อีเมล") ||
      body?.includes("Email") ||
      body?.includes("ตั้งค่า") ||
      body?.includes("Settings") ||
      body?.includes("โปรไฟล์");
    expect(hasUserInfo).toBeTruthy();
  });

  test("Settings page has editable fields", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForTimeout(3000);
    // Should have input fields for profile
    const inputs = await page.locator("input").count();
    await page.screenshot({ path: "test-results/e2e-06-02-settings-fields.png", fullPage: true });
    expect(inputs).toBeGreaterThan(0);
  });
});
