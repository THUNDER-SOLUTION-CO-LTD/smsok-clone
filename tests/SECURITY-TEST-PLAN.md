# SMSOK Security Test Plan
**Task**: #3307 | **Priority**: P1 | **Date**: 2026-03-14
**Status**: Ready to execute post-deploy

---

## 1. Auth Security Tests (9 cases)

| # | Test Case | Method | Expected | Pre-deploy |
|---|-----------|--------|----------|------------|
| SEC-01 | /admin no session → redirect /login | GET /admin | 302 → /login | FAIL (pending deploy) |
| SEC-02 | /admin/* subpages no session → redirect | GET /admin/orders | 302 → /login | FAIL (pending deploy) |
| SEC-03 | /admin with valid JWT → dashboard loads | GET /admin (cookie: valid JWT) | 200 | Blocked |
| SEC-04 | /admin expired JWT → redirect /login | GET /admin (cookie: expired) | 302 → /login | Blocked |
| SEC-05 | /admin tampered JWT → redirect /login | GET /admin (cookie: bad sig) | 302 → /login | Blocked |
| SEC-06 | /dashboard no session → redirect /login | GET /dashboard | 302 → /login | PASS |
| SEC-07 | /dashboard/* no session → redirect | GET /dashboard/settings | 302 → /login | PASS |
| SEC-08 | Admin API no token → 401 | GET /api/admin/orders | 401 | PASS (API layer) |
| SEC-09 | Admin API invalid token → 401 | GET /api/admin/orders (bad Bearer) | 401 | PASS (API layer) |

---

## 2. CSV Injection Tests (6 cases)

**Endpoints**:
- `/api/v1/contacts/export?format=csv`
- `/api/v1/logs/export?format=csv`
- `/api/v1/audit-logs/export?format=csv`

| # | Test Case | Payload | Expected | File |
|---|-----------|---------|----------|------|
| CSV-01 | Formula in name field neutralized | `=CMD('calc')` | Cell shows `'=CMD('calc')` (prefix quote) | contacts/export |
| CSV-02 | Plus formula neutralized | `+CMD('calc')` | Prefixed with `'` | contacts/export |
| CSV-03 | Minus formula neutralized | `-1+1` | Prefixed with `'` | contacts/export |
| CSV-04 | At-sign formula neutralized | `@SUM(A1:A10)` | Prefixed with `'` | contacts/export |
| CSV-05 | Tab/CR injection neutralized | `\ttest\rinjection` | Stripped | contacts/export |
| CSV-06 | UTF-8 BOM present for Thai | Export Thai data | BOM `EF BB BF` at start | contacts/export |

**Implementation check**: `escapeCsvField()` strips `[=+\-@\t\r]` prefix chars.

---

## 3. Rate Limit Tests (10 cases)

**Config from `lib/rate-limit.ts`**:

| Endpoint | Limit | Window |
|----------|-------|--------|
| SMS send | 10 | 60s |
| Batch SMS | 5 | 60s |
| Auth login | 20 | 15min |
| Admin login | 5 | 60s |
| OTP send | 3 | 10min |
| Password reset | 5 | 15min |
| API keys | 10 | 60s |
| Generic API | 60 | 60s |

| # | Test Case | Endpoint | Method | Expected |
|---|-----------|----------|--------|----------|
| RL-01 | SMS send over limit → 429 | POST /api/v1/sms/send | 11 rapid requests | 429 after 10th |
| RL-02 | Auth login over limit → 429 | POST /api/auth/login | 21 requests in 15min | 429 after 20th |
| RL-03 | Admin login over limit → 429 | POST /api/v1/admin/auth | 6 rapid requests | 429 after 5th |
| RL-04 | OTP send over limit → 429 | POST /api/v1/otp/send | 4 requests in 10min | 429 after 3rd |
| RL-05 | Password reset over limit → 429 | POST /api/auth/forgot-password | 6 requests in 15min | 429 after 5th |
| RL-06 | 429 response has Retry-After header | Any over-limit | Check headers | Retry-After present |
| RL-07 | X-RateLimit headers present | Any API call | Check headers | Limit + Remaining headers |
| RL-08 | Rate limit resets after window | Wait for window expiry | Request succeeds | 200 |
| RL-09 | Contacts export no rate limit | GET /api/v1/contacts/export | Rapid requests | **EXPECTED GAP** — no limit |
| RL-10 | Dev bypass disabled in prod | Check NODE_ENV | shouldBypassRateLimit() = false | Must be false |

### Known Gaps (to report):
- `/api/v1/contacts/export` — **NO rate limit** (HIGH risk)
- `/api/v1/logs/export` — generic 60/min (should be 5/min for export)
- `/api/v1/audit-logs/export` — no MAX_EXPORT_ROWS limit

---

## 4. PDPA/Consent Tests (8 cases)

| # | Test Case | Type | Expected |
|---|-----------|------|----------|
| PDPA-01 | Cookie banner shows on first visit | UI | Banner visible after 240ms |
| PDPA-02 | Accept all → log consent + load analytics | UI+API | POST /api/v1/consent with OPT_IN |
| PDPA-03 | Reject analytics → no analytics scripts | UI | No tracking scripts in DOM |
| PDPA-04 | Reject marketing → no marketing scripts | UI | Marketing consent OPT_OUT logged |
| PDPA-05 | Consent persists in localStorage | UI | `cookie-consent` key present |
| PDPA-06 | Consent syncs to backend | API | GET /api/v1/consent/status returns correct state |
| PDPA-07 | /settings/privacy → withdraw marketing consent | UI+API | OPT_OUT logged, analytics unloaded |
| PDPA-08 | SERVICE consent cannot be withdrawn | API | POST withdraw SERVICE → 400 error |

**Implementation**: `components/cookie-banner.tsx` + `lib/actions/consent.ts`

---

## 5. Additional Security Findings (to verify)

| # | Finding | Severity | File |
|---|---------|----------|------|
| EXTRA-01 | JWT_SECRET minimum length not enforced | MEDIUM | lib/env.ts |
| EXTRA-02 | Admin tokens lack jti for individual revocation | MEDIUM | lib/admin-auth.ts |
| EXTRA-03 | Silent JWT verification failures (no logging) | MEDIUM | session-jwt.ts, admin-auth.ts |
| EXTRA-04 | contactId enumeration via public API key | MEDIUM | api/v1/pdpa/consent/route.ts |
| EXTRA-05 | Contacts export unbounded rows (no MAX limit) | MEDIUM | api/v1/contacts/export/route.ts |

---

## Execution Plan

### Phase A: Pre-deploy (NOW)
- [x] Write test plan
- [x] Identify security gaps from code review
- [ ] Prepare automated test scripts

### Phase B: Post-deploy
- [ ] SEC-01~05: Admin auth redirect tests
- [ ] RL-01~08: Rate limit verification
- [ ] CSV-01~06: CSV injection tests
- [ ] PDPA-01~08: Consent flow tests

### Phase C: Report
- [ ] Compile results
- [ ] Report to PM via oracle_task_done()
