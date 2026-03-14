# SMSOK Frontend Visual QA Audit

**Date:** 2026-03-14
**Auditor:** QA Agent
**Task:** #3333

---

## 1. Nansen DNA v2 Color Compliance

### Token System (globals.css) — COMPLIANT ✅

All five core colors are correctly defined as CSS variables:
- `--bg-base: #0b1118` ✅
- `--bg-surface: #10161c` (= `--card`, `--nansen-card`) ✅
- `--border-default: #20252c` (= `--border`, `--input`) ✅
- `--text-secondary: #b2bacd` ✅
- `--accent: #00E2B5` (= `--primary`) ✅

### CRITICAL — Wrong Accent RGB (rgba(0,255,167) ≠ rgba(0,226,181))

`#00E2B5` = `rgb(0,226,181)` but **20+ files** use `rgba(0,255,167,...)` which is `#00FFA7` — a different green.

**Affected files:**
| File | Occurrences |
|---|---|
| `LandingPage.tsx` | ~20 lines (301, 339, 355, 393, 461, 499, 508, etc.) |
| `login/page.tsx` | 3 lines (119, 150, 171) |
| `register/page.tsx` | 9 lines |
| `forgot-password/page.tsx` | 3 lines |
| `2fa/page.tsx` | 4 lines |
| `SendSmsForm.tsx` | 2 lines |
| `MessagesClient.tsx` | 1 line |
| `ContactsClient.tsx` | 6 lines |
| `GroupsPageClient.tsx` | 1 line |
| `GroupDetailClient.tsx` | 2 lines |
| `TemplatesClient.tsx` | 2 lines |
| `TwoFactorSection.tsx` | 4 lines |
| `settings/roles/[id]/page.tsx` | 2 lines |
| `admin/marketing/page.tsx` | 2 lines |

**Fix:** Replace all `rgba(0,255,167,X)` → `rgba(var(--accent-rgb),X)`

### HIGH — Off-Palette Hardcodes

| File | Issue |
|---|---|
| `SenderNameForm.tsx` (6 lines) | `text-slate-300` instead of `text-[var(--text-secondary)]` |
| `PasswordChangeForm.tsx` (3 lines) | `text-slate-300` instead of `text-[var(--text-secondary)]` |
| `register/page.tsx` (4 lines) | `border-[#3a4049]` (not `#20252c`), `text-[#556677]` (off-palette) |
| `components/ui/switch.tsx` (3 lines) | Unchecked state uses `#4a5568`/`#374151`/`#9ca3af` instead of DNA tokens |

### LOW — Acceptable Exceptions

- `help/page.tsx`: `#00B900` (LINE brand green) — intentional
- `test-sms/page.tsx`: confetti particle colors — decorative
- `layout.tsx`: `themeColor: "#061019"` should be `#0b1118` (minor)
- `emails/` components: hardcoded values required (email clients)

---

## 2. Layout Uniformity

### Sidebar — CONSISTENT ✅

All dashboard pages use `DashboardShell.tsx` via `DashboardLayout`. No page bypasses it.

### Container Padding — INCONSISTENT ❌

**4 competing patterns found:**

| Pattern | Pages |
|---|---|
| `p-4 md:p-6` | dashboard home, messages, send, logs |
| `p-4 md:p-8` | contacts, groups, templates, otp, roles |
| `p-6 md:p-8` | senders, api-docs, analytics, billing, scheduled, security |
| `px-8 py-6 max-md:px-4` | welcome, packages, support, quotations |

Design tokens define `--content-padding-x: 32px` (px-8) / `--content-padding-y: 24px` (py-6) but core pages don't use them.

### Card Inner Padding — INCONSISTENT ❌

`CardContent` uses `p-4`, `p-5`, and `p-6` interchangeably, even within the same file (`DashboardContent.tsx`).

### Typography — CORRECT ✅

IBM Plex Sans + IBM Plex Sans Thai loaded via Google Fonts. No Inter used (task description mentioned Inter but project uses IBM Plex).

### Button Styles — INCONSISTENT ❌ (4 approaches)

1. shadcn `<Button>` — correct usage in many pages
2. `btn-primary` CSS class — 7 occurrences (settings, senders, api-docs, scheduled)
3. Inline styled `<Link>` as button — 3 occurrences (billing)
4. Bare `<button>` with ad-hoc Tailwind — pervasive (contacts, settings, otp, messages)

### Banned Radius Classes — VIOLATED ❌

`globals.css` bans `rounded-xl`/`rounded-2xl` (`--radius-lg: 12px` is max), but **168 occurrences** exist across the dashboard.

---

## 3. shadcn/ui Usage

