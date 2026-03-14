import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "รายชื่อผู้ติดต่อ",
};

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
