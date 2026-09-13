import { and, eq, inArray } from "drizzle-orm";
import { createDatabase } from "@/infrastructure/database/client";
import {
  characterAbilityScores,
  characterFeats,
  characterSkills,
  classFeatureGrants,
  classFeatures,
  classSpellcasting,
  classSpellcastingProgression,
  creatureTypes,
  items,
  raceAbilities,
  skills,
  weapons,
  type RuleChoice,
} from "@/infrastructure/database/schema";
import {
  evaluateDnd35Prerequisite,
  type Dnd35Alignment,
  type Dnd35PrerequisiteExpression,
  type Dnd35PrerequisiteFacts,
  type Dnd35RuleExtension,
} from "@/rulesets/dnd35/prerequisites";
import { racialBaseBonuses } from "../domain/monsterRaceCreation";

type CharacterDatabase = ReturnType<typeof createDatabase>;

export interface FirstClassEligibilityFacts {
  classId: string;
  classSlug: string;
  classLevelId: string;
  baseAttackBonus: number;
  fort: number;
  ref: number;
  will: number;
  powersKnown: number | null;
  basePowerPoints: number | null;
}

export interface FeatEligibilityOption {
  prerequisite: unknown;
}

function classHasWeaponProficiency(classSlug: string, weapon: { proficiency: string; slug: string }): boolean {
  if (weapon.proficiency === "simple") return !["monk", "wizard"].includes(classSlug);
  if (weapon.proficiency === "martial") {
    if (["barbarian", "fighter", "paladin", "ranger", "duskblade", "knight", "dragon-shaman", "psychic-warrior"].includes(classSlug)) return true;
    if (classSlug === "bard") return ["longsword", "rapier", "sap", "short-sword", "shortbow", "whip"].includes(weapon.slug);
    if (classSlug === "rogue") return ["rapier", "sap", "shortbow", "short-sword"].includes(weapon.slug);
    return false;
  }
  if (classSlug === "wizard") return ["club", "dagger", "heavy-crossbow", "light-crossbow", "quarterstaff"].includes(weapon.slug);
  if (classSlug === "monk") return ["club", "light-crossbow", "heavy-crossbow", "dagger", "handaxe", "javelin", "kama", "nunchaku", "quarterstaff", "sai", "shuriken", "siangham", "sling"].includes(weapon.slug);
  return false;
}

function primaryStoredChoice(choices: RuleChoice[] | null): string | undefined {
  for (const choice of choices ?? []) {
    if (choice.contentId) return choice.contentId;
    if (choice.text) return choice.text;
  }
  return undefined;
}

