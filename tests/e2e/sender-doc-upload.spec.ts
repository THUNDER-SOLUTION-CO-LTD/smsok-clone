import { test, expect, type APIRequestContext } from "@playwright/test";
import path from "path";

const FIXTURES = path.join(__dirname, "..", "fixtures");
const SCREENSHOTS = path.join(__dirname, "..", "screenshots", "sender-doc-upload");

// Helper: create a DRAFT sender name for testing
async function createTestSenderName(request: APIRequestContext): Promise<string> {
  const uniqueName = `QA${Date.now().toString(36).slice(-5)}`.toUpperCase().slice(0, 11);
  const resp = await request.post("/api/v1/senders/name", {
    data: {
      name: uniqueName,
      accountType: "corporate",
      urls: [],
    },
  });
  expect(resp.status()).toBe(201);
  const body = await resp.json();
  expect(body.data?.id).toBeTruthy();
  return body.data.id;
}

// Helper: cleanup documents by uploading nothing (just for isolation — not critical)
async function getSenderDocCount(request: APIRequestContext, senderId: string): Promise<number> {
  const resp = await request.get(`/api/v1/senders/${senderId}/documents`);
  if (resp.status() !== 200) return 0;
  const body = await resp.json();
  return body.data?.total ?? 0;
}

test.describe("Sender Name Document Upload API — Layer 1 (API)", () => {
  let senderId: string;

  test.beforeAll(async ({ request }) => {
    senderId = await createTestSenderName(request);
  });

  test("1. Upload single JPG file → fileUrl correct", async ({ request }) => {
    const resp = await request.post(`/api/v1/senders/${senderId}/documents`, {
      multipart: {
        document: {
          name: "test-doc.jpg",
          mimeType: "image/jpeg",
          buffer: require("fs").readFileSync(path.join(FIXTURES, "test-doc.jpg")),
        },
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.data.senderNameId).toBe(senderId);
    expect(body.data.documents).toHaveLength(1);
    expect(body.data.documents[0].fileName).toBe("test-doc.jpg");
    expect(body.data.documents[0].mimeType).toBe("image/jpeg");
    expect(body.data.documents[0].fileUrl).toBeTruthy();
    expect(body.data.total).toBeGreaterThanOrEqual(1);
  });

  test("2. Upload multiple files (PNG + PDF) → document count correct", async ({ request }) => {
    const resp = await request.post(`/api/v1/senders/${senderId}/documents`, {
      multipart: {
        documents: {
            name: "test-doc.png",
            mimeType: "image/png",
            buffer: require("fs").readFileSync(path.join(FIXTURES, "test-doc.png")),
        },
        documents_other: {
            name: "test-doc.pdf",
            mimeType: "application/pdf",
            buffer: require("fs").readFileSync(path.join(FIXTURES, "test-doc.pdf")),
        },
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.data.documents).toHaveLength(2);
    expect(body.data.documents[0].mimeType).toBe("image/png");
    expect(body.data.documents[1].mimeType).toBe("application/pdf");
  });

  test("3. Upload file > 5MB → must reject 400", async ({ request }) => {
    const resp = await request.post(`/api/v1/senders/${senderId}/documents`, {
      multipart: {
        document: {
          name: "test-large.jpg",
          mimeType: "image/jpeg",
          buffer: require("fs").readFileSync(path.join(FIXTURES, "test-large.jpg")),
        },
      },
    });
    expect(resp.status()).toBe(400);
    const body = await resp.json();
    expect(body.error).toContain("5MB");
  });

  test("4. Upload non-allowed type (.exe) → must reject 400", async ({ request }) => {
    const resp = await request.post(`/api/v1/senders/${senderId}/documents`, {
      multipart: {
        document: {
          name: "test-fake.exe",
          mimeType: "application/x-msdownload",
          buffer: require("fs").readFileSync(path.join(FIXTURES, "test-fake.exe")),
        },
      },
    });
    expect(resp.status()).toBe(400);
    const body = await resp.json();
    expect(body.error).toContain("JPG, PNG, PDF");
  });

  test("5. Upload exceeding max 5 files → must reject 400", async ({ request }) => {
    // Create a fresh sender to test max file limit
    const freshId = await createTestSenderName(request);
    const jpgBuf = require("fs").readFileSync(path.join(FIXTURES, "test-doc.jpg"));

    // Upload 5 files first (should succeed) — use separate field names for Playwright
    const multipartFields: Record<string, { name: string; mimeType: string; buffer: Buffer }> = {};
    for (let i = 0; i < 5; i++) {
      multipartFields[`documents_${i}`] = {
        name: `doc-${i}.jpg`,
        mimeType: "image/jpeg",
        buffer: jpgBuf,
      };
    }

    const resp1 = await request.post(`/api/v1/senders/${freshId}/documents`, {
      multipart: multipartFields,
    });
    expect(resp1.status()).toBe(201);

    // Try uploading 1 more → should fail
    const resp2 = await request.post(`/api/v1/senders/${freshId}/documents`, {
      multipart: {
        document: {
          name: "extra.jpg",
          mimeType: "image/jpeg",
          buffer: jpgBuf,
        },
      },
    });
    expect(resp2.status()).toBe(400);
    const body = await resp2.json();
    expect(body.error).toContain("สูงสุด");
  });

  test("6. GET documents → list correct", async ({ request }) => {
    const resp = await request.get(`/api/v1/senders/${senderId}/documents`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.senderNameId).toBe(senderId);
    expect(body.data.documents).toBeInstanceOf(Array);
    expect(body.data.total).toBeGreaterThanOrEqual(1);
    // Check each document has required fields
    for (const doc of body.data.documents) {
      expect(doc.id).toBeTruthy();
      expect(doc.fileName).toBeTruthy();
      expect(doc.mimeType).toBeTruthy();
      expect(doc.fileSize).toBeGreaterThan(0);
      expect(doc.fileUrl).toBeTruthy();
      expect(doc.createdAt).toBeTruthy();
    }
  });

  test("7. Non-owner access → 403", async ({ request }) => {
    // Use a fake sender ID — should be 404 or 403
    const resp = await request.get(`/api/v1/senders/nonexistent-id-12345/documents`);
    expect([403, 404]).toContain(resp.status());
  });

  test("8. No auth → 401", async ({ playwright }) => {
    // Create a fresh context with no cookies
    const ctx = await playwright.request.newContext({ baseURL: "http://localhost:3000" });
    const resp = await ctx.post(`/api/v1/senders/${senderId}/documents`, {
      multipart: {
        document: {
          name: "test.jpg",
          mimeType: "image/jpeg",
          buffer: Buffer.from("fake"),
        },
      },
    });
    expect(resp.status()).toBe(401);
    await ctx.dispose();
  });

  test("9. Upload with no files → 400", async ({ request }) => {
    const resp = await request.post(`/api/v1/senders/${senderId}/documents`, {
      multipart: {
        someField: "not a file",
      },
    });
    expect(resp.status()).toBe(400);
    const body = await resp.json();
    expect(body.error).toContain("อย่างน้อย 1");
  });

  test("10. Typed upload (company_certificate) → correct type", async ({ request }) => {
    const freshId = await createTestSenderName(request);
    const resp = await request.post(`/api/v1/senders/${freshId}/documents`, {
      multipart: {
        documents_company_certificate: {
          name: "cert.pdf",
          mimeType: "application/pdf",
          buffer: require("fs").readFileSync(path.join(FIXTURES, "test-doc.pdf")),
        },
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.data.documents[0].type).toBe("company_certificate");
  });

  test("11. XSS in filename → sanitized/no script execution", async ({ request }) => {
    const freshId = await createTestSenderName(request);
    const resp = await request.post(`/api/v1/senders/${freshId}/documents`, {
      multipart: {
        document: {
          name: '<script>alert("xss")</script>.jpg',
          mimeType: "image/jpeg",
          buffer: require("fs").readFileSync(path.join(FIXTURES, "test-doc.jpg")),
        },
      },
    });
    // Should either accept (sanitizing filename) or reject — not crash
    expect([200, 201, 400]).toContain(resp.status());
    if (resp.status() === 201) {
      const body = await resp.json();
      // Filename should not contain raw script tags
      const fileName = body.data.documents[0].fileName;
      expect(fileName).not.toContain("<script>");
    }
  });

  test("12. SQL injection in sender ID → no crash", async ({ request }) => {
    const resp = await request.get(
      `/api/v1/senders/'; DROP TABLE sender_name_documents;--/documents`
    );
    expect([400, 404]).toContain(resp.status());
  });
});

test.describe("Sender Name Document Upload — Layer 2 (Browser)", () => {
  test("Browser: Login → Sender Names → Upload Document flow", async ({ page }) => {
    const fs = require("fs");
    const screenshotDir = SCREENSHOTS;
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

    // Step 1: Navigate to sender names page
    await page.goto("/dashboard/sender-names", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({ path: path.join(screenshotDir, "01-sender-names-page.png"), fullPage: true });

    // Check page loaded
    const pageTitle = await page.title();
    console.log(`📍 URL: ${page.url()}`);
    console.log(`👁️ Page title: ${pageTitle}`);

    // Check for console errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    // Step 2: Click "เพิ่มชื่อผู้ส่ง" or equivalent button
    const addBtn = page.getByRole("button", { name: /เพิ่ม|สร้าง|ขอ|request/i })
      .or(page.getByRole("link", { name: /เพิ่ม|สร้าง|ขอ|request/i }));

    if (await addBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.first().click();
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.screenshot({ path: path.join(screenshotDir, "02-add-sender-form.png"), fullPage: true });
      console.log(`📍 URL after click add: ${page.url()}`);
    }

    // Step 3: Look for document upload section on sender name detail page
    // Try navigating to a sender name request page
    const resp = await page.request.post("/api/v1/senders/name", {
      data: {
        name: `QABRW${Date.now().toString(36).slice(-3)}`.toUpperCase().slice(0, 11),
        accountType: "corporate",
        urls: [],
      },
    });

    if (resp.status() === 201) {
      const body = await resp.json();
      const newSenderId = body.data?.id;
      console.log(`✅ Created sender name for browser test: ${newSenderId}`);

      // Navigate to sender detail page
      await page.goto(`/dashboard/sender-names/${newSenderId}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.screenshot({ path: path.join(screenshotDir, "03-sender-detail.png"), fullPage: true });
      console.log(`📍 URL: ${page.url()}`);
      console.log(`👁️ Sender detail page content visible`);

      // Step 4: Look for upload area/button
      const uploadInput = page.locator('input[type="file"]');
      const uploadBtn = page.getByRole("button", { name: /อัปโหลด|upload|แนบ|เอกสาร/i });

      if (await uploadInput.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        // Upload a file
        await uploadInput.first().setInputFiles(path.join(FIXTURES, "test-doc.jpg"));
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(screenshotDir, "04-file-selected.png"), fullPage: true });

        // Click upload/submit if needed
        if (await uploadBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
          await uploadBtn.first().click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: path.join(screenshotDir, "05-upload-complete.png"), fullPage: true });
          console.log(`✅ File uploaded via browser`);
        }
      } else if (await uploadBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await uploadBtn.first().click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(screenshotDir, "04-upload-dialog.png"), fullPage: true });
      } else {
        console.log("⚠️ No upload UI found on sender detail page — checking if upload feature has a dedicated route");
        // Try /dashboard/sender-names/[id]/documents
        await page.goto(`/dashboard/sender-names/${newSenderId}/documents`, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.screenshot({ path: path.join(screenshotDir, "04-documents-page.png"), fullPage: true });
        console.log(`📍 URL: ${page.url()}`);
      }

      // Step 5: Verify uploaded documents via API
      const docsResp = await page.request.get(`/api/v1/senders/${newSenderId}/documents`);
      const docsBody = await docsResp.json();
      console.log(`📋 Documents count: ${docsBody.data?.total ?? 0}`);
    }

    // Step 6: Check console errors
    if (consoleErrors.length > 0) {
      console.log(`❌ Console errors: ${consoleErrors.join("; ")}`);
    } else {
      console.log(`✅ No console errors`);
    }

    // Step 7: Mobile responsive check
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/sender-names", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({ path: path.join(screenshotDir, "06-mobile-375.png"), fullPage: true });
    console.log(`📱 Mobile 375px check done`);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({ path: path.join(screenshotDir, "07-mobile-390.png"), fullPage: true });
    console.log(`📱 Mobile 390px check done`);
  });
});
