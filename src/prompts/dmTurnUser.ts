import type { StructuredDmTurnInput } from "@/modules/campaigns/server/dmToolPlanner";
import { campaignPacingContext } from "./campaignPacing";

export function dmTurnUserPrompt(input: StructuredDmTurnInput): string {
  const context = input.context;
  const toolContext = {
    actors: context.actors,
    encounter: context.encounter,
    actingCharacter: context.character.character,
    allowedSkills: context.character.skills,
    carriedWeapons: context.character.weapons,
    castingTracks: context.character.castingTracks,
    inventory: context.character.inventory,
    alignment: context.character.alignment,
    activeConditions: context.activeConditions,
  };
  return [
    `Campaign: ${input.campaignName}`,
    `Description: ${input.campaignDescription || "No campaign description provided."}`,
    campaignPacingContext(input.settings),
    `Campaign settings: ${JSON.stringify(input.settings).slice(0, 5000)}`,
    `Tool context: ${JSON.stringify(toolContext).slice(0, 20000)}`,
    `Recent authoritative events: ${JSON.stringify(input.recentEvents).slice(0, 7000)}`,
    `Authoritative results from this turn: ${JSON.stringify(input.authoritativeToolResults ?? []).slice(0, 9000)}`,
    "Recent conversation and persistent DM memory:",
    input.conversation || "(No previous messages.)",
    "Choose the single next step for the most recent player turn.",
  ].join("\n\n");
}
