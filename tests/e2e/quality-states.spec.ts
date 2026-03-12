import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";

/**
 * Quality States Test Suite
 * Tests empty states, loading states, error handling, and console errors
 * across ALL customer-facing dashboard pages.
 */

// Known warnings to ignore (hydration, React dev mode, etc.)
const IGNORED_CONSOLE_PATTERNS = [
  /hydrat/i,
  /Warning: .*ReactDOM/i,
  /Warning: Each child in a list/i,
  /Warning: validateDOMNesting/i,
  /Warning: Prop .* did not match/i,
  /Download the React DevTools/i,
  /next-dev\.js/,
  /fast refresh/i,
  /\[HMR\]/,
  /webpack/i,
  /DevTools/i,
  /Proxy error/i,
  /favicon\.ico/,
  /ERR_CONNECTION_REFUSED.*localhost:47778/, // oracle server
  /Failed to load resource.*\/api\/analytics/, // analytics endpoints may 404
];

function isIgnoredConsoleMessage(msg: ConsoleMessage): boolean {
  const text = msg.text();
  return IGNORED_CONSOLE_PATTERNS.some((p) => p.test(text));
}

interface PageTestResult {
  path: string;
  loaded: boolean;
  loadTimeMs: number;
  hasInternalServerError: boolean;
  hasApplicationError: boolean;
  hasEmptyBody: boolean;
  hasInfiniteLoading: boolean;
  consoleErrors: string[];
  bodySnippet: string;
}

const ALL_PAGES = [
  "/dashboard",
  "/dashboard/send",
  "/dashboard/otp",
  "/dashboard/messages",
  "/dashboard/contacts",
  "/dashboard/contacts/groups",
  "/dashboard/templates",
  "/dashboard/campaigns",
  "/dashboard/senders",
  "/dashboard/analytics",
  "/dashboard/settings",
  "/dashboard/settings/security",
  "/dashboard/settings/team",
  "/dashboard/settings/roles",
  "/dashboard/settings/webhooks",
  "/dashboard/settings/pdpa",
  "/dashboard/api-keys",
  "/dashboard/credits",
  "/dashboard/packages",
  "/dashboard/billing",
  "/dashboard/billing/orders",
  "/dashboard/billing/topup",
  "/dashboard/tags",
  "/dashboard/docs/senders",
];

async function testPage(page: Page, path: string): Promise<PageTestResult> {
  const consoleErrors: string[] = [];
  const result: PageTestResult = {
    path,
    loaded: false,
    loadTimeMs: 0,
    hasInternalServerError: false,
    hasApplicationError: false,
    hasEmptyBody: false,
    hasInfiniteLoading: false,
    consoleErrors: [],
    bodySnippet: "",
  };

  // Collect console errors
  const onConsole = (msg: ConsoleMessage) => {
    if (msg.type() === "error" && !isIgnoredConsoleMessage(msg)) {
      consoleErrors.push(`[${msg.type()}] ${msg.text().substring(0, 300)}`);
    }
  };
  page.on("console", onConsole);

  const start = Date.now();
  try {
    // Use domcontentloaded to avoid networkidle flakiness on dev servers
    await page.goto(path, { waitUntil: "domcontentloaded", timeout: 20000 });
    result.loaded = true;
    // Give page time to render client-side content
    await page.waitForTimeout(2000);
    // Try waiting for networkidle briefly (best-effort)
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  } catch {
    // Even if navigation times out, page might have partially loaded
    try {
      await page.waitForLoadState("load", { timeout: 5000 });
      result.loaded = true;
    } catch {
      result.loaded = false;
    }
  }
  result.loadTimeMs = Date.now() - start;

  // Get body text
  const bodyText = await page
    .locator("body")
    .textContent({ timeout: 5000 })
    .catch(() => "");

  result.bodySnippet = (bodyText || "").substring(0, 200);

  // Check for fatal errors
  result.hasInternalServerError = /Internal Server Error/i.test(bodyText || "");
  result.hasApplicationError =
    /Application error/i.test(bodyText || "") ||
    /unhandled/i.test(bodyText || "") ||
    /Something went wrong/i.test(bodyText || "");
  result.hasEmptyBody = (bodyText || "").trim().length < 10;

  // Check for infinite loading spinners (wait 3s extra, then check)
  await page.waitForTimeout(2000);
  const spinnerSelectors = [
    '[class*="spinner"]',
    '[class*="loading"]',
    '[class*="skeleton"]',
    '[role="progressbar"]',
    '[data-loading="true"]',
    ".animate-spin",
    ".animate-pulse",
  ];

  // Check if there are ONLY spinners/skeletons and no real content
  const hasSpinner = await page
    .locator(spinnerSelectors.join(", "))
    .first()
    .isVisible({ timeout: 500 })
    .catch(() => false);

  if (hasSpinner) {
    // Wait a bit more and re-check — if spinner persists with no other content, flag it
    await page.waitForTimeout(3000);
    const stillSpinning = await page
      .locator(spinnerSelectors.join(", "))
      .first()
      .isVisible({ timeout: 500 })
      .catch(() => false);

    // Only flag as infinite loading if spinner is STILL there and body is mostly empty
    const bodyAfterWait = await page
      .locator("body")
      .textContent({ timeout: 3000 })
      .catch(() => "");
    if (stillSpinning && (bodyAfterWait || "").trim().length < 50) {
      result.hasInfiniteLoading = true;
    }
  }

  result.consoleErrors = [...consoleErrors];
  page.removeListener("console", onConsole);

  return result;
}

