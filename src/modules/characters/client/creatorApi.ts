import { offlineRequestJson } from "@/infrastructure/offline";

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
export type Alignment = "LG" | "NG" | "CG" | "LN" | "N" | "CN" | "LE" | "NE" | "CE";
export type ProgressionMode = "standard" | "gestalt";
export type PointBuyBudget = 22 | 32 | 52 | 72;
export type AbilityGenerationMethod =
  | "standard-array"
  | `point-buy-${PointBuyBudget}`
  | "roll-4d6-drop-lowest"
  | "roll-4d6-reroll-1-2";

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
  racialHitDie: number | null;
  naturalArmor: number;
  isHomebrew: boolean;
  abilityModifiers: Partial<Record<AbilityKey, number>>;
}

export interface ClassSkillSummary { id: string; slug: string; name: string }
export interface StartingWealthFormula { diceCount: number; dieSides: number; multiplierGp: number }
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
  classSkills: ClassSkillSummary[];
  startingWealth: StartingWealthFormula | null;
}

export interface CharacterCreationOptions {
  races: RaceOption[];
  classes: ClassOption[];
  alignments: Alignment[];
  maximumLevelAdjustment: number;
  progressionModes: ProgressionMode[];
  abilityGeneration: {
    standardArray: number[];
    pointBuyBudgets: PointBuyBudget[];
    rollMethods: Array<"roll-4d6-drop-lowest" | "roll-4d6-reroll-1-2">;
  };
}

export interface SkillOption {
  id: string;
  slug: string;
  name: string;
  ability: AbilityKey | null;
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
  classes?: Array<{ track: number; classId: string; className: string }>;
  options: SkillOption[];
  speakLanguageOptions?: Array<{ id: string; name: string }>;
  selections: Array<{ skillId: string; specialization: string; ranks: number }>;
}

export interface LanguageOption {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  script?: string | null;
  typicalSpeakers?: string | null;
  isSecret?: boolean;
}
export interface LanguagePage {
  automatic: Array<{ languageId: string; name: string; slug: string }>;
  bonusOptions: Array<{ languageId: string; name: string; slug: string }>;
  allOptions?: LanguageOption[];
  bonusChoicesRequired: number;
  druidicGranted: boolean;
  selected: Array<{ id: string; name: string }>;
}

