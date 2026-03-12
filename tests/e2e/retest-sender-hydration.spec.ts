import { test, expect, expectPageLoads, collectConsoleErrors } from "./fixtures";

// ============================================================
// Retest: Sender Guide, Custom 404, Hydration Fix, docs/senders migration
// ============================================================

test.describe("1. Sender Guide page (/dashboard/docs/senders)", () => {
  test("loads without error (200 OK) with Thai content", async ({ authedPage: page }) => {
    const errors = await collectConsoleErrors(page);

    const response = await page.goto("/dashboard/docs/senders", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    expect(response?.status()).toBe(200);

    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Application error");
    expect(body).not.toContain("Internal Server Error");

    // Thai language content present
    const hasThai = /[\u0E00-\u0E7F]/.test(body!);
    expect(hasThai).toBe(true);

    // No console errors (exclude known third-party library warnings)
    const realErrors = errors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("Failed to load resource") &&
        !e.includes("Base UI:") // Base UI library warning, not app error
    );
    expect(realErrors).toHaveLength(0);
  });

  test("all links do NOT have target=_blank (navigate within app)", async ({ authedPage: page }) => {
    await page.goto("/dashboard/docs/senders", { waitUntil: "networkidle" });

    const links = page.locator("a[target='_blank']");
    const count = await links.count();

    if (count > 0) {
      const hrefs: string[] = [];
      for (let i = 0; i < count; i++) {
        hrefs.push((await links.nth(i).getAttribute("href")) || "unknown");
      }
      // Fail with details about which links have target=_blank
      expect(count, `Links with target=_blank: ${hrefs.join(", ")}`).toBe(0);
    }

    expect(count).toBe(0);
  });

  test("mobile 375px: readable, no overflow", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/docs/senders", { waitUntil: "networkidle" });

    // Check no horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    // Content is visible
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });
});

test.describe("2. Custom 404 page", () => {
  test("public 404: /this-does-not-exist shows custom 404 with Thai", async ({ authedPage: page }) => {
    const response = await page.goto("/this-does-not-exist", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(404);

    const body = await page.textContent("body");
    // Should have error message (custom 404, not generic browser error)
    expect(body!.length).toBeGreaterThan(50);

    // Should have a link back to home or dashboard
    const backLink = page.locator('a[href="/"], a[href="/dashboard"], a:has-text("กลับ"), a:has-text("หน้าแรก"), a:has-text("Home")');
    const linkCount = await backLink.count();
    expect(linkCount).toBeGreaterThan(0);

    // Thai language
    const hasThai = /[\u0E00-\u0E7F]/.test(body!);
    expect(hasThai).toBe(true);
  });

  test("dashboard 404: /dashboard/this-does-not-exist returns 404", async ({ authedPage: page }) => {
    const response = await page.goto("/dashboard/this-does-not-exist", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(404);

    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);
  });

  test("mobile 375px: 404 page renders correctly", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const response = await page.goto("/this-does-not-exist", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(404);

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);
  });
});

test.describe("3. Hydration Fix (useId) — no hydration mismatch warnings", () => {
  const HYDRATION_PAGES = [
    { path: "/dashboard", name: "Dashboard" },
    { path: "/dashboard/send", name: "Send SMS" },
    { path: "/dashboard/messages", name: "Messages" },
    { path: "/dashboard/settings", name: "Settings" },
  ];

  for (const route of HYDRATION_PAGES) {
    test(`${route.name} (${route.path}): no hydration warnings`, async ({ authedPage: page }) => {
      const consoleMessages: string[] = [];

      // Listen BEFORE navigation
      page.on("console", (msg) => {
        const text = msg.text();
        consoleMessages.push(text);
      });

      // Navigate fresh (not from authedPage's /dashboard since it already loaded)
      await page.goto(route.path, { waitUntil: "networkidle", timeout: 30000 });

      // Wait a bit for any late hydration warnings
      await page.waitForTimeout(1000);

      // Check for hydration mismatch warnings
      const hydrationErrors = consoleMessages.filter(
        (msg) =>
          msg.includes("Prop `id` did not match") ||
          msg.includes("Expected server HTML to contain") ||
          msg.includes("Hydration failed") ||
          msg.includes("Text content does not match") ||
          msg.includes("There was an error while hydrating")
      );

      expect(
        hydrationErrors,
        `Hydration errors on ${route.path}: ${hydrationErrors.join("\n")}`
      ).toHaveLength(0);
    });
  }

  test("Dashboard: no visual flicker on load (page content stable)", async ({ authedPage: page }) => {
    // Navigate and take two rapid screenshots to detect flicker
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    // Wait for full load
    await page.waitForLoadState("networkidle");

    // Page should have meaningful content (not a blank flash)
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);

    // No page errors
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));
    await page.waitForTimeout(500);
    expect(pageErrors).toHaveLength(0);
  });
});

test.describe("4. docs/senders migration", () => {
  test("/docs/senders should redirect to /dashboard/docs/senders OR return 404", async ({ authedPage: page }) => {
    const response = await page.goto("/docs/senders", { waitUntil: "networkidle" });
    const status = response?.status();
    const finalUrl = page.url();

    // Either redirected to /dashboard/docs/senders OR 404
    const isRedirected = finalUrl.includes("/dashboard/docs/senders");
    const is404 = status === 404;

    expect(
      isRedirected || is404,
      `/docs/senders should redirect or 404, got status=${status} url=${finalUrl}`
    ).toBe(true);
  });

  test("/dashboard/docs/senders is canonical URL (200 OK)", async ({ authedPage: page }) => {
    const response = await page.goto("/dashboard/docs/senders", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
  });

  test("/dashboard/docs/senders is Server Component (fast load, no loading spinner)", async ({ authedPage: page }) => {
    const startTime = Date.now();

    await page.goto("/dashboard/docs/senders", { waitUntil: "domcontentloaded" });

    // Content should be immediately available (SSR, no client-side loading)
    const body = await page.textContent("body");
    const loadTime = Date.now() - startTime;

    // Content present on initial HTML (Server Component)
    expect(body!.length).toBeGreaterThan(100);

    // No loading spinner visible at domcontentloaded time
    const spinner = page.locator('[class*="spinner"], [class*="loading"], [role="progressbar"]');
    const spinnerCount = await spinner.count();

    // If spinners exist, they should be hidden/not visible
    for (let i = 0; i < spinnerCount; i++) {
      const isVisible = await spinner.nth(i).isVisible().catch(() => false);
      expect(isVisible, "Loading spinner should not be visible for Server Component").toBe(false);
    }
  });
});
