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
  powerDisciplines,
  powers,
  raceAbilities,
  spellClassLevels,
  spellSchools,
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
  requireFirstCharacterClasses,
  type CharacterDatabase,
} from "./creationAccess";

interface CharacterCreationBindings extends AuthEnv { DB?: D1Database; }
type CharacterCreationEnv = { Bindings: CharacterCreationBindings };
type FirstClass = Awaited<ReturnType<typeof requireFirstCharacterClasses>>[number];

const trackSelectionSchema = z.object({ track: z.union([z.literal(1), z.literal(2)]), ids: z.array(z.string().trim().min(1)).max(300) });
const selectionSchema = z.object({
  ids: z.array(z.string().trim().min(1)).max(300).optional(),
  tracks: z.array(trackSelectionSchema).max(2).optional(),
});

async function ensureClassCastingTrack(db: CharacterDatabase, characterId: string, definition: { id: string }, specializationKey?: string) {
  const existing = await db.select({ id: characterCastingTracks.id }).from(characterCastingTracks).where(and(eq(characterCastingTracks.characterId, characterId), eq(characterCastingTracks.classSpellcastingId, definition.id))).get();
  if (existing) {
    await db.update(characterCastingTracks).set({ specializationKey: specializationKey ?? null, updatedAt: new Date() }).where(eq(characterCastingTracks.id, existing.id)).run();
    return existing.id;
  }
  const id = crypto.randomUUID();
  await db.insert(characterCastingTracks).values({ id, characterId, classSpellcastingId: definition.id, ...(specializationKey === undefined ? {} : { specializationKey }) }).run();
  return id;
}

async function wizardSpecialization(db: CharacterDatabase, characterId: string): Promise<{ schoolId?: string; prohibitedSchoolIds: string[] }> {
  const choice = await db.select({ contentId: characterCreationChoices.contentId, valueText: characterCreationChoices.valueText, parameters: characterCreationChoices.parameters }).from(characterCreationChoices).where(and(eq(characterCreationChoices.characterId, characterId), eq(characterCreationChoices.choiceKey, "wizard-school-specialization"))).get();
  if (!choice || choice.valueText === "generalist") return { prohibitedSchoolIds: [] };
  if (!choice.contentId) throw new ValidationError("Complete wizard school specialization before choosing spells.");
  const raw = choice.parameters?.["prohibitedSchoolIds"];
  return { schoolId: choice.contentId, prohibitedSchoolIds: Array.isArray(raw) ? raw.filter((value): value is string => typeof value === "string") : [] };
}

async function effectiveIntelligence(db: CharacterDatabase, characterId: string): Promise<number> {
  const [extension, score] = await Promise.all([
    db.select({ raceId: dnd35Characters.raceId }).from(dnd35Characters).where(eq(dnd35Characters.characterId, characterId)).get(),
    db.select({ baseScore: characterAbilityScores.baseScore }).from(characterAbilityScores).where(and(eq(characterAbilityScores.characterId, characterId), eq(characterAbilityScores.ability, "int"))).get(),
  ]);
  if (!extension?.raceId || score?.baseScore == null) throw new ValidationError("Choose race and ability scores before choosing Intelligence-based spells.");
  const racial = await db.select({ modifier: raceAbilities.modifier }).from(raceAbilities).where(and(eq(raceAbilities.raceId, extension.raceId), eq(raceAbilities.ability, "int"))).get();
  return score.baseScore + (racial?.modifier ?? 0);
}

async function spellDefinition(db: CharacterDatabase, firstClass: FirstClass) {
  return db.select({ id: classSpellcasting.id, castingMode: classSpellcasting.castingMode, knownBehavior: classSpellcasting.knownBehavior, classId: classSpellcasting.classId, spellListClassId: classSpellcasting.spellListClassId }).from(classSpellcasting).where(eq(classSpellcasting.classId, firstClass.classId)).get();
}

async function firstLevelSpellProgression(db: CharacterDatabase, firstClass: FirstClass) {
  return db.select({ spellLevel: classSpellcastingProgression.spellLevel, slotsPerDay: classSpellcastingProgression.slotsPerDay, spellsKnown: classSpellcastingProgression.spellsKnown }).from(classSpellcastingProgression).where(and(eq(classSpellcastingProgression.classId, firstClass.classId), eq(classSpellcastingProgression.classLevel, 1))).orderBy(asc(classSpellcastingProgression.spellLevel)).all();
}

