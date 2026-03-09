import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getApprovedSenderNames } from "@/lib/actions/sender-names";
import DashboardShell from "../DashboardShell";
import SendSmsForm from "./SendSmsForm";

export default async function SendPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const senderNames = await getApprovedSenderNames(user.id);

  return (
    <DashboardShell user={user} title="ส่ง SMS">
      <SendSmsForm userId={user.id} senderNames={senderNames.map(s => s.name)} />
    </DashboardShell>
  );
}