export async function filterQualifiedFeatOptions<T extends FeatEligibilityOption>(input: {
  db: CharacterDatabase;
  characterId: string;
  raceId: string;
  raceSlug: string;
  creatureTypeId: string | null;
  racialHitDice: number;
  alignment: Dnd35Alignment | null;
  firstClasses: FirstClassEligibilityFacts[];
  options: T[];
}): Promise<T[]> {
  const { db, characterId, raceId, raceSlug, creatureTypeId, racialHitDice, alignment, firstClasses, options } = input;
  const classLevelIds = firstClasses.map(({ classLevelId }) => classLevelId);
  const classIds = firstClasses.map(({ classId }) => classId);

  const [baseAbilities, racialModifiers, skillRows, featureRows, spellcastingRows, storedFeats, allWeapons] = await Promise.all([
    db.select({ ability: characterAbilityScores.ability, baseScore: characterAbilityScores.baseScore }).from(characterAbilityScores).where(eq(characterAbilityScores.characterId, characterId)).all(),
    db.select({ ability: raceAbilities.ability, modifier: raceAbilities.modifier }).from(raceAbilities).where(eq(raceAbilities.raceId, raceId)).all(),
    db.select({ skillId: characterSkills.skillId, specialization: characterSkills.specialization, ranks: characterSkills.ranks, skillName: skills.name }).from(characterSkills).innerJoin(skills, eq(characterSkills.skillId, skills.id)).where(eq(characterSkills.characterId, characterId)).all(),
    db.select({ id: classFeatures.id, slug: classFeatures.slug }).from(classFeatureGrants).innerJoin(classFeatures, eq(classFeatureGrants.classFeatureId, classFeatures.id)).where(inArray(classFeatureGrants.classLevelId, classLevelIds)).all(),
    db.select({ id: classSpellcasting.id, classId: classSpellcasting.classId, tradition: classSpellcasting.tradition, castingMode: classSpellcasting.castingMode, casterLevelNumerator: classSpellcasting.casterLevelNumerator, casterLevelDenominator: classSpellcasting.casterLevelDenominator }).from(classSpellcasting).where(inArray(classSpellcasting.classId, classIds)).all(),
    db.select({ featId: characterFeats.featId, choices: characterFeats.choices }).from(characterFeats).where(eq(characterFeats.characterId, characterId)).all(),
    db.select({ id: weapons.itemId, proficiency: weapons.proficiency, slug: items.slug }).from(weapons).innerJoin(items, eq(weapons.itemId, items.id)).all(),
  ]);

  if (baseAbilities.length !== 6 || baseAbilities.some(({ baseScore }) => baseScore === null)) return [];

  const effectiveAbilities = Object.fromEntries(
    baseAbilities.map(({ ability, baseScore }) => [
      ability,
      baseScore! + (racialModifiers.find((modifier) => modifier.ability === ability)?.modifier ?? 0),
    ]),
  ) as Dnd35PrerequisiteFacts["abilities"];

  const selectedFeatFacts = storedFeats.map(({ featId, choices }) => {
    const choice = primaryStoredChoice(choices as RuleChoice[] | null);
    return choice ? { featId, choice } : { featId };
  });
  if (firstClasses.some(({ classSlug }) => classSlug === "monk")) {
    selectedFeatFacts.push({ featId: "phb-feat-improved-unarmed-strike" });
  }

  const skillRanks: Record<string, number> = {};
  const skillRanksByName = new Map<string, number>();
  for (const skill of skillRows) {
    skillRanks[skill.skillId] = Math.max(skillRanks[skill.skillId] ?? 0, skill.ranks);
    skillRanks[`${skill.skillId}:${skill.specialization}`] = skill.ranks;
    skillRanksByName.set(
      skill.skillName.toLocaleLowerCase(),
      Math.max(skillRanksByName.get(skill.skillName.toLocaleLowerCase()) ?? 0, skill.ranks),
    );
  }

  const featureFacts = Object.fromEntries(featureRows.map(({ id }) => [id, 1]));
  const hasTurning = featureRows.some(({ slug }) => slug.includes("turn-rebuke"));

  const spellAccess: Array<{ level: number; tradition: "arcane" | "divine" | "psionic" | "other"; classId: string }> = [];
  const classCasterLevels: Record<string, number> = {};
  for (const casting of spellcastingRows) {
    if (casting.castingMode === "psionic") continue;
    const progression = await db
      .select({ spellLevel: classSpellcastingProgression.spellLevel })
      .from(classSpellcastingProgression)
      .where(and(eq(classSpellcastingProgression.classId, casting.classId), eq(classSpellcastingProgression.classLevel, 1)))
      .all();
    const maximum = progression.reduce((value, entry) => Math.max(value, entry.spellLevel), -1);
    const casterLevel = maximum >= 0 ? Math.floor(casting.casterLevelNumerator / casting.casterLevelDenominator) : 0;
    classCasterLevels[casting.classId] = casterLevel;
    if (maximum >= 0) spellAccess.push({ level: maximum, tradition: casting.tradition, classId: casting.classId });
  }
  const casterLevel = Math.max(0, ...Object.values(classCasterLevels));
  const classManifesterLevels = Object.fromEntries(
    firstClasses.map((characterClass) => [
      characterClass.classId,
      characterClass.powersKnown !== null || characterClass.basePowerPoints !== null ? 1 : 0,
    ]),
  );
  const manifesterLevel = Math.max(0, ...Object.values(classManifesterLevels));

  const creatureType = racialHitDice > 0 && creatureTypeId
    ? await db
        .select({
          hitDie: creatureTypes.hitDie,
          skillPointsPerHitDie: creatureTypes.skillPointsPerHitDie,
          babProgression: creatureTypes.babProgression,
          fortProgression: creatureTypes.fortProgression,
          refProgression: creatureTypes.refProgression,
          willProgression: creatureTypes.willProgression,
        })
        .from(creatureTypes)
        .where(eq(creatureTypes.id, creatureTypeId))
        .get()
    : undefined;
  const racialBonuses = racialBaseBonuses({
    raceSlug,
    racialHitDice,
    racialHitDie: creatureType?.hitDie ?? null,
    levelAdjustment: 0,
    creatureSkillPointsPerHitDie: creatureType?.skillPointsPerHitDie ?? null,
    creatureBabProgression: creatureType?.babProgression ?? null,
    creatureFortProgression: creatureType?.fortProgression ?? null,
    creatureRefProgression: creatureType?.refProgression ?? null,
    creatureWillProgression: creatureType?.willProgression ?? null,
  });
  const baseAttackBonus = racialBonuses.baseAttackBonus + Math.max(...firstClasses.map(({ baseAttackBonus }) => baseAttackBonus));
  const saves = {
    fort: racialBonuses.fort + Math.max(...firstClasses.map(({ fort }) => fort)),
    ref: racialBonuses.ref + Math.max(...firstClasses.map(({ ref }) => ref)),
    will: racialBonuses.will + Math.max(...firstClasses.map(({ will }) => will)),
  };

  const commonFacts: Omit<Dnd35PrerequisiteFacts, "evaluateCustom"> = {
    abilities: effectiveAbilities,
    characterLevel: racialHitDice + 1,
    baseAttackBonus,
    casterLevel,
    manifesterLevel,
    classLevels: Object.fromEntries(firstClasses.map((characterClass) => [characterClass.classId, 1])),
    classBaseAttackBonuses: Object.fromEntries(firstClasses.map((characterClass) => [characterClass.classId, characterClass.baseAttackBonus])),
    classCasterLevels,
    classManifesterLevels,
    saves,
    feats: selectedFeatFacts,
    skillRanks,
    spellLevelAccess: spellAccess,
    raceId,
    ...(creatureTypeId ? { creatureTypeId } : {}),
    ...(alignment ? { alignment } : {}),
    classFeatures: featureFacts,
  };

  const hasAnyProficientWeapon = allWeapons.some((weapon) =>
    firstClasses.some(({ classSlug }) => classHasWeaponProficiency(classSlug, weapon)),
  );

  function evaluateCustom(extensionRule: Dnd35RuleExtension): boolean {
    const parameters = extensionRule.parameters;
    if (extensionRule.key === "dnd35.prerequisite.turn-or-rebuke") return hasTurning;
    if (extensionRule.key === "dnd35.prerequisite.skill-ranks") {
      const skillName = parameters["skill"];
      const minimum = parameters["minimum"];
      return typeof skillName === "string" && typeof minimum === "number" && (skillRanksByName.get(skillName.toLocaleLowerCase()) ?? 0) >= minimum;
    }
    if (extensionRule.key === "dnd35.prerequisite.weapon-proficiency") return hasAnyProficientWeapon;
    if (extensionRule.key === "dnd35.prerequisite.selected-feat") {
      const featId = parameters["featId"];
      const requiredChoice = parameters["choice"];
      if (typeof featId !== "string") return false;
      return selectedFeatFacts.some((fact) => fact.featId === featId && (typeof requiredChoice !== "string" || fact.choice === requiredChoice));
    }
    if (extensionRule.key === "dnd35.prerequisite.selected-weapon-feat") {
      const required = parameters["featId"];
      const requiredMany = parameters["featIds"];
      const requiredIds = typeof required === "string"
        ? [required]
        : Array.isArray(requiredMany)
          ? requiredMany.filter((value): value is string => typeof value === "string")
          : [];
      if (requiredIds.length === 0) return false;
      const firstChoices = selectedFeatFacts.filter((fact) => requiredIds.includes(fact.featId) && fact.choice).map((fact) => fact.choice!);
      return firstChoices.some((choice) => requiredIds.every((featId) => selectedFeatFacts.some((fact) => fact.featId === featId && fact.choice === choice)));
    }
    return false;
  }

  return options.filter((option) => {
    if (!option.prerequisite) return true;
    const evaluation = evaluateDnd35Prerequisite(option.prerequisite as Dnd35PrerequisiteExpression, {
      ...commonFacts,
      evaluateCustom: (rule) => evaluateCustom(rule),
    });
    return evaluation.passed;
  });
}
