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

export interface SkillOption {
  id: string;
  slug: string;
  name: string;
  ability: AbilityKey;
  trainedOnly: boolean;
  armorCheckMultiplier: number;
  requiresSpecialization: boolean;
  isClassSkill: boolean;
  maximumRanks: number;
  pointCostPerRank: number;
}

export interface SkillPage {
  budget: number;
  effectiveIntelligence: number;
  intelligenceModifier: number;
  classId: string;
  className: string;
  options: SkillOption[];
  speakLanguageOptions?: Array<{ id: string; name: string }>;
  selections: Array<{ skillId: string; specialization: string; ranks: number }>;
}

export interface LanguagePage {
  automatic: Array<{ languageId: string; name: string; slug: string }>;
  bonusOptions: Array<{ languageId: string; name: string; slug: string }>;
  bonusChoicesRequired: number;
  druidicGranted: boolean;
  selected: Array<{ id: string; name: string }>;
}

export type FeatChoiceKind = "none" | "skill" | "weapon" | "school" | "spell" | "other";
export interface FeatOption {
  id: string;
  slug: string;
  name: string;
  repeatable: boolean;
  choiceKind: FeatChoiceKind;
  explanation: string | null;
}
export interface FeatChoiceOption { id: string; name: string; slug?: string }
export interface FeatPage {
  required: {
    level: number;
    racialBonus: number;
    classBonusFeatures: Array<{ id: string; slug: string; name: string }>;
  };
  options: FeatOption[];
  choiceOptions?: Partial<Record<Exclude<FeatChoiceKind, "none" | "other">, FeatChoiceOption[]>>;
  selected: Array<{
    id: string;
    featId: string;
    occurrence: number;
    grantKind: "level" | "race" | "class";
    choices?: RuleChoice[] | null;
  }>;
}
export interface RuleChoice { key: string; contentId?: string; text?: string; value?: number }
export interface FeatSelection { featId: string; choices?: RuleChoice[] }
export interface ClassFeatSelection extends FeatSelection { classFeatureId: string }

export interface WealthRow {
  startingWealthCopper: number | null;
  currentCopper: number;
  equipmentSpentCopper: number;
  rollResults?: number[] | null;
}
export interface EquipmentOption {
  id: string;
  slug: string;
  name: string;
  category: string;
  priceCopper: number;
  weightPounds: number | null;
}
export interface EquipmentPage {
  class: { id: string; slug: string; name: string };
  formula: Record<string, unknown> | null;
  wealth: WealthRow | null;
  inventory: Array<{ inventoryId: string; itemId: string; quantity: number; name: string; priceCopper: number | null }>;
  options: EquipmentOption[];
}

export interface SpellOption {
  id: string;
  slug: string;
  name: string;
  schoolId: string;
  spellLevel: number;
}
export interface SpellPage {
  required: boolean;
  classId?: string;
  mode: "limited" | "all_list" | "spellbook" | "none" | null;
  automaticSpellIds?: string[];
  firstLevelChoicesRequired?: number;
  specialization?: { schoolId?: string; prohibitedSchoolIds: string[] };
  knownByLevel?: Record<string, number>;
  options: SpellOption[];
  selected: Array<{ spellId: string }>;
}

export interface PowerOption {
  id: string;
  slug: string;
  name: string;
  disciplineId?: string | null;
  powerLevel: number;
}
export interface PowerPage {
  required: boolean;
  classId?: string;
  count: number;
  disciplineId?: string | null;
  options: PowerOption[];
  selected: Array<{ powerId: string }>;
}

export interface ChoiceOption { id: string; slug: string; name: string; specialistName?: string | null }
export interface ClassChoicePage {
  classId: string;
  className: string;
  required: boolean;
  choice: "favored-enemy" | "school-specialization" | "psionic-discipline" | null;
  options?: ChoiceOption[];
  schools?: ChoiceOption[];
  generalistAllowed?: boolean;
  subtypeRequiredFor?: string[];
  subtypeOptions?: Record<string, ChoiceOption[]>;
  selected: Array<{
    choiceKey: string;
    contentId?: string | null;
    valueText?: string | null;
    parameters?: Record<string, unknown> | null;
  }>;
}

