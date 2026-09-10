/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import {
  characterAbilityScores,
  characterClassLevels,
  characterCreationChoices,
  characterCreationProgress,
  characterLanguages,
  characterSkills,
  classSkills,
  creatureTypes,
  dnd35Characters,
  languages,
  powerDisciplines,
  raceAbilities,
  raceClassSkills,
  raceLanguages,
  races,
  skills,
} from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import { abilityModifier } from "@/rulesets/dnd35";
import { ValidationError } from "@/server/middleware/errors";
import {
  dragonShamanTotemClassSkills,
  firstLevelBonusLanguageCount,
  psionDisciplineClassSkills,
} from "../domain/creationRules";
import {
  firstClassSkillPointBudget,
  racialSkillPointBudget,
} from "../domain/monsterRaceCreation";
import {
  ensureCreationProgress,
  markCreationStep,
  requireCharacterCreatorEditor,
  requireCharacterDatabase,
  requireFirstCharacterClasses,
  type CharacterDatabase,
} from "./creationAccess";

interface CharacterCreationBindings extends AuthEnv {
  DB?: D1Database;
}

type CharacterCreationEnv = { Bindings: CharacterCreationBindings };
type FirstClass = Awaited<ReturnType<typeof requireFirstCharacterClasses>>[number];

const skillSelectionSchema = z.object({
  skillId: z.string().trim().min(1),
  specialization: z.string().trim().max(120).optional(),
  ranks: z.number().positive().multipleOf(0.5),
});
const skillAllocationSchema = z.object({ selections: z.array(skillSelectionSchema).max(100) });
const languageSelectionSchema = z.object({ bonusLanguageIds: z.array(z.string().trim().min(1)).max(50) });

function normalizeSpecialization(value: string | undefined): string {
  return value?.trim() ?? "";
}

async function requireRaceAndIntelligence(db: CharacterDatabase, characterId: string) {
  const [extension, intelligenceRow] = await Promise.all([
    db
      .select({ raceId: dnd35Characters.raceId })
      .from(dnd35Characters)
      .where(eq(dnd35Characters.characterId, characterId))
      .get(),
    db
      .select({ baseScore: characterAbilityScores.baseScore })
      .from(characterAbilityScores)
      .where(
        and(
          eq(characterAbilityScores.characterId, characterId),
          eq(characterAbilityScores.ability, "int"),
        ),
      )
      .get(),
  ]);
  if (!extension?.raceId || intelligenceRow?.baseScore == null) {
    throw new ValidationError("Choose race and ability scores before completing this step.");
  }

  const [race, racialIntelligence] = await Promise.all([
    db
      .select({
        id: races.id,
        slug: races.slug,
        name: races.name,
        creatureTypeId: races.creatureTypeId,
        racialHitDice: races.racialHitDice,
        bonusSkillPointsPerLevel: races.bonusSkillPointsPerLevel,
      })
      .from(races)
      .where(eq(races.id, extension.raceId))
      .get(),
    db
      .select({ modifier: raceAbilities.modifier })
      .from(raceAbilities)
      .where(and(eq(raceAbilities.raceId, extension.raceId), eq(raceAbilities.ability, "int")))
      .get(),
  ]);
  if (!race) throw new ValidationError("Selected race is not available.");
  const creatureType = race.racialHitDice > 0 && race.creatureTypeId
    ? await db
        .select({ skillPointsPerHitDie: creatureTypes.skillPointsPerHitDie })
        .from(creatureTypes)
        .where(eq(creatureTypes.id, race.creatureTypeId))
        .get()
    : undefined;
  const effectiveIntelligence = intelligenceRow.baseScore + (racialIntelligence?.modifier ?? 0);
  return {
    race,
    creatureSkillPointsPerHitDie: creatureType?.skillPointsPerHitDie ?? null,
    effectiveIntelligence,
    intelligenceModifier: abilityModifier(effectiveIntelligence),
  };
}

async function addSkillsBySlug(
  db: CharacterDatabase,
  result: Set<string>,
  slugs: readonly string[],
  context: string,
) {
  if (slugs.length === 0) return;
  const rows = await db
    .select({ id: skills.id })
    .from(skills)
    .where(and(inArray(skills.slug, [...slugs]), eq(skills.isEnabled, true)))
    .all();
  if (rows.length !== new Set(slugs).size) {
    throw new ValidationError(`One or more ${context} class skills are missing from the rules catalog.`);
  }
  for (const { id } of rows) result.add(id);
}

