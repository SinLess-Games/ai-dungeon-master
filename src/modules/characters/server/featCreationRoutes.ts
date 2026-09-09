/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { and, asc, eq, inArray, isNull, like, or } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import {
  characterAbilityScores,
  characterFeats,
  characterSkills,
  classFeatureGrants,
  classFeatures,
  classSpellcasting,
  classSpellcastingProgression,
  dnd35Characters,
  featCategoryAssignments,
  featPrerequisites,
  feats,
  items,
  raceAbilities,
  races,
  skills,
  spellSchools,
  spells,
  weapons,
  type RuleChoice,
} from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import {
  evaluateDnd35Prerequisite,
  type Dnd35PrerequisiteExpression,
  type Dnd35PrerequisiteFacts,
  type Dnd35RuleExtension,
} from "@/rulesets/dnd35/prerequisites";
import { ValidationError } from "@/server/middleware/errors";
import {
  markCreationStep,
  requireCharacterCreatorEditor,
  requireCharacterDatabase,
  requireFirstCharacterClass,
} from "./creationAccess";

interface CharacterCreationBindings extends AuthEnv {
  DB?: D1Database;
}
type CharacterCreationEnv = { Bindings: CharacterCreationBindings };

const ruleChoiceSchema = z.object({
  key: z.string().trim().min(1).max(80),
  contentId: z.string().trim().min(1).optional(),
  text: z.string().trim().min(1).max(200).optional(),
  value: z.number().finite().optional(),
});
const featSelectionSchema = z.object({
  featId: z.string().trim().min(1),
  choices: z.array(ruleChoiceSchema).max(10).optional(),
});
const classFeatSelectionSchema = featSelectionSchema.extend({
  classFeatureId: z.string().trim().min(1),
});
const featAllocationSchema = z.object({
  levelFeats: z.array(featSelectionSchema).max(10),
  racialBonusFeats: z.array(featSelectionSchema).max(10),
  classBonusFeats: z.array(classFeatSelectionSchema).max(20),
});

type FeatSelection = z.infer<typeof featSelectionSchema>;
type ClassFeatSelection = z.infer<typeof classFeatSelectionSchema>;

function primaryChoice(selection: FeatSelection): string | undefined {
  for (const choice of selection.choices ?? []) {
    if (choice.contentId) return choice.contentId;
    if (choice.text) return choice.text;
  }
  return undefined;
}

function classHasWeaponProficiency(classSlug: string, weapon: { proficiency: string; slug: string }): boolean {
  if (weapon.proficiency === "simple") {
    return !["monk", "wizard"].includes(classSlug);
  }
  if (weapon.proficiency === "martial") {
    if (["barbarian", "fighter", "paladin", "ranger"].includes(classSlug)) return true;
    if (classSlug === "bard") {
      return ["longsword", "rapier", "sap", "short-sword", "shortbow", "whip"].includes(weapon.slug);
    }
    if (classSlug === "rogue") return ["rapier", "sap", "shortbow", "short-sword"].includes(weapon.slug);
    return false;
  }
  if (classSlug === "wizard") {
    return ["club", "dagger", "heavy-crossbow", "light-crossbow", "quarterstaff"].includes(weapon.slug);
  }
  if (classSlug === "monk") {
    return [
      "club",
      "light-crossbow",
      "heavy-crossbow",
      "dagger",
      "handaxe",
      "javelin",
      "kama",
      "nunchaku",
      "quarterstaff",
      "sai",
      "shuriken",
      "siangham",
      "sling",
    ].includes(weapon.slug);
  }
  return false;
}

function validateChoiceShape(
  feat: { name: string; choiceKind: string },
  selection: FeatSelection,
): void {
  const choices = selection.choices ?? [];
  if (feat.choiceKind === "none") {
    if (choices.length > 0) throw new ValidationError(`${feat.name} does not take a choice.`);
    return;
  }
  if (choices.length !== 1 || !primaryChoice(selection)) {
    throw new ValidationError(`${feat.name} requires exactly one ${feat.choiceKind} choice.`);
  }
}

