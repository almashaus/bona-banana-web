import type { Metadata } from "next";
import EditCampaignClient from "./EditCampaignClient";

export const metadata: Metadata = {
  title: "Edit Campaign",
  description: "Edit your DnD campaign details.",
};

export default function EditCampaignPage({
  params,
}: {
  params: { campaignId: string };
}) {
  return <EditCampaignClient campaignId={params.campaignId} />;
}
