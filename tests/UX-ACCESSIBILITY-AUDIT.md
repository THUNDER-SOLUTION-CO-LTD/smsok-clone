# SMSOK UX + Accessibility Audit Report
**Task**: #3313 | **Priority**: P1 | **Date**: 2026-03-14

---

## 1. Performance Check

| Page | Load Time | Size | Status |
|------|-----------|------|--------|
| Homepage | 0.91s | 67KB | PASS (< 3s) |
| /login | 0.34s | 30KB | PASS |
| /register | 0.19s | 46KB | PASS |
| /api/health | instant | ~1KB | PASS |

---

## 2. UX Flow Audit

### Navigation (Header)
| Link | Target | Status |
|------|--------|--------|
| SMSOK logo | / | PASS |
| ทำไมต้องเรา | #why | PASS |
| ฟีเจอร์ | #features | PASS |
| ราคา | #pricing | PASS |
| FAQ | #faq | PASS |
| เข้าสู่ระบบ | /login | PASS |
| สมัครฟรี | /register | PASS |

### Navigation (Footer) — 9 BROKEN LINKS
| Link | href | Status |
|------|------|--------|
| ฟีเจอร์ | #features | PASS |
| ราคา | #pricing | PASS |
| สมัครฟรี | /register | PASS |
| API Docs | # | **BROKEN** — placeholder |
| เกี่ยวกับเรา | # | **BROKEN** — placeholder |
| บล็อก | # | **BROKEN** — placeholder |
| ติดต่อเรา | # | **BROKEN** — placeholder |
| ร่วมงานกับเรา | # | **BROKEN** — placeholder |
| เงื่อนไขการใช้งาน | # | **BROKEN** — should → /terms |
| นโยบายความเป็นส่วนตัว | # | **BROKEN** — should → /privacy |
| SLA | # | **BROKEN** — placeholder |
| PDPA | # | **BROKEN** — placeholder |

**File**: `app/components/LandingPage.tsx:927-929`
**Fix**: Legal links should point to `/terms`, `/privacy`, `/cookie-policy`, etc. (pages exist)

### Social Media Links
| Link | Status |
|------|--------|
| LINE | # — placeholder |
| Facebook | # — placeholder |
| X (Twitter) | # — placeholder |

**Note**: Social links have correct `aria-label` attributes (PASS for a11y)

---

## 3. Accessibility Audit

### CRITICAL Issues

| # | Issue | Severity | Location | WCAG |
|---|-------|----------|----------|------|
| A11Y-01 | No skip-to-content link | MAJOR | All pages | 2.4.1 |
| A11Y-02 | No semantic `<header>`, `<main>`, `<nav>` on landing | MAJOR | LandingPage.tsx | 1.3.1 |
| A11Y-03 | Form inputs may lack `<label>` associations | MAJOR | /login, /register | 1.3.1 |
| A11Y-04 | No `autocomplete` on login email/password | MAJOR | /login | 1.3.5 |
| A11Y-05 | No password strength indicator on register | MINOR | /register | 3.3.2 |
| A11Y-06 | FAQ accordion missing `aria-expanded` state | MINOR | LandingPage.tsx | 4.1.2 |
| A11Y-07 | CTA buttons missing `aria-label` | MINOR | LandingPage.tsx | 4.1.2 |
| A11Y-08 | No visible focus indicators documented | MAJOR | All pages | 2.4.7 |
| A11Y-09 | `maximum-scale=1` blocks pinch zoom | MAJOR | viewport meta | 1.4.4 |
| A11Y-10 | No error message association (aria-describedby) on forms | MAJOR | /login, /register | 3.3.1 |

### PASS Items

| # | Check | Status |
|---|-------|--------|
| P-01 | `lang="th"` on `<html>` | PASS |
| P-02 | Thai font loaded (IBM Plex Sans Thai) | PASS |
| P-03 | Dark theme with intentional contrast | PASS |
| P-04 | `<footer>` semantic element used | PASS |
| P-05 | Social icons have `aria-label` | PASS |
| P-06 | PDPA consent links to /terms and /privacy | PASS |
| P-07 | Phone field has helper text (OTP hint) | PASS |

---

## 4. Cross-browser Notes

Cannot verify from CLI — requires manual testing:
- [ ] Chrome latest
- [ ] Safari latest
- [ ] Firefox latest
- [ ] iOS Safari (mobile)
- [ ] Android Chrome (mobile)
- [ ] Responsive: 375px, 768px, 1024px, 1440px

---

## 5. Summary

| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| Performance | 3/3 | 0 | All pages < 1s |
| Header Nav | 7/7 | 0 | All links work |
| Footer Nav | 3/12 | 9 | 9 placeholder `#` links |
| Accessibility | 7/17 | 10 | Missing labels, skip link, semantics |
| Cross-browser | — | — | Needs manual testing |

### Priority Fixes

1. **P0**: Fix 9 broken footer links (Legal links especially — `/terms`, `/privacy` pages exist!)
2. **P1**: Add skip-to-content link
3. **P1**: Add semantic landmarks (`<header>`, `<main>`, `<nav>`)
4. **P1**: Add `autocomplete` attributes to login/register forms
5. **P1**: Add `<label>` elements to all form inputs
6. **P2**: Remove `maximum-scale=1` from viewport meta
7. **P2**: Add `aria-expanded` to FAQ accordion
8. **P2**: Add password strength indicator to register