export const characterFeatCreationRoutes = new Hono<CharacterCreationEnv>()
  .use("/api/characters/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/characters/:characterId/creation/feats", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const row = await requireCharacterCreatorEditor({
      db,
      characterId: c.req.param("characterId"),
      userId: session.user.id,
    });
    const firstClass = await requireFirstCharacterClass(db, row.character.id);
    const extension = await db
      .select({ raceId: dnd35Characters.raceId })
      .from(dnd35Characters)
      .where(eq(dnd35Characters.characterId, row.character.id))
      .get();
    if (!extension?.raceId) throw new ValidationError("Choose a race before selecting feats.");
    const [race, options, classBonusFeatures, selected] = await Promise.all([
      db
        .select({ bonusFeatsAtFirstLevel: races.bonusFeatsAtFirstLevel })
        .from(races)
        .where(eq(races.id, extension.raceId))
        .get(),
      db
        .select({
          id: feats.id,
          slug: feats.slug,
          name: feats.name,
          repeatable: feats.repeatable,
          choiceKind: feats.choiceKind,
          explanation: featPrerequisites.explanation,
        })
        .from(feats)
        .leftJoin(featPrerequisites, eq(feats.id, featPrerequisites.featId))
        .where(
          and(
            eq(feats.isEnabled, true),
            or(isNull(feats.ownerUserId), eq(feats.ownerUserId, session.user.id)),
          ),
        )
        .orderBy(asc(feats.name))
        .all(),
      db
        .select({ id: classFeatures.id, slug: classFeatures.slug, name: classFeatures.name })
        .from(classFeatureGrants)
        .innerJoin(classFeatures, eq(classFeatureGrants.classFeatureId, classFeatures.id))
        .where(
          and(
            eq(classFeatureGrants.classLevelId, firstClass.classLevelId),
            like(classFeatures.slug, "%bonus-feat%"),
          ),
        )
        .all(),
      db
        .select({
          id: characterFeats.id,
          featId: characterFeats.featId,
          occurrence: characterFeats.occurrence,
          grantKind: characterFeats.grantKind,
          choices: characterFeats.choices,
        })
        .from(characterFeats)
        .where(eq(characterFeats.characterId, row.character.id))
        .all(),
    ]);
    if (!race) throw new ValidationError("Selected race is unavailable.");
    return c.json({
      required: {
        level: 1,
        racialBonus: race.bonusFeatsAtFirstLevel,
        classBonusFeatures,
      },
      options,
      selected,
    });
  })
  .put(
    "/api/characters/:characterId/feats",
    zValidator("json", featAllocationSchema),
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
      const extension = await db
        .select({ raceId: dnd35Characters.raceId, alignment: dnd35Characters.alignment })
        .from(dnd35Characters)
        .where(eq(dnd35Characters.characterId, row.character.id))
        .get();
      if (!extension?.raceId) throw new ValidationError("Choose a race before selecting feats.");

      const [race, baseAbilities, racialModifiers, skillRows, featureRows, spellcasting, classBonusFeatures] =
        await Promise.all([
          db
            .select({ bonusFeatsAtFirstLevel: races.bonusFeatsAtFirstLevel })
            .from(races)
            .where(eq(races.id, extension.raceId))
            .get(),
          db
            .select({ ability: characterAbilityScores.ability, baseScore: characterAbilityScores.baseScore })
            .from(characterAbilityScores)
            .where(eq(characterAbilityScores.characterId, row.character.id))
            .all(),
          db
            .select({ ability: raceAbilities.ability, modifier: raceAbilities.modifier })
            .from(raceAbilities)
            .where(eq(raceAbilities.raceId, extension.raceId))
            .all(),
          db
            .select({
              skillId: characterSkills.skillId,
              specialization: characterSkills.specialization,
              ranks: characterSkills.ranks,
              skillName: skills.name,
            })
            .from(characterSkills)
            .innerJoin(skills, eq(characterSkills.skillId, skills.id))
            .where(eq(characterSkills.characterId, row.character.id))
            .all(),
          db
            .select({ id: classFeatures.id, slug: classFeatures.slug })
            .from(classFeatureGrants)
            .innerJoin(classFeatures, eq(classFeatureGrants.classFeatureId, classFeatures.id))
            .where(eq(classFeatureGrants.classLevelId, firstClass.classLevelId))
            .all(),
          db
            .select({
              id: classSpellcasting.id,
              tradition: classSpellcasting.tradition,
              casterLevelNumerator: classSpellcasting.casterLevelNumerator,
              casterLevelDenominator: classSpellcasting.casterLevelDenominator,
            })
            .from(classSpellcasting)
            .where(eq(classSpellcasting.classId, firstClass.classId))
            .get(),
          db
            .select({ id: classFeatures.id, slug: classFeatures.slug, name: classFeatures.name })
            .from(classFeatureGrants)
            .innerJoin(classFeatures, eq(classFeatureGrants.classFeatureId, classFeatures.id))
            .where(
              and(
                eq(classFeatureGrants.classLevelId, firstClass.classLevelId),
                like(classFeatures.slug, "%bonus-feat%"),
              ),
            )
            .all(),
        ]);
      if (!race) throw new ValidationError("Selected race is unavailable.");
      if (baseAbilities.length !== 6 || baseAbilities.some(({ baseScore }) => baseScore === null)) {
        throw new ValidationError("Set all six ability scores before selecting feats.");
      }
      if (input.levelFeats.length !== 1) {
        throw new ValidationError("A 1st-level character must choose exactly one level feat.");
      }
      if (input.racialBonusFeats.length !== race.bonusFeatsAtFirstLevel) {
        throw new ValidationError(
          `This race grants exactly ${race.bonusFeatsAtFirstLevel} bonus feat${race.bonusFeatsAtFirstLevel === 1 ? "" : "s"} at 1st level.`,
        );
      }
      if (input.classBonusFeats.length !== classBonusFeatures.length) {
        throw new ValidationError(
          `${firstClass.className} requires ${classBonusFeatures.length} class bonus feat choice${classBonusFeatures.length === 1 ? "" : "s"} at 1st level.`,
        );
      }
      const classFeatureIds = new Set(classBonusFeatures.map(({ id }) => id));
      if (
        new Set(input.classBonusFeats.map(({ classFeatureId }) => classFeatureId)).size !==
          input.classBonusFeats.length ||
        input.classBonusFeats.some(({ classFeatureId }) => !classFeatureIds.has(classFeatureId))
      ) {
        throw new ValidationError("Class bonus feats must map one-to-one to current 1st-level bonus-feat features.");
      }

      const allSelections: Array<{
        selection: FeatSelection;
        grantKind: "level" | "race" | "class";
        classFeatureId?: string;
      }> = [
        ...input.levelFeats.map((selection) => ({ selection, grantKind: "level" as const })),
        ...input.racialBonusFeats.map((selection) => ({ selection, grantKind: "race" as const })),
        ...input.classBonusFeats.map((selection: ClassFeatSelection) => ({
          selection,
          grantKind: "class" as const,
          classFeatureId: selection.classFeatureId,
        })),
      ];
      const featIds = [...new Set(allSelections.map(({ selection }) => selection.featId))];
      const availableFeats = featIds.length
        ? await db
            .select({
              id: feats.id,
              slug: feats.slug,
              name: feats.name,
              repeatable: feats.repeatable,
              choiceKind: feats.choiceKind,
              prerequisite: featPrerequisites.expression,
              explanation: featPrerequisites.explanation,
            })
            .from(feats)
            .leftJoin(featPrerequisites, eq(feats.id, featPrerequisites.featId))
            .where(
              and(
                inArray(feats.id, featIds),
                eq(feats.isEnabled, true),
                or(isNull(feats.ownerUserId), eq(feats.ownerUserId, session.user.id)),
              ),
            )
            .all()
        : [];
      const featsById = new Map(availableFeats.map((feat) => [feat.id, feat]));
      if (featsById.size !== featIds.length) throw new ValidationError("One or more selected feats are unavailable.");

      for (const { selection } of allSelections) {
        validateChoiceShape(featsById.get(selection.featId)!, selection);
      }
      const occurrenceKey = new Map<string, Set<string>>();
      for (const { selection } of allSelections) {
        const feat = featsById.get(selection.featId)!;
        const choice = primaryChoice(selection) ?? "";
        const choices = occurrenceKey.get(feat.id) ?? new Set<string>();
        if (!feat.repeatable && choices.size > 0) {
          throw new ValidationError(`${feat.name} cannot be selected more than once.`);
        }
        if (choices.has(choice)) {
          throw new ValidationError(`${feat.name} cannot repeat the same choice.`);
        }
        choices.add(choice);
        occurrenceKey.set(feat.id, choices);
      }

      const effectiveAbilities = Object.fromEntries(
        baseAbilities.map(({ ability, baseScore }) => {
          if (baseScore === null) {
            throw new ValidationError(`${ability.toUpperCase()} must have a score before selecting feats.`);
          }
          return [
            ability,
            baseScore + (racialModifiers.find((modifier) => modifier.ability === ability)?.modifier ?? 0),
          ];
        }),
      ) as Dnd35PrerequisiteFacts["abilities"];
      const selectedFeatFacts = allSelections.map(({ selection }) => {
        const choice = primaryChoice(selection);
        return choice ? { featId: selection.featId, choice } : { featId: selection.featId };
      });
      if (firstClass.classSlug === "monk") {
        selectedFeatFacts.push({ featId: "phb-feat-improved-unarmed-strike" });
      }
      const skillRanks: Record<string, number> = {};
      const skillRanksByName = new Map<string, number>();
      for (const skill of skillRows) {
        skillRanks[skill.skillId] = Math.max(skillRanks[skill.skillId] ?? 0, skill.ranks);
        skillRanks[`${skill.skillId}:${skill.specialization}`] = skill.ranks;
        skillRanksByName.set(skill.skillName.toLocaleLowerCase(), skill.ranks);
      }
      const featureFacts = Object.fromEntries(featureRows.map(({ id }) => [id, 1]));
      const hasTurning = featureRows.some(({ slug }) => slug.includes("turn-rebuke"));
      const firstLevelSpellAccess = spellcasting
        ? await db
            .select({ spellLevel: classSpellcastingProgression.spellLevel })
            .from(classSpellcastingProgression)
            .where(
              and(
                eq(classSpellcastingProgression.classId, firstClass.classId),
                eq(classSpellcastingProgression.classLevel, 1),
              ),
            )
            .all()
        : [];
      const maximumSpellLevel = firstLevelSpellAccess.reduce(
        (maximum, row) => Math.max(maximum, row.spellLevel),
        -1,
      );
      const casterLevel = maximumSpellLevel >= 0 && spellcasting
        ? Math.floor(spellcasting.casterLevelNumerator / spellcasting.casterLevelDenominator)
        : 0;
      const manifesterLevel = firstClass.powersKnown !== null || firstClass.basePowerPoints !== null ? 1 : 0;

      const weaponChoiceIds = allSelections
        .filter(({ selection }) => featsById.get(selection.featId)?.choiceKind === "weapon")
        .map(({ selection }) => primaryChoice(selection))
        .filter((value): value is string => Boolean(value));
      const chosenWeapons = weaponChoiceIds.length
        ? await db
            .select({ id: weapons.itemId, proficiency: weapons.proficiency, slug: items.slug })
            .from(weapons)
            .innerJoin(items, eq(weapons.itemId, items.id))
            .where(inArray(weapons.itemId, [...new Set(weaponChoiceIds)]))
            .all()
        : [];
      const weaponsById = new Map(chosenWeapons.map((weapon) => [weapon.id, weapon]));
      const schoolIds = allSelections
        .filter(({ selection }) => featsById.get(selection.featId)?.choiceKind === "school")
        .map(({ selection }) => primaryChoice(selection))
        .filter((value): value is string => Boolean(value));
      if (schoolIds.length > 0) {
        const found = await db
          .select({ id: spellSchools.id })
          .from(spellSchools)
          .where(inArray(spellSchools.id, [...new Set(schoolIds)]))
          .all();
        if (found.length !== new Set(schoolIds).size) throw new ValidationError("A selected spell school is unavailable.");
      }
      const spellChoiceIds = allSelections
        .filter(({ selection }) => featsById.get(selection.featId)?.choiceKind === "spell")
        .map(({ selection }) => primaryChoice(selection))
        .filter((value): value is string => Boolean(value));
      if (spellChoiceIds.length > 0) {
        const found = await db
          .select({ id: spells.id })
          .from(spells)
          .where(inArray(spells.id, [...new Set(spellChoiceIds)]))
          .all();
        if (found.length !== new Set(spellChoiceIds).size) throw new ValidationError("A selected spell is unavailable.");
      }

      const commonFacts: Omit<Dnd35PrerequisiteFacts, "evaluateCustom"> = {
        abilities: effectiveAbilities,
        characterLevel: 1,
        baseAttackBonus: firstClass.baseAttackBonus,
        casterLevel,
        manifesterLevel,
        classLevels: { [firstClass.classId]: 1 },
        classBaseAttackBonuses: { [firstClass.classId]: firstClass.baseAttackBonus },
        classCasterLevels: { [firstClass.classId]: casterLevel },
        classManifesterLevels: { [firstClass.classId]: manifesterLevel },
        saves: { fort: firstClass.fort, ref: firstClass.ref, will: firstClass.will },
        feats: selectedFeatFacts,
        skillRanks,
        spellLevelAccess:
          maximumSpellLevel >= 0 && spellcasting
            ? [{ level: maximumSpellLevel, tradition: spellcasting.tradition, classId: firstClass.classId }]
            : [],
        raceId: extension.raceId,
        alignment: extension.alignment,
        classFeatures: featureFacts,
      };

      function evaluateCustom(
        extensionRule: Dnd35RuleExtension,
        selection: FeatSelection,
      ): boolean {
        const parameters = extensionRule.parameters;
        if (extensionRule.key === "dnd35.prerequisite.turn-or-rebuke") return hasTurning;
        if (extensionRule.key === "dnd35.prerequisite.skill-ranks") {
          const skillName = parameters["skill"];
          const minimum = parameters["minimum"];
          return (
            typeof skillName === "string" &&
            typeof minimum === "number" &&
            (skillRanksByName.get(skillName.toLocaleLowerCase()) ?? 0) >= minimum
          );
        }
        if (extensionRule.key === "dnd35.prerequisite.weapon-proficiency") {
          const choice = primaryChoice(selection);
          const weapon = choice ? weaponsById.get(choice) : undefined;
          return Boolean(weapon && classHasWeaponProficiency(firstClass.classSlug, weapon));
        }
        if (extensionRule.key === "dnd35.prerequisite.selected-feat") {
          const featId = parameters["featId"];
          const requiredChoice = parameters["choice"];
          if (typeof featId !== "string") return false;
          return selectedFeatFacts.some(
            (fact) =>
              fact.featId === featId &&
              (typeof requiredChoice !== "string" || fact.choice === requiredChoice),
          );
        }
        if (extensionRule.key === "dnd35.prerequisite.selected-weapon-feat") {
          const currentChoice = primaryChoice(selection);
          const required = parameters["featId"];
          const requiredMany = parameters["featIds"];
          const requiredIds = typeof required === "string"
            ? [required]
            : Array.isArray(requiredMany)
              ? requiredMany.filter((value): value is string => typeof value === "string")
              : [];
          return (
            Boolean(currentChoice) &&
            requiredIds.length > 0 &&
            requiredIds.every((featId) =>
              selectedFeatFacts.some((fact) => fact.featId === featId && fact.choice === currentChoice),
            )
          );
        }
        return false;
      }

      const fighterFeatIds = new Set(
        (
          await db
            .select({ featId: featCategoryAssignments.featId })
            .from(featCategoryAssignments)
            .where(eq(featCategoryAssignments.category, "fighter"))
            .all()
        ).map(({ featId }) => featId),
      );
      for (const entry of allSelections) {
        const feat = featsById.get(entry.selection.featId)!;
        if (entry.grantKind === "class") {
          const feature = classBonusFeatures.find(({ id }) => id === entry.classFeatureId)!;
          if (firstClass.classSlug === "fighter" && !fighterFeatIds.has(feat.id)) {
            throw new ValidationError(`${feat.name} is not a fighter bonus feat.`);
          }
          if (
            firstClass.classSlug === "monk" &&
            !["improved-grapple", "stunning-fist"].includes(feat.slug)
          ) {
            throw new ValidationError("A 1st-level monk bonus feat must be Improved Grapple or Stunning Fist.");
          }
          if (firstClass.classSlug === "monk" && feature.slug.includes("bonus-feat")) continue;
        }
        if (feat.prerequisite) {
          const evaluation = evaluateDnd35Prerequisite(
            feat.prerequisite as Dnd35PrerequisiteExpression,
            {
              ...commonFacts,
              evaluateCustom: (rule) => evaluateCustom(rule, entry.selection),
            },
          );
          if (!evaluation.passed) {
            throw new ValidationError(
              `${feat.name} prerequisites are not met${feat.explanation ? `: ${feat.explanation}` : "."}`,
              { failures: evaluation.failures },
            );
          }
        }
      }

      const occurrenceByFeat = new Map<string, number>();
      const values = allSelections.map(({ selection, grantKind }) => {
        const occurrence = (occurrenceByFeat.get(selection.featId) ?? 0) + 1;
        occurrenceByFeat.set(selection.featId, occurrence);
        return {
          id: crypto.randomUUID(),
          characterId: row.character.id,
          featId: selection.featId,
          occurrence,
          grantKind,
          grantedAtLevel: 1,
          choices: selection.choices as RuleChoice[] | undefined,
        };
      });
      await db.batch([
        db.delete(characterFeats).where(eq(characterFeats.characterId, row.character.id)),
        db.insert(characterFeats).values(values),
      ]);
      await markCreationStep(db, row.character.id, "featsFinalized");

      return c.json({ characterId: row.character.id, selections: values });
    },
  );