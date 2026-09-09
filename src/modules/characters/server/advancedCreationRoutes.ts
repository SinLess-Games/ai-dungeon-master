/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import {
  campaigns,
  characterClassLevels,
  characters,
  classes,
  classLevels,
  dnd35Characters,
  races,
} from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
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
      items: rows.map((row) => ({ ...row, classes: classesByCharacter.get(row.id) ?? [] })),
    });
  })
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
