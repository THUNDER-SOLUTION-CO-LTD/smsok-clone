# SMSOK Clone — Design Spec (Web3 Style)
> designed by UXUI Oracle | 2026-03-09

---

## 1. Design Direction

**Style**: Web3 Dark Neon
**Mood**: Professional SMS platform meets crypto dashboard aesthetic
**Core**: Dark base (#060A14), glassmorphism cards, sky blue neon accents (#38BDF8), subtle motion

---

## 2. Design Tokens

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#06060C` | Page background |
| `--bg-surface` | `rgba(255,255,255,0.03)` | Card/panel surface |
| `--bg-surface-hover` | `rgba(255,255,255,0.06)` | Hover states |
| `--bg-elevated` | `rgba(255,255,255,0.08)` | Dropdowns, modals |
| `--border-subtle` | `rgba(139,92,246,0.12)` | Card borders |
| `--border-focus` | `rgba(139,92,246,0.4)` | Focus rings |
| `--text-primary` | `#E4E4E7` | Main text |
| `--text-secondary` | `rgba(228,228,231,0.5)` | Labels, hints |
| `--text-muted` | `rgba(228,228,231,0.25)` | Disabled, meta |
| `--accent-purple` | `#8B5CF6` | Primary accent |
| `--accent-purple-glow` | `rgba(139,92,246,0.4)` | Glow effects |
| `--accent-pink` | `#EC4899` | Secondary accent |
| `--success` | `#10B981` | Delivered, Approved |
| `--warning` | `#F59E0B` | Pending, Queued |
| `--error` | `#EF4444` | Failed, Rejected |
| `--info` | `#3B82F6` | Sending, Info |

### Typography

| Element | Font | Weight | Size | Tracking |
|---------|------|--------|------|----------|
| Page title | Inter | 700 | 24px | -0.02em |
| Section title | Inter | 600 | 18px | -0.01em |
| Card title | Inter | 600 | 14px | 0 |
| Body | Inter | 400 | 14px | 0 |
| Label | Inter | 500 | 12px | 0.05em |
| Caption | Inter | 400 | 11px | 0.02em |
| Mono/data | JetBrains Mono | 400 | 13px | 0 |
| Badge | Inter | 600 | 10px | 0.1em |

### Spacing

| Token | Value |
|-------|-------|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--space-2xl` | 48px |
| `--radius-sm` | 8px |
| `--radius-md` | 12px |
| `--radius-lg` | 16px |
| `--radius-xl` | 24px |

---

## 3. Core Components

### Glass Card
```
┌─────────────────────────────────┐
│  background: rgba(255,255,255,  │
│    0.03)                        │
│  backdrop-filter: blur(24px)    │
│  border: 1px solid rgba(139,    │
│    92,246,0.12)                  │
│  border-radius: 16px            │
│  gradient-border on hover       │
└─────────────────────────────────┘
```

### Button Variants

**Primary (Purple Glow)**
```
┌──────────────────┐
│  Send SMS  →     │  bg: linear-gradient(135deg, #8B5CF6, #7C3AED)
└──────────────────┘  shadow: 0 0 20px rgba(139,92,246,0.3)
                      hover: translateY(-1px), stronger glow
                      active: scale(0.98)
```

**Secondary (Glass)**
```
┌──────────────────┐
│    Cancel        │  bg: rgba(255,255,255,0.04)
└──────────────────┘  border: 1px solid rgba(255,255,255,0.08)
                      hover: bg rgba(255,255,255,0.08)
```

**Danger (Red Glow)**
```
┌──────────────────┐
│    Delete        │  bg: rgba(239,68,68,0.1)
└──────────────────┘  border: 1px solid rgba(239,68,68,0.2)
                      text: #EF4444
```

### Input Field
```
┌─ Phone Number ──────────────────┐
│  +66 812345678                  │
└─────────────────────────────────┘
  bg: rgba(255,255,255,0.03)
  border: 1px solid rgba(255,255,255,0.08)
  focus: border-color var(--accent-purple)
         box-shadow: 0 0 0 3px rgba(139,92,246,0.15)
  label: text-[12px] text-white/50 uppercase tracking-wider
  placeholder: text-white/20
```

### Status Badge
```
  ┌──────────┐
  │ DELIVERED│  Success: bg rgba(16,185,129,0.1) text #10B981
  └──────────┘
  ┌──────────┐
  │  QUEUED  │  Warning: bg rgba(245,158,11,0.1) text #F59E0B
  └──────────┘
  ┌──────────┐
  │  FAILED  │  Error: bg rgba(239,68,68,0.1) text #EF4444
  └──────────┘
  font: 10px, weight 600, tracking 0.1em, uppercase
  padding: 4px 10px, border-radius: 6px
```

### Stat Card (Dashboard)
```
┌─────────────────────────┐
│ ↑ Messages Sent         │  label: 11px, text-white/40
│                         │
│  12,847                 │  value: 28px, font-bold, neon glow
│  +23.5% vs last week   │  delta: 11px, text-green-400
│  ▁▂▃▅▇▅▃▄▆▇            │  sparkline: 20px tall, purple bars
└─────────────────────────┘
  glass card with breathe animation on hover
```

### Table Row
```
┌────────────┬─────────────┬──────────┬───────────┬────────┐
│ To         │ Message     │ Sender   │ Status    │ Cost   │
├────────────┼─────────────┼──────────┼───────────┼────────┤
│ 081-xxx-xx │ Your OTP is │ SMSOK    │ DELIVERED │ 0.50 ฿ │
│ 092-xxx-xx │ Verify code │ MyApp    │ QUEUED    │ 0.50 ฿ │
└────────────┴─────────────┴──────────┴───────────┴────────┘
  row-hover: bg rgba(139,92,246,0.04)
  border-bottom: 1px solid rgba(255,255,255,0.04)
  font: JetBrains Mono for phone/cost, Inter for text
```

### Sidebar Nav Item
```
  ┌──────────────────────┐
  │  ◆  Dashboard        │  active: bg rgba(139,92,246,0.08)
  └──────────────────────┘         border-left: 2px solid #8B5CF6
                                   text: #E4E4E7
  ┌──────────────────────┐
  │  ○  Messages         │  inactive: text-white/40
  └──────────────────────┘  hover: text-white/70, bg rgba(255,255,255,0.03)
```

---

## 4. Page Layouts

### 4A. Auth Pages (Login / Register)

**User Flow**: Landing → Login/Register → Verify Email → Dashboard

```
┌─────────────────────────────────────────────────────────┐
│                    (gradient bg mesh)                    │
│                                                         │
│        ┌──────────────────────────────────┐              │
│        │  ◆ SMSOK                        │              │
│        │  ─────────────────────          │              │
│        │                                 │              │
│        │  Welcome back                   │              │
│        │  Sign in to your account        │              │
│        │                                 │              │
│        │  ┌─ Email ───────────────────┐  │              │
│        │  │  you@example.com         │  │              │
│        │  └──────────────────────────┘  │              │
│        │                                 │              │
│        │  ┌─ Password ───────────────┐  │              │
│        │  │  ••••••••     👁         │  │              │
│        │  └──────────────────────────┘  │              │
│        │                                 │              │
│        │  ┌──────────────────────────┐  │              │
│        │  │     Sign In    →         │  │  ← purple glow btn
│        │  └──────────────────────────┘  │              │
│        │                                 │              │
│        │  Don't have an account?         │              │
│        │  Register →                     │              │
│        │                                 │              │
│        │  ── or continue with ──         │              │
│        │  [Google]  [GitHub]             │              │
│        └──────────────────────────────────┘              │
│                                                         │
│     ┌─────────────────────────────────────┐             │
│     │ "Send 10,000+ SMS with one click"  │  ← glass    │
│     │  Trusted by 500+ businesses        │    testimonial│
│     └─────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

**Interactions**:
- Email/Password fields: focus → purple border glow
- Sign In button: hover → lift + stronger glow
- Error state: input border turns red, shake animation
- Success: fade out → redirect to dashboard
- Background: mesh gradient with floating particles

### 4B. Dashboard (Home)

**User Flow**: Login → Dashboard overview → Quick actions

```
┌─────────┬──────────────────────────────────────────────────┐
│         │  Dashboard                          ▼ profile    │
│  ◆ SMSOK│──────────────────────────────────────────────────│
│         │                                                  │
│  ◆ Dash │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐│
│  ○ Send │  │ Credits  │ │ Sent     │ │ Delivered│ │ Fail ││
│  ○ Msgs │  │ 5,240 ฿  │ │ 12,847  │ │ 12,612  │ │  235 ││
│  ○ Camp │  │ +1,000   │ │ +23.5%  │ │ 98.2%   │ │ 1.8% ││
│  ○ Book │  │ ▁▂▃▅     │ │ ▁▂▃▅▇  │ │ ▅▇▇▇   │ │ ▁▁▁  ││
│  ──────│  └─────────┘ └──────────┘ └──────────┘ └──────┘│
│  ○ Send │                                                  │
│    Names│  ┌──────────────────────────────────────────────┐│
│  ○ Topup│  │  Quick Send                                 ││
│  ○ Keys │  │  ┌─ To ──────────┐ ┌─ Message ───────────┐ ││
│  ──────│  │  │ +66           │ │ Your OTP is {code}  │ ││
│  ○ Sett │  │  └───────────────┘ └─────────────────────┘ ││
│         │  │                     [Send SMS →]            ││
│         │  └──────────────────────────────────────────────┘│
│         │                                                  │
│         │  ┌──────────────────────────────────────────────┐│
│         │  │  Recent Messages                    View All ││
│         │  │  ┌────────┬──────────┬────────┬──────────┐  ││
│         │  │  │ To     │ Body     │ Status │ Time     │  ││
│         │  │  ├────────┼──────────┼────────┼──────────┤  ││
│         │  │  │ 081-xx │ OTP: 42..│DELIVERED│ 2m ago  │  ││
│         │  │  │ 092-xx │ Hello... │ SENT   │ 5m ago   │  ││
│         │  │  │ 083-xx │ Verify...│ FAILED │ 12m ago  │  ││
│         │  │  └────────┴──────────┴────────┴──────────┘  ││
│         │  └──────────────────────────────────────────────┘│
│─────────│──────────────────────────────────────────────────│
│ v1.0    │  © SMSOK Clone — designed by uxui               │
└─────────┴──────────────────────────────────────────────────┘
```

**Sidebar**:
- Width: 240px, glass background
- Logo: gradient text "SMSOK" with diamond icon
- Sections: Main / Management / Settings
- Collapse to icons on mobile (< 768px)

**Stat Cards**:
- 4 columns on desktop, 2 on tablet, 1 on mobile
- Each has: icon, label, value (large neon), delta, sparkline
- Breathe animation on hover
- Credits card has gradient purple border (emphasize balance)

### 4C. Send SMS Page

```
┌─────────┬──────────────────────────────────────────────────┐
│ Sidebar │  Send SMS                                        │
│         │──────────────────────────────────────────────────│
│         │                                                  │
│         │  ┌──────────────────────┬────────────────────── ┐│
│         │  │                      │                       ││
│         │  │  Compose             │  Preview              ││
│         │  │                      │                       ││
│         │  │  ┌─ Sender Name ──┐  │  ┌────────────────┐  ││
│         │  │  │ SMSOK       ▼  │  │  │ From: SMSOK    │  ││
│         │  │  └────────────────┘  │  │                │  ││
│         │  │                      │  │ Your OTP code  │  ││
│         │  │  ┌─ Recipients ───┐  │  │ is: 482910     │  ││
│         │  │  │ +66812345678   │  │  │                │  ││
│         │  │  │ +66923456789   │  │  │ Do not share   │  ││
│         │  │  │ [+ Add more]   │  │  │ this code.     │  ││
│         │  │  └────────────────┘  │  │                │  ││
│         │  │  or [Import CSV]     │  │  ── 95 chars   │  ││
│         │  │  or [From Contacts]  │  │  ── 1 SMS part │  ││
│         │  │                      │  └────────────────┘  ││
│         │  │  ┌─ Message ──────┐  │                       ││
│         │  │  │ Your OTP code  │  │  Cost: 1.00 ฿        ││
│         │  │  │ is: {code}     │  │  Recipients: 2       ││
│         │  │  │                │  │  Total: 2.00 ฿       ││
│         │  │  │ Do not share   │  │                       ││
│         │  │  │ this code.     │  │  ┌────────────────┐  ││
│         │  │  └────────────────┘  │  │  Send Now  →   │  ││
│         │  │  95/160 chars        │  └────────────────┘  ││
│         │  │                      │  ┌────────────────┐  ││
│         │  │  ☐ Schedule send     │  │  Schedule       │  ││
│         │  │                      │  └────────────────┘  ││
│         │  └──────────────────────┴───────────────────────┘│
└─────────┴──────────────────────────────────────────────────┘
```

**Interactions**:
- Recipients: tag input — each number becomes a pill with ✕
- Message: live character count, SMS parts indicator
- Preview: real-time render of the SMS as phone mockup
- Send button: confirmation modal → loading → success toast
- Schedule: datetime picker with purple accent

### 4D. Messages History Page

```
┌─────────┬──────────────────────────────────────────────────┐
│ Sidebar │  Messages                        [Send SMS →]    │
│         │──────────────────────────────────────────────────│
│         │                                                  │
│         │  ┌──────────────────────────────────────────────┐│
│         │  │  🔍 Search messages...    [All ▼] [Date ▼]  ││
│         │  └──────────────────────────────────────────────┘│
│         │                                                  │
│         │  ┌────┬──────────┬────────────┬────────┬──────┐ │
│         │  │ #  │ To       │ Body       │ Status │ Cost │ │
│         │  ├────┼──────────┼────────────┼────────┼──────┤ │
│         │  │ 1  │ 081-xxx  │ OTP: 4829  │🟢 DLVD│ 0.50 │ │
│         │  │ 2  │ 092-xxx  │ Hello fr...│🟡 SENT│ 0.50 │ │
│         │  │ 3  │ 083-xxx  │ Verify y...│🔴 FAIL│ 0.50 │ │
│         │  │ 4  │ 081-xxx  │ Your acc...│🟢 DLVD│ 0.50 │ │
│         │  │ 5  │ 095-xxx  │ Reset pa...│🟡 QUEU│ 0.50 │ │
│         │  └────┴──────────┴────────────┴────────┴──────┘ │
│         │                                                  │
│         │  ← 1 2 3 ... 24 →           Showing 1-20 of 470│
└─────────┴──────────────────────────────────────────────────┘
```

### 4E. Contacts Page

```
┌─────────┬──────────────────────────────────────────────────┐
│ Sidebar │  Contacts                    [+ Add] [Import]    │
│         │──────────────────────────────────────────────────│
│         │                                                  │
│         │  Groups: [All (342)] [VIP (28)] [Staff (15)]     │
│         │                                                  │
│         │  ┌────┬──────────┬──────────────┬────────┬─────┐│
│         │  │ ☐  │ Name     │ Phone        │ Group  │  ⋮  ││
│         │  ├────┼──────────┼──────────────┼────────┼─────┤│
│         │  │ ☐  │ สมชาย    │ 081-234-5678 │ VIP    │  ⋮  ││
│         │  │ ☐  │ มานี     │ 092-345-6789 │ Staff  │  ⋮  ││
│         │  └────┴──────────┴──────────────┴────────┴─────┘│
│         │                                                  │
│         │  Selected: 0  [Send SMS] [Delete]                │
└─────────┴──────────────────────────────────────────────────┘
```

### 4F. Campaigns Page

```
┌─────────┬──────────────────────────────────────────────────┐
│ Sidebar │  Campaigns                   [+ New Campaign]    │
│         │──────────────────────────────────────────────────│
│         │                                                  │
│         │  ┌──────────────────────────────────────────────┐│
│         │  │  🎯 March Promo              COMPLETED       ││
│         │  │  Sent: 2,500 | Cost: 1,250 ฿ | 98% delivered││
│         │  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░             ││
│         │  └──────────────────────────────────────────────┘│
│         │  ┌──────────────────────────────────────────────┐│
│         │  │  🕐 Easter Sale              SCHEDULED       ││
│         │  │  Recipients: 1,800 | Est: 900 ฿             ││
│         │  │  Scheduled: 2026-04-01 09:00                ││
│         │  └──────────────────────────────────────────────┘│
│         │  ┌──────────────────────────────────────────────┐│
│         │  │  ✏️  Welcome Message          DRAFT           ││
│         │  │  Recipients: 0 | Body: "Welcome to..."      ││
│         │  │  [Edit] [Delete]                             ││
│         │  └──────────────────────────────────────────────┘│
└─────────┴──────────────────────────────────────────────────┘
```

### 4G. Top Up / Billing Page

```
┌─────────┬──────────────────────────────────────────────────┐
│ Sidebar │  Billing & Credits                               │
│         │──────────────────────────────────────────────────│
│         │                                                  │
│         │  ┌─────────────────────────────────┐             │
│         │  │  Current Balance                │             │
│         │  │                                 │             │
│         │  │  ฿ 5,240.00                     │  ← big neon │
│         │  │  ≈ 10,480 SMS remaining         │             │
│         │  │                                 │             │
│         │  │  [Top Up →]                     │             │
│         │  └─────────────────────────────────┘             │
│         │                                                  │
│         │  Top Up Packages:                                │
│         │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│         │  │ 500 ฿  │ │ 1,000฿ │ │ 5,000฿ │ │ Custom │   │
│         │  │ 1K SMS │ │ 2K SMS │ │ 11K SMS│ │  ___   │   │
│         │  │        │ │ POPULAR│ │ BEST   │ │        │   │
│         │  └────────┘ └────────┘ └────────┘ └────────┘   │
│         │                                                  │
│         │  Transaction History:                            │
│         │  ┌──────┬────────┬──────────┬──────────┬──────┐ │
│         │  │ Type │ Amount │ Credits  │ Status   │ Date │ │
│         │  ├──────┼────────┼──────────┼──────────┼──────┤ │
│         │  │TOPUP │ +1,000 │ +2,000   │COMPLETED │ 3/8  │ │
│         │  │USAGE │ -0.50  │ -1       │COMPLETED │ 3/8  │ │
│         │  │REFUND│ +0.50  │ +1       │COMPLETED │ 3/7  │ │
│         │  └──────┴────────┴──────────┴──────────┴──────┘ │
└─────────┴──────────────────────────────────────────────────┘
```

### 4H. API Keys Page

```
┌─────────┬──────────────────────────────────────────────────┐
│ Sidebar │  API Keys                    [+ Generate Key]    │
│         │──────────────────────────────────────────────────│
│         │                                                  │
│         │  ┌──────────────────────────────────────────────┐│
│         │  │  API Key                                     ││
│         │  │  sk_live_••••••••••••••••••••3f2a   [Copy]   ││
│         │  │  Created: 2026-03-01 | Last used: 2m ago     ││
│         │  │  [Regenerate] [Revoke]                       ││
│         │  └──────────────────────────────────────────────┘│
│         │                                                  │
│         │  Quick Start:                                    │
│         │  ┌──────────────────────────────────────────────┐│
│         │  │  curl -X POST https://api.smsok.com/v1/send ││
│         │  │    -H "Authorization: Bearer YOUR_API_KEY"   ││
│         │  │    -d '{"to":"+66..","body":"Hello"}'        ││
│         │  └──────────────────────────────────────────────┘│
│         │  font: JetBrains Mono, bg dark glass             │
└─────────┴──────────────────────────────────────────────────┘
```

---

## 5. Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | No sidebar, bottom nav, stacked cards |
| Tablet | 640-1024px | Collapsed sidebar (icons), 2-col grid |
| Desktop | > 1024px | Full sidebar, 4-col stat grid |

### Mobile Navigation (Bottom Bar)
```
┌──────────────────────────────────────┐
│                                      │
│           (page content)             │
│                                      │
├──────┬──────┬──────┬──────┬──────────┤
│ Home │ Send │  +   │ Msgs │ More     │
│  ◆   │  ✉   │  ●   │  ☰   │  ⋮      │
└──────┴──────┴──────┴──────┴──────────┘
  The "+" button: floating action, purple glow
  Active tab: purple icon + dot indicator
```

---

## 6. Animations & Micro-interactions

| Element | Animation | Duration |
|---------|-----------|----------|
| Card appear | fade-in + slide-up | 0.4s ease-out |
| Button hover | translateY(-1px) + glow | 0.2s |
| Button active | scale(0.98) | 0.1s |
| Status badge pulse | subtle opacity pulse | 2s infinite |
| Stat value count-up | number increment | 0.8s ease-out |
| Sidebar nav hover | bg fade in | 0.15s |
| Toast notification | slide-in from top-right | 0.3s |
| Modal open | fade + scale(0.95→1) | 0.2s |
| Skeleton loading | shimmer gradient sweep | 1.5s infinite |
| SMS sent success | ring burst + checkmark | 0.5s |

---

## 7. Empty States

### No Messages Yet
```
┌──────────────────────────────────┐
│                                  │
│         ✉ (large, dim)           │
│                                  │
│    No messages yet               │
│    Send your first SMS to get    │
│    started                       │
│                                  │
│    [Send SMS →]                  │
│                                  │
└──────────────────────────────────┘
```

### No Contacts
```
┌──────────────────────────────────┐
│                                  │
│         👥 (large, dim)          │
│                                  │
│    Your contact book is empty    │
│    Add contacts to send SMS      │
│    faster                        │
│                                  │
│    [+ Add Contact]  [Import CSV] │
│                                  │
└──────────────────────────────────┘
```

---

## 8. Accessibility

- [x] Keyboard navigable — all interactive elements focusable
- [x] Focus rings: 2px purple glow ring
- [x] Color contrast: AAA for text on dark backgrounds
- [x] Touch targets: min 44x44px on mobile
- [x] Screen reader: aria-labels on icon-only buttons
- [x] Status colors: always paired with text/icon (not color alone)
- [x] Motion: `prefers-reduced-motion` disables animations

---

## 9. Implementation Priority

| Phase | Pages | Priority |
|-------|-------|----------|
| P0 | Auth (Login/Register) | Must have |
| P0 | Dashboard (overview) | Must have |
| P1 | Send SMS | Must have |
| P1 | Messages History | Must have |
| P2 | Contacts | Should have |
| P2 | Top Up / Billing | Should have |
| P3 | Campaigns | Nice to have |
| P3 | API Keys | Nice to have |
| P3 | Sender Names | Nice to have |
| P3 | Settings | Nice to have |

---

## 10. Design System Components Needed

| Component | Variants |
|-----------|----------|
| Button | primary, secondary, danger, ghost, icon |
| Input | text, password, textarea, search |
| Select | single, with search |
| Badge | success, warning, error, info, neutral |
| Card | glass, stat, action |
| Table | sortable, selectable, with pagination |
| Modal | confirm, form, alert |
| Toast | success, error, info |
| Sidebar | expanded, collapsed |
| Tabs | underline, pill |
| Avatar | image, initials |
| Dropdown | menu, select |
| Skeleton | text, card, table row |
| Tag Input | for phone numbers |
| Pagination | numbered, simple |
| Tooltip | dark glass |
| Progress Bar | linear, with percentage |

---

*designed by uxui — ผู้ออกแบบประสบการณ์*
