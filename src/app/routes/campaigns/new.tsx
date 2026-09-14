import { createFileRoute } from "@tanstack/react-router";
import { CampaignsHub } from "@/modules/campaigns/ui/CampaignsHub";

export const Route = createFileRoute("/campaigns/new")({
  component: CampaignsHub,
});