async function spellOptions(db: CharacterDatabase, userId: string, listClassId: string, maximumLevel: number) {
  return db
    .select({
      id: spells.id,
      slug: spells.slug,
      name: spells.name,
      description: spells.description,
      rulesText: spells.rulesText,
      schoolId: spells.schoolId,
      schoolSlug: spellSchools.slug,
      schoolName: spellSchools.name,
      spellLevel: spellClassLevels.spellLevel,
      castingTime: spells.castingTime,
      rangeText: spells.rangeText,
      durationText: spells.durationText,
    })
    .from(spellClassLevels)
    .innerJoin(spells, eq(spellClassLevels.spellId, spells.id))
    .innerJoin(spellSchools, eq(spells.schoolId, spellSchools.id))
    .where(and(eq(spellClassLevels.classId, listClassId), lte(spellClassLevels.spellLevel, maximumLevel), eq(spells.isEnabled, true), or(isNull(spells.ownerUserId), eq(spells.ownerUserId, userId))))
    .orderBy(asc(spellClassLevels.spellLevel), asc(spellSchools.name), asc(spells.name))
    .all();
}

async function spellSection(db: CharacterDatabase, userId: string, characterId: string, firstClass: FirstClass) {
  const definition = await spellDefinition(db, firstClass);
  if (!definition || definition.castingMode === "psionic") return { track: firstClass.track, classId: firstClass.classId, className: firstClass.className, required: false, mode: null, options: [], selected: [] };
  const progression = await firstLevelSpellProgression(db, firstClass);
  if (progression.length === 0) return { track: firstClass.track, classId: firstClass.classId, className: firstClass.className, required: false, mode: definition.knownBehavior, options: [], selected: [] };
  const listClassId = definition.spellListClassId ?? firstClass.classId;
  const maximumLevel = Math.max(...progression.map(({ spellLevel }) => spellLevel));
  let options = await spellOptions(db, userId, listClassId, maximumLevel);
  const castingTrack = await db.select({ id: characterCastingTracks.id }).from(characterCastingTracks).where(and(eq(characterCastingTracks.characterId, characterId), eq(characterCastingTracks.classSpellcastingId, definition.id))).get();
  const selected = castingTrack ? await db.select({ spellId: characterSpells.spellId }).from(characterSpells).where(eq(characterSpells.castingTrackId, castingTrack.id)).all() : [];

  if (definition.knownBehavior === "spellbook" && firstClass.classSlug === "wizard") {
    const specialization = await wizardSpecialization(db, characterId);
    options = options.filter((spell) => !specialization.prohibitedSchoolIds.includes(spell.schoolId));
    const intelligence = await effectiveIntelligence(db, characterId);
    return { track: firstClass.track, classId: firstClass.classId, className: firstClass.className, required: true, mode: "spellbook" as const, automaticSpellIds: options.filter(({ spellLevel }) => spellLevel === 0).map(({ id }) => id), firstLevelChoicesRequired: 3 + Math.max(0, abilityModifier(intelligence)), specialization, options, selected };
  }

  const knownByLevel = Object.fromEntries(progression.filter(({ spellsKnown }) => spellsKnown !== null).map(({ spellLevel, spellsKnown }) => [spellLevel, spellsKnown]));
  if (firstClass.classSlug === "duskblade" && definition.knownBehavior === "limited") {
    const intelligence = await effectiveIntelligence(db, characterId);
    knownByLevel[0] = 2 + Math.max(0, abilityModifier(intelligence));
    knownByLevel[1] = 2;
  }
  return {
    track: firstClass.track,
    classId: firstClass.classId,
    className: firstClass.className,
    required: definition.knownBehavior === "limited",
    automaticKnown: definition.knownBehavior === "all_list",
    mode: definition.knownBehavior,
    knownByLevel,
    options,
    selected,
  };
}

