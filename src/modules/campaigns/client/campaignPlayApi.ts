import { requestJson } from "./campaignCreatorApi";

export interface CampaignGameActorHealth {
  maximumHitPoints: number;
  currentHitPoints: number;
  temporaryHitPoints: number;
  nonlethalDamage: number;
  stable: boolean;
  state: string;
}

export interface CampaignGameActor {
  id: string;
  kind: "character" | "monster" | "npc";
  characterId: string | null;
  controllerUserId: string | null;
  name: string;
  status: string;
  metadata: Record<string, unknown>;
  health: CampaignGameActorHealth | null;
}

export interface CampaignEncounterParticipant {
  actorId: string;
  status: string;
  initiativeRoll: number;
  initiativeModifier: number;
  initiativeTotal: number;
  turnOrder: number;
  actionEconomy: {
    standardAvailable: boolean;
    moveAvailable: boolean;
    swiftAvailable: boolean;
    attacksOfOpportunityRemaining: number;
  };
}

export interface CampaignEncounter {
  id: string;
  roundNumber: number;
  activeTurnIndex: number;
  currentActorId: string | null;
  participants: CampaignEncounterParticipant[];
}

export interface CampaignCondition {
  id: string;
  actorId: string;
  conditionId: string;
  sourceActorId: string | null;
  sourceDescription: string | null;
  durationKind: string;
  remainingRounds: number | null;
  encounterId: string | null;
  expiresEncounterRound: number | null;
  expiresTurnOrder: number | null;
  expiresAt: number | null;
  state: Record<string, unknown> | null;
}

export interface CampaignGameEvent {
  id: string;
  sequence: number;
  type: string;
  occurredAt: number;
  actorId: string | null;
  sourceId: string | null;
  targetIds: string[];
  payload: Record<string, unknown>;
  deltas: unknown[];
}

export interface CampaignGameState {
  schemaVersion: 1;
  campaignId: string;
  worldId: string;
  sessionId: string;
  ruleset: { id: string; version: string };
  sequence: number;
  actors: CampaignGameActor[];
  encounter: CampaignEncounter | null;
  conditions: CampaignCondition[];
  events: CampaignGameEvent[];
}

export type CampaignPlayMessageChannel = "campaign" | "ooc_dm";
export type CampaignPlayMessageAuthorKind = "player" | "dm" | "system";
export type CampaignSaveKind = "fort" | "ref" | "will";

export interface CampaignPlayMessage {
  id: string;
  campaignId: string;
  channel: CampaignPlayMessageChannel;
  authorKind: CampaignPlayMessageAuthorKind;
  authorUserId: string | null;
  authorName: string;
  characterId: string | null;
  characterName: string | null;
  content: string;
  createdAt: number;
}

export interface CampaignPlaySkillOption {
  id: string;
  slug: string;
  name: string;
  ability: string | null;
  specialization: string;
  ranks: number;
  trainedOnly: boolean;
}

export interface CampaignPlayCheckOptions {
  character: { id: string; name: string };
  skills: CampaignPlaySkillOption[];
  saves: CampaignSaveKind[];
}

export interface SendCampaignPlayMessageResult {
  message: CampaignPlayMessage;
  dmMessage: CampaignPlayMessage | null;
  aiError: string | null;
  awaitingHumanDm: boolean;
}

export function getCampaignGameState(campaignId: string): Promise<CampaignGameState> {
  return requestJson<CampaignGameState>(
    `/api/campaigns/${encodeURIComponent(campaignId)}/game/state?eventLimit=100`,
  );
}

export async function listCampaignPlayMessages(
  campaignId: string,
  channel: CampaignPlayMessageChannel,
  limit = 60,
): Promise<CampaignPlayMessage[]> {
  const response = await requestJson<{ items: CampaignPlayMessage[] }>(
    `/api/campaigns/${encodeURIComponent(campaignId)}/play/messages?channel=${encodeURIComponent(channel)}&limit=${limit}`,
  );
  return response.items;
}

export function sendCampaignPlayMessage(
  campaignId: string,
  input: {
    channel: CampaignPlayMessageChannel;
    content: string;
    characterId?: string | null;
  },
): Promise<SendCampaignPlayMessageResult> {
  return requestJson<SendCampaignPlayMessageResult>(
    `/api/campaigns/${encodeURIComponent(campaignId)}/play/messages`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function getCampaignPlayCheckOptions(
  campaignId: string,
  characterId: string,
): Promise<CampaignPlayCheckOptions> {
  return requestJson<CampaignPlayCheckOptions>(
    `/api/campaigns/${encodeURIComponent(campaignId)}/play/characters/${encodeURIComponent(characterId)}/checks`,
  );
}

export function performCampaignSkillCheck(
  campaignId: string,
  actorId: string,
  skillId: string,
  dc: number,
  specialization?: string,
): Promise<unknown> {
  return requestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/game/commands`, {
    method: "POST",
    body: JSON.stringify({
      type: "check.skill",
      actorId,
      skillId,
      dc,
      ...(specialization ? { specialization } : {}),
    }),
  });
}

export function performCampaignSave(
  campaignId: string,
  actorId: string,
  save: CampaignSaveKind,
  dc: number,
): Promise<unknown> {
  return requestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/game/commands`, {
    method: "POST",
    body: JSON.stringify({
      type: "check.save",
      actorId,
      save,
      dc,
    }),
  });
}

export function endCampaignTurn(
  campaignId: string,
  encounterId: string,
  actorId: string,
): Promise<unknown> {
  return requestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/game/commands`, {
    method: "POST",
    body: JSON.stringify({
      type: "encounter.end_turn",
      encounterId,
      actorId,
    }),
  });
}
