import { getSession } from "@/lib/auth";
import { getMessages } from "@/lib/actions/sms";
import MessagesClient from "./MessagesClient";

export default async function MessagesPage() {
  const user = await getSession();

  const { messages, pagination } = await getMessages(user!.id, {
    page: 1,
    limit: 50,
  });

  return (
    <MessagesClient messages={messages} pagination={pagination} />
  );
}
