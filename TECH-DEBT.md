# TECH-DEBT — SMSOK Production Readiness
**Scan Date**: 2026-03-14
**Repos**: smsok-clone + smsok-backoffice

---

## P0 — CRITICAL (Fix Before Deploy)

### smsok-backoffice
| # | Issue | File | Line |
|---|-------|------|------|
| 1 | `.env.example` missing 8 production vars: SMS_API_URL, SMS_API_USERNAME, SMS_API_PASSWORD, EASYSLIP_API_KEY, EASYSLIP_API_URL, OTP_HASH_SECRET, CRON_SECRET, TWO_FA_ENCRYPTION_KEY | `.env.example` | — |

### smsok-clone
| # | Issue | File | Line |
|---|-------|------|------|
| 2 | Hard-coded "default" organizationId — breaks multi-tenant isolation | `hooks/usePermission.tsx` | 27 |
| 3 | Two-factor recovery URL fallback to localhost — may expose internal URL | `lib/actions/two-factor.ts` | 429 |

---

## P1 — HIGH (Fix Before Release)

### smsok-backoffice
| # | Issue | File | Line |
|---|-------|------|------|
| 4 | No ESLint + Prettier config — code style not enforced | project root | — |
| 5 | CSRF `DEFAULT_ALLOWED_ORIGINS` hard-coded localhost:3001 | `lib/csrf.ts` | 1 |
| 6 | Unhandled `.then()` without `.catch()` on raw SQL | `app/api/admin/users/stats/route.ts` | 31 |
| 7 | `as any` type casts in audit metadata — should use `JsonValue` | `lib/audit.ts` | 48-50 |
| 8 | Default admin password in seed script source code | `scripts/seed-admin.ts` | 20-22 |

### smsok-clone
| # | Issue | File | Line |
|---|-------|------|------|
| 9 | Dashboard credits page incomplete — waiting backend event endpoint | `app/(dashboard)/dashboard/credits/page.tsx` | 566 |
| 10 | `shadcn` CLI in dependencies instead of devDependencies | `package.json` | — |

---

## P2 — MEDIUM (Backlog)

### smsok-clone
| # | Issue | File | Line |
|---|-------|------|------|
| 11 | Alert integrations TODO (Slack, LINE, Email) not implemented | `lib/alerts.ts` | 53-59 |
| 12 | `.env.example` lacks REQUIRED vs optional distinction | `.env.example` | — |

### smsok-backoffice
| # | Issue | File | Line |
|---|-------|------|------|
| 13 | Redis URL localhost fallback — may connect wrong in production | `lib/redis.ts` | 3 |

---

## Clean Areas (No Action Needed)

| Category | smsok-clone | smsok-backoffice |
|----------|------------|-----------------|
| TODO/FIXME/HACK | 5 (3 LOW, 1 MED, 1 HIGH) | 0 — CLEAN |
| console.log debug | CLEAN (all legitimate) | CLEAN (all legitimate) |
| Unused imports | CLEAN | CLEAN |
| Dead code | CLEAN (omise.ts removed) | CLEAN |
| Error handling | GOOD (apiError wrapper) | GOOD (apiError helper) |
| Dependencies | 46 deps — no duplicates | 15 deps — no duplicates |
| TypeScript strict | Enabled | Enabled |

---

## Action Plan

1. **Backend** → Fix #1 (.env.example backoffice) + #6 (unhandled .then) + #7 (as any)
2. **Frontend** → Fix #2 (usePermission orgId) + #3 (2FA URL fallback) + #10 (shadcn devDep)
3. **DevOps** → Fix #4 (ESLint/Prettier backoffice) + #5 (CSRF origins to env) + #8 (seed password to env)
4. **Backlog** → #9, #11, #12, #13