export type FeatChoiceKind = "none" | "skill" | "weapon" | "school" | "spell" | "other";
export interface FeatOption {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  rulesText?: string | null;
  normalText?: string | null;
  specialText?: string | null;
  repeatabilityText?: string | null;
  repeatable: boolean;
  choiceKind: FeatChoiceKind;
  explanation: string | null;
}
export interface FeatChoiceOption { id: string; name: string; slug?: string }
export interface FeatPage {
  required: {
    level: number;
    racialBonus: number;
    classBonusFeatures: Array<{ id: string; slug: string; name: string; track?: number; classId?: string; classSlug?: string; className?: string }>;
  };
  classes?: Array<{ track: number; classId: string; classSlug: string; className: string }>;
  options: FeatOption[];
  choiceOptions?: Partial<Record<Exclude<FeatChoiceKind, "none" | "other">, FeatChoiceOption[]>>;
  selected: Array<{ id: string; featId: string; occurrence: number; grantKind: "level" | "race" | "class"; choices?: RuleChoice[] | null }>;
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
export interface EquipmentOption { id: string; slug: string; name: string; category: string; priceCopper: number; weightPounds: number | null }
export interface EquipmentPage {
  class: { id: string; slug: string; name: string };
  formula: StartingWealthFormula | null;
  wealth: WealthRow | null;
  inventory: Array<{ inventoryId: string; itemId: string; quantity: number; name: string; priceCopper: number | null }>;
  options: EquipmentOption[];
}

export interface SpellOption {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  rulesText?: string | null;
  schoolId: string;
  schoolSlug?: string;
  schoolName?: string;
  spellLevel: number;
  castingTime?: string | null;
  rangeText?: string | null;
  durationText?: string | null;
}
export interface SpellSection {
  track: number;
  classId: string;
  className: string;
  required: boolean;
  mode: "limited" | "all_list" | "spellbook" | "none" | null;
  automaticKnown?: boolean;
  automaticSpellIds?: string[];
  firstLevelChoicesRequired?: number;
  specialization?: { schoolId?: string; prohibitedSchoolIds: string[] };
  knownByLevel?: Record<string, number>;
  options: SpellOption[];
  selected: Array<{ spellId: string }>;
}
export interface SpellPage extends Omit<SpellSection, "track" | "className"> {
  track?: number;
  className?: string;
  sections?: SpellSection[];
}

export interface PowerOption {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  rulesText?: string | null;
  disciplineId?: string | null;
  disciplineName?: string | null;
  powerLevel: number;
  powerPoints?: number | null;
  manifestingTime?: string | null;
  rangeText?: string | null;
  durationText?: string | null;
  augmentationText?: string | null;
}
export interface PowerSection {
  track: number;
  classId: string;
  className: string;
  required: boolean;
  count: number;
  maximumPowerLevel: number;
  disciplineId?: string | null;
  options: PowerOption[];
  selected: Array<{ powerId: string }>;
}
export interface PowerPage extends Omit<PowerSection, "track" | "className" | "maximumPowerLevel"> {
  track?: number;
  className?: string;
  maximumPowerLevel?: number;
  sections?: PowerSection[];
}

export interface ChoiceOption { id: string; slug: string; name: string; specialistName?: string | null; alignments?: readonly string[]; classSkills?: readonly string[]; breathWeapon?: string }
export type ClassChoiceKind = "favored-enemy" | "school-specialization" | "psionic-discipline" | "totem-dragon" | null;
export interface ClassChoiceSection {
  track: number;
  characterClassLevelId?: string;
  classId: string;
  className: string;
  required: boolean;
  choice: ClassChoiceKind;
  options?: ChoiceOption[];
  schools?: ChoiceOption[];
  generalistAllowed?: boolean;
  subtypeRequiredFor?: string[];
  subtypeOptions?: Record<string, ChoiceOption[]>;
  selected: CharacterCreationChoice[];
}
export interface CharacterCreationChoice {
  choiceKey: string;
  contentId?: string | null;
  valueText?: string | null;
  characterClassLevelId?: string | null;
  parameters?: Record<string, unknown> | null;
}
export interface ClassChoicePage extends Omit<ClassChoiceSection, "track"> {
  track?: number;
  sections?: ClassChoiceSection[];
}

export interface DivinePage {
  required: boolean;
  reason?: string;
  alignment: Alignment;
  deityId: string | null;
  domains: Array<{ id: string; slug: string; name: string }>;
  deityOptions: Array<{ id: string; slug: string; name: string; alignment: Alignment | null; portfolio: string | null; symbol: string | null }>;
  domainOptions: Array<{ id: string; slug: string; name: string; grantedPowerText: string | null }>;
  deityOptional?: boolean;
  domainsRequired?: number;
  deityDomainIds?: Record<string, string[]>;
  classTrack?: number;
}

export interface CompanionSection {
  track: number;
  classId: string;
  className: string;
  required: boolean;
  mayDecline: boolean;
  kind: "familiar" | "animal_companion" | null;
  options: string[];
  selected: Array<{ id: string; classFeatureId?: string; kind: string; creatureName: string; name: string | null }>;
}
export interface CompanionPage extends Omit<CompanionSection, "track"> {
  track?: number;
  sections?: CompanionSection[];
}

export interface ReadinessPage { characterId: string; complete: boolean; missing: string[]; progress: Record<string, boolean> | null }
export interface ReadyResult { characterId: string; status: "ready"; maximumHitPoints: number; campaignStatus: string; creationComplete: boolean }

export interface CreatorReferenceOptions {
  languages: LanguageOption[];
  featChoiceOptions: Partial<Record<Exclude<FeatChoiceKind, "none" | "other">, FeatChoiceOption[]>>;
  deityDomainIds: Record<string, string[]>;
}

export interface CharacterLibraryItem {
  id: string;
  name: string;
  status: string;
  campaignId: string;
  campaignName: string;
  campaignStatus: string;
  updatedAt: string | number | Date;
  readyAt: string | number | Date | null;
  progressionMode: ProgressionMode | null;
  raceId: string | null;
  raceName: string | null;
  levelAdjustment: number | null;
  classes: Array<{ track: number; characterLevel: number; className: string }>;
}

export async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  return offlineRequestJson<T>(input, init);
}

const characterPath = (characterId: string, suffix = "") => `/api/characters/${encodeURIComponent(characterId)}${suffix}`;
let referenceOptionsPromise: Promise<CreatorReferenceOptions> | undefined;
function getCreatorReferenceOptions(): Promise<CreatorReferenceOptions> {
  referenceOptionsPromise ??= requestJson<CreatorReferenceOptions>("/api/dnd35/character-creation-reference-options").catch((error) => { referenceOptionsPromise = undefined; throw error; });
  return referenceOptionsPromise;
}

