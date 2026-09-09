/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { and, asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import {
  characterCompanions,
  classFeatureGrants,
  classFeatures,
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

const companionSelectionSchema = z.object({
  creatureName: z.string().trim().min(1).max(120).nullable(),
  name: z.string().trim().min(1).max(120).optional(),
});

const FAMILIAR_OPTIONS = [
  "Bat",
  "Cat",
  "Hawk",
  "Lizard",
  "Owl",
  "Rat",
  "Raven",
  "Tiny viper snake",
  "Toad",
  "Weasel",
] as const;

const DRUID_COMPANION_OPTIONS = [
  "Badger",
  "Camel",
  "Dire rat",
  "Dog",
  "Riding dog",
  "Eagle",
  "Hawk",
  "Heavy horse",
  "Light horse",
  "Owl",
  "Pony",
  "Small viper snake",
  "Medium viper snake",
  "Wolf",
] as const;

function normalizedChoice(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function companionDefinition(classSlug: string): {
  kind: "familiar" | "animal_companion";
  featureSlug: string;
  options: readonly string[];
} | null {
  if (classSlug === "wizard") {
    return { kind: "familiar", featureSlug: "wizard-summon-familiar", options: FAMILIAR_OPTIONS };
  }
  if (classSlug === "sorcerer") {
    return { kind: "familiar", featureSlug: "sorcerer-summon-familiar", options: FAMILIAR_OPTIONS };
  }
  if (classSlug === "druid") {
    return { kind: "animal_companion", featureSlug: "druid-animal-companion", options: DRUID_COMPANION_OPTIONS };
  }
  return null;
}

export const characterCompanionCreationRoutes = new Hono<CharacterCreationEnv>()
  .use("/api/characters/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/characters/:characterId/creation/companions", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const row = await requireCharacterCreatorEditor({
      db,
      characterId: c.req.param("characterId"),
      userId: session.user.id,
    });
    const firstClass = await requireFirstCharacterClass(db, row.character.id);
    const definition = companionDefinition(firstClass.classSlug);
    const selected = await db
      .select({
        id: characterCompanions.id,
        kind: characterCompanions.kind,
        creatureName: characterCompanions.creatureName,
        name: characterCompanions.name,
      })
      .from(characterCompanions)
      .where(eq(characterCompanions.characterId, row.character.id))
      .orderBy(asc(characterCompanions.createdAt))
      .all();

    return c.json({
      required: definition !== null,
      mayDecline: true,
      classId: firstClass.classId,
      className: firstClass.className,
      kind: definition?.kind ?? null,
      options: definition?.options ?? [],
      selected,
    });
  })
  .put(
    "/api/characters/:characterId/companions",
    zValidator("json", companionSelectionSchema),
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
      const definition = companionDefinition(firstClass.classSlug);

      await db
        .delete(characterCompanions)
        .where(eq(characterCompanions.characterId, row.character.id))
        .run();

      if (!definition) {
        if (input.creatureName !== null) {
          throw new ValidationError(`${firstClass.className} has no familiar or animal-companion choice at 1st level.`);
        }
        await markCreationStep(db, row.character.id, "companionsFinalized");
        return c.json({ characterId: row.character.id, selected: null, required: false });
      }

      if (input.creatureName === null) {
        await markCreationStep(db, row.character.id, "companionsFinalized");
        return c.json({ characterId: row.character.id, selected: null, declined: true });
      }

      const selectedOption = definition.options.find(
        (option) => normalizedChoice(option) === normalizedChoice(input.creatureName!),
      );
      if (!selectedOption) {
        throw new ValidationError(
          `${input.creatureName} is not a standard 1st-level ${definition.kind === "familiar" ? "familiar" : "druid animal companion"} choice.`,
        );
      }

      const feature = await db
        .select({ id: classFeatures.id })
        .from(classFeatureGrants)
        .innerJoin(classFeatures, eq(classFeatureGrants.classFeatureId, classFeatures.id))
        .where(
          and(
            eq(classFeatureGrants.classLevelId, firstClass.classLevelId),
            eq(classFeatures.slug, definition.featureSlug),
          ),
        )
        .get();
      if (!feature) {
        throw new ValidationError(`${firstClass.className} companion feature is missing from the rules catalog.`);
      }

      const value = {
        id: crypto.randomUUID(),
        characterId: row.character.id,
        classFeatureId: feature.id,
        kind: definition.kind,
        creatureName: selectedOption,
        ...(input.name === undefined ? {} : { name: input.name }),
        details: { source: "character-creation", characterLevel: 1 },
      };
      await db.insert(characterCompanions).values(value).run();
      await markCreationStep(db, row.character.id, "companionsFinalized");
      return c.json({ characterId: row.character.id, selected: value });
    },
  );