/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { and, asc, eq, inArray, isNull, lte, or } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import {
  characterAbilityScores,
  characterCastingTracks,
  characterCreationChoices,
  characterPowers,
  characterSpellbooks,
  characterSpellbookSpells,
  characterSpells,
  classSpellcasting,
  classSpellcastingProgression,
  dnd35Characters,
  powerClassLevels,
  powers,
  raceAbilities,
  spellClassLevels,
  spells,
} from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import { abilityModifier } from "@/rulesets/dnd35";
import { ValidationError } from "@/server/middleware/errors";
import {
  markCreationStep,
  requireCharacterCreatorEditor,
  requireCharacterDatabase,
  requireFirstCharacterClass,
  type CharacterDatabase,
} from "./creationAccess";

interface CharacterCreationBindings extends AuthEnv {
  DB?: D1Database;
}
type CharacterCreationEnv = { Bindings: CharacterCreationBindings };

const selectionSchema = z.object({
  ids: z.array(z.string().trim().min(1)).max(200),
});

async function ensureClassCastingTrack(
  db: CharacterDatabase,
  characterId: string,
  definition: { id: string },
  specializationKey?: string,
) {
  const existing = await db
    .select({ id: characterCastingTracks.id })
    .from(characterCastingTracks)
    .where(
      and(
        eq(characterCastingTracks.characterId, characterId),
        eq(characterCastingTracks.classSpellcastingId, definition.id),
      ),
    )
    .get();
  if (existing) {
    await db
      .update(characterCastingTracks)
      .set({ specializationKey: specializationKey ?? null, updatedAt: new Date() })
      .where(eq(characterCastingTracks.id, existing.id))
      .run();
    return existing.id;
  }

  const id = crypto.randomUUID();
  await db
    .insert(characterCastingTracks)
    .values({
      id,
      characterId,
      classSpellcastingId: definition.id,
      ...(specializationKey === undefined ? {} : { specializationKey }),
    })
    .run();
  return id;
}

async function wizardSpecialization(
  db: CharacterDatabase,
  characterId: string,
): Promise<{ schoolId?: string; prohibitedSchoolIds: string[] }> {
  const choice = await db
    .select({ contentId: characterCreationChoices.contentId, valueText: characterCreationChoices.valueText, parameters: characterCreationChoices.parameters })
    .from(characterCreationChoices)
    .where(
      and(
        eq(characterCreationChoices.characterId, characterId),
        eq(characterCreationChoices.choiceKey, "wizard-school-specialization"),
      ),
    )
    .get();
  if (!choice || choice.valueText === "generalist") return { prohibitedSchoolIds: [] };
  if (!choice.contentId) throw new ValidationError("Complete wizard school specialization before choosing spells.");
  const raw = choice.parameters?.["prohibitedSchoolIds"];
  const prohibitedSchoolIds = Array.isArray(raw)
    ? raw.filter((value): value is string => typeof value === "string")
    : [];
  return { schoolId: choice.contentId, prohibitedSchoolIds };
}

