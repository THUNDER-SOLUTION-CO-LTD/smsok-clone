import { getSession } from "@/lib/auth";
import { getDashboardStats } from "@/lib/actions/sms";
import { getApprovedSenderNames } from "@/lib/actions/sender-names";
import DashboardContent from "./DashboardContent";

export default async function DashboardPage() {
  const user = await getSession();

  const [stats, senderNames] = await Promise.all([
    getDashboardStats(user!.id),
    getApprovedSenderNames(user!.id),
  ]);

  return <DashboardContent user={user!} stats={stats} senderNames={senderNames.map(s => s.name)} />;
}
