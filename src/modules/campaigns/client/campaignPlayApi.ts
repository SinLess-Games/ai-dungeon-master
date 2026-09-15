import { requestDmStream, type DmStreamOptions } from "./dmStreamApi";
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
export type CampaignInventoryLocation = "carried" | "stored" | "party";
export type CampaignLoadCategory = "light" | "medium" | "heavy" | "overloaded";
export type CampaignEquipmentSlot =
  | "head"
  | "face"
  | "throat"
  | "shoulders"
  | "body"
  | "torso"
  | "waist"
  | "arms"
  | "hands"
  | "feet"
  | "ring_left"
  | "ring_right"
  | "main_hand"
  | "off_hand"
  | "both_hands"
  | "shield"
  | "slotless"
  | "other";
export type CampaignAbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

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
  kind: "check.skill" | "check.save" | "check.initiative";
  status: "pending" | "resolving" | "resolved" | "failed" | "cancelled";
  dc: number | null;
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
  castingAbility: CampaignAbilityKey;
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

export interface CampaignCharacterInventoryEntry {
  id: string;
  itemId: string;
  instanceId: string | null;
  name: string;
  category: string;
  quantity: number;
  weightPounds: number | null;
  totalWeightPounds: number | null;
  priceCopper: number | null;
  equipped: boolean;
  equippedSlot: CampaignEquipmentSlot | null;
  suggestedSlot: CampaignEquipmentSlot | null;
  location: CampaignInventoryLocation;
  notes: string | null;
}

export interface CampaignItemCatalogEntry {
  id: string;
  name: string;
  category: string;
  weightPounds: number | null;
  priceCopper: number | null;
  suggestedSlot: CampaignEquipmentSlot | null;
}