export interface DivinePage {
  required: boolean;
  reason?: string;
  alignment: Alignment;
  deityId: string | null;
  domains: Array<{ id: string; slug: string; name: string }>;
  deityOptions: Array<{
    id: string;
    slug: string;
    name: string;
    alignment: Alignment | null;
    portfolio: string | null;
    symbol: string | null;
  }>;
  domainOptions: Array<{ id: string; slug: string; name: string; grantedPowerText: string | null }>;
  deityOptional?: boolean;
  domainsRequired?: number;
  deityDomainIds?: Record<string, string[]>;
}

export interface CompanionPage {
  required: boolean;
  mayDecline: boolean;
  classId: string;
  className: string;
  kind: "familiar" | "animal_companion" | null;
  options: string[];
  selected: Array<{ id: string; kind: string; creatureName: string; name: string | null }>;
}

export interface ReadinessPage {
  characterId: string;
  complete: boolean;
  missing: string[];
  progress: Record<string, boolean> | null;
}

export interface ReadyResult {
  characterId: string;
  status: "ready";
  maximumHitPoints: number;
  campaignStatus: string;
  creationComplete: boolean;
}

export interface CreatorReferenceOptions {
  languages: FeatChoiceOption[];
  featChoiceOptions: Partial<
    Record<Exclude<FeatChoiceKind, "none" | "other">, FeatChoiceOption[]>
  >;
  deityDomainIds: Record<string, string[]>;
}

interface ErrorEnvelope {
  error?: string | { message?: string };
  message?: string;
}

export async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const body = (await response.json()) as ErrorEnvelope;
      if (typeof body.error === "string") message = body.error;
      else if (body.error?.message) message = body.error.message;
      else if (body.message) message = body.message;
    } catch {
      // Preserve the HTTP status fallback for non-JSON failures.
    }
    throw new Error(message);
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

const characterPath = (characterId: string, suffix = "") =>
  `/api/characters/${encodeURIComponent(characterId)}${suffix}`;

let referenceOptionsPromise: Promise<CreatorReferenceOptions> | undefined;
function getCreatorReferenceOptions(): Promise<CreatorReferenceOptions> {
  referenceOptionsPromise ??= requestJson<CreatorReferenceOptions>(
    "/api/dnd35/character-creation-reference-options",
  ).catch((error) => {
    referenceOptionsPromise = undefined;
    throw error;
  });
  return referenceOptionsPromise;
}

export async function listDraftCampaigns(): Promise<CampaignSummary[]> {
  const response = await requestJson<{ items: CampaignSummary[] }>("/api/campaigns");
  return response.items.filter(
    (campaign) =>
      (campaign.status === "draft" || campaign.status === "ready") &&
      campaign.rulesetId === "dnd35" && campaign.rulesetVersion === "3.5",
  );
}

export function createSoloCampaign(name: string): Promise<CampaignSummary> {
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

export async function createCharacterFoundation(input: {
  campaignId: string;
  name: string;
  pronouns?: string;
  playerNotes?: string;
  raceId: string;
  alignment: Alignment;
  abilities: Record<AbilityKey, number>;
  characterClass: ClassOption;
}): Promise<{ characterId: string }> {
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
          extensions: { creatorVersion: 2, creationMethod: "standard-array" },
        },
      }),
    },
  );
  await requestJson(characterPath(character.id), {
    method: "PATCH",
    body: JSON.stringify({ raceId: input.raceId, alignment: input.alignment }),
  });
  await requestJson(characterPath(character.id, "/abilities"), {
    method: "PUT",
    body: JSON.stringify(input.abilities),
  });
  await requestJson(characterPath(character.id, "/class-levels"), {
    method: "POST",
    body: JSON.stringify({
      classLevelId: input.characterClass.classLevelId,
      hitPointsGained: input.characterClass.firstLevelHitPoints,
      skillPointsSpent: 0,
      track: 1,
    }),
  });
  return { characterId: character.id };
}

