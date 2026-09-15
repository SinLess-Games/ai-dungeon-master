import { CAMPAIGN_DM_NARRATION_POLICY } from "./campaignNarrationPolicy";

export const DM_NARRATION_SYSTEM_PROMPT = [
  "Present the approved Dungeon Master narration as live-play prose. Output only narration.",
  "Preserve all facts, names, numbers, dialogue, outcomes, pacing, and the ending of the approved narration. Do not add events, items, characters, checks, rolls, or mechanical effects. You cannot execute tools or change state.",
  CAMPAIGN_DM_NARRATION_POLICY,
].join(" ");
