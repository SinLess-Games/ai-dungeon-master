/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { and, asc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import {
  characterCreationChoices,
  classFeatureGrants,
  classFeatures,
  creatureSubtypes,
  creatureTypes,
  powerDisciplines,
  spellSchools,
} from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
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

const wizardSpecializationSchema = z.object({
  schoolId: z.string().trim().min(1),
  prohibitedSchoolIds: z.array(z.string().trim().min(1)).max(2),
});

const classChoiceSchema = z.object({
  favoredEnemyTypeId: z.string().trim().min(1).nullable().optional(),
  favoredEnemySubtypeId: z.string().trim().min(1).nullable().optional(),
  wizardSpecialization: wizardSpecializationSchema.nullable().optional(),
  psionDisciplineId: z.string().trim().min(1).nullable().optional(),
});

const HUMANOID_FAVORED_ENEMY_SUBTYPES = new Set([
  "aquatic",
  "dwarf",
  "elf",
  "goblinoid",
  "gnoll",
  "gnome",
  "halfling",
  "human",
  "orc",
  "reptilian",
]);

const OUTSIDER_FAVORED_ENEMY_SUBTYPES = new Set([
  "air",
  "chaotic",
  "earth",
  "evil",
  "fire",
  "good",
  "lawful",
  "native",
  "water",
]);

function favoredEnemySubtypeSet(typeSlug: string): ReadonlySet<string> | null {
  if (typeSlug === "humanoid") return HUMANOID_FAVORED_ENEMY_SUBTYPES;
  if (typeSlug === "outsider") return OUTSIDER_FAVORED_ENEMY_SUBTYPES;
  return null;
}

async function firstLevelFeatureMap(
  db: ReturnType<typeof createDatabase>,
  classLevelId: string,
) {
  const rows = await db
    .select({ id: classFeatures.id, slug: classFeatures.slug, name: classFeatures.name })
    .from(classFeatureGrants)
    .innerJoin(classFeatures, eq(classFeatureGrants.classFeatureId, classFeatures.id))
    .where(eq(classFeatureGrants.classLevelId, classLevelId))
    .all();
  return new Map(rows.map((feature) => [feature.slug, feature]));
}

export const characterClassChoiceCreationRoutes = new Hono<CharacterCreationEnv>()
  .use("/api/characters/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/characters/:characterId/creation/class-choices", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const row = await requireCharacterCreatorEditor({
      db,
      characterId: c.req.param("characterId"),
      userId: session.user.id,
    });
    const firstClass = await requireFirstCharacterClass(db, row.character.id);
    const selected = await db
      .select()
      .from(characterCreationChoices)
      .where(eq(characterCreationChoices.characterId, row.character.id))
      .orderBy(asc(characterCreationChoices.choiceKey))
      .all();

    if (firstClass.classSlug === "ranger") {
      const [options, subtypes] = await Promise.all([
        db
          .select({ id: creatureTypes.id, slug: creatureTypes.slug, name: creatureTypes.name })
          .from(creatureTypes)
          .where(eq(creatureTypes.isEnabled, true))
          .orderBy(asc(creatureTypes.name))
          .all(),
        db
          .select({ id: creatureSubtypes.id, slug: creatureSubtypes.slug, name: creatureSubtypes.name })
          .from(creatureSubtypes)
          .where(eq(creatureSubtypes.isEnabled, true))
          .orderBy(asc(creatureSubtypes.name))
          .all(),
      ]);
      return c.json({
        classId: firstClass.classId,
        className: firstClass.className,
        choice: "favored-enemy",
        required: true,
        options,
        subtypeRequiredFor: ["humanoid", "outsider"],
        subtypeOptions: {
          humanoid: subtypes.filter(({ slug }) => HUMANOID_FAVORED_ENEMY_SUBTYPES.has(slug)),
          outsider: subtypes.filter(({ slug }) => OUTSIDER_FAVORED_ENEMY_SUBTYPES.has(slug)),
        },
        selected,
      });
    }

    if (firstClass.classSlug === "wizard") {
      const schools = await db
        .select({ id: spellSchools.id, slug: spellSchools.slug, name: spellSchools.name })
        .from(spellSchools)
        .where(eq(spellSchools.isEnabled, true))
        .orderBy(asc(spellSchools.name))
        .all();
      return c.json({
        classId: firstClass.classId,
        className: firstClass.className,
        choice: "school-specialization",
        required: true,
        generalistAllowed: true,
        schools: schools.filter((school) => school.slug !== "universal"),
        selected,
      });
    }

    if (firstClass.classSlug === "psion") {
      const disciplines = await db
        .select({
          id: powerDisciplines.id,
          slug: powerDisciplines.slug,
          name: powerDisciplines.name,
          specialistName: powerDisciplines.specialistName,
        })
        .from(powerDisciplines)
        .where(and(eq(powerDisciplines.sourceId, "xph-3.5"), eq(powerDisciplines.isEnabled, true)))
        .orderBy(asc(powerDisciplines.name))
        .all();
      return c.json({
        classId: firstClass.classId,
        className: firstClass.className,
        choice: "psionic-discipline",
        required: true,
        options: disciplines,
        selected,
      });
    }

    return c.json({
      classId: firstClass.classId,
      className: firstClass.className,
      required: false,
      choice: null,
      options: [],
      selected,
    });
  })
  .put(
    "/api/characters/:characterId/class-choices",
    zValidator("json", classChoiceSchema),
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
      const features = await firstLevelFeatureMap(db, firstClass.classLevelId);

      await db
        .delete(characterCreationChoices)
        .where(
          and(
            eq(characterCreationChoices.characterId, row.character.id),
            eq(characterCreationChoices.characterClassLevelId, firstClass.characterClassLevelId),
          ),
        )
        .run();

      const values: Array<typeof characterCreationChoices.$inferInsert> = [];

      if (firstClass.classSlug === "ranger") {
        if (!input.favoredEnemyTypeId) {
          throw new ValidationError("A 1st-level ranger must choose a favored enemy creature type.");
        }
        const type = await db
          .select({ id: creatureTypes.id, slug: creatureTypes.slug, name: creatureTypes.name })
          .from(creatureTypes)
          .where(and(eq(creatureTypes.id, input.favoredEnemyTypeId), eq(creatureTypes.isEnabled, true)))
          .get();
        if (!type) throw new ValidationError("Selected favored-enemy creature type is unavailable.");

        const allowedSubtypes = favoredEnemySubtypeSet(type.slug);
        let subtype: { id: string; slug: string; name: string } | undefined;
        if (allowedSubtypes) {
          if (!input.favoredEnemySubtypeId) {
            throw new ValidationError(`${type.name} favored enemies require a subtype.`);
          }
          subtype = await db
            .select({ id: creatureSubtypes.id, slug: creatureSubtypes.slug, name: creatureSubtypes.name })
            .from(creatureSubtypes)
            .where(
              and(
                eq(creatureSubtypes.id, input.favoredEnemySubtypeId),
                eq(creatureSubtypes.isEnabled, true),
              ),
            )
            .get();
          if (!subtype || !allowedSubtypes.has(subtype.slug)) {
            throw new ValidationError(`Selected subtype is not a legal ${type.name} favored-enemy subtype.`);
          }
        } else if (input.favoredEnemySubtypeId) {
          throw new ValidationError(`${type.name} favored enemies do not take a subtype choice.`);
        }

        const feature = features.get("ranger-favored-enemy");
        if (!feature) throw new ValidationError("Ranger favored enemy feature is missing from the rules catalog.");
        values.push({
          id: crypto.randomUUID(),
          characterId: row.character.id,
          characterClassLevelId: firstClass.characterClassLevelId,
          classFeatureId: feature.id,
          choiceKey: "ranger-favored-enemy-1",
          kind: "creature_type",
          contentId: type.id,
          parameters: {
            rank: 1,
            bonus: 2,
            ...(subtype ? { subtypeId: subtype.id, subtypeSlug: subtype.slug } : {}),
          },
        });
      } else if (firstClass.classSlug === "wizard") {
        const specialization = input.wizardSpecialization ?? null;
        const feature = features.get("wizard-school-specialization");
        if (!feature) throw new ValidationError("Wizard school-specialization feature is missing from the rules catalog.");

        if (specialization === null) {
          values.push({
            id: crypto.randomUUID(),
            characterId: row.character.id,
            characterClassLevelId: firstClass.characterClassLevelId,
            classFeatureId: feature.id,
            choiceKey: "wizard-school-specialization",
            kind: "school",
            valueText: "generalist",
            parameters: { specialist: false },
          });
        } else {
          const requestedIds = [...new Set([specialization.schoolId, ...specialization.prohibitedSchoolIds])];
          const schoolRows = await db
            .select({ id: spellSchools.id, slug: spellSchools.slug, name: spellSchools.name })
            .from(spellSchools)
            .where(and(inArray(spellSchools.id, requestedIds), eq(spellSchools.isEnabled, true)))
            .all();
          if (schoolRows.length !== requestedIds.length) {
            throw new ValidationError("One or more wizard specialization schools are unavailable.");
          }
          const selectedSchool = schoolRows.find(({ id }) => id === specialization.schoolId)!;
          if (selectedSchool.slug === "universal") {
            throw new ValidationError("Universal is not a wizard specialist school.");
          }
          const prohibitedIds = [...new Set(specialization.prohibitedSchoolIds)];
          const requiredProhibited = selectedSchool.slug === "divination" ? 1 : 2;
          if (prohibitedIds.length !== requiredProhibited) {
            throw new ValidationError(
              `${selectedSchool.name} specialization requires exactly ${requiredProhibited} prohibited school${requiredProhibited === 1 ? "" : "s"}.`,
            );
          }
          const prohibitedRows = prohibitedIds.map((id) => schoolRows.find((school) => school.id === id)!);
          if (prohibitedRows.some((school) => school.id === selectedSchool.id)) {
            throw new ValidationError("A wizard cannot prohibit the school in which they specialize.");
          }
          if (prohibitedRows.some((school) => school.slug === "divination" || school.slug === "universal")) {
            throw new ValidationError("Divination and Universal cannot be selected as prohibited schools.");
          }
          values.push({
            id: crypto.randomUUID(),
            characterId: row.character.id,
            characterClassLevelId: firstClass.characterClassLevelId,
            classFeatureId: feature.id,
            choiceKey: "wizard-school-specialization",
            kind: "school",
            contentId: selectedSchool.id,
            parameters: { specialist: true, prohibitedSchoolIds: prohibitedIds },
          });
        }
      } else if (firstClass.classSlug === "psion") {
        if (!input.psionDisciplineId) {
          throw new ValidationError("A 1st-level psion must choose a psionic discipline.");
        }
        const discipline = await db
          .select({ id: powerDisciplines.id, name: powerDisciplines.name })
          .from(powerDisciplines)
          .where(
            and(
              eq(powerDisciplines.id, input.psionDisciplineId),
              eq(powerDisciplines.sourceId, "xph-3.5"),
              eq(powerDisciplines.isEnabled, true),
            ),
          )
          .get();
        if (!discipline) throw new ValidationError("Selected psionic discipline is unavailable.");
        values.push({
          id: crypto.randomUUID(),
          characterId: row.character.id,
          characterClassLevelId: firstClass.characterClassLevelId,
          choiceKey: "psion-discipline",
          kind: "other",
          contentId: discipline.id,
          parameters: { system: "psionics", discipline: true },
        });
      } else {
        if (
          input.favoredEnemyTypeId ||
          input.favoredEnemySubtypeId ||
          input.wizardSpecialization ||
          input.psionDisciplineId
        ) {
          throw new ValidationError(`${firstClass.className} has no supported 1st-level class choice in this creator step.`);
        }
      }

      if (values.length > 0) await db.insert(characterCreationChoices).values(values).run();
      await markCreationStep(db, row.character.id, "classChoicesFinalized");
      return c.json({ characterId: row.character.id, classId: firstClass.classId, choices: values });
    },
  );
