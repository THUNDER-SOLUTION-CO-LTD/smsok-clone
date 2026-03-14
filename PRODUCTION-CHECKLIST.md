# PRODUCTION CHECKLIST — SMSOK
**Last Updated**: 2026-03-14
**Deploy Target**: 185.241.210.52

---

## Backend
- [x] Auth: JWT verification middleware (jose) — both repos
- [x] Security: CSV formula injection neutralized — both repos
- [x] Security: Rate limiting on all endpoints — both repos
- [x] Security: 2FA TOTP implementation
- [x] Security: CSRF origin validation — both repos
- [x] PDPA: Self-service endpoints (clone) — /api/v1/me/export, /api/v1/me/delete
- [ ] **PDPA: Admin APIs (backoffice) — #3230 BLOCKED (backend in_progress)**
- [x] API: OpenAPI spec documented
- [ ] API Docs: SDK examples + webhook docs — #3238 in_progress
- [x] Payment: SlipOK + EasySlip integration
- [x] SMS: EasyThunder gateway integration
- [x] Queue: BullMQ workers (OTP, bulk SMS, campaigns)

## Frontend
- [x] Dashboard: Analytics, Campaign Table, Heatmap, Date Range — #3380
- [x] PDPA: Consent UI components — #3406
- [x] Campaign Builder: 5-step wizard — #3407
- [x] Build: tsc + Next.js build pass
- [ ] Review: Reviewer #3430 pending
- [ ] QA: E2E testing after reviewer pass

## Security
- [x] CSV injection: toCsvCell() on all exports — both repos
- [x] Rate limiting: Login 5 attempts/5min, API per-endpoint limits
- [x] 2FA: TOTP + recovery codes
- [x] JWT: Signature verification (not just cookie existence)
- [x] CSRF: Origin validation
- [ ] QA: Security audit — #3347 pending
- [ ] QA: CSV + Rate Limit E2E test — #3416 pending

## Infrastructure
- [x] Deploy scripts: npm→bun migration — 7 fixes
- [x] PM2 ecosystem: standalone server.js
- [x] Backup: pg_dump --format=custom
- [x] DEPLOY-RUNBOOK.md created
- [ ] Review: Deploy scripts #3426 pending reviewer
- [ ] **DNS: A records configured — HUMAN BLOCKER**
- [ ] **SSH: Server access granted — HUMAN BLOCKER**
- [ ] **SSL: Let's Encrypt / Cloudflare — HUMAN BLOCKER**

## Database
- [x] Prisma schema: all migrations up to date
- [x] Seed script: admin user + test data
- [ ] Production seed: admin user only (no test data)
- [ ] Verify migrations run clean on fresh DB

## Environment
- [x] smsok-clone .env.example: comprehensive (88 lines, all vars)
- [ ] **smsok-backoffice .env.example: MISSING 8 vars** (see TECH-DEBT.md #1)
- [ ] .env.production templates prepared (see below)

## Monitoring
- [ ] Sentry DSN configured
- [ ] Health check endpoint verified
- [ ] PM2 monitoring enabled
- [ ] Uptime monitoring (external)

## QA Sign-off
- [ ] QA: CSV Formula Injection E2E — #3416
- [ ] QA: Frontend Build + Localhost — #3383
- [ ] QA: Backoffice Security Audit — #3347
- [ ] QA: UX + Accessibility — #3313
- [ ] **QA E2E 100% pass — REQUIRED before Human uses**

---

## BLOCKERS (3)

| # | Blocker | Owner | Status |
|---|---------|-------|--------|
| 1 | PDPA Backoffice APIs #3230 | backend | in_progress — จี้แล้ว #3421 |
| 2 | DNS + SSH + SSL setup | **Human** | Not started |
| 3 | QA E2E 100% pass | qa | 4 tasks pending |

---

## Deploy Order
```
1. Human: DNS + SSH + SSL
2. Backend: PDPA Backoffice done → reviewer → QA
3. QA: All 4 tests pass
4. DevOps: Run DEPLOY-RUNBOOK.md
5. Lead-dev: Verify production
6. PM: Sign-off → Go live
```
