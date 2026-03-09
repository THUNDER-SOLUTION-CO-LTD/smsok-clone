# QA Report

Date: 2026-03-09
Project: `smsok-clone`
Environment: local Chrome against `http://localhost:3000`

## Scope

Regression-tested all 13 dashboard routes:

1. `/dashboard`
2. `/dashboard/send`
3. `/dashboard/messages`
4. `/dashboard/otp`
5. `/dashboard/templates`
6. `/dashboard/contacts`
7. `/dashboard/senders`
8. `/dashboard/campaigns`
9. `/dashboard/analytics`
10. `/dashboard/topup`
11. `/dashboard/api-keys`
12. `/dashboard/docs` -> resolves to `/dashboard/api-docs`
13. `/dashboard/settings`

## Pass Summary

- After clean restart of the local Next dev server, all 13 dashboard routes loaded without reproducible `Internal Server Error`.
- `Noto Sans Thai` loaded correctly on all 13 dashboard routes.
- No literal `$` text remained in dashboard DOM content after clean restart.
- Shared currency UI recheck passed:
  - top-right dashboard credit badge uses `฿`
  - Topup current-credit icon uses `฿`
- Contact Tags UI works:
  - add contact succeeds
  - tag preset selection works
  - saved row renders tag chip
  - tag filter pill updates (`VIP (1)`)

## Bugs For Lead Dev

### 1. Login/register flow becomes unstable because the local Turbopack dev server corrupts itself

Severity: High
Routes:
- `/login`
- `/register`

Expected:
- auth pages should remain usable for the full QA session

Actual:
- later in the same QA session, `/login` and `/register` intermittently returned `Internal Server Error`
- active dev-server logs show Turbopack internal failures:
  - `Failed to write page endpoint /_app`
  - missing `app/(auth)/login/page/build-manifest.json`
  - missing `app/(auth)/register/page/build-manifest.json`

Why this matters:
- blocks real login-flow regression testing
- makes QA results nondeterministic across the same local run

Repro:
1. Start local `next dev`
2. Browse dashboard/auth routes for a while under Chrome automation
3. Re-open `/login` or `/register`
4. Observe intermittent `Internal Server Error` once Turbopack crashes

Evidence:
- active Next.js dev-server log during QA run
- repeated Chrome checks where auth pages alternated between `200` and `Internal Server Error`

### 2. Topup `ซื้อแพ็กเกจ` buttons are dead CTAs

Severity: High
Route: `/dashboard/topup`

Expected:
- clicking a package CTA should open payment flow, modal, confirmation, or navigate to the next step

Actual:
- clicking `ซื้อแพ็กเกจ` leaves URL unchanged
- no modal appears
- no visible state changes
- body content stays identical

Repro:
1. Login
2. Open `/dashboard/topup`
3. Click any `ซื้อแพ็กเกจ` button

Observed from Chrome regression run:
- before URL: `/dashboard/topup`
- after URL: `/dashboard/topup`
- no text/body change

### 3. Readability / contrast regression on changed dashboard pages

Severity: Medium
Routes:
- `/dashboard/templates`
- `/dashboard/campaigns`
- `/dashboard/analytics`

Expected:
- secondary content, empty-state copy, filters, and table/chart metadata should remain comfortably readable on the dark background

Actual:
- text and metadata are too dim on the dark surface
- empty states and secondary labels read noticeably weaker than the dashboard/settings baseline
- campaign table metadata and analytics chart/status labels feel under-contrasted

Impact:
- content looks visually unfinished
- usability drops for first-time users on empty or low-data states

Evidence:
- `/Users/lambogreny/oracles/qa/artifacts/smsok-regression-2026-03-09T16-31-27-841Z/05-templates.png`
- `/Users/lambogreny/oracles/qa/artifacts/smsok-regression-2026-03-09T16-31-27-841Z/08-campaigns.png`
- `/Users/lambogreny/oracles/qa/artifacts/smsok-regression-2026-03-09T16-31-27-841Z/09-analytics.png`

## Contact Tags Result

Status: Pass

Verified in Chrome:
- open Contacts
- create new contact
- add `VIP` tag
- save contact
- row renders correctly
- tag filter shows `VIP (1)`

Evidence:
- `/Users/lambogreny/oracles/qa/artifacts/contact-tags-proof-2026-03-09T16-35-49-732Z/contacts-tags-working.png`

## Login Flow Result

Status: Blocked by environment instability

What was verified:
- `/login` and `/register` both worked after clean server restart
- dashboard session creation worked multiple times earlier in the run

What failed later:
- auth pages intermittently degraded into `Internal Server Error`
- this coincided with Turbopack panic output in the running dev server

Conclusion:
- login flow is not cleanly pass/fail at the app layer because the local server became unstable mid-run
- this should be treated as a blocker for reliable QA on auth flows until the dev-server issue is removed

## Evidence Index

Main regression screenshots:
- `/Users/lambogreny/oracles/qa/artifacts/smsok-regression-2026-03-09T16-31-27-841Z/01-dashboard.png`
- `/Users/lambogreny/oracles/qa/artifacts/smsok-regression-2026-03-09T16-31-27-841Z/02-send.png`
- `/Users/lambogreny/oracles/qa/artifacts/smsok-regression-2026-03-09T16-31-27-841Z/03-messages.png`
- `/Users/lambogreny/oracles/qa/artifacts/smsok-regression-2026-03-09T16-31-27-841Z/04-otp.png`
- `/Users/lambogreny/oracles/qa/artifacts/smsok-regression-2026-03-09T16-31-27-841Z/05-templates.png`
- `/Users/lambogreny/oracles/qa/artifacts/smsok-regression-2026-03-09T16-31-27-841Z/06-contacts.png`
- `/Users/lambogreny/oracles/qa/artifacts/smsok-regression-2026-03-09T16-31-27-841Z/07-senders.png`
- `/Users/lambogreny/oracles/qa/artifacts/smsok-regression-2026-03-09T16-31-27-841Z/08-campaigns.png`
- `/Users/lambogreny/oracles/qa/artifacts/smsok-regression-2026-03-09T16-31-27-841Z/09-analytics.png`
- `/Users/lambogreny/oracles/qa/artifacts/smsok-regression-2026-03-09T16-31-27-841Z/10-topup.png`
- `/Users/lambogreny/oracles/qa/artifacts/smsok-regression-2026-03-09T16-31-27-841Z/11-api-keys.png`

Docs + settings:
- `/Users/lambogreny/oracles/qa/artifacts/docs-settings-2026-03-09T16-36-21-550Z/12-api-docs.png`
- `/Users/lambogreny/oracles/qa/artifacts/docs-settings-2026-03-09T16-36-21-550Z/13-settings.png`

## Notes

- Recheck completed: no literal `$` remained in the 13 dashboard page DOM after clean restart.
- Currency icon false positive corrected: [DashboardShell.tsx](/Users/lambogreny/oracles/smsok-clone/app/(dashboard)/dashboard/DashboardShell.tsx#L301) and [TopupContent.tsx](/Users/lambogreny/oracles/smsok-clone/app/(dashboard)/dashboard/topup/TopupContent.tsx#L48) both render `฿`, not `$`.
- `Topup` still fails on dead CTA behavior.
- `API Docs` redirect works after clean restart: `/dashboard/docs` resolves to `/dashboard/api-docs`.
- The local dev server later became unstable again due to Turbopack internal errors, so auth-page reliability remains a real QA blocker in the current environment.
