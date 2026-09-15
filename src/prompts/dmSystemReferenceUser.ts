import type { DmSystemReferenceInput } from "@/modules/campaigns/server/dmSystemReferencePlanner";

export function dmSystemReferenceUserPrompt(input: DmSystemReferenceInput): string {
  return [
    `Campaign: ${input.campaignName}`,
    `Description: ${input.campaignDescription || "No campaign description provided."}`,
    `Latest player text: ${input.playerText.slice(0, 4000)}`,
    input.conversation
      ? `Recent table/OOC context: ${input.conversation.slice(-6000)}`
      : "No additional conversation context supplied.",
    "Select only references that could materially improve the next DM response.",
  ].join("\n\n");
}