export async function listDraftCampaigns(): Promise<CampaignSummary[]> {
  const response = await requestJson<{ items: CampaignSummary[] }>("/api/campaigns");
  return response.items.filter((campaign) => (campaign.status === "draft" || campaign.status === "ready") && campaign.rulesetId === "dnd35" && campaign.rulesetVersion === "3.5");
}
export function createSoloCampaign(name: string): Promise<CampaignSummary> {
  return requestJson<CampaignSummary>("/api/campaigns", { method: "POST", body: JSON.stringify({ name, description: "Created from the D&D 3.5 character creator.", playMode: "solo", gameMasterMode: "ai", timeMode: "paused", visibility: "private" }) });
}
export function getCharacterCreationOptions(): Promise<CharacterCreationOptions> { return requestJson<CharacterCreationOptions>("/api/dnd35/character-creation-options"); }
export function rollAbilityScores(method: "roll-4d6-drop-lowest" | "roll-4d6-reroll-1-2") {
  return offlineRequestJson<{ method: string; scores: number[]; rolls: number[][] }>("/api/dnd35/ability-generation/roll", { method: "POST", body: JSON.stringify({ method }) }, { queueWhenOffline: false, onlineOnlyMessage: "Reconnect before rolling ability scores so the authoritative dice result can be recorded." });
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
  secondaryClass?: ClassOption;
  progressionMode: ProgressionMode;
  abilityGenerationMethod: AbilityGenerationMethod;
}): Promise<{ characterId: string }> {
  const selectedClasses = [input.characterClass, ...(input.progressionMode === "gestalt" && input.secondaryClass ? [input.secondaryClass] : [])];
  if (input.progressionMode === "gestalt" && !input.secondaryClass) throw new Error("Choose both gestalt classes.");
  if (input.secondaryClass?.id === input.characterClass.id) throw new Error("A gestalt character must choose two different classes.");
  for (const characterClass of selectedClasses) {
    if (!characterClass.allowedAlignments.includes(input.alignment)) throw new Error(characterClass.prerequisiteExplanation ?? `${characterClass.name} does not allow the selected alignment.`);
    if (!characterClass.startingWealth) throw new Error(`${characterClass.name} is missing a starting-wealth formula.`);
  }
  const character = await requestJson<{ id: string }>(`/api/campaigns/${encodeURIComponent(input.campaignId)}/characters`, {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      metadata: {
        ...(input.pronouns ? { pronouns: input.pronouns } : {}),
        ...(input.playerNotes ? { playerNotes: input.playerNotes } : {}),
        extensions: { creatorVersion: 3, creationMethod: input.abilityGenerationMethod, progressionMode: input.progressionMode },
      },
    }),
  });
  await requestJson(characterPath(character.id), { method: "PATCH", body: JSON.stringify({ raceId: input.raceId, alignment: input.alignment }) });
  await requestJson(characterPath(character.id, "/abilities"), { method: "PUT", body: JSON.stringify(input.abilities) });
  await requestJson(characterPath(character.id, "/progression-mode"), { method: "PUT", body: JSON.stringify({ mode: input.progressionMode }) });
  await requestJson(characterPath(character.id, "/class-levels"), { method: "POST", body: JSON.stringify({ classLevelId: input.characterClass.classLevelId, hitPointsGained: input.characterClass.firstLevelHitPoints, skillPointsSpent: 0, track: 1 }) });
  if (input.progressionMode === "gestalt" && input.secondaryClass) {
    await requestJson(characterPath(character.id, "/class-levels"), { method: "POST", body: JSON.stringify({ classLevelId: input.secondaryClass.classLevelId, hitPointsGained: input.secondaryClass.firstLevelHitPoints, skillPointsSpent: 0, track: 2 }) });
  }
  return { characterId: character.id };
}

export async function getSkills(id: string): Promise<SkillPage> {
  const [page, references] = await Promise.all([requestJson<SkillPage>(characterPath(id, "/creation/skills")), getCreatorReferenceOptions()]);
  return { ...page, speakLanguageOptions: references.languages.filter((language) => !language.isSecret).map(({ id: languageId, name }) => ({ id: languageId, name })) };
}
export const saveSkills = (id: string, selections: Array<{ skillId: string; specialization?: string; ranks: number }>) => requestJson(characterPath(id, "/skills"), { method: "PUT", body: JSON.stringify({ selections }) });
export const getLanguages = (id: string) => requestJson<LanguagePage>(characterPath(id, "/creation/languages"));
export const saveLanguages = (id: string, bonusLanguageIds: string[]) => requestJson(characterPath(id, "/languages"), { method: "PUT", body: JSON.stringify({ bonusLanguageIds }) });

