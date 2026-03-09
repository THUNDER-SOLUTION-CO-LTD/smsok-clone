import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  );
}
