import type { LegacyDmTurnInput } from "@/modules/campaigns/server/dmToolPlanner";
import { campaignPacingContext } from "./campaignPacing";

export function legacyDmTurnUserPrompt(input: LegacyDmTurnInput): string {
  return [
    `Campaign: ${input.campaignName}`,
    `Description: ${input.campaignDescription || "No campaign description provided."}`,
    campaignPacingContext(input.settings),
    `Campaign settings: ${JSON.stringify(input.settings).slice(0, 5000)}`,
    `Current actors: ${JSON.stringify(input.actors).slice(0, 5000)}`,
    `Recent authoritative events: ${JSON.stringify(input.recentEvents).slice(0, 7000)}`,
    `Acting character: ${JSON.stringify(input.character)}`,
    `Allowed skills: ${JSON.stringify(input.skills).slice(0, 9000)}`,
    "Recent conversation:",
    input.conversation || "(No previous messages.)",
    "Plan the response to the most recent player message.",
  ].join("\n\n");
}
