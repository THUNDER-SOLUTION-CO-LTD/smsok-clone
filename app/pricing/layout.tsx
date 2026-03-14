import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "แพ็กเกจ SMS — เลือกแพ็กเกจที่เหมาะกับธุรกิจ",
  description:
    "เปรียบเทียบแพ็กเกจ SMS ราคาเริ่มต้น 0.15 บาท ส่ง SMS ได้ทันที รองรับ Sender Name, OTP, แคมเปญ ทดลองฟรี 500 SMS",
  openGraph: {
    title: "แพ็กเกจ SMS | SMSOK",
    description:
      "เปรียบเทียบแพ็กเกจ SMS ราคาเริ่มต้น 0.15 บาท ส่งได้ทันที ทดลองฟรี",
    type: "website",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
