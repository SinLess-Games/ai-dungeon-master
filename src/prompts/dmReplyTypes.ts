export interface DmReplyCampaign {
  name: string;
  description: string | null;
  status: string;
  rulesetId: string;
  rulesetVersion: string;
}
export type DmReplyChannel = "campaign" | "ooc_dm";
