# SMSOK UX + Accessibility Audit v2

**Date:** 2026-03-14
**Auditor:** QA Agent
**Task:** #3313

---

## 1. UX Flow Audit

### Register Flow — GOOD with gaps
- Two-step wizard (form → OTP) with step indicator
- Zod schema validation with `mode: "onChange"` for real-time feedback
- Real-time duplicate check for email (debounced 500ms) and phone
- Password strength meter, CapsLock warning
- Loading states, success/error toasts, redirect after success

**Gaps:**
| # | Severity | Issue | File |
|---|---|---|---|
| 1 | MEDIUM | Unchecked consents cause silent no-op (no error shown) | `register/page.tsx:185-187` |
| 2 | LOW | No required field `*` indicators on core fields (only on consent checkboxes) | `register/page.tsx` |

### Login Flow — GOOD
- Zod validation, spinner + "กำลังเข้าสู่ระบบ...", error banner + toast
- 2FA redirect handled, network error caught separately

**Gaps:**
| # | Severity | Issue | File |
|---|---|---|---|
| 3 | MEDIUM | No CapsLock warning (register has it, login doesn't) | `login/page.tsx` |
| 4 | LOW | Button disabled on pristine load — confusing initial state | `login/page.tsx:170` |

### Dashboard — GOOD
- Server component with `Promise.all` parallel fetch, `.catch()` fallbacks
- `loading.tsx` exists with skeleton cards

**Gaps:**
| # | Severity | Issue | File |
|---|---|---|---|
| 5 | MEDIUM | Empty `catch {}` swallows errors silently — no logging | `dashboard/page.tsx:32` |
| 6 | MEDIUM | No `error.tsx` for dashboard root route | `dashboard/` |

### Send SMS — CRITICAL BUG FOUND
- Good: Loading states, inline errors, phone validation, credit check, confirmation modal
- Good: CSV upload for bulk, variable autocomplete, sending-hours guard

**Gaps:**
| # | Severity | Issue | File |
|---|---|---|---|
| 7 | **CRITICAL** | **Scheduled SMS never calls `createScheduledSms` — always sends immediately!** `handleSend()` ignores `scheduleMode`, always calls `sendSms()`/`sendBatchSms()` | `SendSmsForm.tsx:153-167` |
| 8 | HIGH | Mobile CTA bypasses confirmation modal (calls `handleSend()` directly) | `SendSmsForm.tsx:563 vs :538` |
| 9 | LOW | No timezone display on schedule picker | `SendSmsForm.tsx:519-533` |
| 10 | LOW | `senderName` defaults to `undefined` when no senders | `SendSmsForm.tsx:31` |

### Logout — GOOD
- Desktop + mobile paths, cross-tab broadcast, tab-focus re-check, global 401 interceptor

**Gaps:**
| # | Severity | Issue | File |
|---|---|---|---|
| 11 | MEDIUM | No loading indicator on logout — double-click risk | `DashboardShell.tsx:307-311` |

### Navigation — ALL 18 SIDEBAR LINKS VERIFIED ✅
No dead links. Every `href` resolves to a valid `page.tsx`.

**Gaps:**
| # | Severity | Issue | File |
|---|---|---|---|
| 12 | LOW | ~10 pages exist but unreachable from sidebar (scheduled, history, profile, support, webhooks, etc.) | Various |
| 13 | LOW | Mobile Sheet active-state uses strict equality — won't highlight nested routes | `DashboardShell.tsx:555` |

### Breadcrumbs — MISSING ❌
| # | Severity | Issue | File |
|---|---|---|---|
| 14 | HIGH | **Zero breadcrumbs anywhere in the dashboard.** No back buttons on detail pages (`contacts/[id]`, `groups/[id]`, `orders/[id]`, `roles/[id]`) | All detail pages |
| 15 | HIGH | Settings sub-pages have no navigation back to `/dashboard/settings` | `settings/security/`, `settings/team/`, etc. |

### Form Validation Summary

| Form | Zod Schema | Error Display | Thai Messages | Client-side | Server-side |
|---|---|---|---|---|---|
| Register | ✅ | ✅ FormMessage + banner | ✅ | ✅ onChange | ✅ |
| Login | ✅ | ✅ FormMessage + banner | ✅ | ✅ | ✅ |
| Send SMS | ❌ manual | ✅ inline + toast | ✅ | ⚠️ partial | ✅ |
| Profile edit | ❌ manual | ✅ inline | ✅ | ⚠️ minimal | ✅ |
| Password change | ❌ manual | ✅ inline + toast | ✅ | ⚠️ partial | ✅ |

**Gaps:**
| # | Severity | Issue | File |
|---|---|---|---|
| 16 | HIGH | PasswordChangeForm client validation misses strength rules — server throws on weak passwords | `PasswordChangeForm.tsx:16` |
| 17 | LOW | ProfileEditForm has no client-side Zod — allows `<script>` in name field | `ProfileEditForm.tsx:20` |

---

## 2. Accessibility Audit

### CRITICAL Issues (blocks AT users)

| # | Issue | File | Details |
|---|---|---|---|
| 18 | **Toast — no `aria-live` region** | `Toast.tsx:47-58` | Custom ToastContainer renders without `role="alert"` or `aria-live`. Screen readers never announce toasts. |
| 19 | **ConfirmDialog — no `role="dialog"`, no focus trap** | `ConfirmDialog.tsx:41-99` | Custom modal has no `aria-modal`, `aria-labelledby`, focus trapping, or focus restoration. |

### HIGH Issues (significant barrier)

| # | Issue | Files |
|---|---|---|
| 20 | `focus:outline-none` on inputs with NO ring alternative — ~10 files | `SendSmsForm.tsx:473,525,531`, `SenderNameForm.tsx:85`, `scheduled/page.tsx:61,74`, `ContactsClient.tsx:241`, `api-docs/page.tsx:1034`, `help/page.tsx:72`, `admin/pdpa/page.tsx:215` |
| 21 | `.btn-primary` CSS class has no `:focus-visible` ring | `globals.css:226-246` |
| 22 | Audit-logs backdrop div — `onClick` only, no keyboard close | `audit-logs/page.tsx:279` |
| 23 | Toast dismiss button — no `aria-label` | `Toast.tsx:77-81` |
| 24 | Unlabeled inputs (date, time, test-phone) | `SendSmsForm.tsx:519-534`, `scheduled/page.tsx:48-75` |
| 25 | Sortable `<th>` headers — no keyboard support or `aria-sort` | `globals.css:416-417`, all nansen-table users |
| 26 | Color contrast FAIL: `--text-subdued` (#6b7280) = 3.1-3.9:1, `--success` (#089981) = 3.4:1, `--accent-blue` (#4779FF) = 3.8:1 | `globals.css` |

### MEDIUM Issues

| # | Issue | Files |
|---|---|---|
| 27 | Sidebar `SidebarLink` — missing `aria-current="page"` | `DashboardShell.tsx:108-123` |
| 28 | Mobile "เพิ่มเติม" button — no `aria-label` or `aria-expanded` | `DashboardShell.tsx:617-624` |
| 29 | 4-5 `<nav>` elements without `aria-label` to distinguish them | `DashboardShell.tsx:212,221,230,262,594` |
| 30 | `<th>` elements missing `scope="col"` across all tables | All table components |
| 31 | Contacts tag-input outer `<div>` with `onClick` but no keyboard semantics | `ContactsClient.tsx:232-233` |
| 32 | Skip-link target `#main-content` missing on pricing/help/status pages | Public pages |

### LOW Issues

| # | Issue |
|---|---|
| 33 | English `aria-label` strings in Thai UI (audit-logs, api-docs, CreditAlertBanner) |
| 34 | LandingPage uses `<section id="main-content">` — should be `<main>` |
| 35 | `ConfirmDialog.tsx` SVG icons missing `aria-hidden="true"` |

### Color Contrast Results (WCAG AA = 4.5:1 normal text)

| Color | On Background | Ratio | Result |
|---|---|---|---|
| `#F2F4F5` (text-primary) | `#0b1118` | 19.1:1 | ✅ PASS |
| `#b2bacd` (text-secondary) | `#0b1118` | 9.1:1 | ✅ PASS |
| `#8a95a0` (text-muted) | `#0b1118` | 5.5:1 | ✅ PASS (marginal) |
| `#6b7280` (text-subdued) | `#0b1118` | 3.9:1 | ❌ FAIL |
| `#00E2B5` (accent) | `#0b1118` | 9.5:1 | ✅ PASS |
| `#089981` (success) | `#0b1118` | 3.9:1 | ❌ FAIL |
| `#4779FF` (accent-blue) | `#0b1118` | 3.8:1 | ❌ FAIL |

---

## 3. Performance Audit

### Bundle Size — HIGH concerns

| Issue | Impact | File |
|---|---|---|
| `framer-motion` eagerly imported in 19 files including landing page | ~170 KB gzipped in initial bundle | `LandingPage.tsx`, `dashboard/template.tsx` |
| `recharts` synchronously imported in dashboard | ~160 KB gzipped | `DashboardContent.tsx` |
| **Zero `next/dynamic` or `React.lazy` in entire codebase** | No code splitting for heavy components | All files |
| Google Fonts loaded via CDN `<link>` tags instead of `next/font` | Render-blocking network request | `layout.tsx:67-70` |
| `sharp` not in dependencies — image optimization disabled | Slower builds | `package.json` |
| `@fontsource/ibm-plex-sans-thai` installed but never imported | Dead dependency | `package.json` |

### Console Statements — CLEAN ✅
Zero stray `console.log` in client components. Server-side logging uses proper context tags.

### Loading States — PARTIAL

- **33 routes have `loading.tsx`** — good coverage on main routes
- **30 sub-routes missing `loading.tsx`** — settings/*, billing/*, support/*, profile, etc.
- **Zero `<Suspense>` boundaries** for partial streaming inside pages

### Meta/SEO — GOOD with gaps

| Item | Status |
|---|---|
| Root metadata (title, description, keywords) | ✅ |
| OpenGraph + Twitter card | ⚠️ No image defined |
| robots.ts | ✅ |
| sitemap.ts | ✅ (8 public pages) |
| PWA manifest | ✅ |
| Spurious `hreflang="en"` | ⚠️ Points to non-existent English locale |

---

## Summary Scorecard

| Category | Score | Notes |
|---|---|---|
| Register flow | 8/10 | Good UX, minor gaps |
| Login flow | 8/10 | Solid, missing CapsLock warn |
| Send SMS flow | **4/10** | CRITICAL: scheduled send broken |
| Navigation | 8/10 | All links valid, breadcrumbs missing |
| Form validation | 6/10 | Inconsistent Zod usage |
| Keyboard navigation | 5/10 | Multiple focus ring gaps |
| Screen reader support | **3/10** | Toast + ConfirmDialog critical |
| Color contrast | 6/10 | 3 tokens fail WCAG AA |
| Performance/bundle | 5/10 | No code splitting, heavy libs |
| Loading states | 7/10 | Main routes covered, sub-routes not |
| **Overall** | **6.0/10** | |

## Top Priority Fixes

### P0 (Critical)
1. **Fix scheduled SMS send** — `SendSmsForm.tsx` must branch on `scheduleMode` and call `createScheduledSms`
2. **Add `aria-live` to Toast** — screen readers cannot hear notifications
3. **Add `role="dialog"` + focus trap to ConfirmDialog** — or replace with shadcn Dialog

### P1 (High)
4. Add breadcrumbs/back navigation on all detail pages
5. Fix `focus:outline-none` inputs — add `focus:ring-2` or use `nansen-input` class
6. Fix PasswordChangeForm client validation to match server schema
7. Add mobile confirmation modal (currently bypassed)
8. Fix color contrast for `--text-subdued`, `--success`, `--accent-blue`

### P2 (Medium)
9. Dynamic import `recharts` and `framer-motion`
10. Switch Google Fonts to `next/font/google`
11. Add `loading.tsx` to 30 missing sub-routes
12. Add `aria-current="page"` to sidebar active links
13. Add `scope="col"` to all `<th>` elements
14. Add keyboard support to sortable table headers
