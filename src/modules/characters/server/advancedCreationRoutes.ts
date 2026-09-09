/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import {
  campaigns,
  characterAbilityScores,
  characterClassLevels,
  characters,
  classes,
  classLevels,
  dnd35Characters,
  races,
} from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import {
  pointBuyBudgets,
  pointBuyTotal,
  type AbilityGenerationMethod,
} from "../domain/abilityGeneration";
import { monsterEffectiveCharacterLevel } from "../domain/monsterRaceCreation";
import { ValidationError } from "@/server/middleware/errors";
import {
  requireCharacterCreatorEditor,
  requireCharacterDatabase,
} from "./creationAccess";

interface CharacterCreationBindings extends AuthEnv {
  DB?: D1Database;
}
type CharacterCreationEnv = { Bindings: CharacterCreationBindings };

const progressionSchema = z.object({ mode: z.enum(["standard", "gestalt"]) });
const abilityKeySchema = z.enum(["str", "dex", "con", "int", "wis", "cha"]);
const abilityScoresSchema = z.object({
  str: z.number().int().min(0).max(100),
  dex: z.number().int().min(0).max(100),
  con: z.number().int().min(0).max(100),
  int: z.number().int().min(0).max(100),
  wis: z.number().int().min(0).max(100),
  cha: z.number().int().min(0).max(100),
});
const abilityMethodSchema = z.union([
  z.literal("standard-array"),
  ...pointBuyBudgets.map((budget) => z.literal(`point-buy-${budget}` as const)),
  z.literal("roll-4d6-drop-lowest"),
  z.literal("roll-4d6-reroll-1-2"),
]);
const advancedAbilitySchema = z.object({
  method: abilityMethodSchema,
  scores: abilityScoresSchema,
});

function validateAbilityMethod(method: AbilityGenerationMethod, values: number[]) {
  if (method === "standard-array") {
    const expected = [15, 14, 13, 12, 10, 8].sort((a, b) => a - b);
    const actual = [...values].sort((a, b) => a - b);
    if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
      throw new ValidationError("Standard-array characters must assign 15, 14, 13, 12, 10, and 8 exactly once.");
    }
    return;
  }

  if (method.startsWith("point-buy-")) {
    const budget = Number(method.slice("point-buy-".length));
    if (!pointBuyBudgets.includes(budget as (typeof pointBuyBudgets)[number])) {
      throw new ValidationError("Unsupported point-buy budget.");
    }
    if (values.some((score) => score < 8 || score > 18)) {
      throw new ValidationError("Point-buy scores must be between 8 and 18 before racial modifiers.");
    }
    const spent = pointBuyTotal(values);
    if (spent !== budget) {
      throw new ValidationError(`Spend exactly ${budget} point-buy points.`, {
        budget,
        spent,
        remaining: budget - spent,
      });
    }
    return;
  }

  const minimum = method === "roll-4d6-reroll-1-2" ? 12 : 3;
  const maximum = method === "roll-4d6-reroll-1-2" ? 24 : 18;
  if (values.some((score) => score < minimum || score > maximum)) {
    throw new ValidationError(`Rolled scores for ${method} must be between ${minimum} and ${maximum}.`);
  }
}