### Custom Components Duplicating shadcn

| Custom Component | shadcn Equivalent | Usage Count |
|---|---|---|
| `CustomSelect.tsx` | `<Select>` | 20+ files |
| `PillTabs.tsx` | `<Tabs>` | 2 files |
| `SenderDropdown.tsx` | `<Select>` / `<Command>` | 2 files |

### Custom Modals Not Using `<Dialog>`

- `settings/privacy/page.tsx:141` — hand-built `fixed inset-0 z-50` overlay
- `settings/ForceChangeModal.tsx:40` — same pattern

shadcn `<Dialog>` is already used in 14 other files.

---

## 4. Dark Theme — PASS ✅

- `<html>` has `className="dark"` — forced dark mode
- Zero `bg-white`, `bg-gray-100`, `bg-slate-100` found in dashboard
- `bg-white/[0.04]` etc. are intentional dark-UI hover overlays
- Minor: 6 error buttons use `text-white` instead of `text-[var(--text-primary)]`

---

## 5. New Pages Check — ALL EXIST ✅

| Page | Path | Status |
|---|---|---|
| Campaign Management | `dashboard/campaigns/page.tsx` | ✅ EXISTS |
| Analytics Dashboard | `dashboard/analytics/page.tsx` | ✅ EXISTS |
| Terms | `app/terms/page.tsx` | ✅ EXISTS |
| Privacy | `app/privacy/page.tsx` | ✅ EXISTS |
| Cookies | `app/cookies/page.tsx` | ✅ EXISTS |
| Help Center | `app/help/page.tsx` | ✅ EXISTS |
| Status Page | `app/status/page.tsx` | ✅ EXISTS |
| Billing | `dashboard/billing/page.tsx` | ✅ EXISTS |

---

## 6. Mobile Responsive

### Navigation — PASS ✅

Bottom nav (`md:hidden`) + Sheet slide-up for full menu. No hamburger needed.

### Responsive Grids — PASS ✅

Consistent `grid-cols-1 md:grid-cols-X lg:grid-cols-Y` across pages.

### Table Responsiveness — MIXED ⚠️

| Page | Status | Notes |
|---|---|---|
| campaigns | ✅ | Desktop table + mobile card fallback |
| billing/orders | ✅ | Desktop table + mobile card fallback |
| contacts, groups, messages, logs | ✅ | `overflow-x-auto` / `TableWrapper` |
| **invoices** | ⚠️ | Fixed grid (680px min), no mobile cards |
| **quotations** | ⚠️ | Fixed grid (850px min), no mobile cards |
| **api-docs** | ❌ | Two-column layout, no responsive collapse |
| **logs filter bar** | ⚠️ | Multiple `min-w-[*]` inputs, no `flex-wrap` |

---

## Summary Scorecard

| Category | Status | Score |
|---|---|---|
| Color tokens defined | ✅ | 10/10 |
| Accent RGB consistency | ❌ CRITICAL | 3/10 |
| Text/border palette compliance | ⚠️ | 6/10 |
| Sidebar consistency | ✅ | 10/10 |
| Container padding | ❌ | 4/10 |
| Card padding | ❌ | 5/10 |
| Typography | ✅ | 10/10 |
| Button consistency | ❌ | 4/10 |
| Border radius compliance | ❌ | 3/10 |
| shadcn usage | ⚠️ | 6/10 |
| Dark theme | ✅ | 9/10 |
| New pages exist | ✅ | 10/10 |
| Mobile navigation | ✅ | 9/10 |
| Table responsiveness | ⚠️ | 7/10 |
| **Overall** | | **6.9/10** |

## Priority Fixes

### P0 (Critical)
1. Fix accent RGB: `rgba(0,255,167)` → `rgba(var(--accent-rgb))` across 20+ files

### P1 (High)
2. Remove 168 `rounded-xl`/`rounded-2xl` violations (spec bans them)
3. Standardize container padding to design tokens (`px-8 py-6`)
4. Replace `text-slate-300` with `text-[var(--text-secondary)]` in forms

### P2 (Medium)
5. Migrate `CustomSelect` → shadcn `<Select>` (20 files)
6. Replace `btn-primary` CSS class and inline button styles → shadcn `<Button>`
7. Fix `api-docs/page.tsx` two-column layout for mobile
8. Add `flex-wrap` to logs filter bar

### P3 (Low)
9. Migrate `PillTabs` → shadcn `<Tabs>`
10. Replace custom modals → shadcn `<Dialog>`
11. Add mobile card fallback for invoices/quotations tables
12. Fix `switch.tsx` unchecked state colors to use DNA tokens
