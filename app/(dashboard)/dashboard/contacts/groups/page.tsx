import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGroups } from "@/lib/actions/groups";
import GroupsPageClient from "../../groups/GroupsPageClient";
import { ErrorState } from "@/components/ErrorState";

export default async function ContactsGroupsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  let groups: Awaited<ReturnType<typeof getGroups>> | null = null;
  try {
    groups = await getGroups();
  } catch {}

  if (!groups) {
    return <ErrorState type="SERVER_ERROR" />;
  }

  const serializedGroups = groups.map((group) => ({
    ...group,
    createdAt: group.createdAt.toISOString(),
  }));

  return <GroupsPageClient initialGroups={serializedGroups} />;
}
