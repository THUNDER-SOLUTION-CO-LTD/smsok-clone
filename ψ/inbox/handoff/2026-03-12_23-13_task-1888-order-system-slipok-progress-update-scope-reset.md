# Progress Update — Task #1888 Order System Backend

## Current status
- Work is **not finished yet**
- No production code for `#1888` has been landed yet
- Current phase: implementation planning + impact analysis complete, coding about to start

## Scope reset from Human (latest directive)
`#1888` changed materially and the new source of truth is:
- Use **SlipOK** instead of EasySlip for order slip verification
- Remove **admin approval/reject flow** for order payments
- Customer flow only
- If SlipOK verification passes -> mark order `PAID` immediately
- If SlipOK verification fails -> return error to customer and ask for re-upload
- No `/admin/orders` approval/reject dependency for this flow

## Research read
- `/Users/lambogreny/oracles/lead-research/research/slip-verification-api-comparison-2026-03-12.md`
- Key decision from research: SlipOK can auto-check duplicate (`1012`), amount mismatch (`1013`), and receiver mismatch (`1014`), so backend custom verification logic can be simplified

## Existing code already inspected
- `lib/easyslip.ts`
- `app/api/v1/orders/[id]/upload/route.ts`
- `app/api/orders/[id]/slip/route.ts`
- `app/api/orders/[id]/status/route.ts`
- `lib/orders/api.ts`
- `lib/orders/service.ts`
- env templates / server setup for current EasySlip config

## Planned implementation slice
1. Add `lib/slipok.ts` adapter for `POST form-data` + `x-authorization`
2. Switch customer order upload routes from EasySlip to SlipOK
3. On successful verify: create slip record + mark order `PAID` immediately + issue documents + activate package purchase
4. On failed verify: keep order unpaid and return customer-facing error from SlipOK code path
5. Stop depending on admin payment approval for order flow
6. Update env templates/docs from EasySlip -> SlipOK for order-system path
7. Add regression tests for provider switch + auto-paid behavior

## Important note
- Topup flow still has EasySlip references in other paths; current intent is to switch **order system** scope first per Human directive, not rewrite every existing payment path blindly in the same step

## Gate status
- Not yet reviewed
- Not yet QA E2E 100%
- Do **not** send to Human yet
