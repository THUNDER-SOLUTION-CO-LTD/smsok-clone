import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SMS API Documentation — ส่งได้ทันทีใน 5 นาที",
  description: "เอกสาร SMSOK REST API สำหรับส่ง SMS, OTP, และจัดการ Contacts ผ่าน API พร้อมตัวอย่างโค้ด cURL, Node.js, Python",
  alternates: { canonical: "/docs/api" },
};

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
