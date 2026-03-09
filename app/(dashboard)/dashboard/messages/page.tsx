import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMessages } from "@/lib/actions/sms";
import DashboardShell from "../DashboardShell";
import MessagesClient from "./MessagesClient";

export default async function MessagesPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const { messages, pagination } = await getMessages(user.id, {
    page: 1,
    limit: 50,
  });

  return (
    <DashboardShell user={user} title="ข้อความ">
      <MessagesClient messages={messages} pagination={pagination} />
    </DashboardShell>
  );
}
