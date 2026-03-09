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
- Contact Tags UI works:
  - add contact succeeds
  - tag preset selection works
  - saved row renders tag chip
  - tag filter pill updates (`VIP (1)`)

## Bugs For Lead Dev

### 1. Currency UI still shows dollar-sign icons in dashboard header and Topup

Severity: High
Routes:
- dashboard header credit badge (top-right, shared shell)
- `/dashboard/topup`

Expected:
- no `$` leftover anywhere in the dashboard experience

Actual:
- the shared top-right credit badge still shows a dollar-sign icon
- the current-credit card on Topup still uses a dollar-sign icon visually
- text values are `฿`, but iconography is still `$`

Why this matters:
- violates the explicit currency requirement
- creates mixed-currency visual language on the one page where currency clarity matters most

Repro:
1. Login
2. Look at the top-right credit badge in the dashboard shell
3. Open `/dashboard/topup`
4. Look at the current-credit card icon on the left side

Evidence:
- `/Users/lambogreny/oracles/qa/artifacts/smsok-regression-2026-03-09T16-31-27-841Z/01-dashboard.png`
- `/Users/lambogreny/oracles/qa/artifacts/smsok-regression-2026-03-09T16-31-27-841Z/10-topup.png`

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

- `Topup` passes the literal text check for `฿`; the remaining issue is the visual dollar-sign icon and dead CTA behavior.
- `API Docs` redirect works after clean restart: `/dashboard/docs` resolves to `/dashboard/api-docs`.
- The first localhost process became globally unstable and returned 500s; that issue did not reproduce after clean restart, so it is not logged as a stable product bug in this report.
