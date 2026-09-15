import type { DmReplyCampaign, DmReplyChannel } from "./dmReplyTypes";
import { campaignPacingContext } from "./campaignPacing";

export function dmReplyUserPrompt(
  campaign: DmReplyCampaign,
  channel: DmReplyChannel,
  settings: Record<string, unknown>,
  events: unknown[],
  systemReferenceText: string,
  conversation: string,
): string {
  return [
    `Campaign: ${campaign.name}`,
    `Description: ${campaign.description || "No campaign description provided."}`,
    campaignPacingContext(settings),
    `Recent events: ${JSON.stringify(events).slice(0, 7000)}`,
    ...(systemReferenceText
      ? ["Source-backed system database references for this response:", systemReferenceText]
      : []),
    "Shared DM context:",
    conversation || "(No previous campaign or private OOC messages.)",
    channel === "ooc_dm"
      ? "Respond to the most recent private OOC player message while staying consistent with the campaign table."
      : "Respond to the most recent campaign player message while honoring relevant private OOC direction.",
  ].join("\n\n");
}