async function classSkillIdSet(
  db: CharacterDatabase,
  characterId: string,
  firstClasses: FirstClass[],
  raceId: string,
): Promise<Set<string>> {
  const classIds = [...new Set(firstClasses.map(({ classId }) => classId))];
  const [baseRows, racialRows] = await Promise.all([
    db
      .select({ skillId: classSkills.skillId })
      .from(classSkills)
      .where(inArray(classSkills.classId, classIds))
      .all(),
    db
      .select({ skillId: raceClassSkills.skillId })
      .from(raceClassSkills)
      .where(eq(raceClassSkills.raceId, raceId))
      .all(),
  ]);
  const result = new Set([...baseRows, ...racialRows].map(({ skillId }) => skillId));

  if (firstClasses.some(({ classSlug }) => classSlug === "psion")) {
    const disciplineChoice = await db
      .select({ contentId: characterCreationChoices.contentId })
      .from(characterCreationChoices)
      .where(
        and(
          eq(characterCreationChoices.characterId, characterId),
          eq(characterCreationChoices.choiceKey, "psion-discipline"),
        ),
      )
      .get();
    if (!disciplineChoice?.contentId) {
      throw new ValidationError("Choose the psion's discipline before allocating skill points.");
    }
    const discipline = await db
      .select({ slug: powerDisciplines.slug })
      .from(powerDisciplines)
      .where(eq(powerDisciplines.id, disciplineChoice.contentId))
      .get();
    if (!discipline) throw new ValidationError("The selected psion discipline is unavailable.");
    const additionalSlugs = psionDisciplineClassSkills(discipline.slug);
    if (additionalSlugs.length === 0) {
      throw new ValidationError(`No class-skill mapping exists for psion discipline: ${discipline.slug}.`);
    }
    await addSkillsBySlug(db, result, additionalSlugs, "psion discipline");
  }

  if (firstClasses.some(({ classSlug }) => classSlug === "dragon-shaman")) {
    const totemChoice = await db
      .select({ valueText: characterCreationChoices.valueText })
      .from(characterCreationChoices)
      .where(
        and(
          eq(characterCreationChoices.characterId, characterId),
          eq(characterCreationChoices.choiceKey, "dragon-shaman-totem"),
        ),
      )
      .get();
    if (!totemChoice?.valueText) {
      throw new ValidationError("Choose the dragon shaman's totem dragon before allocating skill points.");
    }
    const additionalSlugs = dragonShamanTotemClassSkills(totemChoice.valueText);
    if (additionalSlugs.length === 0) throw new ValidationError("The selected totem dragon is unavailable.");
    await addSkillsBySlug(db, result, additionalSlugs, "dragon shaman totem");
  }
  return result;
}

function skillPointRate(firstClasses: FirstClass[]): number {
  return Math.max(...firstClasses.map(({ skillPointsPerLevel }) => skillPointsPerLevel));
}

function creatorSkillBudget(input: {
  racialHitDice: number;
  creatureSkillPointsPerHitDie: number | null;
  classSkillPointsPerLevel: number;
  intelligenceModifier: number;
  racialBonusSkillPointsPerLevel: number;
}) {
  const racialBudget = racialSkillPointBudget(
    input.racialHitDice,
    input.creatureSkillPointsPerHitDie,
    input.intelligenceModifier,
  );
  const classBudget = firstClassSkillPointBudget(
    input.racialHitDice,
    input.classSkillPointsPerLevel,
    input.intelligenceModifier,
    input.racialBonusSkillPointsPerLevel,
  );
  return { racialBudget, classBudget, budget: racialBudget + classBudget };
}

