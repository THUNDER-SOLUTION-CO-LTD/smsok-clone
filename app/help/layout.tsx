import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ศูนย์ช่วยเหลือ — คำถามที่พบบ่อย",
  description:
    "คำถามที่พบบ่อยเกี่ยวกับการส่ง SMS, API, การชำระเงิน, บัญชีผู้ใช้ และ PDPA พร้อมคำตอบจากทีม SMSOK",
  openGraph: {
    title: "ศูนย์ช่วยเหลือ | SMSOK",
    description:
      "คำถามที่พบบ่อยเกี่ยวกับการส่ง SMS, API, การชำระเงิน และอื่นๆ",
    type: "website",
  },
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