export const characterAdvancedCreationRoutes = new Hono<CharacterCreationEnv>()
  .use("/api/characters*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/characters", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const rows = await db
      .select({
        id: characters.id,
        name: characters.name,
        status: characters.status,
        campaignId: characters.campaignId,
        campaignName: campaigns.name,
        campaignStatus: campaigns.status,
        updatedAt: characters.updatedAt,
        readyAt: characters.readyAt,
        progressionMode: dnd35Characters.progressionMode,
        raceId: dnd35Characters.raceId,
        raceName: races.name,
        levelAdjustment: races.levelAdjustment,
        racialHitDice: races.racialHitDice,
      })
      .from(characters)
      .innerJoin(campaigns, eq(characters.campaignId, campaigns.id))
      .leftJoin(dnd35Characters, eq(dnd35Characters.characterId, characters.id))
      .leftJoin(races, eq(dnd35Characters.raceId, races.id))
      .where(eq(characters.ownerUserId, session.user.id))
      .orderBy(desc(characters.updatedAt))
      .all();

    const ids = rows.map(({ id }) => id);
    const classRows = ids.length === 0
      ? []
      : await db
          .select({
            characterId: characterClassLevels.characterId,
            track: characterClassLevels.track,
            characterLevel: characterClassLevels.characterLevel,
            className: classes.name,
          })
          .from(characterClassLevels)
          .innerJoin(classLevels, eq(characterClassLevels.classLevelId, classLevels.id))
          .innerJoin(classes, eq(classLevels.classId, classes.id))
          .where(inArray(characterClassLevels.characterId, ids))
          .orderBy(asc(characterClassLevels.track), asc(characterClassLevels.characterLevel))
          .all();
    const classesByCharacter = new Map<string, Array<{ track: number; characterLevel: number; className: string }>>();
    for (const classRow of classRows) {
      const list = classesByCharacter.get(classRow.characterId) ?? [];
      list.push({ track: classRow.track, characterLevel: classRow.characterLevel, className: classRow.className });
      classesByCharacter.set(classRow.characterId, list);
    }

    return c.json({
      items: rows.map((row) => {
        const characterClasses = classesByCharacter.get(row.id) ?? [];
        const classLevelCount = new Set(characterClasses.map(({ characterLevel }) => characterLevel)).size;
        const racialHitDice = row.racialHitDice ?? 0;
        const levelAdjustment = row.levelAdjustment ?? 0;
        return {
          ...row,
          racialHitDice,
          totalHitDice: racialHitDice + classLevelCount,
          effectiveCharacterLevel: monsterEffectiveCharacterLevel(racialHitDice, classLevelCount, levelAdjustment),
          classes: characterClasses,
        };
      }),
    });
  })
  .put(
    "/api/characters/:characterId/creation/abilities",
    zValidator("json", advancedAbilitySchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const input = c.req.valid("json");
      const db = createDatabase(requireCharacterDatabase(c.env.DB));
      const row = await requireCharacterCreatorEditor({
        db,
        characterId: c.req.param("characterId"),
        userId: session.user.id,
      });
      const entries = Object.entries(input.scores) as Array<[z.infer<typeof abilityKeySchema>, number]>;
      validateAbilityMethod(input.method as AbilityGenerationMethod, entries.map(([, score]) => score));
      const now = new Date();
      await db.batch([
        db.delete(characterAbilityScores).where(eq(characterAbilityScores.characterId, row.character.id)),
        db.insert(characterAbilityScores).values(
          entries.map(([ability, baseScore]) => ({
            characterId: row.character.id,
            ability,
            baseScore,
            createdAt: now,
            updatedAt: now,
          })),
        ),
      ]);
      return c.json({ characterId: row.character.id, method: input.method, abilityScores: input.scores });
    },
  )
  .put(
    "/api/characters/:characterId/progression-mode",
    zValidator("json", progressionSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const { mode } = c.req.valid("json");
      const db = createDatabase(requireCharacterDatabase(c.env.DB));
      const row = await requireCharacterCreatorEditor({
        db,
        characterId: c.req.param("characterId"),
        userId: session.user.id,
      });
      const classRows = await db
        .select({ track: characterClassLevels.track })
        .from(characterClassLevels)
        .where(eq(characterClassLevels.characterId, row.character.id))
        .all();
      if (mode === "standard" && classRows.some(({ track }) => track === 2)) {
        throw new ValidationError("Remove the secondary gestalt track before switching to standard progression.");
      }
      await db
        .update(dnd35Characters)
        .set({ progressionMode: mode, updatedAt: new Date() })
        .where(eq(dnd35Characters.characterId, row.character.id))
        .run();
      return c.json({ characterId: row.character.id, progressionMode: mode });
    },
  );
