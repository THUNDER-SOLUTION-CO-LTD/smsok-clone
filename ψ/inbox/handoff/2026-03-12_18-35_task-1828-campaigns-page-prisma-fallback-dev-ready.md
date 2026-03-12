# Dev Handoff — Task #1828 Campaigns page Prisma fail

## Status
- Dev implementation complete
- Verified with targeted test + lint + typecheck
- Not yet reviewed
- Not yet QA E2E 100%
- Do **not** send to Human yet

## Problem addressed
- `/dashboard/campaigns` could crash the whole page when campaign-related Prisma queries failed during server render
- The page also assumed campaign statuses were already lowercase, but legacy/uppercase values could leak through and break client rendering

## What changed
- Added a dedicated campaigns page data loader that:
  - wraps campaign list + metadata reads in `Promise.allSettled`
  - falls back to empty page data for recoverable Prisma client errors instead of throwing a server error
  - logs recoverable fallback events with scope/userId/error metadata
  - normalizes campaign status values to lowercase client-safe values before rendering
- Updated the dashboard campaigns page to use the new loader
- Added regression tests for status normalization, recoverable Prisma fallback, sender name dedupe, and non-Prisma rethrow behavior

## Files
- `app/(dashboard)/dashboard/campaigns/page.tsx`
- `lib/campaigns/page-data.ts`
- `tests/task-1828-regressions.test.ts`

## Verification
- `npx vitest run tests/task-1828-regressions.test.ts` ✅
- `npx eslint 'app/(dashboard)/dashboard/campaigns/page.tsx' lib/campaigns/page-data.ts tests/task-1828-regressions.test.ts` ✅
- `npx tsc --noEmit --pretty false --incremental false` ✅

## Notes
- This fixes the page-level blast radius for recoverable Prisma failures and status drift, but it does not change API semantics for `/api/v1/campaigns`
- If reviewer wants the underlying Prisma/storage issue root-caused further, inspect campaign-related migrations / DB provisioning separately; current change is to keep dashboard page usable and non-fatal