async function effectiveIntelligence(db: CharacterDatabase, characterId: string): Promise<number> {
  const [extension, score] = await Promise.all([
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
  if (!extension?.raceId || score?.baseScore == null) {
    throw new ValidationError("Choose race and ability scores before choosing wizard spells.");
  }
  const racial = await db
    .select({ modifier: raceAbilities.modifier })
    .from(raceAbilities)
    .where(and(eq(raceAbilities.raceId, extension.raceId), eq(raceAbilities.ability, "int")))
    .get();
  return score.baseScore + (racial?.modifier ?? 0);
}

export const characterCastingCreationRoutes = new Hono<CharacterCreationEnv>()
  .use("/api/characters/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/characters/:characterId/creation/spells", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const row = await requireCharacterCreatorEditor({
      db,
      characterId: c.req.param("characterId"),
      userId: session.user.id,
    });
    const firstClass = await requireFirstCharacterClass(db, row.character.id);
    const definition = await db
      .select({
        id: classSpellcasting.id,
        castingMode: classSpellcasting.castingMode,
        knownBehavior: classSpellcasting.knownBehavior,
        classId: classSpellcasting.classId,
        spellListClassId: classSpellcasting.spellListClassId,
      })
      .from(classSpellcasting)
      .where(eq(classSpellcasting.classId, firstClass.classId))
      .get();

    if (!definition || definition.castingMode === "psionic") {
      return c.json({ required: false, classId: firstClass.classId, mode: null, options: [], selected: [] });
    }

    const progression = await db
      .select({
        spellLevel: classSpellcastingProgression.spellLevel,
        slotsPerDay: classSpellcastingProgression.slotsPerDay,
        spellsKnown: classSpellcastingProgression.spellsKnown,
      })
      .from(classSpellcastingProgression)
      .where(
        and(
          eq(classSpellcastingProgression.classId, firstClass.classId),
          eq(classSpellcastingProgression.classLevel, 1),
        ),
      )
      .orderBy(asc(classSpellcastingProgression.spellLevel))
      .all();
    if (progression.length === 0) {
      return c.json({ required: false, classId: firstClass.classId, mode: definition.knownBehavior, options: [], selected: [] });
    }

    const listClassId = definition.spellListClassId ?? firstClass.classId;
    const maximumLevel = Math.max(...progression.map(({ spellLevel }) => spellLevel));
    const options = await db
      .select({
        id: spells.id,
        slug: spells.slug,
        name: spells.name,
        schoolId: spells.schoolId,
        spellLevel: spellClassLevels.spellLevel,
      })
      .from(spellClassLevels)
      .innerJoin(spells, eq(spellClassLevels.spellId, spells.id))
      .where(
        and(
          eq(spellClassLevels.classId, listClassId),
          lte(spellClassLevels.spellLevel, maximumLevel),
          eq(spells.isEnabled, true),
          or(isNull(spells.ownerUserId), eq(spells.ownerUserId, session.user.id)),
        ),
      )
      .orderBy(asc(spellClassLevels.spellLevel), asc(spells.name))
      .all();

    const track = await db
      .select({ id: characterCastingTracks.id })
      .from(characterCastingTracks)
      .where(
        and(
          eq(characterCastingTracks.characterId, row.character.id),
          eq(characterCastingTracks.classSpellcastingId, definition.id),
        ),
      )
      .get();
    const selected = track
      ? await db
          .select({ spellId: characterSpells.spellId })
          .from(characterSpells)
          .where(eq(characterSpells.castingTrackId, track.id))
          .all()
      : [];

    if (definition.knownBehavior === "spellbook" && firstClass.classSlug === "wizard") {
      const specialization = await wizardSpecialization(db, row.character.id);
      const usable = options.filter((spell) => !specialization.prohibitedSchoolIds.includes(spell.schoolId));
      const automaticSpellIds = usable.filter(({ spellLevel }) => spellLevel === 0).map(({ id }) => id);
      const intelligence = await effectiveIntelligence(db, row.character.id);
      return c.json({
        required: true,
        classId: firstClass.classId,
        mode: "spellbook",
        automaticSpellIds,
        firstLevelChoicesRequired: 3 + Math.max(0, abilityModifier(intelligence)),
        specialization,
        options: usable,
        selected,
      });
    }

    return c.json({
      required: definition.knownBehavior === "limited",
      classId: firstClass.classId,
      mode: definition.knownBehavior,
      knownByLevel: Object.fromEntries(
        progression
          .filter(({ spellsKnown }) => spellsKnown !== null)
          .map(({ spellLevel, spellsKnown }) => [spellLevel, spellsKnown]),
      ),
      options,
      selected,
    });
  })
  .put(
    "/api/characters/:characterId/spells",
    zValidator("json", selectionSchema),
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
      const definition = await db
        .select({
          id: classSpellcasting.id,
          castingMode: classSpellcasting.castingMode,
          knownBehavior: classSpellcasting.knownBehavior,
          spellListClassId: classSpellcasting.spellListClassId,
        })
        .from(classSpellcasting)
        .where(eq(classSpellcasting.classId, firstClass.classId))
        .get();

      const uniqueIds = [...new Set(input.ids)];
      if (uniqueIds.length !== input.ids.length) throw new ValidationError("Spell selections must be unique.");
      if (!definition || definition.castingMode === "psionic") {
        if (uniqueIds.length > 0) throw new ValidationError(`${firstClass.className} has no 1st-level spell selection.`);
        await markCreationStep(db, row.character.id, "spellsFinalized");
        return c.json({ characterId: row.character.id, spellIds: [], required: false });
      }

      const progression = await db
        .select({ spellLevel: classSpellcastingProgression.spellLevel, spellsKnown: classSpellcastingProgression.spellsKnown })
        .from(classSpellcastingProgression)
        .where(
          and(
            eq(classSpellcastingProgression.classId, firstClass.classId),
            eq(classSpellcastingProgression.classLevel, 1),
          ),
        )
        .all();
      if (progression.length === 0) {
        if (uniqueIds.length > 0) throw new ValidationError(`${firstClass.className} cannot select spells at 1st level.`);
        await markCreationStep(db, row.character.id, "spellsFinalized");
        return c.json({ characterId: row.character.id, spellIds: [], required: false });
      }

      const listClassId = definition.spellListClassId ?? firstClass.classId;
      const maximumLevel = Math.max(...progression.map(({ spellLevel }) => spellLevel));
      const selectedRows = uniqueIds.length
        ? await db
            .select({ id: spells.id, name: spells.name, schoolId: spells.schoolId, spellLevel: spellClassLevels.spellLevel })
            .from(spellClassLevels)
            .innerJoin(spells, eq(spellClassLevels.spellId, spells.id))
            .where(
              and(
                inArray(spells.id, uniqueIds),
                eq(spellClassLevels.classId, listClassId),
                lte(spellClassLevels.spellLevel, maximumLevel),
                eq(spells.isEnabled, true),
                or(isNull(spells.ownerUserId), eq(spells.ownerUserId, session.user.id)),
              ),
            )
            .all()
        : [];
      if (selectedRows.length !== uniqueIds.length) {
        throw new ValidationError("One or more selected spells are not available to this class at 1st level.");
      }

      let specializationKey: string | undefined;
      let persistedSpellIds = uniqueIds;
      if (definition.knownBehavior === "limited") {
        for (const progress of progression) {
          const required = progress.spellsKnown ?? 0;
          const actual = selectedRows.filter(({ spellLevel }) => spellLevel === progress.spellLevel).length;
          if (actual !== required) {
            throw new ValidationError(
              `${firstClass.className} must know exactly ${required} level-${progress.spellLevel} spell${required === 1 ? "" : "s"} at 1st level.`,
            );
          }
        }
      } else if (definition.knownBehavior === "all_list" || definition.knownBehavior === "none") {
        if (uniqueIds.length > 0) {
          throw new ValidationError(`${firstClass.className} does not choose individual known spells at 1st level.`);
        }
        persistedSpellIds = [];
      } else if (definition.knownBehavior === "spellbook" && firstClass.classSlug === "wizard") {
        const specialization = await wizardSpecialization(db, row.character.id);
        specializationKey = specialization.schoolId;
        if (selectedRows.some(({ schoolId }) => specialization.prohibitedSchoolIds.includes(schoolId))) {
          throw new ValidationError("A specialist wizard cannot add prohibited-school spells to the starting spellbook.");
        }
        if (selectedRows.some(({ spellLevel }) => spellLevel !== 1)) {
          throw new ValidationError("Submit only the wizard's chosen 1st-level spells; 0-level spells are added automatically.");
        }
        const intelligence = await effectiveIntelligence(db, row.character.id);
        const required = 3 + Math.max(0, abilityModifier(intelligence));
        if (selectedRows.length !== required) {
          throw new ValidationError(`A 1st-level wizard must choose exactly ${required} 1st-level spells for the starting spellbook.`);
        }
        const cantrips = await db
          .select({ id: spells.id })
          .from(spellClassLevels)
          .innerJoin(spells, eq(spellClassLevels.spellId, spells.id))
          .where(
            and(
              eq(spellClassLevels.classId, listClassId),
              eq(spellClassLevels.spellLevel, 0),
              eq(spells.isEnabled, true),
              or(isNull(spells.ownerUserId), eq(spells.ownerUserId, session.user.id)),
            ),
          )
          .all();
        persistedSpellIds = [
          ...cantrips
            .map(({ id }) => id)
            .filter((id) => {
              const row = selectedRows.find((spell) => spell.id === id);
              return !row || !specialization.prohibitedSchoolIds.includes(row.schoolId);
            }),
          ...uniqueIds,
        ];
      }

      const trackId = await ensureClassCastingTrack(db, row.character.id, definition, specializationKey);
      await db.delete(characterSpells).where(eq(characterSpells.castingTrackId, trackId)).run();
      if (definition.knownBehavior === "limited" && persistedSpellIds.length > 0) {
        await db
          .insert(characterSpells)
          .values(persistedSpellIds.map((spellId) => ({ castingTrackId: trackId, spellId, accessKind: "known" as const, gainedAtLevel: 1 })))
          .run();
      }

      if (definition.knownBehavior === "spellbook" && firstClass.classSlug === "wizard") {
        await db.delete(characterSpellbooks).where(eq(characterSpellbooks.characterId, row.character.id)).run();
        const spellbookId = crypto.randomUUID();
        await db.insert(characterSpellbooks).values({ id: spellbookId, characterId: row.character.id, name: "Primary Spellbook" }).run();
        if (persistedSpellIds.length > 0) {
          await db
            .insert(characterSpellbookSpells)
            .values(persistedSpellIds.map((spellId) => ({ spellbookId, spellId })))
            .run();
        }
      }

      await markCreationStep(db, row.character.id, "spellsFinalized");
      return c.json({ characterId: row.character.id, castingTrackId: trackId, spellIds: persistedSpellIds });
    },
  )
  .get("/api/characters/:characterId/creation/powers", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const row = await requireCharacterCreatorEditor({ db, characterId: c.req.param("characterId"), userId: session.user.id });
    const firstClass = await requireFirstCharacterClass(db, row.character.id);
    const required = firstClass.powersKnown ?? 0;
    const maximumPowerLevel = firstClass.maxPowerLevel ?? 0;
    if (required === 0 || maximumPowerLevel === 0) {
      return c.json({ required: false, count: 0, maximumPowerLevel: 0, options: [], selected: [] });
    }

    const definition = await db
      .select({ id: classSpellcasting.id })
      .from(classSpellcasting)
      .where(and(eq(classSpellcasting.classId, firstClass.classId), eq(classSpellcasting.castingMode, "psionic")))
      .get();
    if (!definition) throw new ValidationError("Psionic casting-track definition is missing for this class.");

    const disciplineChoice = firstClass.classSlug === "psion"
      ? await db
          .select({ contentId: characterCreationChoices.contentId })
          .from(characterCreationChoices)
          .where(
            and(
              eq(characterCreationChoices.characterId, row.character.id),
              eq(characterCreationChoices.choiceKey, "psion-discipline"),
            ),
          )
          .get()
      : null;
    if (firstClass.classSlug === "psion" && !disciplineChoice?.contentId) {
      throw new ValidationError("Choose the psion's discipline before selecting powers.");
    }

    const optionRows = await db
      .select({
        id: powers.id,
        slug: powers.slug,
        name: powers.name,
        disciplineId: powers.disciplineId,
        powerLevel: powerClassLevels.powerLevel,
        powerPoints: powerClassLevels.powerPoints,
        specialistDisciplineId: powerClassLevels.specialistDisciplineId,
      })
      .from(powerClassLevels)
      .innerJoin(powers, eq(powerClassLevels.powerId, powers.id))
      .where(
        and(
          eq(powerClassLevels.classId, firstClass.classId),
          lte(powerClassLevels.powerLevel, maximumPowerLevel),
          eq(powers.isEnabled, true),
          or(isNull(powers.ownerUserId), eq(powers.ownerUserId, session.user.id)),
        ),
      )
      .orderBy(asc(powerClassLevels.powerLevel), asc(powers.name))
      .all();
    const options = firstClass.classSlug === "psion"
      ? optionRows.filter(
          ({ specialistDisciplineId }) =>
            specialistDisciplineId === null || specialistDisciplineId === disciplineChoice!.contentId,
        )
      : optionRows;
    const track = await db
      .select({ id: characterCastingTracks.id })
      .from(characterCastingTracks)
      .where(
        and(
          eq(characterCastingTracks.characterId, row.character.id),
          eq(characterCastingTracks.classSpellcastingId, definition.id),
        ),
      )
      .get();
    const selected = track
      ? await db
          .select({ powerId: characterPowers.powerId })
          .from(characterPowers)
          .where(eq(characterPowers.castingTrackId, track.id))
          .all()
      : [];
    return c.json({
      required: true,
      count: required,
      maximumPowerLevel,
      disciplineId: disciplineChoice?.contentId ?? null,
      options,
      selected,
    });
  })
  .put(
    "/api/characters/:characterId/powers",
    zValidator("json", selectionSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const input = c.req.valid("json");
      const db = createDatabase(requireCharacterDatabase(c.env.DB));
      const row = await requireCharacterCreatorEditor({ db, characterId: c.req.param("characterId"), userId: session.user.id });
      const firstClass = await requireFirstCharacterClass(db, row.character.id);
      const required = firstClass.powersKnown ?? 0;
      const maximumPowerLevel = firstClass.maxPowerLevel ?? 0;
      const uniqueIds = [...new Set(input.ids)];
      if (uniqueIds.length !== input.ids.length) throw new ValidationError("Power selections must be unique.");
      if (required === 0 || maximumPowerLevel === 0) {
        if (uniqueIds.length > 0) throw new ValidationError(`${firstClass.className} has no 1st-level power selection.`);
        await markCreationStep(db, row.character.id, "powersFinalized");
        return c.json({ characterId: row.character.id, powerIds: [], required: false });
      }
      if (uniqueIds.length !== required) {
        throw new ValidationError(`${firstClass.className} must choose exactly ${required} power${required === 1 ? "" : "s"} at 1st level.`);
      }

      const definition = await db
        .select({ id: classSpellcasting.id })
        .from(classSpellcasting)
        .where(and(eq(classSpellcasting.classId, firstClass.classId), eq(classSpellcasting.castingMode, "psionic")))
        .get();
      if (!definition) throw new ValidationError("Psionic casting-track definition is missing for this class.");
      const disciplineChoice = firstClass.classSlug === "psion"
        ? await db
            .select({ contentId: characterCreationChoices.contentId })
            .from(characterCreationChoices)
            .where(
              and(
                eq(characterCreationChoices.characterId, row.character.id),
                eq(characterCreationChoices.choiceKey, "psion-discipline"),
              ),
            )
            .get()
        : null;
      if (firstClass.classSlug === "psion" && !disciplineChoice?.contentId) {
        throw new ValidationError("Choose the psion's discipline before selecting powers.");
      }

      const selectedRows = await db
        .select({ id: powers.id, specialistDisciplineId: powerClassLevels.specialistDisciplineId })
        .from(powerClassLevels)
        .innerJoin(powers, eq(powerClassLevels.powerId, powers.id))
        .where(
          and(
            inArray(powers.id, uniqueIds),
            eq(powerClassLevels.classId, firstClass.classId),
            lte(powerClassLevels.powerLevel, maximumPowerLevel),
            eq(powers.isEnabled, true),
            or(isNull(powers.ownerUserId), eq(powers.ownerUserId, session.user.id)),
          ),
        )
        .all();
      if (selectedRows.length !== uniqueIds.length) {
        throw new ValidationError("One or more selected powers are unavailable to this class at 1st level.");
      }
      if (
        firstClass.classSlug === "psion" &&
        selectedRows.some(
          ({ specialistDisciplineId }) =>
            specialistDisciplineId !== null && specialistDisciplineId !== disciplineChoice!.contentId,
        )
      ) {
        throw new ValidationError("A psion can only select specialist powers from the chosen discipline.");
      }

      const trackId = await ensureClassCastingTrack(
        db,
        row.character.id,
        definition,
        disciplineChoice?.contentId ?? undefined,
      );
      await db.delete(characterPowers).where(eq(characterPowers.castingTrackId, trackId)).run();
      await db
        .insert(characterPowers)
        .values(uniqueIds.map((powerId) => ({ castingTrackId: trackId, powerId, accessKind: "known" as const, gainedAtLevel: 1 })))
        .run();
      await markCreationStep(db, row.character.id, "powersFinalized");
      return c.json({ characterId: row.character.id, castingTrackId: trackId, powerIds: uniqueIds });
    },
  );