/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { and, asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import { characterCompanions, classFeatureGrants, classFeatures } from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import { ValidationError } from "@/server/middleware/errors";
import { markCreationStep, requireCharacterCreatorEditor, requireCharacterDatabase, requireFirstCharacterClasses } from "./creationAccess";

interface CharacterCreationBindings extends AuthEnv { DB?: D1Database; }
type CharacterCreationEnv = { Bindings: CharacterCreationBindings };
type FirstClass = Awaited<ReturnType<typeof requireFirstCharacterClasses>>[number];

const trackCompanionSchema = z.object({
  track: z.union([z.literal(1), z.literal(2)]),
  creatureName: z.string().trim().min(1).max(120).nullable(),
  name: z.string().trim().min(1).max(120).optional(),
});
const companionSelectionSchema = z.object({
  creatureName: z.string().trim().min(1).max(120).nullable().optional(),
  name: z.string().trim().min(1).max(120).optional(),
  selections: z.array(trackCompanionSchema).max(2).optional(),
});

const FAMILIAR_OPTIONS = ["Bat", "Cat", "Hawk", "Lizard", "Owl", "Rat", "Raven", "Tiny viper snake", "Toad", "Weasel"] as const;
const DRUID_COMPANION_OPTIONS = ["Badger", "Camel", "Dire rat", "Dog", "Riding dog", "Eagle", "Hawk", "Heavy horse", "Light horse", "Owl", "Pony", "Small viper snake", "Medium viper snake", "Wolf"] as const;

function normalizedChoice(value: string): string { return value.trim().toLocaleLowerCase(); }
function companionDefinition(classSlug: string): { kind: "familiar" | "animal_companion"; featureSlug: string; options: readonly string[] } | null {
  if (classSlug === "wizard") return { kind: "familiar", featureSlug: "wizard-summon-familiar", options: FAMILIAR_OPTIONS };
  if (classSlug === "sorcerer") return { kind: "familiar", featureSlug: "sorcerer-summon-familiar", options: FAMILIAR_OPTIONS };
  if (classSlug === "druid") return { kind: "animal_companion", featureSlug: "druid-animal-companion", options: DRUID_COMPANION_OPTIONS };
  return null;
}

async function featureForClass(db: ReturnType<typeof createDatabase>, firstClass: FirstClass, featureSlug: string) {
  return db
    .select({ id: classFeatures.id })
    .from(classFeatureGrants)
    .innerJoin(classFeatures, eq(classFeatureGrants.classFeatureId, classFeatures.id))
    .where(and(eq(classFeatureGrants.classLevelId, firstClass.classLevelId), eq(classFeatures.slug, featureSlug)))
    .get();
}

export const characterCompanionCreationRoutes = new Hono<CharacterCreationEnv>()
  .use("/api/characters/*", async (c, next) => { c.header("Cache-Control", "no-store"); await next(); })
  .get("/api/characters/:characterId/creation/companions", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const row = await requireCharacterCreatorEditor({ db, characterId: c.req.param("characterId"), userId: session.user.id });
    const firstClasses = await requireFirstCharacterClasses(db, row.character.id);
    const selected = await db.select({ id: characterCompanions.id, classFeatureId: characterCompanions.classFeatureId, kind: characterCompanions.kind, creatureName: characterCompanions.creatureName, name: characterCompanions.name }).from(characterCompanions).where(eq(characterCompanions.characterId, row.character.id)).orderBy(asc(characterCompanions.createdAt)).all();

    const sections = [];
    for (const firstClass of firstClasses) {
      const definition = companionDefinition(firstClass.classSlug);
      let classSelected = [] as typeof selected;
      if (definition) {
        const feature = await featureForClass(db, firstClass, definition.featureSlug);
        if (feature) classSelected = selected.filter(({ classFeatureId }) => classFeatureId === feature.id);
      }
      sections.push({
        track: firstClass.track,
        classId: firstClass.classId,
        className: firstClass.className,
        required: definition !== null,
        mayDecline: true,
        kind: definition?.kind ?? null,
        options: definition?.options ?? [],
        selected: classSelected,
      });
    }
    const relevant = sections.filter(({ required }) => required);
    const primary = relevant[0] ?? sections[0]!;
    return c.json({ ...primary, required: relevant.length > 0, sections, selected });
  })
  .put("/api/characters/:characterId/companions", zValidator("json", companionSelectionSchema), async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const input = c.req.valid("json");
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const row = await requireCharacterCreatorEditor({ db, characterId: c.req.param("characterId"), userId: session.user.id });
    const firstClasses = await requireFirstCharacterClasses(db, row.character.id);
    const relevant = firstClasses.filter(({ classSlug }) => companionDefinition(classSlug) !== null);
    const selections = input.selections ?? [{ track: relevant[0]?.track ?? 1, creatureName: input.creatureName ?? null, name: input.name }];
    if (new Set(selections.map(({ track }) => track)).size !== selections.length) throw new ValidationError("Each gestalt companion track can be selected only once.");
    const selectionByTrack = new Map(selections.map((selection) => [selection.track, selection]));

    await db.delete(characterCompanions).where(eq(characterCompanions.characterId, row.character.id)).run();
    const values: Array<typeof characterCompanions.$inferInsert> = [];
    for (const firstClass of relevant) {
      const definition = companionDefinition(firstClass.classSlug)!;
      const inputSelection = selectionByTrack.get(firstClass.track) ?? { track: firstClass.track, creatureName: null };
      if (inputSelection.creatureName === null) continue;
      const selectedOption = definition.options.find((option) => normalizedChoice(option) === normalizedChoice(inputSelection.creatureName!));
      if (!selectedOption) throw new ValidationError(`${inputSelection.creatureName} is not a standard 1st-level ${definition.kind === "familiar" ? "familiar" : "druid animal companion"} choice.`);
      const feature = await featureForClass(db, firstClass, definition.featureSlug);
      if (!feature) throw new ValidationError(`${firstClass.className} companion feature is missing from the rules catalog.`);
      values.push({
        id: crypto.randomUUID(), characterId: row.character.id, classFeatureId: feature.id, kind: definition.kind,
        creatureName: selectedOption, ...(inputSelection.name ? { name: inputSelection.name } : {}),
        details: { source: "character-creation", characterLevel: 1, track: firstClass.track },
      });
    }
    if (values.length > 0) await db.insert(characterCompanions).values(values).run();
    await markCreationStep(db, row.character.id, "companionsFinalized");
    return c.json({ characterId: row.character.id, selected: values, required: relevant.length > 0 });
  });
