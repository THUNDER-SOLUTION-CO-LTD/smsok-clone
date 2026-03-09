import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/lib/actions/sms";
import AnalyticsContent from "./AnalyticsContent";

export default async function AnalyticsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const stats = await getDashboardStats(user.id);
  return <AnalyticsContent stats={stats} />;
}
