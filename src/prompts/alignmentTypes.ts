import type { DmToolAlignmentContext } from "@/modules/campaigns/server/dmToolContext";

export type AlignmentPromptInput = {
  signal?: AbortSignal;
  rulesetId: string;
  rulesetVersion: string;
  characterName: string;
  current: DmToolAlignmentContext;
  playerAction: string;
  authoritativeResults: unknown[];
  recentEvents: unknown[];
};
