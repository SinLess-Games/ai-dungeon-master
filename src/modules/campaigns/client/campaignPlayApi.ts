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
export type CampaignAttackKind = "melee" | "ranged";
export type CampaignCastingMode = "prepared" | "spontaneous" | "psionic" | "other";
export type CampaignCastingTradition = "arcane" | "divine" | "psionic" | "other";

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

export interface CampaignDmAction {
  id: string;
  campaignId: string;
  characterId: string;
  actorId: string;
  kind: "check.skill" | "check.save";
  status: "pending" | "resolving" | "resolved" | "failed" | "cancelled";
  dc: number;
  reason: string;
  skill: { id: string; name: string; specialization: string } | null;
  save: CampaignSaveKind | null;
  error: string | null;
  createdAt: number;
  resolvedAt: number | null;
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

export interface CampaignPlayWeaponOption {
  inventoryId: string;
  itemId: string;
  name: string;
  attackKind: "melee" | "ranged" | "both";
  handedness: "light" | "one_handed" | "two_handed" | "ranged";
  quantity: number;
}

export interface CampaignPlayCheckOptions {
  character: { id: string; name: string };
  skills: CampaignPlaySkillOption[];
  saves: CampaignSaveKind[];
  weapons: CampaignPlayWeaponOption[];
}

export interface CampaignPreparedSpellOption {
  preparationId: string;
  spellId: string;
  name: string;
  slotLevel: number;
  preparedCount: number;
  expendedCount: number;
  remaining: number;
  actionType: string | null;
  rangeText: string;
  targetText: string | null;
}

export interface CampaignSpontaneousSpellOption {
  spellId: string;
  name: string;
  spellLevel: number;
  actionType: string | null;
  rangeText: string;
  targetText: string | null;
}

export interface CampaignPowerOption {
  powerId: string;
  name: string;
  powerLevel: number;
  powerPoints: number;
  actionType: string | null;
  rangeText: string;
  targetText: string | null;
  augmentationText: string | null;
}

export interface CampaignCastingCatalogTrack {
  id: string;
  mode: CampaignCastingMode;
  tradition: CampaignCastingTradition;
  trackKey: string;
  prepared: CampaignPreparedSpellOption[];
  spontaneous: CampaignSpontaneousSpellOption[];
  powers: CampaignPowerOption[];
}

export interface CampaignCastingCatalog {
  character: { id: string; name: string };
  tracks: CampaignCastingCatalogTrack[];
}

export interface CampaignCastingStateTrack {
  id: string;
  mode: CampaignCastingMode;
  tradition: CampaignCastingTradition;
  castingAbility: "str" | "dex" | "con" | "int" | "wis" | "cha";
  effectiveProgressionLevel: number;
  casterOrManifesterLevel: number;
  prepared?: Array<{
    id: string;
    spellId: string;
    slotLevel: number;
    preparedCount: number;
    expendedCount: number;
    remaining: number;
  }>;
  spontaneous?: Array<{
    spellLevel: number;
    maximum: number;
    expended: number;
    remaining: number;
  }>;
}

export interface CampaignCastingState {
  characterId: string;
  tracks: CampaignCastingStateTrack[];
  psionics: {
    maximumPowerPoints: number;
    powerPointsSpent: number;
    currentPowerPoints: number;
    focused: boolean;
  };
}

export interface SendCampaignPlayMessageResult {
  message: CampaignPlayMessage;
  dmMessage: CampaignPlayMessage | null;
  pendingAction: CampaignDmAction | null;
  aiError: string | null;
  awaitingHumanDm: boolean;
}

export interface ResolveCampaignDmActionResult {
  action: CampaignDmAction;
  result: { type: "check.skill" | "check.save"; value: unknown };
  dmMessage: CampaignPlayMessage;
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

export async function getPendingCampaignDmAction(
  campaignId: string,
): Promise<CampaignDmAction | null> {
  const response = await requestJson<{ action: CampaignDmAction | null }>(
    `/api/campaigns/${encodeURIComponent(campaignId)}/play/dm-actions/pending`,
  );
  return response.action;
}

export function resolveCampaignDmAction(
  campaignId: string,
  actionId: string,
  roll: number,
): Promise<ResolveCampaignDmActionResult> {
  return requestJson<ResolveCampaignDmActionResult>(
    `/api/campaigns/${encodeURIComponent(campaignId)}/play/dm-actions/${encodeURIComponent(actionId)}/resolve`,
    {
      method: "POST",
      body: JSON.stringify({ roll }),
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

export function getCampaignCastingCatalog(
  campaignId: string,
  characterId: string,
): Promise<CampaignCastingCatalog> {
  return requestJson<CampaignCastingCatalog>(
    `/api/campaigns/${encodeURIComponent(campaignId)}/play/characters/${encodeURIComponent(characterId)}/casting`,
  );
}

export function getCampaignCastingState(
  campaignId: string,
  characterId: string,
): Promise<CampaignCastingState> {
  return requestJson<CampaignCastingState>(
    `/api/campaigns/${encodeURIComponent(campaignId)}/game/casting/${encodeURIComponent(characterId)}`,
  );
}

export function castPreparedCampaignSpell(
  campaignId: string,
  input: {
    actorId: string;
    castingTrackId: string;
    spellId: string;
    preparationId: string;
    targetIds?: string[];
  },
): Promise<unknown> {
  return requestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/game/resolved-casting/spells`, {
    method: "POST",
    body: JSON.stringify({ mode: "prepared", ...input }),
  });
}

export function castSpontaneousCampaignSpell(
  campaignId: string,
  input: {
    actorId: string;
    castingTrackId: string;
    spellId: string;
    slotLevel?: number;
    targetIds?: string[];
  },
): Promise<unknown> {
  return requestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/game/resolved-casting/spells`, {
    method: "POST",
    body: JSON.stringify({ mode: "spontaneous", ...input }),
  });
}

export function manifestCampaignPower(
  campaignId: string,
  input: {
    actorId: string;
    castingTrackId: string;
    powerId: string;
    targetIds?: string[];
  },
): Promise<unknown> {
  return requestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/game/resolved-casting/powers`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function performCampaignSkillCheck(
  campaignId: string,
  actorId: string,
  skillId: string,
  dc: number,
  specialization?: string,
  roll?: number,
): Promise<unknown> {
  return requestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/game/commands`, {
    method: "POST",
    body: JSON.stringify({
      type: "check.skill",
      actorId,
      skillId,
      dc,
      ...(specialization ? { specialization } : {}),
      ...(roll === undefined ? {} : { roll }),
    }),
  });
}

export function performCampaignSave(
  campaignId: string,
  actorId: string,
  save: CampaignSaveKind,
  dc: number,
  roll?: number,
): Promise<unknown> {
  return requestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/game/commands`, {
    method: "POST",
    body: JSON.stringify({
      type: "check.save",
      actorId,
      save,
      dc,
      ...(roll === undefined ? {} : { roll }),
    }),
  });
}

export function performCampaignAttack(
  campaignId: string,
  attackerId: string,
  targetId: string,
  kind: CampaignAttackKind,
  weaponInventoryId?: string,
): Promise<unknown> {
  return requestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/game/commands`, {
    method: "POST",
    body: JSON.stringify({
      type: "combat.attack",
      attackerId,
      targetId,
      kind,
      ...(weaponInventoryId ? { weaponInventoryId } : {}),
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
