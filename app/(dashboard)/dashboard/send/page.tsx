import { getSession } from "@/lib/auth";
import { getApprovedSenderNames } from "@/lib/actions/sender-names";
import SendSmsForm from "./SendSmsForm";

export default async function SendPage() {
  const user = await getSession();

  const senderNames = await getApprovedSenderNames(user!.id);

  return (
    <SendSmsForm userId={user!.id} senderNames={senderNames.map(s => s.name)} />
  );
}
