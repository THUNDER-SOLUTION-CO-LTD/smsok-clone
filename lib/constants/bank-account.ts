/**
 * ข้อมูลบัญชีรับเงินหลักของบริษัท
 * อัปเดตที่นี่จุดเดียว — ทุก component/API จะใช้ค่านี้
 */
export const COMPANY_BANK_ACCOUNT = {
  bank: "ไทยพาณิชย์ (SCB)",
  bankShort: "SCB",
  accountNumber: "407-824-0476",
  accountName: "นายภูมิชนะ อุดแก้ว",
  accountType: "ออมทรัพย์",
  branch: "สำนักงานใหญ่",
  logo: "scb",
} as const;

/** เลขบัญชีแบบไม่มี dash — ใช้สำหรับ slip verification */
export const COMPANY_ACCOUNT_DIGITS = COMPANY_BANK_ACCOUNT.accountNumber.replace(/\D/g, "");
