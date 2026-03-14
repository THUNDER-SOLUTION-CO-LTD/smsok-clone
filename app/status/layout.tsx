import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "สถานะระบบ — System Status",
  description:
    "ตรวจสอบสถานะระบบ SMSOK แบบเรียลไทม์ — SMS Gateway, API, เว็บไซต์ และ Uptime",
  openGraph: {
    title: "สถานะระบบ | SMSOK",
    description: "ตรวจสอบสถานะระบบ SMSOK แบบเรียลไทม์",
    type: "website",
  },
};

export default function StatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
