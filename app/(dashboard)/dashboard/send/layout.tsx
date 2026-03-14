import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ส่ง SMS",
};

export default function SendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
