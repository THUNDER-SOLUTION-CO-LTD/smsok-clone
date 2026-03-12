import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { loadCampaignsPageData } from "@/lib/campaigns/page-data";
import CampaignsClient from "./CampaignsClient";

export default async function CampaignsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const { campaigns, groups, templates, senderNames } = await loadCampaignsPageData(user.id);

  return (
    <CampaignsClient
      userId={user.id}
      initialCampaigns={campaigns}
      groups={groups}
      templates={templates}
      senderNames={senderNames}
    />
  );
}
