export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
export type Alignment = "LG" | "NG" | "CG" | "LN" | "N" | "CN" | "LE" | "NE" | "CE";

export interface CampaignSummary {
  id: string;
  name: string;
  status: string;
  rulesetId: string;
  rulesetVersion: string;
}

export interface RaceOption {
  id: string;
  name: string;
  description: string;
  rulesText: string;
  size: string;
  baseSpeedFeet: number;
  levelAdjustment: number | null;
  racialHitDice: number;
  naturalArmor: number;
  isHomebrew: boolean;
  abilityModifiers: Partial<Record<AbilityKey, number>>;
}

export interface ClassOption {
  id: string;
  slug: string;
  name: string;
  description: string;
  rulesText: string;
  category: "base" | "prestige" | "npc";
  hitDie: number;
  skillPointsPerLevel: number;
  babProgression: "full" | "three_quarters" | "half" | "custom";
  fortProgression: "good" | "poor" | "custom";
  refProgression: "good" | "poor" | "custom";
  willProgression: "good" | "poor" | "custom";
  isHomebrew: boolean;
  classLevelId: string;
  firstLevelHitPoints: number;
  firstLevelSkillPoints: number;
  allowedAlignments: Alignment[];
  prerequisiteExplanation: string | null;
}

export interface CharacterCreationOptions {
  races: RaceOption[];
  classes: ClassOption[];
  alignments: Alignment[];
}

interface ErrorEnvelope {
  error?: { message?: string };
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const body = (await response.json()) as ErrorEnvelope;
      if (body.error?.message) message = body.error.message;
    } catch {
      // Keep the status-based fallback for non-JSON failures.
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export async function listDraftCampaigns(): Promise<CampaignSummary[]> {
  const response = await requestJson<{ items: CampaignSummary[] }>("/api/campaigns");
  return response.items.filter(
    (campaign) =>
      (campaign.status === "draft" || campaign.status === "ready") &&
      campaign.rulesetId === "dnd35" &&
      campaign.rulesetVersion === "3.5",
  );
}

export async function createSoloCampaign(name: string): Promise<CampaignSummary> {
  return requestJson<CampaignSummary>("/api/campaigns", {
    method: "POST",
    body: JSON.stringify({
      name,
      description: "Created from the D&D 3.5 character creator.",
      playMode: "solo",
      gameMasterMode: "ai",
      timeMode: "paused",
      visibility: "private",
    }),
  });
}

export function getCharacterCreationOptions(): Promise<CharacterCreationOptions> {
  return requestJson<CharacterCreationOptions>("/api/dnd35/character-creation-options");
}

export interface CreateLevelOneCharacterInput {
  campaignId: string;
  name: string;
  pronouns?: string;
  playerNotes?: string;
  raceId: string;
  alignment: Alignment;
  abilities: Record<AbilityKey, number>;
  characterClass: ClassOption;
}

export interface CharacterReadyResult {
  characterId: string;
  status: "ready";
  maximumHitPoints: number;
  campaignStatus: string;
}

export async function createLevelOneCharacter(
  input: CreateLevelOneCharacterInput,
): Promise<CharacterReadyResult> {
  if (!input.characterClass.allowedAlignments.includes(input.alignment)) {
    throw new Error(
      input.characterClass.prerequisiteExplanation ??
        `${input.characterClass.name} does not allow the selected alignment.`,
    );
  }

  const character = await requestJson<{ id: string }>(
    `/api/campaigns/${encodeURIComponent(input.campaignId)}/characters`,
    {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        metadata: {
          ...(input.pronouns ? { pronouns: input.pronouns } : {}),
          ...(input.playerNotes ? { playerNotes: input.playerNotes } : {}),
          extensions: { creatorVersion: 1, creationMethod: "standard-array" },
        },
      }),
    },
  );

  await requestJson(`/api/characters/${encodeURIComponent(character.id)}`, {
    method: "PATCH",
    body: JSON.stringify({ raceId: input.raceId, alignment: input.alignment }),
  });

  await requestJson(`/api/characters/${encodeURIComponent(character.id)}/abilities`, {
    method: "PUT",
    body: JSON.stringify(input.abilities),
  });

  await requestJson(`/api/characters/${encodeURIComponent(character.id)}/class-levels`, {
    method: "POST",
    body: JSON.stringify({
      classLevelId: input.characterClass.classLevelId,
      hitPointsGained: input.characterClass.firstLevelHitPoints,
      skillPointsSpent: 0,
      track: 1,
    }),
  });

  return requestJson<CharacterReadyResult>(
    `/api/characters/${encodeURIComponent(character.id)}/ready`,
    { method: "POST" },
  );
}