// Batch pages into groups to keep test output readable
const PAGE_GROUPS: Record<string, string[]> = {
  "Core Dashboard": ["/dashboard", "/dashboard/send", "/dashboard/otp"],
  Messaging: ["/dashboard/messages", "/dashboard/templates", "/dashboard/campaigns"],
  Contacts: ["/dashboard/contacts", "/dashboard/contacts/groups", "/dashboard/tags"],
  "Senders & Analytics": ["/dashboard/senders", "/dashboard/analytics", "/dashboard/docs/senders"],
  Settings: [
    "/dashboard/settings",
    "/dashboard/settings/security",
    "/dashboard/settings/team",
    "/dashboard/settings/roles",
    "/dashboard/settings/webhooks",
    "/dashboard/settings/pdpa",
  ],
  "Billing & Credits": [
    "/dashboard/api-keys",
    "/dashboard/credits",
    "/dashboard/packages",
    "/dashboard/billing",
    "/dashboard/billing/orders",
    "/dashboard/billing/topup",
  ],
};

for (const [groupName, pages] of Object.entries(PAGE_GROUPS)) {
  test.describe(`Quality States — ${groupName}`, () => {
    for (const pagePath of pages) {
      test(`${pagePath} — no errors, proper empty state, no infinite loading`, async ({
        page,
      }) => {
        const result = await testPage(page, pagePath);

        // 1. Page must load
        expect(result.loaded, `${pagePath} failed to load`).toBe(true);

        // 2. Load time check — slow pages get 35s, others 15s
        const SLOW_PAGES = ["/dashboard/docs/senders", "/dashboard/billing", "/dashboard/billing/topup"];
        const maxTime = SLOW_PAGES.includes(pagePath) ? 35000 : 15000;
        expect(
          result.loadTimeMs,
          `${pagePath} took ${result.loadTimeMs}ms (>${maxTime / 1000}s)`
        ).toBeLessThan(maxTime);

        // 3. No Internal Server Error
        expect(
          result.hasInternalServerError,
          `${pagePath} shows "Internal Server Error"\nBody: ${result.bodySnippet}`
        ).toBe(false);

        // 4. No Application Error
        expect(
          result.hasApplicationError,
          `${pagePath} shows application error\nBody: ${result.bodySnippet}`
        ).toBe(false);

        // 5. Body has meaningful content
        expect(
          result.hasEmptyBody,
          `${pagePath} has empty/near-empty body\nBody: "${result.bodySnippet}"`
        ).toBe(false);

        // 6. No infinite loading
        expect(
          result.hasInfiniteLoading,
          `${pagePath} has infinite loading spinner`
        ).toBe(false);

        // 7. Console errors (soft-fail — report but don't block)
        if (result.consoleErrors.length > 0) {
          console.warn(
            `⚠ ${pagePath} has ${result.consoleErrors.length} console error(s):\n` +
              result.consoleErrors.map((e) => `  - ${e}`).join("\n")
          );
        }

        // Hard-fail on critical console errors (uncaught exceptions)
        const criticalErrors = result.consoleErrors.filter(
          (e) =>
            /Uncaught|TypeError|ReferenceError|Cannot read prop/i.test(e) &&
            !/hydrat/i.test(e)
        );
        expect(
          criticalErrors,
          `${pagePath} has critical JS errors:\n${criticalErrors.join("\n")}`
        ).toHaveLength(0);
      });
    }
  });
}

// Dedicated test: verify auth-protected pages redirect if no session
test.describe("Quality States — Auth Guard", () => {
  test("visiting /dashboard without auth redirects to /login", async ({
    browser,
  }) => {
    // Create a fresh context WITHOUT stored auth
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 30000 });
    // Wait for possible redirect
    await page.waitForTimeout(3000);

    // Should redirect to login
    const url = page.url();
    expect(
      url,
      `Expected redirect to /login but got ${url}`
    ).toContain("/login");

    await context.close();
  });
});
