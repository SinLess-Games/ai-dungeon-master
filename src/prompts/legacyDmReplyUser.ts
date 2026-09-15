import type { DmReplyCampaign } from "./dmReplyTypes";
import { campaignPacingContext } from "./campaignPacing";

export function legacyDmReplyUserPrompt(
  campaign: DmReplyCampaign,
  settings: Record<string, unknown>,
  actors: unknown[],
  events: unknown[],
  conversation: string,
): string {
  return [
    `Campaign: ${campaign.name}`,
    `Description: ${campaign.description || "No campaign description provided."}`,
    `Status: ${campaign.status}`,
    `Ruleset: ${campaign.rulesetId} ${campaign.rulesetVersion}`,
    campaignPacingContext(settings),
    `Campaign settings: ${JSON.stringify(settings).slice(0, 5000)}`,
    `Current actors: ${JSON.stringify(actors).slice(0, 4000)}`,
    `Recent authoritative game events: ${JSON.stringify(events).slice(0, 7000)}`,
    "Recent conversation:",
    conversation || "(No previous messages.)",
    "Respond to the most recent player message now.",
  ].join("\n\n");
}
