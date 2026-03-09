import { getSession } from "@/lib/auth";
import { getContacts } from "@/lib/actions/contacts";
import ContactsClient from "./ContactsClient";

export default async function ContactsPage() {
  const user = await getSession();

  const { contacts, pagination } = await getContacts(user!.id);

  // Serialize dates for client component
  const serializedContacts = contacts.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    tags: c.tags,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <ContactsClient
      userId={user!.id}
      initialContacts={serializedContacts}
      totalContacts={pagination.total}
    />
  );
}
