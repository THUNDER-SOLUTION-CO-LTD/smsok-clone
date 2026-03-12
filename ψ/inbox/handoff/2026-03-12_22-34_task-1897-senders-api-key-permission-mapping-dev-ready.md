# Dev Handoff — Task #1897 Sender API key permission mapping

## Status
- Dev implementation complete
- Verified with targeted regression, eslint, and full typecheck
- Addresses reviewer rejection where `/api/v1/senders*` was not mapped in `api-key-permissions.ts`, causing API key auth to fail with 403
- Not yet re-reviewed
- Not yet QA E2E 100%
- Do **not** send to Human yet

## What changed
- Added sender subtree mapping in `lib/api-key-permissions.ts`
  - `GET/HEAD /api/v1/senders*` -> `sms:read`
  - write methods on `/api/v1/senders*` -> `sms:send`
- Hardened sender-name subtree to use dual auth via `authenticateRequest(req)` instead of session-only `getSession()`
  - `app/api/v1/senders/name/route.ts`
  - `app/api/v1/senders/name/[id]/route.ts`
- Added regression coverage in `tests/task-1897-regressions.test.ts`
  - asserts sender route permission resolution
  - asserts sender routes use `authenticateRequest`

## Verification
- `npx vitest run tests/task-1897-regressions.test.ts` ✅
- `npx eslint lib/api-key-permissions.ts app/api/v1/senders/name/route.ts app/api/v1/senders/name/[id]/route.ts tests/task-1897-regressions.test.ts` ✅
- `npx tsc --noEmit --pretty false --incremental false` ✅

## Files changed
- `lib/api-key-permissions.ts`
- `app/api/v1/senders/name/route.ts`
- `app/api/v1/senders/name/[id]/route.ts`
- `tests/task-1897-regressions.test.ts`

## Reviewer focus
- Confirm permission choice is acceptable under current API-key model:
  - sender reads reuse `sms:read`
  - sender writes reuse `sms:send`
- Confirm `/api/v1/senders/name*` is intended to be API-key-capable; implementation now matches subtree mapping rather than leaving mixed auth behavior
