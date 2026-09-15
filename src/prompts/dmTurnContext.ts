import { CAMPAIGN_DM_NARRATION_POLICY } from "./campaignNarrationPolicy";

function withCampaignChatPolicy(conversation: string): string {
  return [
    `Campaign chat output policy: ${CAMPAIGN_DM_NARRATION_POLICY}`,
    conversation || "(No previous campaign or private OOC messages.)",
  ].join("\n\n");
}

export function withSystemReferences(conversation: string, systemReferenceText: string): string {
  if (!systemReferenceText) return withCampaignChatPolicy(conversation);
  return withCampaignChatPolicy(
    [
      conversation,
      "Source-backed system database references for this turn:",
      "Use these rows as canonical reference knowledge for the active ruleset. They do not by themselves mutate game state; authoritative mechanics still require validated game commands.",
      systemReferenceText,
    ].join("\n\n"),
  );
}
