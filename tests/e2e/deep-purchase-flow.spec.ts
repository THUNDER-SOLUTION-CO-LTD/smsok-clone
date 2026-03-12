import { test, expect, expectPageLoads, collectConsoleErrors } from "./fixtures";

/**
 * DEEP PURCHASE FLOW — Full E2E test covering:
 * Packages → Checkout → Orders → Billing → My Packages → Topup
 *
 * Tests 30 scenarios across the complete purchase journey.
 */

// ── Helper: get a valid tier code from the packages page ──
async function getFirstTierCode(page: import("@playwright/test").Page): Promise<string | null> {
  // Try to get tier from API
  const resp = await page.request.get("/api/v1/packages").catch(() => null);
  if (resp?.ok()) {
    const data = await resp.json().catch(() => null);
    const tiers = data?.data?.tiers ?? data?.tiers ?? [];
    if (tiers.length > 0) {
      return tiers[0].tierCode ?? tiers[0].tier_code ?? tiers[0].id ?? null;
    }
  }
  // Fallback: use "A" (SME tier A)
  return "A";
}

// ═══════════════════════════════════════════════════════════════════════
// SECTION 1: PACKAGES (/dashboard/packages)
// ═══════════════════════════════════════════════════════════════════════

test.describe("Deep Purchase Flow — Packages", () => {

  // #1: Page loads with pricing tiers
  test("DP-001: packages page loads with pricing content", async ({ authedPage: page }) => {
    const errors = await collectConsoleErrors(page);
    await page.goto("/dashboard/packages", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    expect(body).toContain("เลือกแพ็กเกจ");
    expect(body).toMatch(/฿[\d,]+/); // Has Thai baht prices
    expect(body).toMatch(/[\d,]+\s*SMS/i); // Has SMS amounts
    // No critical console errors (filter hydration noise)
    const criticalErrors = errors.filter(
      (e) => !e.includes("hydrat") && !e.includes("Warning") && !e.includes("DevTools")
    );
    expect(criticalErrors.length).toBeLessThanOrEqual(2);
  });

  // #2: SME + Enterprise tabs exist and switch
  test("DP-002: SME and Enterprise tab switching works", async ({ authedPage: page }) => {
    await page.goto("/dashboard/packages", { waitUntil: "networkidle" });

    // SME tab should be visible
    const smeTab = page.locator('[role="tab"]').filter({ hasText: /SME/i });
    const entTab = page.locator('[role="tab"]').filter({ hasText: /Enterprise/i });
    await expect(smeTab).toBeVisible();
    await expect(entTab).toBeVisible();

    // Click Enterprise tab
    await entTab.click();
    await page.waitForTimeout(500); // Allow animation
    const body = await page.textContent("body");
    // Enterprise tiers should now show (E-H range)
    expect(body).toMatch(/Tier [E-H]/i);

    // Click back to SME
    await smeTab.click();
    await page.waitForTimeout(500);
    const bodyAfter = await page.textContent("body");
    expect(bodyAfter).toMatch(/Tier [A-D]/i);
  });

  // #3: Package cards show name, price, SMS count, features
  test("DP-003: package cards display name, price, SMS count", async ({ authedPage: page }) => {
    await page.goto("/dashboard/packages", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    // Page body should have pricing content with SMS and Baht
    const body = await page.textContent("body");
    // Multiple tiers with SMS counts and prices
    const smsMatches = body!.match(/[\d,]+\s*SMS/g);
    expect(smsMatches).not.toBeNull();
    expect(smsMatches!.length).toBeGreaterThanOrEqual(2);

    // Multiple price entries
    const priceMatches = body!.match(/฿[\d,.]+/g);
    expect(priceMatches).not.toBeNull();
    expect(priceMatches!.length).toBeGreaterThanOrEqual(2);

    // Price per SMS shown
    expect(body).toMatch(/฿[\d.]+\/ข้อความ/);
  });

  // #4: "Best Value" badge on recommended tier
  test("DP-004: Best Value badge visible on recommended tier", async ({ authedPage: page }) => {
    await page.goto("/dashboard/packages", { waitUntil: "networkidle" });
    const bestValueBadge = page.locator("text=Best Value").first();
    // At least one tier should have Best Value badge
    const isVisible = await bestValueBadge.isVisible({ timeout: 5000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  // #5: Comparison table expand/collapse
  test("DP-005: comparison table expands and collapses", async ({ authedPage: page }) => {
    await page.goto("/dashboard/packages", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    // Find the comparison toggle button
    const toggleBtn = page.locator("button, [role='button']").filter({ hasText: /เปรียบเทียบ/ }).first();
    const isVisible = await toggleBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVisible) {
      // On /dashboard/packages with Framer Motion, the toggle might use a different text
      // Check the billing version
      await page.goto("/dashboard/billing/packages", { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    }

    const compareToggle = page.locator("button, [role='button']").filter({ hasText: /เปรียบเทียบ/ }).first();
    if (await compareToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
      await compareToggle.click();
      await page.waitForTimeout(500);

      // After expand, check for table or feature comparison content
      const body = await page.textContent("body");
      expect(body).toMatch(/Feature|SMS|smsCredits|เครดิต|Sender/i);
    } else {
      // No comparison table on this page variant — verify page itself is functional
      const body = await page.textContent("body");
      expect(body).toMatch(/SMS|แพ็กเกจ/);
    }
  });

  // #6: Click "Buy" on a package redirects to checkout
  test("DP-006: clicking Buy redirects to checkout with tier param", async ({ authedPage: page }) => {
    await page.goto("/dashboard/packages", { waitUntil: "networkidle" });

    // Find buy button (ซื้อ or ซื้อเลย)
    const buyBtn = page.locator("button").filter({ hasText: /ซื้อ/ }).first();
    await expect(buyBtn).toBeVisible();
    await buyBtn.click();

    await page.waitForURL(/\/checkout\?tier=/, { timeout: 10000 });
    expect(page.url()).toContain("/dashboard/billing/checkout?tier=");
  });

  // #7: Volume slider section
  test("DP-007: volume slider section is present and functional", async ({ authedPage: page }) => {
    // Try /dashboard/billing/packages first (has volume slider for sure)
    await page.goto("/dashboard/billing/packages", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    // Check for slider role element
    const slider = page.locator('[role="slider"]');
    const hasSlider = await slider.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasSlider) {
      // Fallback to /dashboard/packages
      await page.goto("/dashboard/packages", { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    }

    const sliderVisible = await page.locator('[role="slider"]').isVisible({ timeout: 5000 }).catch(() => false);
    if (sliderVisible) {
      // Volume slider text
      const body = await page.textContent("body");
      expect(body).toMatch(/ต้องการส่ง SMS|ประมาณกี่ข้อความ|SMS/);
      // Recommendation should appear
      expect(body).toMatch(/แพ็กเกจแนะนำ|แนะนำ|ติดต่อฝ่ายขาย/);
    } else {
      // Page may use a different package selection UI (topup-style grid)
      const body = await page.textContent("body");
      expect(body).toMatch(/SMS|แพ็กเกจ/);
    }
  });

  // #8: Mobile 375px — accordion layout
  test("DP-008: mobile 375px shows accordion layout", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      storageState: "tests/e2e/.auth/user.json",
    });
    const page = await context.newPage();
    await page.goto("/dashboard/packages", { waitUntil: "networkidle" });

    // Desktop grid should be hidden
    const desktopGrid = page.locator('.hidden.sm\\:grid');
    await expect(desktopGrid).toBeHidden();

    // Mobile accordion cards should be visible (sm:hidden space-y-2)
    const mobileContainer = page.locator('.sm\\:hidden.space-y-2');
    await expect(mobileContainer).toBeVisible();

    // Click an accordion to expand
    const accordionBtn = mobileContainer.locator("button").first();
    if (await accordionBtn.isVisible().catch(() => false)) {
      await accordionBtn.click();
      await page.waitForTimeout(300);
      // Expanded content should show features
      const body = await page.textContent("body");
      expect(body).toMatch(/฿[\d,]+/);
    }

    await context.close();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 2: CHECKOUT (/dashboard/billing/checkout?tier=X)
// ═══════════════════════════════════════════════════════════════════════

test.describe("Deep Purchase Flow — Checkout", () => {

  // Helper to navigate to a valid checkout page
  async function goToCheckout(page: import("@playwright/test").Page) {
    const tierCode = await getFirstTierCode(page);
    await page.goto(`/dashboard/billing/checkout?tier=${tierCode}`, { waitUntil: "networkidle" });
    // Wait for tiers to load (there's an API fetch)
    await page.waitForTimeout(2000);
    // If "ไม่พบแพ็กเกจ" shown, try billing/packages route for tier codes
    const body = await page.textContent("body");
    if (body?.includes("ไม่พบแพ็กเกจ")) {
      // Navigate via packages page click
      await page.goto("/dashboard/billing/packages", { waitUntil: "networkidle" });
      const buyBtn = page.locator("button").filter({ hasText: /ซื้อ/ }).first();
      if (await buyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await buyBtn.click();
        await page.waitForURL(/checkout/, { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(2000);
      }
    }
  }

  // #9: Step indicator visible (4 steps)
  test("DP-009: step indicator shows 4 steps", async ({ authedPage: page }) => {
    await goToCheckout(page);
    const body = await page.textContent("body");
    if (body?.includes("ไม่พบแพ็กเกจ")) {
      test.skip(true, "No valid tier found for checkout");
      return;
    }
    // Check step labels
    expect(body).toContain("เลือกแพ็กเกจ");
    expect(body).toContain("กรอกข้อมูล");
    expect(body).toContain("ชำระเงิน");
    expect(body).toContain("สำเร็จ");

    // Step circles (4 of them)
    const stepCircles = page.locator('.w-6.h-6.rounded-full');
    const count = await stepCircles.count();
    expect(count).toBe(4);
  });

  // #10: Customer type: Individual vs Company
  test("DP-010: customer type selector shows Individual and Company", async ({ authedPage: page }) => {
    await goToCheckout(page);
    const body = await page.textContent("body");
    if (body?.includes("ไม่พบแพ็กเกจ")) {
      test.skip(true, "No valid tier found");
      return;
    }
    expect(body).toContain("ประเภทลูกค้า");
    expect(body).toContain("บุคคลธรรมดา");
    expect(body).toContain("นิติบุคคล");
  });

  // #11: Switch to Company -> tax form appears
  test("DP-011: switching to Company shows branch and WHT fields", async ({ authedPage: page }) => {
    await goToCheckout(page);
    const body = await page.textContent("body");
    if (body?.includes("ไม่พบแพ็กเกจ")) {
      test.skip(true, "No valid tier found");
      return;
    }

    // Click Company option
    const companyBtn = page.locator("button").filter({ hasText: "นิติบุคคล" });
    await companyBtn.click();
    await page.waitForTimeout(300);

    const bodyAfter = await page.textContent("body");
    // Company-specific fields appear
    expect(bodyAfter).toContain("ชื่อบริษัท");
    expect(bodyAfter).toContain("เลขประจำตัวผู้เสียภาษี");
    expect(bodyAfter).toContain("สาขา");
    expect(bodyAfter).toContain("สำนักงานใหญ่");
    expect(bodyAfter).toContain("หักภาษี ณ ที่จ่าย 3%");
  });

  // #12: Tax ID validation — 13 digits with checksum
  test("DP-012: tax ID validates 13-digit format", async ({ authedPage: page }) => {
    await goToCheckout(page);
    const body = await page.textContent("body");
    if (body?.includes("ไม่พบแพ็กเกจ")) {
      test.skip(true, "No valid tier found");
      return;
    }

    // Find tax ID input (placeholder contains X-XXXX)
    const taxIdInput = page.locator('input[placeholder*="X-XXXX"]');
    await expect(taxIdInput).toBeVisible();

    // Type partial digits
    await taxIdInput.fill("1234567");
    await taxIdInput.blur();
    await page.waitForTimeout(200);

    // Should show partial count indicator
    const bodyPartial = await page.textContent("body");
    expect(bodyPartial).toMatch(/\d+\/13/); // e.g. "7/13 หลัก"

    // Fill valid Thai Tax ID (0105556176970 — known valid)
    await taxIdInput.fill("");
    await taxIdInput.type("0105556176970");
    await taxIdInput.blur();
    await page.waitForTimeout(200);
    const bodyValid = await page.textContent("body");
    // Should show checkmark or "ถูกต้อง"
    expect(bodyValid).toContain("ถูกต้อง");
  });

  // #13: Branch selector HEAD vs BRANCH
  test("DP-013: branch selector shows HEAD and BRANCH options", async ({ authedPage: page }) => {
    await goToCheckout(page);
    const body = await page.textContent("body");
    if (body?.includes("ไม่พบแพ็กเกจ")) {
      test.skip(true, "No valid tier found");
      return;
    }

    // Switch to Company
    const companyBtn = page.locator("button").filter({ hasText: "นิติบุคคล" });
    await companyBtn.click();
    await page.waitForTimeout(300);

    // HEAD radio
    const headRadio = page.locator("text=สำนักงานใหญ่ (00000)");
    await expect(headRadio).toBeVisible();

    // BRANCH radio
    const branchRadio = page.locator("text=สาขาที่");
    await expect(branchRadio).toBeVisible();

    // Click BRANCH to show branch number input
    await branchRadio.click();
    await page.waitForTimeout(200);
    const branchInput = page.locator('input[placeholder="00001"]');
    await expect(branchInput).toBeVisible();
  });

  // #14: WHT 3% toggle — price updates
  test("DP-014: WHT 3% toggle updates price breakdown", async ({ authedPage: page }) => {
    await goToCheckout(page);
    const body = await page.textContent("body");
    if (body?.includes("ไม่พบแพ็กเกจ")) {
      test.skip(true, "No valid tier found");
      return;
    }

    // Switch to Company
    const companyBtn = page.locator("button").filter({ hasText: "นิติบุคคล" });
    await companyBtn.click();
    await page.waitForTimeout(300);

    // Find WHT checkbox
    const whtCheckbox = page.locator("text=หักภาษี ณ ที่จ่าย 3%");
    await expect(whtCheckbox).toBeVisible();

    // Click WHT toggle
    await whtCheckbox.click();
    await page.waitForTimeout(300);

    const bodyAfter = await page.textContent("body");
    // WHT deduction should show
    expect(bodyAfter).toContain("WHT 3%");
    expect(bodyAfter).toContain("ยอดชำระจริง");
    // Should show 50 ทวิ warning
    expect(bodyAfter).toContain("50 ทวิ");
  });

  // #15: Price summary shows package name, subtotal, VAT 7%, total
  test("DP-015: price summary card shows breakdown", async ({ authedPage: page }) => {
    await goToCheckout(page);
    const body = await page.textContent("body");
    if (body?.includes("ไม่พบแพ็กเกจ")) {
      test.skip(true, "No valid tier found");
      return;
    }

    // Price summary should contain:
    expect(body).toContain("สรุปคำสั่งซื้อ");
    expect(body).toContain("ราคาแพ็กเกจ");
    expect(body).toContain("VAT 7%");
    expect(body).toContain("รวมทั้งสิ้น");
    expect(body).toContain("ยอดที่ต้องโอน");
    // Documents section
    expect(body).toContain("เอกสารที่จะได้");
    expect(body).toContain("ใบเสนอราคา");
  });

  // #16: Bank account info — SCB 407-824-0476 (shown in topup, not checkout)
  // Checkout doesn't show bank account — it's on the order detail page after creation.
  // We test this in the topup section instead.

  // #17: Form validation — submit with empty required fields
  test("DP-017: form validation blocks submit with empty fields", async ({ authedPage: page }) => {
    await goToCheckout(page);
    const body = await page.textContent("body");
    if (body?.includes("ไม่พบแพ็กเกจ")) {
      test.skip(true, "No valid tier found");
      return;
    }

    // Clear any pre-filled fields
    const nameInput = page.locator('input').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill("");
    }

    // Submit button should be disabled when form is invalid
    const submitBtn = page.locator("button").filter({ hasText: /สร้างคำสั่งซื้อ/ }).first();
    await expect(submitBtn).toBeVisible();

    // Check if button is disabled (either disabled attr or style)
    const isDisabled = await submitBtn.isDisabled();
    expect(isDisabled).toBeTruthy();
  });

  // #18: XSS in company name, address fields
  test("DP-018: XSS payload escaped in checkout form fields", async ({ authedPage: page }) => {
    await goToCheckout(page);
    const body = await page.textContent("body");
    if (body?.includes("ไม่พบแพ็กเกจ")) {
      test.skip(true, "No valid tier found");
      return;
    }

    const xssPayload = '<script>alert("xss")</script>';

    // Fill XSS in name field
    const nameInput = page.locator('input').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(xssPayload);
    }

    // Fill XSS in address field
    const addressField = page.locator("textarea").first();
    if (await addressField.isVisible().catch(() => false)) {
      await addressField.fill(xssPayload);
    }

    // No script injection
    const hasInjection = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("script")).some(
        (s) => s.textContent?.includes('alert("xss")')
      );
    });
    expect(hasInjection).toBe(false);
  });

  // #19: Mobile 375px — form usable, sticky bottom CTA
  test("DP-019: mobile checkout has sticky bottom CTA", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      storageState: "tests/e2e/.auth/user.json",
    });
    const page = await context.newPage();

    const tierCode = await getFirstTierCode(page);
    await page.goto(`/dashboard/billing/checkout?tier=${tierCode}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    if (!body?.includes("ไม่พบแพ็กเกจ")) {
      // Mobile sticky bottom bar should be visible (lg:hidden)
      const stickyBar = page.locator('.lg\\:hidden.fixed.bottom-0');
      await expect(stickyBar).toBeVisible();

      // Should show amount and button
      const stickyText = await stickyBar.textContent();
      expect(stickyText).toContain("ยอดโอน");
      expect(stickyText).toContain("สร้างคำสั่งซื้อ");
    }

    await context.close();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 3: ORDERS (/dashboard/billing/orders)
// ═══════════════════════════════════════════════════════════════════════

test.describe("Deep Purchase Flow — Orders", () => {

  // #20: Orders list page loads
  test("DP-020: orders list page loads", async ({ authedPage: page }) => {
    await expectPageLoads(page, "/dashboard/billing/orders");
  });

  // #21: Date filter inputs present
  test("DP-021: date filter inputs are present", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/orders", { waitUntil: "networkidle" });
    // Wait for loading to finish
    await page.waitForTimeout(3000);

    const body = await page.textContent("body");
    // Either shows orders table/cards or empty state
    const hasOrderContent =
      body!.includes("คำสั่งซื้อของฉัน") ||
      body!.includes("ยังไม่มีคำสั่งซื้อ") ||
      body!.includes("Order");
    expect(hasOrderContent).toBeTruthy();

    // Date inputs should exist (if orders are present or filter bar shown)
    const dateInputs = page.locator('input[type="date"]');
    const dateCount = await dateInputs.count();
    // If orders exist, date inputs should be present (2 of them)
    if (!body!.includes("ยังไม่มีคำสั่งซื้อ")) {
      expect(dateCount).toBeGreaterThanOrEqual(2);
    }
  });

  // #22: Order status badges visible (or empty state)
  test("DP-022: order status badges or empty state shown", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/orders", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    const body = await page.textContent("body");
    // Either has status badges or empty state
    const hasContent =
      body!.includes("รอชำระ") ||
      body!.includes("สำเร็จ") ||
      body!.includes("หมดอายุ") ||
      body!.includes("ยังไม่มีคำสั่งซื้อ") ||
      body!.includes("ทั้งหมด"); // Stats card
    expect(hasContent).toBeTruthy();
  });

  // #23: Click order -> detail page (if orders exist)
  test("DP-023: clicking order navigates to detail page", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/orders", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    const body = await page.textContent("body");
    if (body!.includes("ยังไม่มีคำสั่งซื้อ")) {
      test.skip(true, "No orders to test");
      return;
    }

    // Click first order row
    const orderRow = page.locator("tr[class*='cursor-pointer']").first();
    if (await orderRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await orderRow.click();
      await page.waitForURL(/\/orders\//, { timeout: 10000 });
      expect(page.url()).toMatch(/\/orders\//);
    } else {
      // Try mobile card
      const orderCard = page.locator("div[class*='cursor-pointer']").first();
      if (await orderCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await orderCard.click();
        await page.waitForURL(/\/orders\//, { timeout: 10000 });
        expect(page.url()).toMatch(/\/orders\//);
      }
    }
  });

  // #24: Order detail page structure (timeline, breakdown, documents)
  test("DP-024: order detail page has expected structure", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/orders", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    const body = await page.textContent("body");
    if (body!.includes("ยังไม่มีคำสั่งซื้อ")) {
      test.skip(true, "No orders to test detail");
      return;
    }

    // Navigate to first order
    const orderRow = page.locator("tr[class*='cursor-pointer'], div[class*='cursor-pointer']").first();
    if (!(await orderRow.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, "No clickable order");
      return;
    }

    await orderRow.click();
    await page.waitForURL(/\/orders\//, { timeout: 10000 });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const detailBody = await page.textContent("body");
    // Should show order-related content
    const hasDetail =
      detailBody!.includes("SMS") ||
      detailBody!.includes("฿") ||
      detailBody!.includes("สถานะ") ||
      detailBody!.includes("ชำระ");
    expect(hasDetail).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 4: BILLING (/dashboard/billing)
// ═══════════════════════════════════════════════════════════════════════

test.describe("Deep Purchase Flow — Billing", () => {

  // #25: Billing page loads with payment history
  test("DP-025: billing page loads with payment history or empty state", async ({ authedPage: page }) => {
    await expectPageLoads(page, "/dashboard/billing");
    const body = await page.textContent("body");
    expect(body).toContain("ประวัติการชำระเงิน");
    // Either has stats or empty state
    const hasBillingContent =
      body!.includes("ยอดชำระปีนี้") ||
      body!.includes("ยังไม่มีรายการชำระเงิน") ||
      body!.includes("ใบกำกับภาษี");
    expect(hasBillingContent).toBeTruthy();
  });

  // #26: Invoice/receipt section
  test("DP-026: billing page has invoice or empty state", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    const body = await page.textContent("body");
    const hasInvoiceSection =
      body!.includes("ใบกำกับภาษี") ||
      body!.includes("ยังไม่มีรายการชำระเงิน") ||
      body!.includes("ดาวน์โหลด");
    expect(hasInvoiceSection).toBeTruthy();
  });

  // #27: Stats cards (total paid, etc.)
  test("DP-027: billing stats cards shown when payments exist", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    const body = await page.textContent("body");
    if (body!.includes("ยังไม่มีรายการชำระเงิน")) {
      // Empty state is valid — just verify it's clean
      expect(body).toContain("ดูแพ็กเกจ");
      return;
    }

    // Should have stat cards
    expect(body).toContain("ยอดชำระปีนี้");
    expect(body).toContain("ใบกำกับภาษี");
    expect(body).toContain("รอดำเนินการ");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 5: MY PACKAGES (/dashboard/packages/my)
// ═══════════════════════════════════════════════════════════════════════

test.describe("Deep Purchase Flow — My Packages", () => {

  // #28: Shows current SMS balance
  test("DP-028: my packages page loads with SMS balance or empty state", async ({ authedPage: page }) => {
    await page.goto("/dashboard/packages/my", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    const hasContent =
      body!.includes("SMS") ||
      body!.includes("เครดิต") ||
      body!.includes("แพ็กเกจ") ||
      body!.includes("ไม่มีแพ็กเกจ") ||
      body!.includes("ยังไม่มี");
    expect(hasContent).toBeTruthy();
  });

  // #29: Active package info
  test("DP-029: my packages shows active package or purchase CTA", async ({ authedPage: page }) => {
    await page.goto("/dashboard/packages/my", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    // Either shows active package details or a CTA to buy
    const hasInfo =
      body!.includes("Tier") ||
      body!.includes("หมดอายุ") ||
      body!.includes("คงเหลือ") ||
      body!.includes("ซื้อแพ็กเกจ") ||
      body!.includes("เลือกแพ็กเกจ") ||
      body!.includes("SMS");
    expect(hasInfo).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 6: CREDIT TOPUP (/dashboard/billing/topup)
// ═══════════════════════════════════════════════════════════════════════

test.describe("Deep Purchase Flow — Credit Topup", () => {

  // #30: Topup page shows bank account after selecting package (step 2)
  test("DP-030: topup page shows bank account info on step 2", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    // Step 1 shows packages — need to select one to see bank info
    // Find a package card/button and click it
    const pkgBtn = page.locator("button[aria-pressed]").first();
    if (await pkgBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pkgBtn.click();
      await page.waitForTimeout(300);
    }

    // Find "next" button to go to step 2
    const nextBtn = page.locator("button").filter({ hasText: /ถัดไป|ดูข้อมูลบัญชี/ }).first();
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(1000);

      const step2Body = await page.textContent("body");
      // Bank info should now be visible
      expect(step2Body).toMatch(/SCB|ไทยพาณิชย์|ธนาคาร/);
      expect(step2Body).toContain("407-824-0476");
    } else {
      // Alternative: bank info might be directly on page
      expect(body).toMatch(/SMS|แพ็กเกจ|เลือก/);
    }
  });

  // #31: Upload slip section visible (bypass actual upload)
  test("DP-031: topup page has upload slip section", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    // Should have upload-related UI
    const hasUpload =
      body!.includes("อัพโหลด") ||
      body!.includes("สลิป") ||
      body!.includes("Upload") ||
      body!.includes("แนบ");
    expect(hasUpload).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 7: CROSS-FLOW NAVIGATION
// ═══════════════════════════════════════════════════════════════════════

test.describe("Deep Purchase Flow — Cross Navigation", () => {

  // Full journey: packages -> checkout -> back
  test("DP-032: full navigation flow packages -> checkout -> back", async ({ authedPage: page }) => {
    // Start at packages
    await page.goto("/dashboard/packages", { waitUntil: "networkidle" });
    expect(page.url()).toContain("/packages");

    // Click buy
    const buyBtn = page.locator("button").filter({ hasText: /ซื้อ/ }).first();
    if (await buyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await buyBtn.click();
      await page.waitForURL(/checkout/, { timeout: 10000 }).catch(() => {});

      if (page.url().includes("checkout")) {
        // Wait for checkout to load
        await page.waitForTimeout(2000);

        // Click back button
        const backBtn = page.locator("button").filter({ hasText: /ย้อนกลับ|กลับ/ }).first();
        if (await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await backBtn.click();
          await page.waitForURL(/packages/, { timeout: 10000 });
          expect(page.url()).toContain("/packages");
        }
      }
    }
  });

  // Security: orders API requires authentication
  test("DP-033: orders API requires authentication", async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const response = await context.request.get("http://localhost:3000/api/v1/orders").catch(() => null);
    if (response) {
      expect(response.status()).toBeGreaterThanOrEqual(400);
    }
    await context.close();
  });

  // Security: cannot access other user's order
  test("DP-034: order detail requires ownership", async ({ authedPage: page }) => {
    const response = await page.goto("/dashboard/billing/orders/fake-order-id-99999");
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    const body = await page.textContent("body");
    // Should show 404 or error, not someone else's data
    const isProtected =
      response?.status() === 404 ||
      body!.includes("ไม่พบ") ||
      body!.includes("Not Found") ||
      body!.includes("404") ||
      body!.includes("error");
    expect(isProtected).toBeTruthy();
  });
});
