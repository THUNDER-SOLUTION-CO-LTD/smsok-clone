// ── Bank Account Configuration ──

export const BANK_ACCOUNT = {
  bankName:
    process.env.NEXT_PUBLIC_BANK_NAME ?? "ไทยพาณิชย์ (SCB)",
  bankColor: process.env.NEXT_PUBLIC_BANK_COLOR ?? "#4E2A84",
  accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "นายภูมิชนะ อุดแก้ว",
  accountNumber:
    process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? "407-824-0476",
};
