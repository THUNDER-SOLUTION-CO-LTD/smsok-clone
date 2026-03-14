# SMSOK Test Suite — Documentation

## Test Types

### 1. Smoke Test (pre-deploy gate)
```bash
bash tests/smoke-test.sh                           # localhost
bash tests/smoke-test.sh https://smsok.io https://admin.smsok.io  # production
```
**What it checks:** Health, static pages, auth endpoints, protected routes, backoffice, rate limiting.
**Pass criteria:** ALL checks pass (exit 0). Any failure = DO NOT DEPLOY.

### 2. Unit & Regression Tests
```bash
bun test                    # run all tests
bun test tests/api-auth     # specific test
```
**Coverage:** 80+ test files covering auth, API contracts, security, PDPA, rate limits, slip processing.

### 3. E2E Tests (Playwright)
```bash
bunx playwright test                          # all E2E
bunx playwright test tests/e2e/auth.spec.ts   # specific
```
**Coverage:** Auth flow, SMS sending, contacts, campaigns, CSV export.

### 4. Integration Tests
```bash
bun test tests/integration/
```
**Coverage:** Auth → SMS → Contacts → Campaigns → PDPA full flows.

### 5. Load Test (k6)
```bash
k6 run tests/load-test.js
```
**Baseline:** 50 concurrent users, 5 min. Expected: p95 < 500ms, error < 1%.

## Pre-Deploy Checklist
1. `bun test` — all unit/regression pass
2. `bash tests/smoke-test.sh` — all smoke pass
3. `bunx playwright test` — all E2E pass
4. Reviewer approved
5. QA sign-off

## After Deploy
1. `bash tests/smoke-test.sh https://YOUR_DOMAIN https://admin.YOUR_DOMAIN`
2. Manual spot-check: login, send SMS, check credits
3. Monitor Sentry for 30 min