export async function getSkills(id: string): Promise<SkillPage> {
  const [page, references] = await Promise.all([
    requestJson<SkillPage>(characterPath(id, "/creation/skills")),
    getCreatorReferenceOptions(),
  ]);
  return {
    ...page,
    speakLanguageOptions: references.languages.map(({ id, name }) => ({ id, name })),
  };
}
export const saveSkills = (id: string, selections: Array<{ skillId: string; specialization?: string; ranks: number }>) =>
  requestJson(characterPath(id, "/skills"), { method: "PUT", body: JSON.stringify({ selections }) });

export const getLanguages = (id: string) => requestJson<LanguagePage>(characterPath(id, "/creation/languages"));
export const saveLanguages = (id: string, bonusLanguageIds: string[]) =>
  requestJson(characterPath(id, "/languages"), { method: "PUT", body: JSON.stringify({ bonusLanguageIds }) });

export async function getFeats(id: string): Promise<FeatPage> {
  const [page, references] = await Promise.all([
    requestJson<FeatPage>(characterPath(id, "/creation/feats")),
    getCreatorReferenceOptions(),
  ]);
  return { ...page, choiceOptions: references.featChoiceOptions };
}
export const saveFeats = (id: string, input: { levelFeats: FeatSelection[]; racialBonusFeats: FeatSelection[]; classBonusFeats: ClassFeatSelection[] }) =>
  requestJson(characterPath(id, "/feats"), { method: "PUT", body: JSON.stringify(input) });

export const getEquipment = (id: string) => requestJson<EquipmentPage>(characterPath(id, "/creation/equipment"));
export const rollStartingWealth = (id: string) =>
  requestJson<{ startingWealthCopper?: number; startingGoldPieces?: number; wealth?: WealthRow; alreadyRolled?: boolean }>(characterPath(id, "/starting-wealth/roll"), { method: "POST" });
export const saveEquipment = (id: string, selections: Array<{ itemId: string; quantity: number }>) =>
  requestJson<{ spentCopper: number; remainingCopper: number }>(characterPath(id, "/equipment"), { method: "PUT", body: JSON.stringify({ selections }) });

export const getSpells = (id: string) => requestJson<SpellPage>(characterPath(id, "/creation/spells"));
export const saveSpells = (id: string, ids: string[]) =>
  requestJson(characterPath(id, "/spells"), { method: "PUT", body: JSON.stringify({ ids }) });
export const getPowers = (id: string) => requestJson<PowerPage>(characterPath(id, "/creation/powers"));
export const savePowers = (id: string, ids: string[]) =>
  requestJson(characterPath(id, "/powers"), { method: "PUT", body: JSON.stringify({ ids }) });

export const getClassChoices = (id: string) => requestJson<ClassChoicePage>(characterPath(id, "/creation/class-choices"));
export const saveClassChoices = (id: string, input: {
  favoredEnemyTypeId?: string | null;
  favoredEnemySubtypeId?: string | null;
  wizardSpecialization?: { schoolId: string; prohibitedSchoolIds: string[] } | null;
  psionDisciplineId?: string | null;
}) => requestJson(characterPath(id, "/class-choices"), { method: "PUT", body: JSON.stringify(input) });

export async function getDivine(id: string): Promise<DivinePage> {
  const [page, references] = await Promise.all([
    requestJson<DivinePage>(characterPath(id, "/creation/divine")),
    getCreatorReferenceOptions(),
  ]);
  return { ...page, deityDomainIds: references.deityDomainIds };
}
export const saveDivine = (id: string, deityId: string | null, domainIds: string[]) =>
  requestJson(characterPath(id, "/divine"), { method: "PUT", body: JSON.stringify({ deityId, domainIds }) });

export const getCompanions = (id: string) => requestJson<CompanionPage>(characterPath(id, "/creation/companions"));
export const saveCompanion = (id: string, creatureName: string | null, name?: string) =>
  requestJson(characterPath(id, "/companions"), {
    method: "PUT",
    body: JSON.stringify({ creatureName, ...(name?.trim() ? { name: name.trim() } : {}) }),
  });

export const getReadiness = (id: string) => requestJson<ReadinessPage>(characterPath(id, "/creation/readiness"));
export const finalizeCharacter = (id: string) =>
  requestJson<ReadyResult>(characterPath(id, "/ready"), { method: "POST" });
