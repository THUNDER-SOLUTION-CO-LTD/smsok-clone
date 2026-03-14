# SMSOK Test Plan — Phase 1 + Phase 2 (77 Test Cases)
**Task**: #3183 | **Priority**: P0 | **Date**: 2026-03-14
**Standard**: Human ลองใช้แล้วเจอปัญหาแม้แต่จุดเดียว = ทีมล้มเหลว

---

## PHASE 1: Customer Side (smsok-clone, port 3000) — 44 Cases

### 1.1 Rejected Slip Flow Backend (10 cases)

| # | Test Case | Method | Endpoint | Expected | Status |
|---|-----------|--------|----------|----------|--------|
| P1-01 | อัพสลิปถูกต้อง → PAID + โควต้าเพิ่ม + 3 docs | POST | /api/orders/:id/slip | 200, status=VERIFYING→PAID | ✅ PASS |
| P1-02 | สลิปซ้ำ (DUPLICATE_SLIP) → REJECTED | POST | /api/orders/:id/slip | reject_reason=DUPLICATE_SLIP | ⬜ Need EasySlip |
| P1-03 | สลิปปลอม (INVALID_SLIP) → REJECTED | POST | /api/orders/:id/slip | reject_reason=INVALID_SLIP | ⬜ Need EasySlip |
| P1-04 | ยอดไม่ตรง (AMOUNT_MISMATCH) → REJECTED | POST | /api/orders/:id/slip | reject_reason + แสดงยอดจริง vs ต้องจ่าย | ⬜ Need EasySlip |
| P1-05 | สลิปหมดอายุ >48ชม (EXPIRED_SLIP) | POST | /api/orders/:id/slip | reject_reason=EXPIRED_SLIP | ⬜ Need EasySlip |
| P1-06 | บัญชีปลายทางผิด (WRONG_ACCOUNT) | POST | /api/orders/:id/slip | reject_reason=WRONG_ACCOUNT | ⬜ Need EasySlip |
| P1-07 | สลิปไม่ชัด (UNREADABLE_SLIP) | POST | /api/orders/:id/slip | reject_reason=UNREADABLE_SLIP | ⬜ Need EasySlip |
| P1-08 | อัพสลิปขณะ VERIFYING → 409 (Guard #1) | POST | /api/orders/:id/slip | 409 UPLOAD_LOCKED | ✅ PASS |
| P1-09 | สลิปเดียวกัน 2 orders → ตัวที่ 2 reject (Guard #2) | POST | /api/orders/:id/slip | 2nd order rejected | ⬜ Need EasySlip |
| P1-10 | Worker เจอ non-VERIFYING → skip (Guard #3) | Worker | slip-verify queue | Job skipped silently | ⬜ Need Worker |

### 1.2 Order Rejected UI (7 cases)

| # | Test Case | Type | Expected | Status |
|---|-----------|------|----------|--------|
| P1-11 | ทุก reject code แสดง banner สีแดง + ข้อความ | UI | destructive Alert visible | ✅ PASS (code exists) |
| P1-12 | ปุ่ม "อัพโหลดสลิปใหม่" navigate to upload | UI | Button → upload page | ✅ PASS |
| P1-13 | ปุ่ม "ยกเลิกคำสั่งซื้อ" → confirm → cancel | UI | Dialog → CANCELLED | ✅ PASS |
| P1-14 | attempt count แสดง n/5 ถูก | UI | Badge shows count | ✅ PASS (code exists) |
| P1-15 | attempt >= 5 → resubmit disabled | UI | Button disabled + Support msg | ⬜ Need 5 rejects |
| P1-16 | Timeline แสดง events ลำดับถูก + timestamp | UI | OrderTimeline component | ⬜ Need real data |
| P1-17 | Mobile responsive — banner+buttons ไม่แตก | UI | Stack vertically on mobile | ✅ PASS |

### 1.3 Resubmit Flow (5 cases)

| # | Test Case | Method | Endpoint | Expected | Status |
|---|-----------|--------|----------|----------|--------|
| P1-18 | REJECTED → resubmit → PENDING_PAYMENT → อัพสลิปใหม่ | PUT | /api/orders/:id/resubmit-slip | 200, status reset | ✅ PASS (endpoint exists) |
| P1-19 | Resubmit ครั้งที่ 5 → disabled + Support msg | PUT | /api/orders/:id/resubmit-slip | 403 MAX_ATTEMPTS | ⬜ Need 5 rejects |
| P1-20 | Resubmit → verify ผ่าน → PAID + โควต้า + docs | E2E | Full flow | ⬜ Need EasySlip |
| P1-21 | Resubmit → verify ไม่ผ่าน → REJECTED + count+1 | E2E | Full flow | ⬜ Need EasySlip |
| P1-22 | API reject ถ้า attempt >= 5 → 403 | API | /api/orders/:id/resubmit-slip | 403 error | ⬜ Need 5 rejects |

### 1.4 Order History Redesign (7 cases)

| # | Test Case | Type | Expected | Status |
|---|-----------|------|----------|--------|
| P1-23 | แสดงรายการ orders ทั้งหมด | API/UI | GET /api/v1/orders returns all | ✅ PASS |
| P1-24 | Status badges สีถูก 5 statuses | UI | PENDING=yellow, VERIFYING=blue, PAID=green, REJECTED=red, CANCELLED=gray | ✅ PASS |
| P1-25 | Filter by status ทำงาน | API | ?status=REJECTED returns filtered | ✅ PASS |
| P1-26 | Filter by date range ทำงาน | API | ?from=&to= returns filtered | ✅ PASS |
| P1-27 | กดเข้า Order detail แสดงข้อมูลครบ | API/UI | GET /api/v1/orders/:id returns all fields | ✅ PASS |
| P1-28 | REJECTED ไม่ map เป็น CANCELLED | API | status serializer correct | ✅ PASS |
| P1-29 | Empty state เมื่อไม่มี orders | UI | "ยังไม่มีคำสั่งซื้อ" message | ⬜ Need new user |

### 1.5 Anti-Fraud Guards (4 cases)

| # | Test Case | Method | Expected | Status |
|---|-----------|--------|----------|--------|
| P1-30 | Upload lock — slip ขณะ VERIFYING → 409 | POST /api/orders/:id/slip | 409 error | ✅ PASS |
| P1-31 | transRef unique — สลิปเดียว 2 orders | Worker | 2nd rejected DUPLICATE | ⬜ Need EasySlip |
| P1-32 | Stale job fencing — status changed → skip | Worker | Job skipped | ⬜ Need Worker |
| P1-33 | Concurrent test — ไม่ได้โควต้า 2 ครั้ง | Worker | Only 1 quota added | ⬜ Need Worker |

### 1.6 Document Generation (6 cases)

| # | Test Case | Method | Expected | Status |
|---|-----------|--------|----------|--------|
| P1-34 | PAID → Invoice + Tax Invoice + Receipt 3 ใบ | GET /api/v1/orders/:id/documents/* | 200 + PDF content | ✅ PASS |
| P1-35 | REJECTED → ไม่มีเอกสารออก | GET /api/v1/orders/:id/documents/receipt | 400 | ✅ PASS |
| P1-36 | PDF URL เป็น R2 ไม่ใช่ localhost | API | R2_PUBLIC_URL in URLs | ✅ PASS |
| P1-37 | ใบกำกับภาษีครบ 8 ข้อ (สรรพากร) | PDF | Full tax invoice content | ⬜ Need PDF content check |
| P1-38 | INDIVIDUAL → ชื่อ/เลข 13 หลัก ถูก | API | Tax profile correct | ✅ PASS |
| P1-39 | COMPANY → ชื่อบริษัท/เลขภาษี ถูก | API | Tax profile correct | ✅ PASS |

### 1.X Additional Security (5 cases)

| # | Test Case | Method | Expected | Status |
|---|-----------|--------|----------|--------|
| P1-40 | No auth → 401 | GET /api/v1/orders | 401 | ✅ PASS |
| P1-41 | IDOR — access other user's order → 404 | GET /api/v1/orders/:id | 404 | ✅ PASS |
| P1-42 | XSS in order fields stripped | POST /api/v1/orders | No <script> in response | ✅ PASS |
| P1-43 | Purchase API disabled (410 Gone) | POST /api/v1/packages/purchase | 410 | ✅ PASS |
| P1-44 | Block direct paid status | PATCH /api/orders/:id/status | 403 | ✅ PASS |

---

## PHASE 2A: Admin Backoffice (smsok-backoffice, port 3001) — 28 Cases

### 2.1 Project Setup (4 cases)

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| P2-01 | npm run dev → app at :3001 | 200 on localhost:3001 | ⬜ NOT STARTED |
| P2-02 | Prisma client connect shared DB | DB queries work | ⬜ NOT STARTED |
| P2-03 | shadcn/ui components render | Components visible | ⬜ NOT STARTED |
| P2-04 | Nansen DNA colors correct | bg=#0b1118, primary=#00E2B5 | ⬜ NOT STARTED |

### 2.2 Admin Auth (6 cases)

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| P2-05 | Login correct email+password → dashboard | 200 + JWT + redirect | ⬜ NOT STARTED |
| P2-06 | Login wrong password → error | 401 error message | ⬜ NOT STARTED |
| P2-07 | Login nonexistent email → error | 401 error message | ⬜ NOT STARTED |
| P2-08 | Access /admin/dashboard without login → redirect | 302 → /admin/login | ⬜ NOT STARTED |
| P2-09 | Logout → cookie cleared → can't access | Cookie removed | ⬜ NOT STARTED |
| P2-10 | JWT expire → redirect to login | Auto-redirect | ⬜ NOT STARTED |

### 2.3 Admin Layout (8 cases)

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| P2-11 | Sidebar 4 nav items correct | Dashboard, Orders, Customers, Audit | ⬜ NOT STARTED |
| P2-12 | Click nav → navigate correct page | URL changes | ⬜ NOT STARTED |
| P2-13 | Active state highlight correct page | Primary color bg | ⬜ NOT STARTED |
| P2-14 | Collapse/expand sidebar | 240px ↔ 64px | ⬜ NOT STARTED |
| P2-15 | Topbar shows admin name + role | Badge visible | ⬜ NOT STARTED |
| P2-16 | Logout button works | Session cleared | ⬜ NOT STARTED |
| P2-17 | Mobile sidebar collapse + hamburger | Responsive works | ⬜ NOT STARTED |
| P2-18 | Nansen DNA colors exact match | Verified with inspector | ⬜ NOT STARTED |

### 2.4 Admin Dashboard (3 cases)

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| P2-19 | KPI numbers match DB | Manual verify against SQL | ⬜ NOT STARTED |
| P2-20 | Recent orders shows 5 latest | Sorted by created_at DESC | ⬜ NOT STARTED |
| P2-21 | Revenue chart 7 days correct | Bar chart with ฿ format | ⬜ NOT STARTED |

### 2.5 Order Management Admin (4 cases)

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| P2-22 | List orders + pagination + filter | DataTable works | ⬜ NOT STARTED |
| P2-23 | Approve → PAID → quota + docs + audit | Full flow | ⬜ NOT STARTED |
| P2-24 | Reject → REJECTED → customer sees reason | Full flow | ⬜ NOT STARTED |
| P2-25 | Viewer role → no approve/reject buttons | RBAC enforced | ⬜ NOT STARTED |

### 2.6+2.7 Customer Mgmt + Audit Log (3 cases)

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| P2-26 | Customer list + search + detail | DataTable works | ⬜ NOT STARTED |
| P2-27 | Block/unblock customer + audit log | Status change + logged | ⬜ NOT STARTED |
| P2-28 | Audit log filters + CSV export | Download CSV works | ⬜ NOT STARTED |

---

## PHASE 3: Cross-System E2E — 5 Cases

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| E2E-1 | Customer order → Admin sees | Create order → Check admin list | Order in admin list, PENDING | ⬜ Need admin app |
| E2E-2 | Customer slip → Admin approve | Upload slip → Admin approve | PAID + quota + audit log | ⬜ Need admin app |
| E2E-3 | Admin reject → Customer sees | Admin reject + reason → Customer check | RejectedBanner + reason + resubmit | ⬜ Need admin app |
| E2E-4 | Customer resubmit → Admin sees attempt | Resubmit + upload → Admin check | attempt_count matches both sides | ⬜ Need admin app |
| E2E-5 | Admin block → Customer blocked | Block customer → Customer tries order | Cannot create new order | ⬜ Need admin app |

---

## PHASE 2B: Sender Name Management — 8 Cases

| # | Test Case | Method | Expected | Status |
|---|-----------|--------|----------|--------|
| SN-01 | Customer ขอ Sender Name → status PENDING_REVIEW | POST /api/admin/sender-names | 201, status=PENDING_REVIEW | ⬜ NOT STARTED |
| SN-02 | Admin approve → status ACTIVE | PUT /api/admin/sender-names/:id | status=ACTIVE | ⬜ NOT STARTED |
| SN-03 | Admin reject + reason → REJECTED visible | PUT /api/admin/sender-names/:id | status=REJECTED + reason | ⬜ NOT STARTED |
| SN-04 | Admin suspend → status SUSPENDED | PUT /api/admin/sender-names/:id | status=SUSPENDED | ⬜ NOT STARTED |
| SN-05 | Name < 3 chars → validation error | POST | 400 validation error | ⬜ NOT STARTED |
| SN-06 | Name > 11 chars → validation error | POST | 400 validation error | ⬜ NOT STARTED |
| SN-07 | Special chars → validation error | POST | 400 validation error | ⬜ NOT STARTED |
| SN-08 | Duplicate name per customer → 409 | POST | 409 duplicate error | ⬜ NOT STARTED |

---

## PHASE 2C: Admin Auth + RBAC — 9 Cases

| # | Test Case | Method | Expected | Status |
|---|-----------|--------|----------|--------|
| RBAC-01 | Login correct email+password → JWT + redirect | POST /api/auth/login | 200, cookie set, redirect / | ⬜ NOT STARTED |
| RBAC-02 | Login wrong password → 401 error | POST /api/auth/login | 401 | ⬜ NOT STARTED |
| RBAC-03 | Login nonexistent email → 401 | POST /api/auth/login | 401 | ⬜ NOT STARTED |
| RBAC-04 | No auth cookie → redirect /login | GET / | 302 → /login | ⬜ NOT STARTED |
| RBAC-05 | Logout → cookie cleared → redirect | POST /api/admin/logout | Cookie removed | ⬜ NOT STARTED |
| RBAC-06 | Wrong password 5x → rate limited | POST /api/auth/login | 429 | ⬜ NOT STARTED |
| RBAC-07 | Super Admin → all pages accessible | Navigation check | All sidebar items accessible | ⬜ NOT STARTED |
| RBAC-08 | Viewer role → read-only (no approve/reject) | UI check | Buttons disabled/hidden | ⬜ NOT STARTED |
| RBAC-09 | Session timeout → auto redirect to login | Wait + navigate | Redirect to /login | ⬜ NOT STARTED |

---

## PHASE 2D: Audit Log — 6 Cases

| # | Test Case | Method | Expected | Status |
|---|-----------|--------|----------|--------|
| AL-01 | Every admin CRUD → logged | GET /api/admin/audit-logs | New entry per action | ⬜ NOT STARTED |
| AL-02 | Diff shows old→new correctly | UI expand | Formatted diff visible | ⬜ NOT STARTED |
| AL-03 | Filter by user works | GET ?user= | Filtered correctly | ⬜ NOT STARTED |
| AL-04 | Filter by action type works | GET ?action= | Filtered correctly | ⬜ NOT STARTED |
| AL-05 | Filter by date range works | GET ?from=&to= | Filtered correctly | ⬜ NOT STARTED |
| AL-06 | Export CSV → data matches | GET /api/admin/audit-logs/export | CSV download with all fields | ⬜ NOT STARTED |

---

## Summary

| Phase | Total | ✅ Pass | ⬜ Blocked | Blocker |
|-------|-------|---------|-----------|---------|
| Phase 1 (Customer) | 44 | 28 | 16 | EasySlip API / Worker / New user |
| Phase 2A (Admin) | 28 | 0 | 28 | Need deploy + manual test |
| Phase 2B (Sender Name) | 8 | 0 | 8 | Need deploy |
| Phase 2C (RBAC) | 9 | 0 | 9 | Need deploy |
| Phase 2D (Audit Log) | 6 | 0 | 6 | Need deploy |
| Phase 3 (Cross-system) | 5 | 0 | 5 | Need both apps |
| **TOTAL** | **100** | **28** | **72** | |

### Status Update (2026-03-14):
- ✅ smsok-backoffice is FULLY BUILT: Dashboard, Users, Transactions, SMS, Senders, Revenue, Campaigns, Audit Logs, Settings, Support, Login page
- ✅ Auth middleware deployed — redirects unauthenticated to /login
- ✅ 10+ sidebar nav items (Revenue + Senders added)
- ⬜ Phase 2 tests need backoffice deployed to server for manual/E2E testing

### Blockers for Remaining 72 Cases:
1. **EasySlip API** (12 cases): P1-02~07, P1-09, P1-20~21, P1-31 — Need real/mock EasySlip for reject code testing
2. **Worker testing** (3 cases): P1-10, P1-32~33 — Need BullMQ worker with test jobs
3. **Max attempts** (3 cases): P1-15, P1-19, P1-22 — Need 5 consecutive rejects
4. **Admin backoffice deploy** (51 cases): P2-01~28, SN-01~08, RBAC-01~09, AL-01~06 — Need backoffice deployed
5. **Cross-system** (5 cases): E2E-1~5 — Need both apps running on server

### What Can Be Done NOW:
- ✅ 28/44 Phase 1 tests already passing (code-level verification)
- ⬜ Run backoffice locally (port 3001) to verify Phase 2A/2B/2C/2D
- ⬜ Write Playwright E2E scripts for admin flows
- ⬜ Seed test data for max-attempt and duplicate-slip scenarios
