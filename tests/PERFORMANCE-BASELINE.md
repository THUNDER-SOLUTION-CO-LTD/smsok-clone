# SMSOK Performance Baseline + Browser Compatibility

**Date:** 2026-03-14
**Auditor:** QA Agent
**Task:** #3473

---

## 1. Performance Baseline (Code-Level Analysis)

> Note: localhost down — Lighthouse scores pending server restart. Code-level analysis below.

### Core Web Vitals Risk Assessment

| Metric | Risk | Issue | Impact |
|--------|------|-------|--------|
| **LCP** | HIGH | Google Fonts CDN (2 external requests), no `next/image` | Render-blocking font load + unoptimized images |
| **CLS** | MEDIUM | `<img>` tags without width/height (6 files) | Layout shift when images load |
| **FID/INP** | MEDIUM | framer-motion eagerly loaded on landing page (~170KB) | Heavy JS blocks interactivity |

### Bundle Size Concerns

| Library | Size (est. gzip) | Loading | Files | Status |
|---------|-----------------|---------|-------|--------|
| framer-motion v12 | ~170 KB | Eager (15 files) | LandingPage, dashboard template | ⚠️ Should be dynamic |
| recharts v3 | ~160 KB | Eager in analytics | AnalyticsContent.tsx | ⚠️ Should be dynamic |
| DashboardContent | ~varies | `next/dynamic` ✅ | dashboard/page.tsx | ✅ Only dynamic import found |

### Font Loading

| Method | Status | Impact |
|--------|--------|--------|
| Google Fonts CDN (IBM Plex Sans Thai) | ⚠️ External | 2 preconnect + 2 stylesheet requests |
| `@fontsource/ibm-plex-sans-thai` | ❌ Installed but unused | Dead dependency |
| `next/font` | ❌ Not used | Best practice for Next.js |
| `display=swap` | ✅ Present | Prevents FOIT |

### Image Optimization

| Check | Status |
|-------|--------|
| `next/image` usage | ❌ **Zero instances** — 6 files use raw `<img>` |
| `sharp` in dependencies | ❌ Missing — image optimization disabled |
| Responsive images (srcset) | ❌ None |
| Lazy loading | ❌ No explicit `loading="lazy"` |
| WebP/AVIF | ❌ Not supported without next/image |

### Loading States & Streaming

