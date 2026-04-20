import type { Metadata } from "next";
import CampaignPageClient from "./CampaignPageClient";

export const metadata: Metadata = {
  title: "Campaign Details",
  description: "View and book DnD campaign sessions.",
};

export default function CampaignDetailPage({
  params,
}: {
  params: { campaignId: string };
}) {
  return <CampaignPageClient campaignId={params.campaignId} />;
}
