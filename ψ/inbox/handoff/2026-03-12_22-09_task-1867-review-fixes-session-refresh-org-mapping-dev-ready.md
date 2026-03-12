# Dev Handoff — Task #1867 Reviewer fixes for session refresh + org route mapping

## Status
- Dev implementation complete
- Verified with targeted regression, eslint, and full typecheck
- Addresses reviewer rejection on middleware/session renewal + organizations route permission mapping
- Not yet re-reviewed
- Not yet QA E2E 100%
- Do **not** send to Human yet

## Reviewer feedback addressed
1. `getSession()` must handle expired/missing access token by recovering from a valid refresh token
2. Organization/roles APIs need explicit API-key route permission mapping instead of implicit fallthrough

## What changed
- `lib/auth.ts`
  - Added refresh-token-backed session lookup for `getSession()` / `getSessionContext()`
  - If access token is missing or expired but refresh token is still valid, session lookup now restores the user context
  - When cookie writes are allowed, it also renews the access cookie without forcing API consumers through a 401 first
- `lib/api-auth.ts` and `lib/request-auth.ts`
  - Pass `req.headers` into `getSession()` so access-cookie renewal can capture request metadata in route contexts
- `lib/api-key-permissions.ts`
  - Added explicit `session-only` mapping for `/api/v1/organizations*` routes so org/roles endpoints never silently fall through API-key permission resolution
- Added targeted regression coverage for refresh-backed `getSession()` recovery, session-only org route mapping, and request header propagation

## Files
- `lib/auth.ts`
- `lib/api-auth.ts`
- `lib/request-auth.ts`
- `lib/api-key-permissions.ts`
- `tests/task-1867-regressions.test.ts`

## Verification
- `npx vitest run tests/task-1867-regressions.test.ts` ✅
- `npx eslint lib/auth.ts lib/api-auth.ts lib/request-auth.ts lib/api-key-permissions.ts tests/task-1867-regressions.test.ts` ✅
- `npx tsc --noEmit --pretty false --incremental false` ✅

## Notes
- Organization APIs remain session-only; this patch makes that policy explicit in route permission resolution rather than accidentally relying on missing mappings
- `getSession()` now tolerates expired ATs by deriving user context from a valid RT, which removes the reviewer-reported failure mode where middleware allowed the request but route/session lookup still failed