| Check | Count | Status |
|-------|-------|--------|
| `loading.tsx` files | 33 | ✅ Good coverage on main routes |
| Missing `loading.tsx` | ~30 sub-routes | ⚠️ settings/*, billing/*, support/* |
| `<Suspense>` boundaries | 3 | ⚠️ Minimal adoption |
| `next/dynamic` | 1 (DashboardContent) | ⚠️ Should add more |

### Estimated Lighthouse Scores (Code-Based Prediction)

| Page | Performance | Accessibility | Best Practices | SEO |
|------|-------------|---------------|----------------|-----|
| Homepage (/) | ~65-75 | ~80 | ~85 | ~90 |
| Login (/login) | ~80-85 | ~75 | ~90 | ~85 |
| Pricing (/pricing) | ~70-80 | ~80 | ~85 | ~90 |
| Dashboard | ~60-70 | ~70 | ~85 | N/A |

> Predictions based on: CDN fonts penalty (-10), no image optimization (-15), large JS bundle (-10), missing a11y features (-10)

---

## 2. Browser Compatibility (Code-Level Analysis)

> Playwright multi-browser test pending server restart.

### CSS Compatibility Assessment

| Feature | Chromium | Firefox | WebKit | Status |
|---------|----------|---------|--------|--------|
| CSS Variables (custom properties) | ✅ | ✅ | ✅ | Heavily used (design tokens) |
| Tailwind v4 utilities | ✅ | ✅ | ✅ | Standard CSS |
| `env(safe-area-inset-bottom)` | ✅ | ✅ | ✅ | Used for iPhone notch |
| `backdrop-filter: blur()` | ✅ | ✅ | ✅ | Used in overlays |
| CSS `@layer` | ✅ | ✅ | ✅ | globals.css organization |
| `gap` in flexbox | ✅ | ✅ | ✅ | Widely used |
| `aspect-ratio` | ✅ | ✅ | ✅ | Not heavily used |
| `color-mix()` | ✅ | ✅ | ✅ 16.2+ | Not used (safe) |

### JavaScript Compatibility

| Feature | Chromium | Firefox | WebKit | Usage |
|---------|----------|---------|--------|-------|
| `Promise.all` | ✅ | ✅ | ✅ | Dashboard parallel fetch |
| `structuredClone` | ✅ | ✅ | ✅ 15.4+ | Not used (safe) |
| `crypto.randomUUID` | ✅ | ✅ | ✅ | Server-side only |
| `BroadcastChannel` | ✅ | ✅ | ✅ 15.4+ | Cross-tab logout |
| `URL.createObjectURL` | ✅ | ✅ | ✅ | CSV download |
| `IntersectionObserver` | ✅ | ✅ | ✅ | Not found (could use) |

### Potential Cross-Browser Issues

| # | Issue | Browsers Affected | File |
|---|-------|-------------------|------|
| 1 | `scrollbar-width: thin` | Firefox OK, Chrome/Safari need `::-webkit-scrollbar` | globals.css |
| 2 | `BroadcastChannel` for cross-tab logout | Safari 15.4+ only | auth context |
| 3 | CSS `oklch()` / `color()` if used | Older browsers | Not found (safe) |
| 4 | `@starting-style` | Chrome 117+ only | Not found (safe) |

**Verdict: HIGH compatibility** — no cutting-edge CSS/JS features used. Standard Tailwind + React patterns.

---

## 3. Mobile Responsive Spot Check (Code-Level)

### Viewport Configuration ✅
```tsx
// app/layout.tsx
export const viewport: Viewport = {
  themeColor: "#061019",
  width: "device-width",
  initialScale: 1,
};
```

### Breakpoint Usage (590 responsive classes across 129 files)

| Breakpoint | Classes | Usage |
|------------|---------|-------|
| `sm:` (640px) | ~400 | Primary mobile breakpoint |
| `md:` (768px) | ~130 | Tablet / desktop split |
| `lg:` (1024px) | ~50 | Wide desktop |
| `xl:` (1280px) | ~10 | Minimal |

### Mobile Components

| Component | Implementation | Status |
|-----------|---------------|--------|
| Bottom nav (mobile) | Fixed bottom bar, 4 tabs, safe-area padding | ✅ Good |
| Hamburger menu | 44px touch target, aria-labels, animation | ✅ Good |
| Mobile sheet drawer | Bottom sheet with shadcn Sheet, 3-col grid | ✅ Good |
| Sidebar | `hidden md:flex` — hidden on mobile | ✅ Correct |
| Mobile sheet link | Shows on `md:hidden` | ✅ Correct |

### Responsive Layout by Viewport

#### 375px (iPhone SE/Mini)
| Element | Expected | Code Evidence |
|---------|----------|---------------|
| Sidebar | Hidden | `hidden md:flex` (DashboardShell:199) |
| Bottom nav | Visible | `md:hidden fixed bottom-0` (DashboardShell:600) |
| Forms | Full width | `grid-cols-1` default |
| Tables | Horizontal scroll | `overflow-x-auto` wrapper |
| Page padding | 16px | `@media (max-width: 767px) { padding: 16px }` |
| Touch targets | 44px min | `min-w-[44px] min-h-[44px]` on buttons |

#### 768px (iPad)
| Element | Expected | Code Evidence |
|---------|----------|---------------|
| Sidebar | Visible | `md:flex` activates |
| Bottom nav | Hidden | `md:hidden` deactivates |
| Forms | 2 columns | `sm:grid-cols-2` |
| Tables | Full display | All columns visible |
| Page padding | 32px | Default `--content-padding-x` |

#### 1024px (Laptop)
| Element | Expected | Code Evidence |
|---------|----------|---------------|
| Sidebar | Full width (240px) | `--sidebar-width: 240px` |
| Tables | Extra columns | `lg:table-cell` shows hidden cols |
| Campaign progress | Visible | `hidden lg:table-cell` |

### Responsive Issues Found

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 1 | MEDIUM | DataTable has no mobile card/list layout — horizontal scroll only | `DataTable.tsx` |
| 2 | LOW | Mobile Sheet active-state uses strict `===` — won't highlight nested routes | `DashboardShell:555` |
| 3 | LOW | Some tables show `hidden lg:table-cell` columns — data loss at 768-1023px | Campaign, Messages tables |
| 4 | LOW | No landscape orientation handling for mobile | - |

---

## Summary Scorecard

| Category | Score | Notes |
|----------|-------|-------|
| Viewport & meta | 10/10 | Proper configuration |
| Responsive breakpoints | 8/10 | 590 classes, good coverage |
| Mobile navigation | 9/10 | Bottom nav + sheet + hamburger |
| Touch targets | 9/10 | 44px minimum throughout |
| Image optimization | 2/10 | No next/image, no srcset |
| Font loading | 4/10 | CDN, not local/next/font |
| Bundle optimization | 5/10 | 1 dynamic import, framer-motion eager |
| Loading states | 7/10 | 33 loading.tsx, few Suspense |
| Browser compat | 9/10 | Standard features, no issues |
| **Overall** | **6.3/10** | |

---

## Priority Fixes

### P1 (High Impact)
1. **Replace `<img>` with `next/image`** in 6 files — improves LCP, CLS
2. **Switch to `next/font/google`** for IBM Plex Sans Thai — eliminates render-blocking
3. **Dynamic import framer-motion** on LandingPage — reduces initial JS by ~170KB
4. **Add `sharp`** to dependencies — enables server-side image optimization

### P2 (Medium Impact)
5. Dynamic import recharts in analytics — reduces dashboard JS by ~160KB
6. Add `<Suspense>` boundaries in dashboard for progressive loading
7. Add `loading.tsx` to 30 missing sub-routes
8. Remove dead `@fontsource/ibm-plex-sans-thai` dependency

### P3 (Low Impact)
9. Add responsive card layout to DataTable on mobile
10. Fix mobile sheet active-state for nested routes
11. Add landscape orientation media queries