export const characterSkillLanguageRoutes = new Hono<CharacterCreationEnv>()
  .use("/api/characters/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/characters/:characterId/creation/skills", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const row = await requireCharacterCreatorEditor({ db, characterId: c.req.param("characterId"), userId: session.user.id });
    const firstClasses = await requireFirstCharacterClasses(db, row.character.id);
    const {
      race,
      creatureSkillPointsPerHitDie,
      effectiveIntelligence,
      intelligenceModifier,
    } = await requireRaceAndIntelligence(db, row.character.id);
    const [classSkillIds, availableSkills, selections] = await Promise.all([
      classSkillIdSet(db, row.character.id, firstClasses, race.id),
      db
        .select({
          id: skills.id,
          slug: skills.slug,
          name: skills.name,
          ability: skills.ability,
          trainedOnly: skills.trainedOnly,
          armorCheckMultiplier: skills.armorCheckMultiplier,
          requiresSpecialization: skills.requiresSpecialization,
        })
        .from(skills)
        .where(and(eq(skills.isEnabled, true), or(isNull(skills.ownerUserId), eq(skills.ownerUserId, session.user.id))))
        .orderBy(asc(skills.name))
        .all(),
      db.select().from(characterSkills).where(eq(characterSkills.characterId, row.character.id)).all(),
    ]);
    const budgets = creatorSkillBudget({
      racialHitDice: race.racialHitDice,
      creatureSkillPointsPerHitDie,
      classSkillPointsPerLevel: skillPointRate(firstClasses),
      intelligenceModifier,
      racialBonusSkillPointsPerLevel: Math.max(0, race.bonusSkillPointsPerLevel),
    });
    const classLevel = Math.max(...firstClasses.map(({ characterLevel }) => characterLevel));
    const totalHitDice = race.racialHitDice + classLevel;
    return c.json({
      budget: budgets.budget,
      racialBudget: budgets.racialBudget,
      classBudget: budgets.classBudget,
      racialHitDice: race.racialHitDice,
      totalHitDice,
      effectiveIntelligence,
      intelligenceModifier,
      classId: firstClasses[0]!.classId,
      className: firstClasses.map(({ className }) => className).join(" / "),
      classes: firstClasses.map(({ track, classId, className }) => ({ track, classId, className })),
      options: availableSkills.map((skill) => ({
        ...skill,
        isClassSkill: classSkillIds.has(skill.id),
        maximumRanks: classSkillIds.has(skill.id) ? totalHitDice + 3 : (totalHitDice + 3) / 2,
        pointCostPerRank: classSkillIds.has(skill.id) ? 1 : 2,
      })),
      selections,
    });
  })
  .put(
    "/api/characters/:characterId/skills",
    zValidator("json", skillAllocationSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const input = c.req.valid("json");
      const db = createDatabase(requireCharacterDatabase(c.env.DB));
      const row = await requireCharacterCreatorEditor({ db, characterId: c.req.param("characterId"), userId: session.user.id });
      const firstClasses = await requireFirstCharacterClasses(db, row.character.id);
      const {
        race,
        creatureSkillPointsPerHitDie,
        effectiveIntelligence,
        intelligenceModifier,
      } = await requireRaceAndIntelligence(db, row.character.id);
      const [classSkillIds, availableSkills, availableLanguages] = await Promise.all([
        classSkillIdSet(db, row.character.id, firstClasses, race.id),
        db
          .select({ id: skills.id, slug: skills.slug, name: skills.name, requiresSpecialization: skills.requiresSpecialization })
          .from(skills)
          .where(and(eq(skills.isEnabled, true), or(isNull(skills.ownerUserId), eq(skills.ownerUserId, session.user.id))))
          .all(),
        db
          .select({ id: languages.id, name: languages.name, isSecret: languages.isSecret })
          .from(languages)
          .where(and(eq(languages.isEnabled, true), or(isNull(languages.ownerUserId), eq(languages.ownerUserId, session.user.id))))
          .all(),
      ]);

      const budgets = creatorSkillBudget({
        racialHitDice: race.racialHitDice,
        creatureSkillPointsPerHitDie,
        classSkillPointsPerLevel: skillPointRate(firstClasses),
        intelligenceModifier,
        racialBonusSkillPointsPerLevel: Math.max(0, race.bonusSkillPointsPerLevel),
      });
      const classLevel = Math.max(...firstClasses.map(({ characterLevel }) => characterLevel));
      const totalHitDice = race.racialHitDice + classLevel;
      const skillsById = new Map(availableSkills.map((skill) => [skill.id, skill]));
      const languagesById = new Map(availableLanguages.map((language) => [language.id, language]));
      const seen = new Set<string>();
      let spent = 0;

      const values = input.selections.map((selection) => {
        const skill = skillsById.get(selection.skillId);
        if (!skill) throw new ValidationError(`Skill is not available: ${selection.skillId}.`);
        const specialization = normalizeSpecialization(selection.specialization);
        if (skill.requiresSpecialization && !specialization) throw new ValidationError(`${skill.name} requires a specialization.`);
        if (!skill.requiresSpecialization && specialization) throw new ValidationError(`${skill.name} does not accept a specialization.`);
        if (skill.slug === "speak-language") {
          if (selection.ranks !== 1) throw new ValidationError("Each Speak Language selection purchases exactly one language.");
          const language = languagesById.get(specialization);
          if (!language || language.isSecret) throw new ValidationError("Speak Language must select an available non-secret language.");
        }
        const uniqueKey = `${selection.skillId}\u0000${specialization.toLocaleLowerCase()}`;
        if (seen.has(uniqueKey)) throw new ValidationError(`Duplicate skill selection: ${skill.name}.`);
        seen.add(uniqueKey);

        const isClassSkill = classSkillIds.has(selection.skillId);
        const maximumRanks = isClassSkill ? totalHitDice + 3 : (totalHitDice + 3) / 2;
        if (selection.ranks > maximumRanks) {
          throw new ValidationError(`${skill.name} exceeds the ${totalHitDice}-HD ${isClassSkill ? "class" : "cross-class"} rank cap of ${maximumRanks}.`);
        }
        if (isClassSkill && !Number.isInteger(selection.ranks)) throw new ValidationError(`${skill.name} class-skill ranks must be whole numbers.`);
        spent += isClassSkill ? selection.ranks : selection.ranks * 2;
        return { characterId: row.character.id, skillId: selection.skillId, specialization, ranks: selection.ranks };
      });

      if (!Number.isInteger(spent) || spent !== budgets.budget) {
        throw new ValidationError(`Spend exactly ${budgets.budget} creation skill points.`, {
          budget: budgets.budget,
          racialBudget: budgets.racialBudget,
          classBudget: budgets.classBudget,
          spent,
          remaining: budgets.budget - spent,
        });
      }
      if (values.length === 0) throw new ValidationError("At least one trained skill is required at character creation.");

      await db.delete(characterSkills).where(eq(characterSkills.characterId, row.character.id)).run();
      await db.insert(characterSkills).values(values).run();
      await db
        .update(characterClassLevels)
        .set({ skillPointsSpent: budgets.classBudget, updatedAt: new Date() })
        .where(inArray(characterClassLevels.id, firstClasses.map(({ characterClassLevelId }) => characterClassLevelId)))
        .run();
      await ensureCreationProgress(db, row.character.id);
      await db
        .update(characterCreationProgress)
        .set({ skillsFinalized: true, languagesFinalized: false, updatedAt: new Date() })
        .where(eq(characterCreationProgress.characterId, row.character.id))
        .run();

      return c.json({
        characterId: row.character.id,
        effectiveIntelligence,
        intelligenceModifier,
        budget: budgets.budget,
        racialBudget: budgets.racialBudget,
        classBudget: budgets.classBudget,
        racialHitDice: race.racialHitDice,
        totalHitDice,
        spent,
        selections: values.map(({ skillId, specialization, ranks }) => ({ skillId, specialization, ranks, isClassSkill: classSkillIds.has(skillId) })),
      });
    },
  )
  .get("/api/characters/:characterId/creation/languages", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const row = await requireCharacterCreatorEditor({ db, characterId: c.req.param("characterId"), userId: session.user.id });
    const firstClasses = await requireFirstCharacterClasses(db, row.character.id);
    const { race, effectiveIntelligence } = await requireRaceAndIntelligence(db, row.character.id);
    const [access, selected, allLanguages] = await Promise.all([
      db
        .select({ languageId: raceLanguages.languageId, kind: raceLanguages.kind, name: languages.name, slug: languages.slug, isSecret: languages.isSecret })
        .from(raceLanguages)
        .innerJoin(languages, eq(raceLanguages.languageId, languages.id))
        .where(eq(raceLanguages.raceId, race.id))
        .orderBy(asc(languages.name))
        .all(),
      db
        .select({ id: characterLanguages.languageId, name: languages.name })
        .from(characterLanguages)
        .innerJoin(languages, eq(characterLanguages.languageId, languages.id))
        .where(eq(characterLanguages.characterId, row.character.id))
        .all(),
      db
        .select({ id: languages.id, slug: languages.slug, name: languages.name, description: languages.description, script: languages.script, typicalSpeakers: languages.typicalSpeakers, isSecret: languages.isSecret })
        .from(languages)
        .where(and(eq(languages.isEnabled, true), or(isNull(languages.ownerUserId), eq(languages.ownerUserId, session.user.id))))
        .orderBy(asc(languages.name))
        .all(),
    ]);
    const bonusOptions = access.filter((entry) => entry.kind === "bonus" && !entry.isSecret);
    return c.json({
      automatic: access.filter((entry) => entry.kind === "automatic"),
      bonusOptions,
      allOptions: allLanguages,
      bonusChoicesRequired: Math.min(firstLevelBonusLanguageCount(effectiveIntelligence), bonusOptions.length),
      druidicGranted: firstClasses.some(({ classSlug }) => classSlug === "druid"),
      selected,
    });
  })
  .put(
    "/api/characters/:characterId/languages",
    zValidator("json", languageSelectionSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const input = c.req.valid("json");
      const db = createDatabase(requireCharacterDatabase(c.env.DB));
      const row = await requireCharacterCreatorEditor({ db, characterId: c.req.param("characterId"), userId: session.user.id });
      const firstClasses = await requireFirstCharacterClasses(db, row.character.id);
      const { race, effectiveIntelligence } = await requireRaceAndIntelligence(db, row.character.id);
      const [access, speakLanguageRows, druidic] = await Promise.all([
        db.select({ languageId: raceLanguages.languageId, kind: raceLanguages.kind }).from(raceLanguages).where(eq(raceLanguages.raceId, race.id)).all(),
        db
          .select({ languageId: characterSkills.specialization })
          .from(characterSkills)
          .innerJoin(skills, eq(characterSkills.skillId, skills.id))
          .where(and(eq(characterSkills.characterId, row.character.id), eq(skills.slug, "speak-language")))
          .all(),
        db.select({ id: languages.id }).from(languages).where(and(eq(languages.slug, "druidic"), eq(languages.isEnabled, true))).get(),
      ]);

      const automatic = access.filter((entry) => entry.kind === "automatic").map((entry) => entry.languageId);
      const bonusAllowed = new Set(access.filter((entry) => entry.kind === "bonus").map((entry) => entry.languageId));
      const uniqueBonus = new Set(input.bonusLanguageIds);
      const required = Math.min(firstLevelBonusLanguageCount(effectiveIntelligence), bonusAllowed.size);
      if (uniqueBonus.size !== input.bonusLanguageIds.length) throw new ValidationError("Bonus language choices must be unique.");
      if (uniqueBonus.size !== required) throw new ValidationError(`Choose exactly ${required} bonus language${required === 1 ? "" : "s"}.`);
      for (const languageId of uniqueBonus) {
        if (!bonusAllowed.has(languageId)) throw new ValidationError(`Language is not an available racial bonus language: ${languageId}.`);
      }

      const selected = new Set<string>([
        ...automatic,
        ...uniqueBonus,
        ...speakLanguageRows.map(({ languageId }) => languageId).filter(Boolean),
      ]);
      if (firstClasses.some(({ classSlug }) => classSlug === "druid")) {
        if (!druidic) throw new ValidationError("The Druidic language is unavailable in the rules catalog.");
        selected.add(druidic.id);
      }
      const values = [...selected].map((languageId) => ({ characterId: row.character.id, languageId }));
      if (values.length === 0) throw new ValidationError("The selected race grants no automatic language.");
      await db.delete(characterLanguages).where(eq(characterLanguages.characterId, row.character.id)).run();
      await db.insert(characterLanguages).values(values).run();
      await markCreationStep(db, row.character.id, "languagesFinalized");
      return c.json({ characterId: row.character.id, languageIds: [...selected], bonusChoices: required });
    },
  );