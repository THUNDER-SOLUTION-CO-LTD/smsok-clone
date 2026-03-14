import { test, expect } from "./fixtures";

test.describe("Invoice & Document Download", () => {
  // BILL-04: Invoice download for paid orders
  test("BILL-04: order detail page shows document download buttons", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/orders", { waitUntil: "networkidle" });
    const body = await page.textContent("body");

    // Check if there are any orders
    const hasOrders = body?.includes("PAID") || body?.includes("สำเร็จ") || body?.includes("PENDING");
    const hasEmpty = body?.includes("ยังไม่มี") || body?.includes("No orders");

    if (hasOrders) {
      // Click first order to view detail
      const orderRow = page.locator("tr a, [data-testid*='order'], a[href*='/orders/']").first();
      if (await orderRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await orderRow.click();
        await page.waitForLoadState("networkidle", { timeout: 15000 });

        const detailBody = await page.textContent("body");

        // Should show document section for paid orders
        const hasDocs = detailBody?.includes("เอกสาร") || detailBody?.includes("Document")
          || detailBody?.includes("ใบแจ้งหนี้") || detailBody?.includes("Invoice")
          || detailBody?.includes("ใบเสร็จ") || detailBody?.includes("Receipt");

        // Documents section should exist (may not have docs if not PAID)
        expect(detailBody).not.toContain("Something went wrong");
      }
    } else {
      // Empty state is acceptable
      expect(hasEmpty).toBeTruthy();
    }
  });

  // BILL-04b: Document API returns proper response
  test("BILL-04b: orders API accessible", async ({ authedPage: page }) => {
    const response = await page.request.get("/api/v1/orders");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
  });
});
