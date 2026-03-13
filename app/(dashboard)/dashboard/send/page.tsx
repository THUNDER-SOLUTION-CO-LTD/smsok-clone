import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getApprovedSenderNames } from "@/lib/actions/sender-names";
import SendSmsForm from "./SendSmsForm";
import { ErrorState } from "@/components/ErrorState";

export default async function SendPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  try {
    const approved = await getApprovedSenderNames();
    const senderNames = approved.map(s => s.name);

    return (
      <SendSmsForm senderNames={senderNames} />
    );
  } catch {
    return <ErrorState type="SERVER_ERROR" />;
  }
}
