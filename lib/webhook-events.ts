/**
 * Canonical Webhook Event Registry
 * Single source of truth for all webhook events.
 * Used by: UI event selector, Zod validation, API docs, test event dropdown
 */

export type WebhookEventId =
  | "sms.sent"
  | "sms.delivered"
  | "sms.failed"
  | "sms.clicked"
  | "otp.verified"
  | "credit.low"
  | "credits.depleted"
  | "campaign.started"
  | "campaign.completed"
  | "campaign.failed"
  | "contact.opted_out"

export interface WebhookEventDef {
  id: WebhookEventId
  label: string
  description: string
  group: WebhookEventGroup
}

export interface WebhookEventRegistryItem {
  id: WebhookEventId
  event: WebhookEventId
  label: string
  description: string
  group: WebhookEventGroup
  category: string
  action: string
}

export type WebhookEventGroup = "sms" | "campaign" | "contact" | "billing" | "security"

export interface WebhookEventGroupDef {
  key: WebhookEventGroup
  label: string
  color: string
  bgColor: string
}

/* ─── Groups ─── */

export const WEBHOOK_EVENT_GROUPS: WebhookEventGroupDef[] = [
  { key: "sms", label: "SMS", color: "var(--info)", bgColor: "rgba(var(--info-rgb),0.12)" },
  { key: "campaign", label: "แคมเปญ", color: "#A855F7", bgColor: "rgba(168,85,247,0.12)" },
  { key: "contact", label: "ผู้ติดต่อ", color: "var(--success)", bgColor: "rgba(var(--success-rgb),0.12)" },
  { key: "billing", label: "เครดิต", color: "var(--warning)", bgColor: "rgba(var(--warning-rgb),0.12)" },
  { key: "security", label: "ความปลอดภัย", color: "var(--accent)", bgColor: "rgba(var(--accent-rgb),0.12)" },
]

/* ─── Events ─── */

export const WEBHOOK_EVENTS: WebhookEventDef[] = [
  // SMS
  { id: "sms.sent", label: "SMS ส่งแล้ว", description: "เมื่อ SMS ถูกส่งไปยัง provider", group: "sms" },
  { id: "sms.delivered", label: "SMS ส่งถึง", description: "เมื่อ SMS ถูกส่งถึงผู้รับสำเร็จ", group: "sms" },
  { id: "sms.failed", label: "SMS ส่งไม่สำเร็จ", description: "เมื่อ SMS ส่งไม่สำเร็จ", group: "sms" },
  { id: "sms.clicked", label: "SMS คลิกลิงก์", description: "เมื่อผู้รับคลิกลิงก์ใน SMS", group: "sms" },

  // Campaign
  { id: "campaign.started", label: "แคมเปญเริ่มส่ง", description: "เมื่อแคมเปญเริ่มส่ง SMS", group: "campaign" },
  { id: "campaign.completed", label: "แคมเปญเสร็จสิ้น", description: "เมื่อแคมเปญส่งครบทุกรายการ", group: "campaign" },
  { id: "campaign.failed", label: "แคมเปญล้มเหลว", description: "เมื่อแคมเปญล้มเหลว", group: "campaign" },

  // Contact
  { id: "contact.opted_out", label: "ยกเลิกสมัคร", description: "เมื่อผู้ติดต่อยกเลิกรับข้อความ", group: "contact" },

  // Billing
  { id: "credit.low", label: "เครดิตเหลือน้อย", description: "เมื่อเครดิตเหลือต่ำกว่าที่กำหนด", group: "billing" },
  { id: "credits.depleted", label: "เครดิตหมด", description: "เมื่อเครดิตหมด ไม่สามารถส่ง SMS ได้", group: "billing" },

  // Security
  { id: "otp.verified", label: "OTP ยืนยันแล้ว", description: "เมื่อผู้ใช้ยืนยัน OTP สำเร็จ", group: "security" },
]

/* ─── Helpers ─── */

export const ALL_EVENT_IDS = WEBHOOK_EVENTS.map((e) => e.id)

export const WEBHOOK_EVENT_REGISTRY: WebhookEventRegistryItem[] = WEBHOOK_EVENTS.map((event) => ({
  id: event.id,
  event: event.id,
  label: event.label,
  description: event.description,
  group: event.group,
  category: event.id.split(".")[0],
  action: event.id.split(".").slice(1).join("."),
}))

export function getEventsByGroup(group: WebhookEventGroup): WebhookEventDef[] {
  return WEBHOOK_EVENTS.filter((e) => e.group === group)
}

export function getEventDef(id: string): WebhookEventDef | undefined {
  return WEBHOOK_EVENTS.find((e) => e.id === id)
}

export function getGroupDef(key: string): WebhookEventGroupDef | undefined {
  return WEBHOOK_EVENT_GROUPS.find((g) => g.key === key)
}

/* ─── Presets ─── */

export const EVENT_PRESETS = [
  {
    key: "delivery",
    label: "Delivery events",
    description: "SMS ส่งถึง / ไม่สำเร็จ",
    events: ["sms.sent", "sms.delivered", "sms.failed"] as WebhookEventId[],
  },
  {
    key: "campaign",
    label: "Campaign lifecycle",
    description: "แคมเปญเริ่ม / เสร็จ / ล้มเหลว",
    events: ["campaign.started", "campaign.completed", "campaign.failed"] as WebhookEventId[],
  },
  {
    key: "compliance",
    label: "Compliance / opt-out",
    description: "ยกเลิกสมัคร + เครดิตหมด",
    events: ["contact.opted_out", "credits.depleted"] as WebhookEventId[],
  },
]