async function saveSpellSection(db: CharacterDatabase, userId: string, characterId: string, firstClass: FirstClass, ids: string[]) {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length !== ids.length) throw new ValidationError(`${firstClass.className} spell selections must be unique.`);
  const definition = await spellDefinition(db, firstClass);
  if (!definition || definition.castingMode === "psionic") {
    if (uniqueIds.length > 0) throw new ValidationError(`${firstClass.className} has no 1st-level spell selection.`);
    return [];
  }
  const progression = await firstLevelSpellProgression(db, firstClass);
  if (progression.length === 0) {
    if (uniqueIds.length > 0) throw new ValidationError(`${firstClass.className} cannot select spells at 1st level.`);
    return [];
  }
  const listClassId = definition.spellListClassId ?? firstClass.classId;
  const maximumLevel = Math.max(...progression.map(({ spellLevel }) => spellLevel));
  const selectedRows = uniqueIds.length ? await db.select({ id: spells.id, name: spells.name, schoolId: spells.schoolId, spellLevel: spellClassLevels.spellLevel }).from(spellClassLevels).innerJoin(spells, eq(spellClassLevels.spellId, spells.id)).where(and(inArray(spells.id, uniqueIds), eq(spellClassLevels.classId, listClassId), lte(spellClassLevels.spellLevel, maximumLevel), eq(spells.isEnabled, true), or(isNull(spells.ownerUserId), eq(spells.ownerUserId, userId)))).all() : [];
  if (selectedRows.length !== uniqueIds.length) throw new ValidationError(`One or more selected spells are not available to ${firstClass.className} at 1st level.`);

  let specializationKey: string | undefined;
  let persistedSpellIds = uniqueIds;
  if (definition.knownBehavior === "limited") {
    const knownByLevel: Record<number, number> = Object.fromEntries(progression.map(({ spellLevel, spellsKnown }) => [spellLevel, spellsKnown ?? 0]));
    if (firstClass.classSlug === "duskblade") {
      const intelligence = await effectiveIntelligence(db, characterId);
      knownByLevel[0] = 2 + Math.max(0, abilityModifier(intelligence));
      knownByLevel[1] = 2;
    }
    for (const [spellLevelText, required] of Object.entries(knownByLevel)) {
      const spellLevel = Number(spellLevelText);
      const actual = selectedRows.filter((row) => row.spellLevel === spellLevel).length;
      if (actual !== required) throw new ValidationError(`${firstClass.className} must know exactly ${required} level-${spellLevel} spell${required === 1 ? "" : "s"} at 1st level.`);
    }
  } else if (definition.knownBehavior === "all_list" || definition.knownBehavior === "none") {
    if (uniqueIds.length > 0) throw new ValidationError(`${firstClass.className} automatically knows its accessible list and does not choose individual known spells at 1st level.`);
    persistedSpellIds = [];
  } else if (definition.knownBehavior === "spellbook" && firstClass.classSlug === "wizard") {
    const specialization = await wizardSpecialization(db, characterId);
    specializationKey = specialization.schoolId;
    if (selectedRows.some(({ schoolId }) => specialization.prohibitedSchoolIds.includes(schoolId))) throw new ValidationError("A specialist wizard cannot add prohibited-school spells to the starting spellbook.");
    if (selectedRows.some(({ spellLevel }) => spellLevel !== 1)) throw new ValidationError("Submit only the wizard's chosen 1st-level spells; 0-level spells are added automatically.");
    const intelligence = await effectiveIntelligence(db, characterId);
    const required = 3 + Math.max(0, abilityModifier(intelligence));
    if (selectedRows.length !== required) throw new ValidationError(`A 1st-level wizard must choose exactly ${required} 1st-level spells for the starting spellbook.`);
    const cantrips = await db.select({ id: spells.id, schoolId: spells.schoolId }).from(spellClassLevels).innerJoin(spells, eq(spellClassLevels.spellId, spells.id)).where(and(eq(spellClassLevels.classId, listClassId), eq(spellClassLevels.spellLevel, 0), eq(spells.isEnabled, true), or(isNull(spells.ownerUserId), eq(spells.ownerUserId, userId)))).all();
    persistedSpellIds = [...cantrips.filter(({ schoolId }) => !specialization.prohibitedSchoolIds.includes(schoolId)).map(({ id }) => id), ...uniqueIds];
  }

  const castingTrackId = await ensureClassCastingTrack(db, characterId, definition, specializationKey);
  await db.delete(characterSpells).where(eq(characterSpells.castingTrackId, castingTrackId)).run();
  if (definition.knownBehavior === "limited" && persistedSpellIds.length > 0) {
    await db.insert(characterSpells).values(persistedSpellIds.map((spellId) => ({ castingTrackId, spellId, accessKind: "known" as const, gainedAtLevel: 1 }))).run();
  }
  if (definition.knownBehavior === "spellbook" && firstClass.classSlug === "wizard") {
    await db.delete(characterSpellbooks).where(eq(characterSpellbooks.characterId, characterId)).run();
    const spellbookId = crypto.randomUUID();
    await db.insert(characterSpellbooks).values({ id: spellbookId, characterId, name: "Primary Spellbook" }).run();
    if (persistedSpellIds.length > 0) await db.insert(characterSpellbookSpells).values(persistedSpellIds.map((spellId) => ({ spellbookId, spellId }))).run();
  }
  return persistedSpellIds;
}

