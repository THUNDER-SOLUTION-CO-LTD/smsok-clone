import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

/**
 * Quality Responsive Design Tests
 * Tests 15 customer-facing pages across 3 viewports (375px, 768px, 1440px)
 * Checks: overflow, load errors, visibility, touch targets, sidebar state
 */

const VIEWPORTS = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 900 },
] as const;

const PAGES = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/dashboard/send", label: "Send SMS" },
  { path: "/dashboard/messages", label: "Messages" },
  { path: "/dashboard/contacts", label: "Contacts" },
  { path: "/dashboard/templates", label: "Templates" },
  { path: "/dashboard/campaigns", label: "Campaigns" },
  { path: "/dashboard/packages", label: "Packages" },
  { path: "/dashboard/billing", label: "Billing" },
  { path: "/dashboard/billing/orders", label: "Billing Orders" },
  { path: "/dashboard/billing/topup", label: "Billing Topup" },
  { path: "/dashboard/settings", label: "Settings" },
  { path: "/dashboard/settings/security", label: "Settings Security" },
  { path: "/dashboard/settings/team", label: "Settings Team" },
  { path: "/dashboard/api-keys", label: "API Keys" },
  { path: "/dashboard/credits", label: "Credits" },
] as const;

// ── Helpers ──────────────────────────────────────────────────────────

async function navigateAndWait(page: Page, path: string): Promise<{ status: number; errors: string[] }> {
  const errors: string[] = [];

  const pageErrorHandler = (err: Error) => {
    // Filter hydration noise
    if (err.message.includes("Hydration") || err.message.includes("parentNode")) return;
    errors.push(`PAGE_ERROR: ${err.message}`);
  };
  page.on("pageerror", pageErrorHandler);

  const response = await page.goto(path, { waitUntil: "domcontentloaded", timeout: 20000 });
  const status = response?.status() ?? 0;

  // Wait for page to render
  await page.waitForTimeout(1500);

  // Check for error text in body
  const bodyText = await page.textContent("body").catch(() => "");
  if (bodyText?.includes("Application error")) errors.push("Application error");
  if (bodyText?.includes("Internal Server Error")) errors.push("Internal Server Error");
  if (bodyText?.includes("Something went wrong")) errors.push("Something went wrong");

  page.off("pageerror", pageErrorHandler);
  return { status, errors };
}

async function checkNoHorizontalOverflow(page: Page): Promise<{ overflowing: boolean; scrollW: number; clientW: number }> {
  return page.evaluate(() => {
    const scrollW = document.documentElement.scrollWidth;
    const clientW = document.documentElement.clientWidth;
    return { overflowing: scrollW > clientW + 2, scrollW, clientW }; // 2px tolerance
  });
}

async function checkHiddenContentBugs(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const issues: string[] = [];
    const mainContent = document.querySelector("main, [role='main'], .main-content");
    if (mainContent) {
      const style = getComputedStyle(mainContent);
      if (style.display === "none") issues.push("Main content has display:none");
      if (style.visibility === "hidden") issues.push("Main content has visibility:hidden");
      if (parseFloat(style.opacity) === 0) issues.push("Main content has opacity:0");
    }
    document.querySelectorAll("h1, h2").forEach((el) => {
      const s = getComputedStyle(el);
      if (s.display === "none" && el.textContent && el.textContent.trim().length > 0) {
        issues.push(`Heading "${el.textContent.trim().slice(0, 40)}" is display:none`);
      }
    });
    return issues;
  });
}

async function getSidebarState(page: Page): Promise<{ found: boolean; visible: boolean; width: number }> {
  return page.evaluate(() => {
    const sidebar = document.querySelector("aside, nav[class*='sidebar'], [class*='sidebar'], [data-sidebar]");
    if (!sidebar) return { found: false, visible: false, width: 0 };
    const rect = sidebar.getBoundingClientRect();
    const style = getComputedStyle(sidebar);
    const visible =
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      parseFloat(style.opacity) > 0 &&
      rect.width > 10;
    const onScreen = rect.right > 0;
    return { found: true, visible: visible && onScreen, width: Math.round(rect.width) };
  });
}

