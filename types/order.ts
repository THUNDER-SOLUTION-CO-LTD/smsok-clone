// ── Order-Based Billing Types ──
// Spec: SMSOK-ORDER-BASED-BILLING-SPEC-v1.md + Wireframes Spec #59

export type SlipRejectCode =
  | "DUPLICATE_SLIP"
  | "INVALID_SLIP"
  | "AMOUNT_MISMATCH"
  | "EXPIRED_SLIP"
  | "WRONG_ACCOUNT"
  | "UNREADABLE_SLIP";

export const REJECT_CODE_CONFIG: Record<
  SlipRejectCode,
  { label: string; description: string; action: string }
> = {
  DUPLICATE_SLIP: {
    label: "สลิปซ้ำ",
    description: "สลิปนี้ถูกใช้กับคำสั่งซื้ออื่นแล้ว กรุณาโอนเงินใหม่และแนบสลิปใหม่",
    action: "โอนเงินใหม่และแนบสลิปใหม่",
  },
  INVALID_SLIP: {
    label: "สลิปไม่ถูกต้อง",
    description: "ไม่สามารถยืนยันสลิปนี้ได้ กรุณาตรวจสอบว่าเป็นสลิปโอนเงินจริง",
    action: "แนบสลิปโอนเงินที่ถูกต้อง",
  },
  AMOUNT_MISMATCH: {
    label: "ยอดเงินไม่ตรง",
    description: "จำนวนเงินในสลิปไม่ตรงกับยอดที่ต้องชำระ กรุณาโอนเงินให้ครบจำนวน",
    action: "โอนเงินให้ตรงยอดและแนบสลิปใหม่",
  },
  EXPIRED_SLIP: {
    label: "สลิปหมดอายุ",
    description: "สลิปนี้เก่าเกินกว่า 48 ชั่วโมง กรุณาโอนเงินใหม่",
    action: "โอนเงินใหม่และแนบสลิปล่าสุด",
  },
  WRONG_ACCOUNT: {
    label: "บัญชีผิด",
    description: "เงินถูกโอนไปยังบัญชีอื่น กรุณาโอนเงินไปยังบัญชีที่กำหนด",
    action: "โอนเงินไปบัญชีที่ถูกต้อง",
  },
  UNREADABLE_SLIP: {
    label: "อ่านสลิปไม่ได้",
    description: "ภาพสลิปไม่ชัดเจนหรืออ่านข้อมูลไม่ได้ กรุณาถ่ายภาพใหม่ให้ชัด",
    action: "ถ่ายภาพสลิปใหม่ให้ชัดเจน",
  },
};

export const MAX_SLIP_ATTEMPTS = 5;

export type OrderStatus =
  | "PENDING"
  | "SLIP_UPLOADED"
  | "VERIFIED"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED"
  | "REJECTED";

export type CustomerType = "INDIVIDUAL" | "COMPANY";
export type BranchType = "HEAD" | "BRANCH";

export interface OrderStatusEvent {
  status: OrderStatus;
  timestamp: string | null;
}

export interface OrderDocument {
  type: "invoice" | "tax_invoice" | "receipt" | "credit_note";
  document_number: string;
  issued_at: string;
  url: string;
}

export interface Order {
  id: string;
  order_number: string;
  package_tier_id: string;
  package_name: string;
  sms_count: number;
  bonus_sms?: number;
  price_per_sms?: number;

  customer_type: CustomerType;
  tax_name: string;
  tax_id: string;
  tax_address: string;
  tax_branch_type: BranchType;
  tax_branch_number?: string;

  net_amount: number;
  vat_amount: number;
  total_amount: number;
  has_wht: boolean;
  wht_amount: number;
  pay_amount: number;

  status: OrderStatus;
  expires_at: string;

  quotation_number?: string;
  quotation_url?: string;
  invoice_number?: string;
  invoice_url?: string;
  tax_invoice_number?: string;
  tax_invoice_url?: string;
  receipt_number?: string;
  receipt_url?: string;

  documents?: OrderDocument[];
  timeline?: OrderStatusEvent[];
  latest_slip_uploaded_at?: string;
  latest_status_note?: string;

  slip_url?: string;
  wht_cert_url?: string;
  easyslip_verified?: boolean;

  reject_reason?: string;
  reject_code?: SlipRejectCode;
  reject_message?: string;
  rejected_at?: string;
  slip_attempt_count?: number;
  admin_note?: string;

  paid_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
}

export interface OrderCreatePayload {
  package_tier_id: string;
  customer_type: CustomerType;
  tax_name: string;
  tax_id: string;
  tax_address: string;
  tax_branch_type: BranchType;
  tax_branch_number?: string;
  has_wht: boolean;
  save_tax_profile: boolean;
}

export interface OrderStats {
  total: number;
  pending: number;
  completed: number;
  total_spent: number;
}

// ── Status Config ──

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bgColor: string; dot: string }
> = {
  PENDING: {
    label: "รอชำระ",
    color: "var(--warning)",
    bgColor: "rgba(245,158,11,0.1)",
    dot: "var(--warning)",
  },
  SLIP_UPLOADED: {
    label: "แนบสลิปแล้ว",
    color: "var(--info)",
    bgColor: "rgba(var(--info-rgb),0.1)",
    dot: "var(--info)",
  },
  VERIFIED: {
    label: "ตรวจสอบแล้ว",
    color: "var(--success)",
    bgColor: "var(--success-bg)",
    dot: "var(--success)",
  },
  PENDING_REVIEW: {
    label: "รอตรวจสอบ",
    color: "var(--warning)",
    bgColor: "rgba(245,158,11,0.1)",
    dot: "var(--warning)",
  },
  APPROVED: {
    label: "อนุมัติ",
    color: "var(--success)",
    bgColor: "var(--success-bg)",
    dot: "var(--success)",
  },
  COMPLETED: {
    label: "สำเร็จ",
    color: "var(--success)",
    bgColor: "var(--success-bg)",
    dot: "var(--success)",
  },
  EXPIRED: {
    label: "หมดอายุ",
    color: "var(--text-muted)",
    bgColor: "rgba(var(--text-muted-rgb),0.1)",
    dot: "var(--text-muted)",
  },
  CANCELLED: {
    label: "ยกเลิก",
    color: "var(--text-muted)",
    bgColor: "rgba(var(--text-muted-rgb),0.1)",
    dot: "var(--text-muted)",
  },
  REJECTED: {
    label: "ไม่ผ่าน",
    color: "var(--error)",
    bgColor: "var(--danger-bg)",
    dot: "var(--error)",
  },
};

// ── Bank Account ──
// Bank info is now fetched from GET /api/v1/payments/bank-accounts at runtime.
// See config/bank.ts for env-var fallback (used by other pages if needed).
export { BANK_ACCOUNT } from "@/config/bank";