async function powerDefinition(db: CharacterDatabase, firstClass: FirstClass) {
  return db.select({ id: classSpellcasting.id }).from(classSpellcasting).where(and(eq(classSpellcasting.classId, firstClass.classId), eq(classSpellcasting.castingMode, "psionic"))).get();
}

async function powerDisciplineChoice(db: CharacterDatabase, characterId: string, firstClass: FirstClass) {
  if (firstClass.classSlug !== "psion") return null;
  const choice = await db.select({ contentId: characterCreationChoices.contentId }).from(characterCreationChoices).where(and(eq(characterCreationChoices.characterId, characterId), eq(characterCreationChoices.choiceKey, "psion-discipline"))).get();
  if (!choice?.contentId) throw new ValidationError("Choose the psion's discipline before selecting powers.");
  return choice.contentId;
}

async function powerSection(db: CharacterDatabase, userId: string, characterId: string, firstClass: FirstClass) {
  const count = firstClass.powersKnown ?? 0;
  const maximumPowerLevel = firstClass.maxPowerLevel ?? 0;
  if (count === 0 || maximumPowerLevel === 0) return { track: firstClass.track, classId: firstClass.classId, className: firstClass.className, required: false, count: 0, maximumPowerLevel: 0, options: [], selected: [] };
  const definition = await powerDefinition(db, firstClass);
  if (!definition) throw new ValidationError("Psionic casting-track definition is missing for this class.");
  const disciplineId = await powerDisciplineChoice(db, characterId, firstClass);
  const optionRows = await db
    .select({
      id: powers.id,
      slug: powers.slug,
      name: powers.name,
      description: powers.description,
      rulesText: powers.rulesText,
      disciplineId: powers.disciplineId,
      disciplineName: powerDisciplines.name,
      powerLevel: powerClassLevels.powerLevel,
      powerPoints: powerClassLevels.powerPoints,
      specialistDisciplineId: powerClassLevels.specialistDisciplineId,
      manifestingTime: powers.manifestingTime,
      rangeText: powers.rangeText,
      durationText: powers.durationText,
      augmentationText: powers.augmentationText,
    })
    .from(powerClassLevels)
    .innerJoin(powers, eq(powerClassLevels.powerId, powers.id))
    .leftJoin(powerDisciplines, eq(powers.disciplineId, powerDisciplines.id))
    .where(and(eq(powerClassLevels.classId, firstClass.classId), lte(powerClassLevels.powerLevel, maximumPowerLevel), eq(powers.isEnabled, true), or(isNull(powers.ownerUserId), eq(powers.ownerUserId, userId))))
    .orderBy(asc(powerClassLevels.powerLevel), asc(powers.name))
    .all();
  const options = firstClass.classSlug === "psion" ? optionRows.filter(({ specialistDisciplineId }) => specialistDisciplineId === null || specialistDisciplineId === disciplineId) : optionRows;
  const castingTrack = await db.select({ id: characterCastingTracks.id }).from(characterCastingTracks).where(and(eq(characterCastingTracks.characterId, characterId), eq(characterCastingTracks.classSpellcastingId, definition.id))).get();
  const selected = castingTrack ? await db.select({ powerId: characterPowers.powerId }).from(characterPowers).where(eq(characterPowers.castingTrackId, castingTrack.id)).all() : [];
  return { track: firstClass.track, classId: firstClass.classId, className: firstClass.className, required: true, count, maximumPowerLevel, disciplineId, options, selected };
}

async function savePowerSection(db: CharacterDatabase, userId: string, characterId: string, firstClass: FirstClass, ids: string[]) {
  const count = firstClass.powersKnown ?? 0;
  const maximumPowerLevel = firstClass.maxPowerLevel ?? 0;
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length !== ids.length) throw new ValidationError(`${firstClass.className} power selections must be unique.`);
  if (count === 0 || maximumPowerLevel === 0) {
    if (uniqueIds.length > 0) throw new ValidationError(`${firstClass.className} has no 1st-level power selection.`);
    return [];
  }
  if (uniqueIds.length !== count) throw new ValidationError(`${firstClass.className} must choose exactly ${count} power${count === 1 ? "" : "s"} at 1st level.`);
  const definition = await powerDefinition(db, firstClass);
  if (!definition) throw new ValidationError("Psionic casting-track definition is missing for this class.");
  const disciplineId = await powerDisciplineChoice(db, characterId, firstClass);
  const selectedRows = await db.select({ id: powers.id, specialistDisciplineId: powerClassLevels.specialistDisciplineId }).from(powerClassLevels).innerJoin(powers, eq(powerClassLevels.powerId, powers.id)).where(and(inArray(powers.id, uniqueIds), eq(powerClassLevels.classId, firstClass.classId), lte(powerClassLevels.powerLevel, maximumPowerLevel), eq(powers.isEnabled, true), or(isNull(powers.ownerUserId), eq(powers.ownerUserId, userId)))).all();
  if (selectedRows.length !== uniqueIds.length) throw new ValidationError(`One or more selected powers are unavailable to ${firstClass.className} at 1st level.`);
  if (firstClass.classSlug === "psion" && selectedRows.some(({ specialistDisciplineId }) => specialistDisciplineId !== null && specialistDisciplineId !== disciplineId)) throw new ValidationError("A psion can only select specialist powers from the chosen discipline.");
  const castingTrackId = await ensureClassCastingTrack(db, characterId, definition, disciplineId ?? undefined);
  await db.delete(characterPowers).where(eq(characterPowers.castingTrackId, castingTrackId)).run();
  await db.insert(characterPowers).values(uniqueIds.map((powerId) => ({ castingTrackId, powerId, accessKind: "known" as const, gainedAtLevel: 1 }))).run();
  return uniqueIds;
}

