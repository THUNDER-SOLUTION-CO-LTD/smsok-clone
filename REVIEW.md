# Code Review Findings

Date: 2026-03-09
Repo: smsok-clone
Scope: recent API, dashboard, OTP, deploy, and auth changes

## Summary

Review focus:
- Security: auth bypass, XSS, SQL injection, secret handling
- Code quality: API/docs consistency, workflow correctness, runtime regressions
- Error handling: validation failures, upstream failures, deploy/test gates

Result:
- No direct SQL injection sink found in reviewed API code
- No obvious `dangerouslySetInnerHTML` XSS sink found in reviewed files
- Multiple high and medium severity issues remain and should be fixed before QA sign-off

## Findings

### High

1. CI does not enforce tests
- File: `.github/workflows/deploy.yml`
- Problem: test stage uses `bun run test || echo "No tests configured yet — skipping"`.
- Impact: deploy can proceed even when tests fail or never run.

2. OTP hashing falls back to weak/default secret
- File: `lib/actions/otp.ts`
- Problem: OTP secret falls back to `JWT_SECRET` or a hardcoded string when `OTP_HASH_SECRET` is missing.
- Impact: weak secret separation and predictable fallback in production misconfiguration.

3. Dashboard API docs do not match real API contracts
- Files: `app/(dashboard)/dashboard/api-docs/page.tsx`, `app/api/v1/sms/send/route.ts`, `app/api/v1/sms/status/route.ts`
- Problem: docs show `recipient` and `senderName`, but route reads `to` and `sender`; docs show `messageId`, route expects `id`.
- Impact: client integrations built from docs will break.

### Medium

4. Top-up slip endpoint does not enforce transaction ownership
- Files: `app/api/v1/topup/slip/route.ts`, `lib/actions/payments.ts`
- Problem: authenticated user identity is ignored when updating a transaction by `transactionId`.
- Impact: another API user could mutate a transaction if the ID leaks.

5. API key management is exposed through ordinary API key auth
- Files: `app/api/v1/api-keys/route.ts`, `app/api/v1/api-keys/[id]/route.ts`
- Problem: an already-issued API key can create, disable, or delete keys in the same account.
- Impact: leaked integration key can be used to establish persistence.

6. API error responses leak raw internal messages
- File: `lib/api-auth.ts`
- Problem: API returns original error text for many business and validation failures.
- Impact: internal details leak to clients and upstream errors are exposed too broadly.

7. `authenticatePublicApiKey` is only a rename, not a policy boundary
- File: `lib/api-key-auth.ts`
- Problem: it simply calls `authenticateApiKey`.
- Impact: code suggests a security distinction that does not actually exist.

### Low

8. Duplicate balance-style endpoints increase drift risk
- Files: `app/api/v1/balance/route.ts`, `app/api/v1/credits/route.ts`
- Problem: overlapping endpoints return slightly different payloads.
- Impact: unnecessary surface area and documentation drift.

## Checks Performed

- Reviewed `git log --oneline -10`
- Reviewed recent diff stats
- Read changed API routes, OTP flow, auth helpers, middleware, schema, deploy workflow, and dashboard docs
- Searched for:
  - `dangerouslySetInnerHTML`
  - `innerHTML`
  - `$queryRaw`
  - `$executeRaw`
  - `eval(`

## Recommendation

Do not treat the current branch as QA-ready until:
- deploy workflow fails hard on test failures
- OTP secret handling is strict in production
- API docs match real request/response contracts
- top-up slip ownership checks are added
- API key management requires stronger auth policy
