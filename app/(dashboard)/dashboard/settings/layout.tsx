import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ตั้งค่า",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