export async function getFeats(id: string): Promise<FeatPage> {
  const [page, references] = await Promise.all([requestJson<FeatPage>(characterPath(id, "/creation/feats")), getCreatorReferenceOptions()]);
  return { ...page, choiceOptions: references.featChoiceOptions };
}
export const saveFeats = (id: string, input: { levelFeats: FeatSelection[]; racialBonusFeats: FeatSelection[]; classBonusFeats: ClassFeatSelection[] }) => requestJson(characterPath(id, "/feats"), { method: "PUT", body: JSON.stringify(input) });

export const getEquipment = (id: string) => requestJson<EquipmentPage>(characterPath(id, "/creation/equipment"));
export const rollStartingWealth = (id: string) => offlineRequestJson<{ startingWealthCopper?: number; startingGoldPieces?: number; wealth?: WealthRow; alreadyRolled?: boolean }>(characterPath(id, "/starting-wealth/roll"), { method: "POST" }, { queueWhenOffline: false, onlineOnlyMessage: "Reconnect before rolling starting wealth so the authoritative roll can be recorded." });
export const saveEquipment = (id: string, selections: Array<{ itemId: string; quantity: number }>) => requestJson<{ spentCopper: number; remainingCopper: number }>(characterPath(id, "/equipment"), { method: "PUT", body: JSON.stringify({ selections }) });

export const getSpells = (id: string) => requestJson<SpellPage>(characterPath(id, "/creation/spells"));
export const saveSpells = (id: string, idsOrTracks: string[] | Array<{ track: 1 | 2; ids: string[] }>) => requestJson(characterPath(id, "/spells"), { method: "PUT", body: JSON.stringify(Array.isArray(idsOrTracks) && (idsOrTracks.length === 0 || typeof idsOrTracks[0] === "string") ? { ids: idsOrTracks } : { tracks: idsOrTracks }) });
export const getPowers = (id: string) => requestJson<PowerPage>(characterPath(id, "/creation/powers"));
export const savePowers = (id: string, idsOrTracks: string[] | Array<{ track: 1 | 2; ids: string[] }>) => requestJson(characterPath(id, "/powers"), { method: "PUT", body: JSON.stringify(Array.isArray(idsOrTracks) && (idsOrTracks.length === 0 || typeof idsOrTracks[0] === "string") ? { ids: idsOrTracks } : { tracks: idsOrTracks }) });

export const getClassChoices = (id: string) => requestJson<ClassChoicePage>(characterPath(id, "/creation/class-choices"));
export const saveClassChoices = (id: string, input: {
  favoredEnemyTypeId?: string | null;
  favoredEnemySubtypeId?: string | null;
  wizardSpecialization?: { schoolId: string; prohibitedSchoolIds: string[] } | null;
  psionDisciplineId?: string | null;
  dragonShamanTotem?: string | null;
  trackChoices?: Array<{
    track: 1 | 2;
    favoredEnemyTypeId?: string | null;
    favoredEnemySubtypeId?: string | null;
    wizardSpecialization?: { schoolId: string; prohibitedSchoolIds: string[] } | null;
    psionDisciplineId?: string | null;
    dragonShamanTotem?: string | null;
  }>;
}) => requestJson(characterPath(id, "/class-choices"), { method: "PUT", body: JSON.stringify(input) });

export async function getDivine(id: string): Promise<DivinePage> {
  const [page, references] = await Promise.all([requestJson<DivinePage>(characterPath(id, "/creation/divine")), getCreatorReferenceOptions()]);
  return { ...page, deityDomainIds: references.deityDomainIds };
}
export const saveDivine = (id: string, deityId: string | null, domainIds: string[]) => requestJson(characterPath(id, "/divine"), { method: "PUT", body: JSON.stringify({ deityId, domainIds }) });
export const getCompanions = (id: string) => requestJson<CompanionPage>(characterPath(id, "/creation/companions"));
export const saveCompanion = (id: string, creatureName: string | null, name?: string, selections?: Array<{ track: 1 | 2; creatureName: string | null; name?: string }>) => requestJson(characterPath(id, "/companions"), { method: "PUT", body: JSON.stringify(selections ? { selections } : { creatureName, ...(name?.trim() ? { name: name.trim() } : {}) }) });
export const getReadiness = (id: string) => requestJson<ReadinessPage>(characterPath(id, "/creation/readiness"));
export const finalizeCharacter = (id: string) => offlineRequestJson<ReadyResult>(characterPath(id, "/ready"), { method: "POST" }, { queueWhenOffline: false, onlineOnlyMessage: "Reconnect before finalizing the character so readiness and hit points are validated authoritatively." });
export const listCharacters = async () => (await requestJson<{ items: CharacterLibraryItem[] }>("/api/characters")).items;
