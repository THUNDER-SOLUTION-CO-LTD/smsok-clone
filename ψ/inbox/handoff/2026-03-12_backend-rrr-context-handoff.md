# Backend RRR Handoff — 2026-03-12

## Why This Exists
- Context low (`~24%`) and Oracle MCP is down (`Transport closed`).
- No task was completed in this session.
- No `mark done` was sent because nothing reached done state and task queue was unavailable.

## Current Repo State
- Repo: `/Users/lambogreny/oracles/smsok-clone`
- Worktree is already dirty from prior work by others.
- I did **not** land any new code in this session.
- An `apply_patch` edit was prepared once, but it was aborted before writing files.

## Inbox Status
- Oracle `oracle_task_list` and `oracle_inbox` both failed with `Transport closed`.
- Local inbox still only contains:
  - `ψ/inbox/handoff/2026-03-10_lead-dev-handoff.md`

## Task Status Summary

### Not Done

#### `#1622 Order Billing Rebuild`
- Started analysis only, then paused due higher-priority interrupt.
- Confirmed frontend is waiting on backend order document endpoints:
  - `GET /api/v1/orders/[id]/quotation`
  - `GET /api/v1/orders/[id]/invoice`
- Evidence found in:
  - `app/(dashboard)/dashboard/billing/orders/[id]/page.tsx`
  - `app/(dashboard)/dashboard/billing/orders/page.tsx`
- Existing backend pieces already present:
  - `app/api/v1/orders/route.ts`
  - `app/api/v1/orders/[id]/route.ts`
  - `app/api/v1/orders/[id]/upload/route.ts`
  - `lib/orders/service.ts`
  - `lib/orders/numbering.ts`
  - PDF templates in `lib/accounting/pdf/*`
- Intended implementation direction:
  - Reuse `payments` pattern: JSON metadata by default, PDF when `?download=1` or `Accept: application/pdf`
  - Add order-specific document helper + 2 routes for quotation/invoice
- No code written yet.

#### `#1679 Security userId trust + disable-2fa`
- This became the active task after the interrupt.
- Analysis is complete enough to restart quickly, but **fixes are not implemented yet**.

##### Findings
- Missing dev route required by E2E:
  - `tests/e2e/global-setup.ts` calls `POST /api/dev/disable-2fa`
  - route does not exist
- High-risk `userId` trust pattern exists in server actions imported by client components.
  - Client components pass `userId` prop into `"use server"` actions.
  - If not rebound to session server-side, this trusts client-supplied identity.

##### Concrete auth/account-adjacent examples to fix first
- `lib/actions.ts`
  - `changePasswordForced(userId, newPassword)`
  - used by `app/(dashboard)/dashboard/settings/ForceChangeModal.tsx`
- `lib/actions/settings.ts`
  - `updateProfile`
  - `changePassword`
  - `getProfile`
  - `getWorkspaceSettings`
  - `updateWorkspaceSettings`
  - `getNotificationPrefs`
  - `updateNotificationPrefs`
- `lib/actions/sender-names.ts`
  - `requestSenderName`
  - `getSenderNames`
  - `getApprovedSenderNames`

##### Additional mixed-mode actions found with same pattern
- `lib/actions/custom-fields.ts`
- `lib/actions/contacts.ts`
- `lib/actions/sms.ts`
- `lib/actions/campaigns.ts`
- `lib/actions/groups.ts`
- `lib/actions/templates.ts`
- `lib/actions/tags.ts`
- `lib/actions/excel-import.ts`

##### Proposed fix shape
- Add a shared helper like `resolveActionUserId(explicitUserId?)`
- Rule:
  - if session exists: require `explicitUserId` to match session user, then use session user
  - if no session exists: allow explicit user only for API-route / API-key flows
  - otherwise reject `Unauthorized`
- Then apply helper to the mixed-mode server actions above
- Add `app/api/dev/disable-2fa/route.ts`
  - dev-only
  - gated by `E2E_DEV_SECRET` or `DEV_SECRET`
  - accept `challengeToken`
  - extract `userId` from signed token instead of trusting request body `userId`
  - clear/delete `twoFactorAuth` row

##### Secondary issue found
- `app/api/v1/consent/logs/route.ts`
  - accepts `userId` filter from query
  - only uses `authenticateRequest(req)`
  - comment says admin list
  - likely needs admin guard or explicit access rule
- `app/api/v1/audit-logs/*` also accepts `userId`, but those are already behind `authenticateAdmin`, so lower concern

#### `#1683 QA: login mechanism`
- Not sent through task queue, but answer is ready:

`Login mechanism summary`
- Frontend login page uses `fetch("/api/auth/login")`
- Backend route: `app/api/auth/login/route.ts`
- Credentials checked there with rate limit first
- If password valid and 2FA is disabled:
  - route calls `setSession(user.id, { headers: req.headers })`
  - this writes `session` + `refresh_token` httpOnly cookies
  - response includes `redirectTo`
- If 2FA is enabled:
  - route does **not** set session yet
  - it returns short-lived `challengeToken` JWT with `purpose: "2fa-challenge"`
  - frontend redirects to `/2fa?token=...`
  - then either:
    - `POST /api/auth/2fa/verify`
    - or `POST /api/auth/2fa/recovery`
  - only after that does backend call `setSession(...)`
- Session stack now is access+refresh cookies with:
  - `app/api/auth/verify-session/route.ts`
  - `app/api/auth/me/route.ts`
  - `app/api/auth/refresh/route.ts`
  - all backed by `lib/auth.ts`

## Recommended Restart Order
1. Re-open `#1679`
2. Implement `resolveActionUserId()` helper
3. Patch auth/account-adjacent server actions first
4. Add `/api/dev/disable-2fa`
5. Run targeted checks for 2FA/login/E2E bootstrap
6. Only after `#1679` is closed, resume `#1622`

## Do Not Assume
- Do not assume any code from this session was applied. It was not.
- Do not mark `#1622` or `#1679` done from this handoff.