function selectionsByTrack(input: z.infer<typeof selectionSchema>, firstClasses: FirstClass[]) {
  if (input.tracks) {
    if (new Set(input.tracks.map(({ track }) => track)).size !== input.tracks.length) throw new ValidationError("Each gestalt track can submit selections only once.");
    return new Map(input.tracks.map(({ track, ids }) => [track, ids]));
  }
  return new Map([[1, input.ids ?? []], ...firstClasses.filter(({ track }) => track === 2).map(({ track }) => [track, []] as const)]);
}

export const characterCastingCreationRoutes = new Hono<CharacterCreationEnv>()
  .use("/api/characters/*", async (c, next) => { c.header("Cache-Control", "no-store"); await next(); })
  .get("/api/characters/:characterId/creation/spells", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const row = await requireCharacterCreatorEditor({ db, characterId: c.req.param("characterId"), userId: session.user.id });
    const firstClasses = await requireFirstCharacterClasses(db, row.character.id);
    const sections = await Promise.all(firstClasses.map((firstClass) => spellSection(db, session.user.id, row.character.id, firstClass)));
    const relevant = sections.filter((section) => section.mode !== null);
    const primary = relevant[0] ?? sections[0]!;
    return c.json({ ...primary, sections, required: relevant.some((section) => section.required) });
  })
  .put("/api/characters/:characterId/spells", zValidator("json", selectionSchema), async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const input = c.req.valid("json");
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const row = await requireCharacterCreatorEditor({ db, characterId: c.req.param("characterId"), userId: session.user.id });
    const firstClasses = await requireFirstCharacterClasses(db, row.character.id);
    const byTrack = selectionsByTrack(input, firstClasses);
    const results = [];
    for (const firstClass of firstClasses) results.push({ track: firstClass.track, className: firstClass.className, spellIds: await saveSpellSection(db, session.user.id, row.character.id, firstClass, byTrack.get(firstClass.track) ?? []) });
    await markCreationStep(db, row.character.id, "spellsFinalized");
    return c.json({ characterId: row.character.id, tracks: results, spellIds: results.flatMap(({ spellIds }) => spellIds) });
  })
  .get("/api/characters/:characterId/creation/powers", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const row = await requireCharacterCreatorEditor({ db, characterId: c.req.param("characterId"), userId: session.user.id });
    const firstClasses = await requireFirstCharacterClasses(db, row.character.id);
    const sections = await Promise.all(firstClasses.map((firstClass) => powerSection(db, session.user.id, row.character.id, firstClass)));
    const relevant = sections.filter(({ required }) => required);
    const primary = relevant[0] ?? sections[0]!;
    return c.json({ ...primary, sections, required: relevant.length > 0 });
  })
  .put("/api/characters/:characterId/powers", zValidator("json", selectionSchema), async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const input = c.req.valid("json");
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const row = await requireCharacterCreatorEditor({ db, characterId: c.req.param("characterId"), userId: session.user.id });
    const firstClasses = await requireFirstCharacterClasses(db, row.character.id);
    const byTrack = selectionsByTrack(input, firstClasses);
    const results = [];
    for (const firstClass of firstClasses) results.push({ track: firstClass.track, className: firstClass.className, powerIds: await savePowerSection(db, session.user.id, row.character.id, firstClass, byTrack.get(firstClass.track) ?? []) });
    await markCreationStep(db, row.character.id, "powersFinalized");
    return c.json({ characterId: row.character.id, tracks: results, powerIds: results.flatMap(({ powerIds }) => powerIds) });
  });
