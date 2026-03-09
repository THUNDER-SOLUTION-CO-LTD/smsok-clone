import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardContent from "./DashboardContent";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  return <DashboardContent user={user} />;
}
