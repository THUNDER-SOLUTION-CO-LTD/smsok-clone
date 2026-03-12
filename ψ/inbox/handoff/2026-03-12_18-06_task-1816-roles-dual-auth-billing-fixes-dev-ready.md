# Dev Handoff — Task #1816 Roles API auth + billing fixes

## Status
- Dev implementation complete
- Not yet reviewed
- Not yet QA E2E 100%
- Do **not** send to Human yet

## Problem addressed
- `/api/v1/organizations/default/roles` and related organization routes were using API-key-only auth (`authenticatePublicApiKey`) even when called from dashboard session-cookie flows
- `default` org alias was not being resolved to the user's actual first organization before calling org/RBAC actions
- Billing order detail payload was too thin for the dashboard detail page and did not expose document URLs/timeline consistently

## What changed
### 1. Organizations routes: dual auth + default org resolver
Added `lib/organizations/resolve.ts` with `resolveOrganizationIdForUser(userId, requestedOrganizationId)`:
- passes through real org ids
- maps `default` to the user's first membership org
- throws `404` if user has no default org

Patched these routes to use `authenticateRequest(req)` and resolve org id before action calls:
- `app/api/v1/organizations/route.ts`
- `app/api/v1/organizations/[id]/route.ts`
- `app/api/v1/organizations/[id]/members/route.ts`
- `app/api/v1/organizations/[id]/invites/route.ts`
- `app/api/v1/organizations/[id]/roles/route.ts`
- `app/api/v1/organizations/[id]/roles/[roleId]/route.ts`
- `app/api/v1/organizations/[id]/roles/[roleId]/permissions/route.ts`
- `app/api/v1/organizations/[id]/members/[memberId]/roles/route.ts`

Result:
- session cookie auth works again for dashboard roles/team/org pages
- API key auth still works through `authenticateRequest()` fallback
- `default` alias no longer passes literal `"default"` into org action layer

### 2. Billing order detail payload improvements
Patched:
- `app/api/v1/orders/[id]/route.ts`
- `lib/orders/service.ts`

Changes:
- route now uses `orderDetailSelect` instead of summary-only select
- serializer now includes:
  - `tax_invoice_number`
  - `tax_invoice_url`
  - `receipt_number`
  - `receipt_url`
  - `documents` array populated from `order.documents`
  - document `url` compatibility field (alongside `pdf_url`)
  - `timeline` derived from order history

Reason:
- `/dashboard/billing/orders/[id]` expects document/timeline shape that was not being returned cleanly
- front-end document section reads `doc.url`, but serializer only exposed `pdf_url` before

## Validation
- `npx vitest run tests/task-1816-regressions.test.ts` ✅
- `npx eslint <patched files>` ✅
- Full `npx tsc --noEmit --pretty false --incremental false` was started twice but did not finish within the session window; no type errors were emitted during the wait, but this check is not confirmed complete

## Added regression coverage
- `tests/task-1816-regressions.test.ts`
  - org routes use `authenticateRequest`
  - org routes resolve default org alias
  - order detail route uses `orderDetailSelect`
  - order serializer exposes tax invoice / receipt / url / timeline fields

## Review focus
- `/dashboard/settings/roles` no longer redirects to `/login`
- `/dashboard/settings/team` and related org/member/invite flows work with session cookies
- `default` org alias resolves correctly for users with memberships
- `/dashboard/billing/orders/[id]` shows documents/timeline and opens correct URLs
- run reviewer + QA E2E before Human
