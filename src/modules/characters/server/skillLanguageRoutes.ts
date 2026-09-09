/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { and, asc, eq, isNull, or } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import {
  characterAbilityScores,
  characterClassLevels,
  characterCreationProgress,
  characterLanguages,
  characterSkills,
  classSkills,
  dnd35Characters,
  languages,
  raceAbilities,
  raceLanguages,
  races,
  skills,
} from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import { abilityModifier } from "@/rulesets/dnd35";
import { ValidationError } from "@/server/middleware/errors";
import { firstLevelBonusLanguageCount } from "../domain/creationRules";
import {
  ensureCreationProgress,
  markCreationStep,
  requireCharacterCreatorEditor,
  requireCharacterDatabase,
  requireFirstCharacterClass,
} from "./creationAccess";

interface CharacterCreationBindings extends AuthEnv {
  DB?: D1Database;
}

type CharacterCreationEnv = { Bindings: CharacterCreationBindings };

const skillSelectionSchema = z.object({
  skillId: z.string().trim().min(1),
  specialization: z.string().trim().max(120).optional(),
  ranks: z.number().positive().multipleOf(0.5),
});

const skillAllocationSchema = z.object({
  selections: z.array(skillSelectionSchema).max(100),
});

const languageSelectionSchema = z.object({
  bonusLanguageIds: z.array(z.string().trim().min(1)).max(50),
});

function normalizeSpecialization(value: string | undefined): string {
  return value?.trim() ?? "";
}

async function requireRaceAndIntelligence(
  db: ReturnType<typeof createDatabase>,
  characterId: string,
) {
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
        name: races.name,
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

  const effectiveIntelligence = intelligenceRow.baseScore + (racialIntelligence?.modifier ?? 0);
  return { race, effectiveIntelligence, intelligenceModifier: abilityModifier(effectiveIntelligence) };
}

