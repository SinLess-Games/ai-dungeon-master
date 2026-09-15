import type { AlignmentPromptInput } from "./alignmentTypes";

export function alignmentUserPrompt(input: AlignmentPromptInput): string {
  return [
    `Character: ${input.characterName}`,
    `Current alignment state: ${JSON.stringify(input.current)}`,
    `Player action: ${input.playerAction}`,
    `Authoritative results from this turn: ${JSON.stringify(input.authoritativeResults).slice(0, 8000)}`,
    `Recent authoritative events: ${JSON.stringify(input.recentEvents).slice(0, 6000)}`,
    "Assess only this completed player turn.",
  ].join("\n\n");
}
