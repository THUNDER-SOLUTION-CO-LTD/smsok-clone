import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/lib/actions/sms";
import { getApprovedSenderNames } from "@/lib/actions/sender-names";
import DashboardContent from "./DashboardContent";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [stats, senderNames] = await Promise.all([
    getDashboardStats(user.id),
    getApprovedSenderNames(user.id),
  ]);

  const names = senderNames.map(s => s.name);
  return <DashboardContent user={user} stats={stats} senderNames={names.length > 0 ? names : ["EasySlip"]} />;
}