async function checkTouchTargets(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const MIN_SIZE = 44;
    const tooSmall: string[] = [];
    document.querySelectorAll('button:not([disabled])').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return;
      const text = el.textContent?.trim() ?? "";
      // Only check primary/submit buttons with meaningful text
      const isPrimary =
        el.getAttribute("type") === "submit" ||
        (text.length > 2 && !text.includes("×"));
      if (isPrimary && (rect.height < MIN_SIZE || rect.width < MIN_SIZE)) {
        tooSmall.push(`"${text.slice(0, 30)}" (${Math.round(rect.width)}x${Math.round(rect.height)})`);
      }
    });
    return tooSmall;
  });
}

async function checkTableResponsive(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const issues: string[] = [];
    document.querySelectorAll("table").forEach((table, i) => {
      const parent = table.parentElement;
      if (!parent) return;
      const parentStyle = getComputedStyle(parent);
      const hasScroll =
        parentStyle.overflowX === "auto" ||
        parentStyle.overflowX === "scroll" ||
        parentStyle.overflow === "auto" ||
        parentStyle.overflow === "scroll";
      const tableRect = table.getBoundingClientRect();
      if (tableRect.width > window.innerWidth && !hasScroll) {
        issues.push(`Table ${i}: ${Math.round(tableRect.width)}px wide, no scroll wrapper`);
      }
    });
    return issues;
  });
}

// ── Tests ────────────────────────────────────────────────────────────

test.describe("Quality Responsive — All Pages x All Viewports", () => {
  for (const vp of VIEWPORTS) {
    test.describe(`Viewport: ${vp.name} (${vp.width}px)`, () => {
      for (const pg of PAGES) {
        test(`${pg.label} @ ${vp.name}`, async ({ authedPage: page }) => {
          await page.setViewportSize({ width: vp.width, height: vp.height });

          // 1. Navigate and check load health
          const { status, errors } = await navigateAndWait(page, pg.path);
          expect(status, `${pg.label} returned HTTP ${status}`).toBeLessThan(500);

          // If redirected to login, skip layout checks
          if (page.url().includes("/login")) {
            console.warn(`[SKIP] ${pg.label} — redirected to login`);
            return;
          }

          if (errors.length > 0) {
            console.warn(`[WARN] ${pg.label} @ ${vp.name} load errors:`, errors);
          }

          // 2. No horizontal overflow
          const overflow = await checkNoHorizontalOverflow(page);
          expect(
            overflow.overflowing,
            `OVERFLOW: ${pg.label} @ ${vp.name} — scrollW=${overflow.scrollW} > clientW=${overflow.clientW}`
          ).toBe(false);

          // 3. No hidden content bugs
          const hiddenBugs = await checkHiddenContentBugs(page);
          expect(hiddenBugs, `HIDDEN: ${pg.label} @ ${vp.name}`).toEqual([]);

          // ── Mobile-specific checks ──
          if (vp.width === 375) {
            // Sidebar should be collapsed
            const sidebar = await getSidebarState(page);
            if (sidebar.found) {
              expect(
                sidebar.visible,
                `SIDEBAR: ${pg.label} @ mobile — sidebar visible (w=${sidebar.width}) should be collapsed`
              ).toBe(false);
            }

            // Tables should have scroll wrapper
            const tableIssues = await checkTableResponsive(page);
            expect(
              tableIssues,
              `TABLE OVERFLOW: ${pg.label} @ mobile — ${tableIssues.join("; ")}`
            ).toEqual([]);

            // Touch targets (warn only, not fail)
            const smallTargets = await checkTouchTargets(page);
            if (smallTargets.length > 0) {
              console.warn(`[TOUCH] ${pg.label} @ mobile — small targets:`, smallTargets);
            }
          }

          // ── Desktop-specific checks ──
          if (vp.width === 1440) {
            // Sidebar should be visible
            const sidebar = await getSidebarState(page);
            if (sidebar.found) {
              expect(
                sidebar.visible,
                `SIDEBAR: ${pg.label} @ desktop — sidebar should be visible`
              ).toBe(true);
            }

            // Check content uses reasonable width
            const contentWidth = await page.evaluate(() => {
              const main = document.querySelector("main");
              return main ? Math.round(main.getBoundingClientRect().width) : 0;
            });
            if (contentWidth > 0 && contentWidth < 400) {
              console.warn(`[LAYOUT] ${pg.label} @ desktop — main content only ${contentWidth}px wide`);
            }
          }
        });
      }
    });
  }
});
