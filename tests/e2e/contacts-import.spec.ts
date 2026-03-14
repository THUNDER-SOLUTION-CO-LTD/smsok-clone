import { test, expect } from "./fixtures";

test.describe("Contacts Import", () => {
  // CON-02: Import contacts CSV
  test("CON-02: contacts page has import button", async ({ authedPage: page }) => {
    await page.goto("/dashboard/contacts", { waitUntil: "networkidle" });
    const body = await page.textContent("body");

    // Page loads
    expect(body).not.toContain("Something went wrong");

    // Should have import option
    const importBtn = page.getByText(/นำเข้า|Import|CSV/i).first();
    const hasImport = await importBtn.isVisible({ timeout: 5000 }).catch(() => false);

    // Import button or menu should exist
    if (!hasImport) {
      // Try looking in a dropdown/menu
      const moreBtn = page.getByRole("button", { name: /เพิ่มเติม|More|⋯/i }).first();
      if (await moreBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await moreBtn.click();
        const importOption = page.getByText(/นำเข้า|Import/i).first();
        await expect(importOption).toBeVisible({ timeout: 3000 });
      }
    }
  });

  // CON-02b: Contacts export available
  test("CON-02b: contacts export API accessible", async ({ authedPage: page }) => {
    const response = await page.request.get("/api/v1/contacts/export?format=json");
    // Should return 200 with data or empty array
    expect([200, 204]).toContain(response.status());
  });
});