export const characterSkillLanguageRoutes = new Hono<CharacterCreationEnv>()
  .use("/api/characters/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/characters/:characterId/creation/skills", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const row = await requireCharacterCreatorEditor({
      db,
      characterId: c.req.param("characterId"),
      userId: session.user.id,
    });
    const firstClass = await requireFirstCharacterClass(db, row.character.id);
    const { race, effectiveIntelligence, intelligenceModifier } = await requireRaceAndIntelligence(
      db,
      row.character.id,
    );
    const [classSkillRows, availableSkills, selections] = await Promise.all([
      db
        .select({ skillId: classSkills.skillId })
        .from(classSkills)
        .where(eq(classSkills.classId, firstClass.classId))
        .all(),
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
        .where(
          and(
            eq(skills.isEnabled, true),
            or(isNull(skills.ownerUserId), eq(skills.ownerUserId, session.user.id)),
          ),
        )
        .orderBy(asc(skills.name))
        .all(),
      db
        .select()
        .from(characterSkills)
        .where(eq(characterSkills.characterId, row.character.id))
        .all(),
    ]);
    const budget =
      (Math.max(1, firstClass.skillPointsPerLevel + intelligenceModifier) +
        Math.max(0, race.bonusSkillPointsPerLevel)) *
      4;
    const classSkillIds = new Set(classSkillRows.map(({ skillId }) => skillId));
    return c.json({
      budget,
      effectiveIntelligence,
      intelligenceModifier,
      classId: firstClass.classId,
      className: firstClass.className,
      options: availableSkills.map((skill) => ({
        ...skill,
        isClassSkill: classSkillIds.has(skill.id),
        maximumRanks: classSkillIds.has(skill.id)
          ? firstClass.characterLevel + 3
          : (firstClass.characterLevel + 3) / 2,
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
      const row = await requireCharacterCreatorEditor({
        db,
        characterId: c.req.param("characterId"),
        userId: session.user.id,
      });
      const firstClass = await requireFirstCharacterClass(db, row.character.id);
      const { race, effectiveIntelligence, intelligenceModifier } = await requireRaceAndIntelligence(
        db,
        row.character.id,
      );

      const [classSkillRows, availableSkills, availableLanguages] = await Promise.all([
        db
          .select({ skillId: classSkills.skillId })
          .from(classSkills)
          .where(eq(classSkills.classId, firstClass.classId))
          .all(),
        db
          .select({
            id: skills.id,
            slug: skills.slug,
            name: skills.name,
            requiresSpecialization: skills.requiresSpecialization,
          })
          .from(skills)
          .where(
            and(
              eq(skills.isEnabled, true),
              or(isNull(skills.ownerUserId), eq(skills.ownerUserId, session.user.id)),
            ),
          )
          .all(),
        db
          .select({ id: languages.id, name: languages.name, isSecret: languages.isSecret })
          .from(languages)
          .where(
            and(
              eq(languages.isEnabled, true),
              or(isNull(languages.ownerUserId), eq(languages.ownerUserId, session.user.id)),
            ),
          )
          .all(),
      ]);

      const budget =
        (Math.max(1, firstClass.skillPointsPerLevel + intelligenceModifier) +
          Math.max(0, race.bonusSkillPointsPerLevel)) *
        4;
      const classSkillIds = new Set(classSkillRows.map(({ skillId }) => skillId));
      const skillsById = new Map(availableSkills.map((skill) => [skill.id, skill]));
      const languagesById = new Map(availableLanguages.map((language) => [language.id, language]));
      const seen = new Set<string>();
      let spent = 0;

      const values = input.selections.map((selection) => {
        const skill = skillsById.get(selection.skillId);
        if (!skill) throw new ValidationError(`Skill is not available: ${selection.skillId}.`);

        const specialization = normalizeSpecialization(selection.specialization);
        if (skill.requiresSpecialization && !specialization) {
          throw new ValidationError(`${skill.name} requires a specialization.`);
        }
        if (!skill.requiresSpecialization && specialization) {
          throw new ValidationError(`${skill.name} does not accept a specialization.`);
        }
        if (skill.slug === "speak-language") {
          if (selection.ranks !== 1) {
            throw new ValidationError("Each Speak Language selection purchases exactly one language.");
          }
          const language = languagesById.get(specialization);
          if (!language || language.isSecret) {
            throw new ValidationError("Speak Language must select an available non-secret language.");
          }
        }

        const uniqueKey = `${selection.skillId}\u0000${specialization.toLocaleLowerCase()}`;
        if (seen.has(uniqueKey)) {
          throw new ValidationError(`Duplicate skill selection: ${skill.name}.`);
        }
        seen.add(uniqueKey);

        const isClassSkill = classSkillIds.has(selection.skillId);
        const maximumRanks = isClassSkill
          ? firstClass.characterLevel + 3
          : (firstClass.characterLevel + 3) / 2;
        if (selection.ranks > maximumRanks) {
          throw new ValidationError(
            `${skill.name} exceeds the level-${firstClass.characterLevel} ${isClassSkill ? "class" : "cross-class"} rank cap of ${maximumRanks}.`,
          );
        }
        if (isClassSkill && !Number.isInteger(selection.ranks)) {
          throw new ValidationError(`${skill.name} class-skill ranks must be whole numbers.`);
        }

        spent += isClassSkill ? selection.ranks : selection.ranks * 2;
        return {
          characterId: row.character.id,
          skillId: selection.skillId,
          specialization,
          ranks: selection.ranks,
        };
      });

      if (!Number.isInteger(spent) || spent !== budget) {
        throw new ValidationError(`Spend exactly ${budget} first-level skill points.`, {
          budget,
          spent,
          remaining: budget - spent,
        });
      }
      if (values.length === 0) {
        throw new ValidationError("At least one trained skill is required at first level.");
      }

      await db.batch([
        db.delete(characterSkills).where(eq(characterSkills.characterId, row.character.id)),
        db.insert(characterSkills).values(values),
        db
          .update(characterClassLevels)
          .set({ skillPointsSpent: budget, updatedAt: new Date() })
          .where(eq(characterClassLevels.id, firstClass.characterClassLevelId)),
      ]);
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
        budget,
        spent,
        selections: values.map(({ skillId, specialization, ranks }) => ({
          skillId,
          specialization,
          ranks,
          isClassSkill: classSkillIds.has(skillId),
        })),
      });
    },
  )
  .get("/api/characters/:characterId/creation/languages", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const row = await requireCharacterCreatorEditor({
      db,
      characterId: c.req.param("characterId"),
      userId: session.user.id,
    });
    const firstClass = await requireFirstCharacterClass(db, row.character.id);
    const { race, effectiveIntelligence } = await requireRaceAndIntelligence(db, row.character.id);
    const [access, selected] = await Promise.all([
      db
        .select({
          languageId: raceLanguages.languageId,
          kind: raceLanguages.kind,
          name: languages.name,
          slug: languages.slug,
          isSecret: languages.isSecret,
        })
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
    ]);
    return c.json({
      automatic: access.filter((entry) => entry.kind === "automatic"),
      bonusOptions: access.filter((entry) => entry.kind === "bonus" && !entry.isSecret),
      bonusChoicesRequired: firstLevelBonusLanguageCount(effectiveIntelligence),
      druidicGranted: firstClass.classSlug === "druid",
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
      const row = await requireCharacterCreatorEditor({
        db,
        characterId: c.req.param("characterId"),
        userId: session.user.id,
      });
      const firstClass = await requireFirstCharacterClass(db, row.character.id);
      const { race, effectiveIntelligence } = await requireRaceAndIntelligence(db, row.character.id);
      const [access, speakLanguageRows, druidic] = await Promise.all([
        db
          .select({ languageId: raceLanguages.languageId, kind: raceLanguages.kind })
          .from(raceLanguages)
          .where(eq(raceLanguages.raceId, race.id))
          .all(),
        db
          .select({ languageId: characterSkills.specialization })
          .from(characterSkills)
          .innerJoin(skills, eq(characterSkills.skillId, skills.id))
          .where(
            and(eq(characterSkills.characterId, row.character.id), eq(skills.slug, "speak-language")),
          )
          .all(),
        db
          .select({ id: languages.id })
          .from(languages)
          .where(and(eq(languages.slug, "druidic"), eq(languages.isEnabled, true)))
          .get(),
      ]);

      const automatic = access
        .filter((entry) => entry.kind === "automatic")
        .map((entry) => entry.languageId);
      const bonusAllowed = new Set(
        access.filter((entry) => entry.kind === "bonus").map((entry) => entry.languageId),
      );
      const uniqueBonus = new Set(input.bonusLanguageIds);
      const required = firstLevelBonusLanguageCount(effectiveIntelligence);
      if (uniqueBonus.size !== input.bonusLanguageIds.length) {
        throw new ValidationError("Bonus language choices must be unique.");
      }
      if (uniqueBonus.size !== required) {
        throw new ValidationError(
          `Choose exactly ${required} bonus language${required === 1 ? "" : "s"}.`,
        );
      }
      for (const languageId of uniqueBonus) {
        if (!bonusAllowed.has(languageId)) {
          throw new ValidationError(
            `Language is not an available racial bonus language: ${languageId}.`,
          );
        }
      }

      const selected = new Set<string>([
        ...automatic,
        ...uniqueBonus,
        ...speakLanguageRows.map(({ languageId }) => languageId).filter(Boolean),
      ]);
      if (firstClass.classSlug === "druid") {
        if (!druidic) {
          throw new ValidationError("The Druidic language is unavailable in the rules catalog.");
        }
        selected.add(druidic.id);
      }
      const values = [...selected].map((languageId) => ({
        characterId: row.character.id,
        languageId,
      }));
      if (values.length === 0) {
        throw new ValidationError("The selected race grants no automatic language.");
      }
      await db.batch([
        db.delete(characterLanguages).where(eq(characterLanguages.characterId, row.character.id)),
        db.insert(characterLanguages).values(values),
      ]);
      await markCreationStep(db, row.character.id, "languagesFinalized");

      return c.json({
        characterId: row.character.id,
        languageIds: [...selected],
        bonusChoices: required,
      });
    },
  );
