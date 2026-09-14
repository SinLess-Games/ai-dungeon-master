import { createFileRoute } from "@tanstack/react-router";
import { CampaignCreator } from "@/modules/campaigns/ui/CampaignCreator";

export const Route = createFileRoute("/campaigns/new")({
  component: CampaignCreator,
});