export interface CampaignCharacterSheet {
  campaignStatus: string;
  character: {
    id: string;
    actorId: string | null;
    name: string;
    status: string;
    pronouns: string | null;
    playerNotes: string;
    alignment: string;
    experiencePoints: number;
    progressionMode: string;
    race: { id: string; name: string; size: string; baseSpeedFeet: number } | null;
    classes: Array<{
      classId: string;
      name: string;
      level: number;
      track: number;
      lastCharacterLevel: number;
    }>;
  };
  permissions: {
    canEdit: boolean;
    canArrangeInventory: boolean;
    canManageInventory: boolean;
  };
  abilities: Record<CampaignAbilityKey, { score: number; modifier: number }>;
  combat: {
    characterLevel: number;
    baseAttackBonus: number;
    armorClass: {
      normal: number;
      touch: number;
      flatFooted: number;
      dexterityModifierApplied: number;
      maximumDexterityBonus: number | null;
    };
    saves: Record<CampaignSaveKind, number>;
    initiative: number;
    grapple: number;
    health: {
      characterId: string;
      maximumHitPoints: number;
      currentHitPoints: number;
      temporaryHitPoints: number;
      nonlethalDamage: number;
    };
  };
  encumbrance: {
    enabled: boolean;
    carriedWeight: number;
    actualLoad: CampaignLoadCategory;
    load: CampaignLoadCategory;
    capacity: {
      strength: number;
      size: string;
      quadruped: boolean;
      lightMaximum: number;
      mediumMaximum: number;
      heavyMaximum: number;
      liftOverHead: number;
      liftOffGround: number;
      pushOrDrag: number;
    };
    baseLandSpeedFeet: number;
    landSpeedFeet: number;
    maxDexterityBonus: number | null;
    armorCheckPenalty: number;
    runMultiplier: number;
    movement: "normal" | "reduced" | "stagger" | "immobile";
    weightComplete: boolean;
    unknownWeightItems: number;
  };
  inventory: CampaignCharacterInventoryEntry[];
  skills: Array<{
    id: string;
    name: string;
    ability: CampaignAbilityKey | null;
    specialization: string;
    ranks: number;
    trainedOnly: boolean;
    armorCheckMultiplier: number;
    total: number;
  }>;
  feats: Array<{
    id: string;
    featId: string;
    name: string;
    occurrence: number;
    gainedAtLevel: number | null;
    grantKind: string;
    choices: unknown;
  }>;
  equipmentSlots: CampaignEquipmentSlot[];
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
  result: { type: "check.skill" | "check.save" | "encounter.start"; value: unknown };
  dmMessage: CampaignPlayMessage;
  /** A resolved check may immediately lead to another player-supplied check. */
  pendingAction: CampaignDmAction | null;
  /** The original check remains authoritative even when later DM planning fails. */
  aiError: string | null;
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
  stream?: DmStreamOptions,
): Promise<SendCampaignPlayMessageResult> {
  if (stream)
    return requestDmStream(
      `/api/campaigns/${encodeURIComponent(campaignId)}/play/messages`,
      input,
      stream,
    );
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
  stream?: DmStreamOptions,
): Promise<ResolveCampaignDmActionResult> {
  if (stream)
    return requestDmStream(
      `/api/campaigns/${encodeURIComponent(campaignId)}/play/dm-actions/${encodeURIComponent(actionId)}/resolve`,
      { roll },
      stream,
    );
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

export function getCampaignCharacterSheet(
  campaignId: string,
  characterId: string,
): Promise<CampaignCharacterSheet> {
  return requestJson<CampaignCharacterSheet>(
    `/api/campaigns/${encodeURIComponent(campaignId)}/play/characters/${encodeURIComponent(characterId)}/sheet`,
  );
}

export function updateCampaignCharacterSheet(
  campaignId: string,
  characterId: string,
  input: {
    name?: string;
    pronouns?: string | null;
    playerNotes?: string | null;
    encumbranceEnabled?: boolean;
  },
): Promise<{ ok: true }> {
  return requestJson(
    `/api/campaigns/${encodeURIComponent(campaignId)}/play/characters/${encodeURIComponent(characterId)}/sheet`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export function updateCampaignInventoryEntry(
  campaignId: string,
  characterId: string,
  inventoryId: string,
  input: {
    location?: CampaignInventoryLocation;
    equippedSlot?: CampaignEquipmentSlot | null;
    notes?: string | null;
  },
): Promise<unknown> {
  return requestJson(
    `/api/campaigns/${encodeURIComponent(campaignId)}/play/characters/${encodeURIComponent(characterId)}/inventory/${encodeURIComponent(inventoryId)}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export async function searchCampaignItemCatalog(
  campaignId: string,
  characterId: string,
  query: string,
): Promise<CampaignItemCatalogEntry[]> {
  const response = await requestJson<{ items: CampaignItemCatalogEntry[] }>(
    `/api/campaigns/${encodeURIComponent(campaignId)}/play/characters/${encodeURIComponent(characterId)}/inventory/catalog?q=${encodeURIComponent(query)}`,
  );
  return response.items;
}

export function grantCampaignInventoryItem(
  campaignId: string,
  actorId: string,
  itemId: string,
  quantity: number,
  location: CampaignInventoryLocation = "carried",
): Promise<unknown> {
  return requestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/game/commands`, {
    method: "POST",
    body: JSON.stringify({
      type: "inventory.grant",
      actorId,
      itemId,
      quantity,
      location,
      reason: "Manual live character sheet inventory edit.",
    }),
  });
}

export function removeCampaignInventoryItem(
  campaignId: string,
  actorId: string,
  inventoryId: string,
  quantity: number,
): Promise<unknown> {
  return requestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/game/commands`, {
    method: "POST",
    body: JSON.stringify({
      type: "inventory.remove",
      actorId,
      inventoryId,
      quantity,
      reason: "Manual live character sheet inventory edit.",
    }),
  });
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
  return requestJson(
    `/api/campaigns/${encodeURIComponent(campaignId)}/game/resolved-casting/spells`,
    {
      method: "POST",
      body: JSON.stringify({ mode: "prepared", ...input }),
    },
  );
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
  return requestJson(
    `/api/campaigns/${encodeURIComponent(campaignId)}/game/resolved-casting/spells`,
    {
      method: "POST",
      body: JSON.stringify({ mode: "spontaneous", ...input }),
    },
  );
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
  return requestJson(
    `/api/campaigns/${encodeURIComponent(campaignId)}/game/resolved-casting/powers`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
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
