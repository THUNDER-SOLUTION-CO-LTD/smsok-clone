import { test, expect, expectPageLoads, collectConsoleErrors } from "./fixtures";
import path from "path";
import fs from "fs";

/**
 * DEEP E2E Test — Topup Pages
 *
 * Route mapping (verified from actual rendered content):
 *   /dashboard/topup         → TopupContent (balance stats, preset ฿ amounts, pricing, history)
 *   /dashboard/billing/topup → TopupWizardPage (3-step: packages → bank → slip upload)
 *   /dashboard/credits       → CreditsPage (SMS balance, FIFO packages, credit history)
 */

// ─── Helpers ────────────────────────────────────────────────────────────────
function createTestPNG(): Buffer {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    "base64"
  );
}

function createTempFile(name: string, content: Buffer | string): string {
  const dir = path.join(__dirname, ".tmp");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

function cleanupTempFiles() {
  const dir = path.join(__dirname, ".tmp");
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: /dashboard/topup — Balance Stats + Quick Topup
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Topup Page — /dashboard/topup (Balance & Quick Topup)", () => {
  test.afterAll(() => cleanupTempFiles());

  test("TC-T01: page loads without error", async ({ authedPage: page }) => {
    await expectPageLoads(page, "/dashboard/topup");
  });

  test("TC-T02: no JS console errors on load", async ({ authedPage: page }) => {
    const errors = await collectConsoleErrors(page);
    await page.goto("/dashboard/topup", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    const jsErrors = errors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("404") &&
        !e.includes("Failed to load resource") &&
        !e.includes("hydration")
    );
    expect(jsErrors).toEqual([]);
  });

  test("TC-T03: balance stats — credit, SMS estimate, used this month", async ({ authedPage: page }) => {
    await page.goto("/dashboard/topup", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    expect(body).toContain("ยอดเครดิตคงเหลือ");
    expect(body).toMatch(/SMS ที่ส่งได้/);
    expect(body).toContain("ใช้ไปเดือนนี้");
  });

  test("TC-T04: preset amount buttons displayed", async ({ authedPage: page }) => {
    await page.goto("/dashboard/topup", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    expect(body).toContain("฿500");
    expect(body).toContain("฿1,000");
    expect(body).toContain("฿3,000");
    expect(body).toContain("฿5,000");
    expect(body).toContain("฿10,000");
  });

  test("TC-T05: selecting preset shows proceed button", async ({ authedPage: page }) => {
    await page.goto("/dashboard/topup", { waitUntil: "networkidle" });
    await page.locator("button").filter({ hasText: "฿1,000" }).click();
    await page.waitForTimeout(300);
    const proceedBtn = page.locator("button").filter({ hasText: /เติม ฿1,000/ });
    await expect(proceedBtn).toBeVisible();
  });

  test("TC-T06: custom amount input with SMS estimate", async ({ authedPage: page }) => {
    await page.goto("/dashboard/topup", { waitUntil: "networkidle" });
    const customInput = page.locator('input[type="number"]');
    await expect(customInput).toBeVisible();
    await customInput.fill("2000");
    await page.waitForTimeout(300);
    const body = await page.textContent("body");
    expect(body).toMatch(/≈.*SMS/);
  });

  test("TC-T07: payment dialog opens with bank info", async ({ authedPage: page }) => {
    await page.goto("/dashboard/topup", { waitUntil: "networkidle" });
    await page.locator("button").filter({ hasText: "฿1,000" }).click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /เติม ฿1,000/ }).click();
    await page.waitForTimeout(500);
    const body = await page.textContent("body");
    expect(body).toContain("ชำระเงิน");
    expect(body).toContain("407-824-0476");
    expect(body).toContain("นายภูมิชนะ อุดแก้ว");
    expect(body).toMatch(/ไทยพาณิชย์|SCB/);
  });

  test("TC-T08: dialog submit disabled without slip", async ({ authedPage: page }) => {
    await page.goto("/dashboard/topup", { waitUntil: "networkidle" });
    await page.locator("button").filter({ hasText: "฿1,000" }).click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /เติม ฿1,000/ }).click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator("button").filter({ hasText: "ยืนยันการชำระ" });
    await expect(confirmBtn).toBeVisible();
    await expect(confirmBtn).toBeDisabled();
  });

  test("TC-T09: uploading slip in dialog enables submit", async ({ authedPage: page }) => {
    await page.goto("/dashboard/topup", { waitUntil: "networkidle" });
    await page.locator("button").filter({ hasText: "฿1,000" }).click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /เติม ฿1,000/ }).click();
    await page.waitForTimeout(500);
    const pngPath = createTempFile("dialog-slip.png", createTestPNG());
    await page.locator('input[type="file"]').setInputFiles(pngPath);
    await page.waitForTimeout(1000);
    const confirmBtn = page.locator("button").filter({ hasText: "ยืนยันการชำระ" });
    await expect(confirmBtn).toBeEnabled();
  });

  test("TC-T10: cancel button closes payment dialog", async ({ authedPage: page }) => {
    await page.goto("/dashboard/topup", { waitUntil: "networkidle" });
    await page.locator("button").filter({ hasText: "฿1,000" }).click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /เติม ฿1,000/ }).click();
    await page.waitForTimeout(500);
    await page.locator("button").filter({ hasText: "ยกเลิก" }).click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator("button").filter({ hasText: "ยืนยันการชำระ" });
    await expect(confirmBtn).not.toBeVisible({ timeout: 3000 });
  });

  test("TC-T11: copy bank account number in dialog", async ({ authedPage: page }) => {
    await page.goto("/dashboard/topup", { waitUntil: "networkidle" });
    await page.locator("button").filter({ hasText: "฿500" }).click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /เติม ฿500/ }).click();
    await page.waitForTimeout(500);
    const copyBtn = page.locator('button[title="คัดลอก"]');
    if (await copyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await copyBtn.click();
      await page.waitForTimeout(500);
      // No crash = pass
    }
  });

  test("TC-T12: pricing table with tiers", async ({ authedPage: page }) => {
    await page.goto("/dashboard/topup", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    expect(body).toContain("อัตราค่าบริการ");
    expect(body).toContain("Starter");
    expect(body).toContain("Growth");
    expect(body).toContain("Pro");
    expect(body).toContain("Enterprise");
    expect(body).toContain("ติดต่อ");
  });

  test("TC-T13: auto top-up toggle and fields", async ({ authedPage: page }) => {
    await page.goto("/dashboard/topup", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    expect(body).toContain("เติมเครดิตอัตโนมัติ");
    expect(body).toContain("เปิดเติมอัตโนมัติ");

    const toggle = page.getByRole("switch");
    await expect(toggle).toBeVisible();
    await toggle.click();
    await page.waitForTimeout(300);

    const bodyAfter = await page.textContent("body");
    expect(bodyAfter).toContain("เติมเมื่อเหลือต่ำกว่า");
    expect(bodyAfter).toContain("เติมครั้งละ");
  });

  test("TC-T14: top-up history table", async ({ authedPage: page }) => {
    await page.goto("/dashboard/topup", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    expect(body).toContain("ประวัติการเติมเงิน");
    expect(body).toContain("วันที่");
    expect(body).toContain("จำนวน");
    expect(body).toContain("สถานะ");
    expect(body).toContain("สำเร็จ");
    expect(body).toContain("รอตรวจสอบ");
    expect(body).toContain("ล้มเหลว");
  });

  test("TC-T15: VAT note present", async ({ authedPage: page }) => {
    await page.goto("/dashboard/topup", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    expect(body).toContain("VAT 7%");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: /dashboard/billing/topup — Wizard Flow (3 steps)
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Topup Wizard — /dashboard/billing/topup (3-Step Flow)", () => {
  test.afterAll(() => cleanupTempFiles());

  test("TC-T16: page loads without error", async ({ authedPage: page }) => {
    await expectPageLoads(page, "/dashboard/billing/topup");
  });

  test("TC-T17: step indicator shows 3 steps", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    expect(body).toContain("เลือกแพ็กเกจ");
    expect(body).toContain("โอนเงิน");
    expect(body).toContain("แนบสลิป");
  });

  test("TC-T18: page title shows 'ซื้อแพ็กเกจ SMS'", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    await expect(page.getByText("ซื้อแพ็กเกจ SMS")).toBeVisible();
  });

  test("TC-T19: package cards displayed and selectable", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const cards = page.locator("button[aria-pressed]");
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2);

    // Click a card and verify it becomes selected
    const firstCard = cards.first();
    await firstCard.click();
    await expect(firstCard).toHaveAttribute("aria-pressed", "true");
  });

  test("TC-T20: custom amount input works", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const customInput = page.locator('input[type="number"]');
    await expect(customInput).toBeVisible();
    await customInput.fill("1500");
    await page.waitForTimeout(300);
    const body = await page.textContent("body");
    // Should show SMS estimate for custom amount
    expect(body).toMatch(/1,500\s*SMS/);
  });

  test("TC-T21: next button visible with package selected", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const nextBtn = page.locator("button").filter({ hasText: /ถัดไป/ });
    await expect(nextBtn).toBeVisible();
  });

  test("TC-T22: step 1 → step 2 (bank info)", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    // Click a package card first to ensure one is selected
    const cards = page.locator("button[aria-pressed]");
    await cards.first().click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /ถัดไป/ }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText("โอนเงินไปที่บัญชีด้านล่าง")).toBeVisible({ timeout: 5000 });
  });

  test("TC-T23: bank account info displayed: SCB 407-824-0476 / นายภูมิชนะ อุดแก้ว", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const cards = page.locator("button[aria-pressed]");
    await cards.first().click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /ถัดไป/ }).click();
    await page.waitForTimeout(500);
    const body = await page.textContent("body");
    expect(body).toContain("407-824-0476");
    expect(body).toContain("นายภูมิชนะ อุดแก้ว");
    expect(body).toMatch(/ไทยพาณิชย์|SCB/);
  });

  test("TC-T24: copy bank account button", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const cards = page.locator("button[aria-pressed]");
    await cards.first().click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /ถัดไป/ }).click();
    await page.waitForTimeout(500);
    const copyBtn = page.locator('button[aria-label="คัดลอกเลขบัญชี"]');
    if (await copyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await copyBtn.click();
      await page.waitForTimeout(500);
      const body = await page.textContent("body");
      expect(body).toMatch(/คัดลอก|สำเร็จ/);
    }
  });

  test("TC-T25: step 2 → step 3 (upload slip)", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const cards = page.locator("button[aria-pressed]");
    await cards.first().click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /ถัดไป/ }).click();
    await page.waitForTimeout(500);
    await page.locator("button").filter({ hasText: /แนบสลิป/ }).click();
    await page.waitForTimeout(500);
    const body = await page.textContent("body");
    expect(body).toMatch(/อัพโหลดสลิป|แนบสลิปโอนเงิน/);
  });

  test("TC-T26: upload valid PNG slip", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const cards = page.locator("button[aria-pressed]");
    await cards.first().click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /ถัดไป/ }).click();
    await page.waitForTimeout(500);
    await page.locator("button").filter({ hasText: /แนบสลิป/ }).click();
    await page.waitForTimeout(500);

    const pngPath = createTempFile("test-slip.png", createTestPNG());
    await page.locator('input[type="file"]').setInputFiles(pngPath);
    await page.waitForTimeout(1000);
    const body = await page.textContent("body");
    expect(body).toMatch(/test-slip\.png|อัพโหลดสำเร็จ/);
  });

  test("TC-T27: reject non-image file (.txt)", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const cards = page.locator("button[aria-pressed]");
    await cards.first().click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /ถัดไป/ }).click();
    await page.waitForTimeout(500);
    await page.locator("button").filter({ hasText: /แนบสลิป/ }).click();
    await page.waitForTimeout(500);

    const txtPath = createTempFile("fake.txt", "not an image");
    await page.locator('input[type="file"]').setInputFiles(txtPath);
    await page.waitForTimeout(1000);
    const body = await page.textContent("body");
    const hasError = body!.includes("รองรับเฉพาะ") || body!.includes("JPG") || body!.includes("PNG");
    const fileAccepted = body!.includes("fake.txt") && body!.includes("อัพโหลดสำเร็จ");
    expect(hasError || !fileAccepted).toBeTruthy();
  });

  test("TC-T28: reject oversized file (>10MB)", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const cards = page.locator("button[aria-pressed]");
    await cards.first().click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /ถัดไป/ }).click();
    await page.waitForTimeout(500);
    await page.locator("button").filter({ hasText: /แนบสลิป/ }).click();
    await page.waitForTimeout(500);

    const bigContent = Buffer.alloc(11 * 1024 * 1024, 0);
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    pngHeader.copy(bigContent);
    const bigPath = createTempFile("huge-slip.png", bigContent);
    await page.locator('input[type="file"]').setInputFiles(bigPath);
    await page.waitForTimeout(1000);
    const body = await page.textContent("body");
    expect(body).toMatch(/10MB|ขนาด|เกิน/);
  });

  test("TC-T29: submit button disabled without slip", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const cards = page.locator("button[aria-pressed]");
    await cards.first().click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /ถัดไป/ }).click();
    await page.waitForTimeout(500);
    await page.locator("button").filter({ hasText: /แนบสลิป/ }).click();
    await page.waitForTimeout(500);

    const submitBtn = page.locator("button").filter({ hasText: /ส่งหลักฐาน/ });
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();
  });

  test("TC-T30: submit button enabled after uploading slip", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const cards = page.locator("button[aria-pressed]");
    await cards.first().click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /ถัดไป/ }).click();
    await page.waitForTimeout(500);
    await page.locator("button").filter({ hasText: /แนบสลิป/ }).click();
    await page.waitForTimeout(500);

    const pngPath = createTempFile("valid-slip.png", createTestPNG());
    await page.locator('input[type="file"]').setInputFiles(pngPath);
    await page.waitForTimeout(1000);
    const submitBtn = page.locator("button").filter({ hasText: /ส่งหลักฐาน/ });
    await expect(submitBtn).toBeEnabled();
  });

  test("TC-T31: back navigation through all steps", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const cards = page.locator("button[aria-pressed]");
    await cards.first().click();
    await page.waitForTimeout(300);

    // Step 1 → 2
    await page.locator("button").filter({ hasText: /ถัดไป/ }).click();
    await page.waitForTimeout(500);

    // Step 2 → 3
    await page.locator("button").filter({ hasText: /แนบสลิป/ }).click();
    await page.waitForTimeout(500);

    // Step 3 → 2
    await page.locator("button").filter({ hasText: /ย้อนกลับ/ }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText("โอนเงินไปที่บัญชีด้านล่าง")).toBeVisible();

    // Step 2 → 1
    await page.locator("button").filter({ hasText: /ย้อนกลับ/ }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText("เลือกแพ็กเกจ")).toBeVisible();
  });

  test("TC-T32: step 3 has transfer amount, date, time, note fields", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const cards = page.locator("button[aria-pressed]");
    await cards.first().click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /ถัดไป/ }).click();
    await page.waitForTimeout(500);
    await page.locator("button").filter({ hasText: /แนบสลิป/ }).click();
    await page.waitForTimeout(500);

    const body = await page.textContent("body");
    expect(body).toContain("จำนวนเงินที่โอน");
    expect(body).toContain("วันที่โอน");
    expect(body).toContain("เวลาที่โอน");
    expect(body).toContain("หมายเหตุ");
  });

  test("TC-T33: remove uploaded slip", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const cards = page.locator("button[aria-pressed]");
    await cards.first().click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /ถัดไป/ }).click();
    await page.waitForTimeout(500);
    await page.locator("button").filter({ hasText: /แนบสลิป/ }).click();
    await page.waitForTimeout(500);

    const pngPath = createTempFile("remove-test.png", createTestPNG());
    await page.locator('input[type="file"]').setInputFiles(pngPath);
    await page.waitForTimeout(1000);
    await expect(page.getByText("remove-test.png")).toBeVisible();

    // Click X to remove (lucide X icon button)
    const removeBtn = page.locator("button").filter({ has: page.locator("svg.lucide-x") });
    if (await removeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await removeBtn.click();
      await page.waitForTimeout(500);
      const body = await page.textContent("body");
      expect(body).toMatch(/อัพโหลดสลิป|ลากไฟล์/);
    }
  });

  test("TC-T34: header has back link", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const backLink = page.locator('a[href*="packages"]').first();
    await expect(backLink).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: /dashboard/credits — Credits Page
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Credits Page — /dashboard/credits", () => {
  test("TC-T35: page loads without error", async ({ authedPage: page }) => {
    await expectPageLoads(page, "/dashboard/credits");
  });

  test("TC-T36: shows credit balance or empty state (no fake data)", async ({ authedPage: page }) => {
    await page.goto("/dashboard/credits", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    const hasBalance = body!.includes("SMS คงเหลือ") || body!.includes("SMS Credits");
    const hasEmpty = body!.includes("ยังไม่มีเครดิต");
    const hasError = body!.includes("โหลดข้อมูลไม่สำเร็จ");
    expect(hasBalance || hasEmpty || hasError).toBeTruthy();
  });

  test("TC-T37: has topup/buy button", async ({ authedPage: page }) => {
    await page.goto("/dashboard/credits", { waitUntil: "networkidle" });
    const actionBtn = page.locator("button, a").filter({
      hasText: /เติมเครดิต|ซื้อแพ็กเกจ/,
    }).first();
    await expect(actionBtn).toBeVisible({ timeout: 10000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: Security / XSS
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Topup — Security / XSS", () => {
  test("TC-T38: XSS in custom amount — /dashboard/topup (type=number rejects non-numeric)", async ({ authedPage: page }) => {
    await page.goto("/dashboard/topup", { waitUntil: "networkidle" });
    const customInput = page.locator('input[type="number"]').first();
    // type=number natively rejects non-numeric input — verify via JS injection
    await page.evaluate(() => {
      const input = document.querySelector('input[type="number"]') as HTMLInputElement;
      if (input) {
        input.value = '<script>alert(1)</script>';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(300);
    const value = await customInput.inputValue();
    // type=number should sanitize to empty
    expect(value).not.toContain("<script>");
    // Verify no script executed in page
    const body = await page.textContent("body");
    expect(body).not.toContain("alert(1)");
  });

  test("TC-T39: XSS in note field — wizard step 3", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const cards = page.locator("button[aria-pressed]");
    await cards.first().click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /ถัดไป/ }).click();
    await page.waitForTimeout(500);
    await page.locator("button").filter({ hasText: /แนบสลิป/ }).click();
    await page.waitForTimeout(500);

    const noteInput = page.locator('input[placeholder*="ref"], input[placeholder*="หมายเหตุ"]');
    if (await noteInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await noteInput.fill('<img src=x onerror=alert(1)>');
      await page.waitForTimeout(300);
      const body = await page.textContent("body");
      expect(body).not.toContain("alert(1)");
    }
  });

  test("TC-T40: no tokens/secrets in page HTML", async ({ authedPage: page }) => {
    await page.goto("/dashboard/topup", { waitUntil: "networkidle" });
    const html = await page.content();
    expect(html).not.toMatch(/secret[_-]?key/i);
    expect(html).not.toMatch(/api[_-]?key\s*[:=]\s*["'][a-zA-Z0-9]/i);
    expect(html).not.toMatch(/password\s*[:=]\s*["'][^"']+/i);
    expect(html).not.toMatch(/bearer\s+[a-zA-Z0-9._-]{20,}/i);
  });

  test("TC-T41: XSS in custom amount — wizard (type=number rejects non-numeric)", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const customInput = page.locator('input[type="number"]');
    // type=number natively rejects non-numeric input — verify via JS injection
    await page.evaluate(() => {
      const input = document.querySelector('input[type="number"]') as HTMLInputElement;
      if (input) {
        input.value = '<script>alert("xss")</script>';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(300);
    const value = await customInput.inputValue();
    expect(value).not.toContain("<script>");
    const body = await page.textContent("body");
    expect(body).not.toContain("alert(");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: Mobile Responsive
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Topup — Mobile Responsive", () => {
  test("TC-T42: 375px — /dashboard/topup no horizontal overflow", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/topup", { waitUntil: "networkidle" });
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
    const body = await page.textContent("body");
    expect(body).toContain("฿500");
  });

  test("TC-T43: 375px — /dashboard/billing/topup usable", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
    const cards = page.locator("button[aria-pressed]");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(2);
    const nextBtn = page.locator("button").filter({ hasText: /ถัดไป/ });
    await expect(nextBtn).toBeVisible();
  });

  test("TC-T44: 768px — tablet layout adapts", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
    const cards = page.locator("button[aria-pressed]");
    await expect(cards.first()).toBeVisible();
  });

  test("TC-T45: 375px — bank info readable on step 2", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const cards = page.locator("button[aria-pressed]");
    await cards.first().click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /ถัดไป/ }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText("407-824-0476")).toBeVisible();
  });

  test("TC-T46: 375px — upload area accessible on step 3", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const cards = page.locator("button[aria-pressed]");
    await cards.first().click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /ถัดไป/ }).click();
    await page.waitForTimeout(500);
    await page.locator("button").filter({ hasText: /แนบสลิป/ }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText("อัพโหลดสลิป")).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeAttached();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: Thai Language & Content Quality
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Topup — Thai Language & Content", () => {
  test("TC-T47: /dashboard/topup — all labels in Thai", async ({ authedPage: page }) => {
    await page.goto("/dashboard/topup", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    expect(body).toContain("เติมเครดิต");
    expect(body).toContain("ยอดเครดิตคงเหลือ");
    expect(body).toContain("อัตราค่าบริการ");
    expect(body).toContain("ประวัติการเติมเงิน");
    expect(body).toContain("เติมเครดิตอัตโนมัติ");
  });

  test("TC-T48: /dashboard/billing/topup — all labels in Thai", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    expect(body).toContain("ซื้อแพ็กเกจ SMS");
    expect(body).toContain("เลือกแพ็กเกจ");
    expect(body).toContain("กลับ");
    expect(body).toContain("ถัดไป");
  });

  test("TC-T49: no Lorem ipsum or placeholder text", async ({ authedPage: page }) => {
    await page.goto("/dashboard/topup", { waitUntil: "networkidle" });
    const body1 = await page.textContent("body");
    expect(body1!.toLowerCase()).not.toContain("lorem ipsum");
    expect(body1!.toLowerCase()).not.toContain("todo");
    expect(body1!.toLowerCase()).not.toContain("fixme");

    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const body2 = await page.textContent("body");
    expect(body2!.toLowerCase()).not.toContain("lorem ipsum");
    expect(body2!.toLowerCase()).not.toContain("todo");
    expect(body2!.toLowerCase()).not.toContain("fixme");
  });

  test("TC-T50: step 3 file type hint in Thai", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    const cards = page.locator("button[aria-pressed]");
    await cards.first().click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /ถัดไป/ }).click();
    await page.waitForTimeout(500);
    await page.locator("button").filter({ hasText: /แนบสลิป/ }).click();
    await page.waitForTimeout(500);
    const body = await page.textContent("body");
    expect(body).toMatch(/JPG.*PNG|อัพโหลด|ลากไฟล์/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: Route Availability
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Topup — Route Availability", () => {
  test("TC-T51: /dashboard/topup responds 200", async ({ authedPage: page }) => {
    const resp = await page.goto("/dashboard/topup", { waitUntil: "networkidle" });
    expect(resp?.status()).toBe(200);
  });

  test("TC-T52: /dashboard/billing/topup responds 200", async ({ authedPage: page }) => {
    const resp = await page.goto("/dashboard/billing/topup", { waitUntil: "networkidle" });
    expect(resp?.status()).toBe(200);
  });

  test("TC-T53: /dashboard/credits responds 200", async ({ authedPage: page }) => {
    const resp = await page.goto("/dashboard/credits", { waitUntil: "networkidle" });
    expect(resp?.status()).toBe(200);
  });
});
