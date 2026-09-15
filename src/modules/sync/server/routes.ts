/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { and, eq, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import { campaigns, characters, worldMaps, worlds } from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from "@/server/middleware/errors";

interface Bindings extends AuthEnv {
  DB?: D1Database;
}

type Env = { Bindings: Bindings };

type SyncResourceKind = "campaign" | "character" | "world" | "map";

const mapDataSchema = z.record(z.string(), z.unknown());
const createMapSchema = z.object({
  id: z.string().trim().min(1).max(240).optional(),
  name: z.string().trim().min(1).max(160),
  kind: z.enum(["world", "region", "location", "tactical"]).default("world"),
  data: mapDataSchema.default({}),
});
const updateMapSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    kind: z.enum(["world", "region", "location", "tactical"]).optional(),
    data: mapDataSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one map field is required.");

function requireDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("Cloud sync storage is unavailable.");
  return binding;
}

function timestampVersion(value: Date | string | number): number {
  if (value instanceof Date) return Math.floor(value.getTime() / 1000);
  if (typeof value === "number") return value < 10_000_000_000 ? value : Math.floor(value / 1000);
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : 0;
}

async function requireOwnedWorld(input: {
  db: ReturnType<typeof createDatabase>;
  worldId: string;
  userId: string;
}) {
  const row = await input.db
    .select({ world: worlds, campaignId: campaigns.id })
    .from(worlds)
    .innerJoin(campaigns, eq(campaigns.worldId, worlds.id))
    .where(and(eq(worlds.id, input.worldId), eq(campaigns.ownerUserId, input.userId)))
    .get();
  if (!row) throw new ForbiddenError("You do not own the campaign for this world.");
  return row.world;
}

async function requireOwnedMap(input: {
  db: ReturnType<typeof createDatabase>;
  mapId: string;
  userId: string;
}) {
  const map = await input.db
    .select()
    .from(worldMaps)
    .where(and(eq(worldMaps.id, input.mapId), eq(worldMaps.ownerUserId, input.userId)))
    .get();
  if (!map) throw new NotFoundError("Map not found.");
  return map;
}

function versionEntry(kind: SyncResourceKind, id: string, version: number) {
  return { kind, id, version };
}

/**
 * Server side of the offline-first save layer.
 *
 * The bootstrap endpoint exposes only the authenticated user's cloud save roots
 * and monotonic resource versions. Rich feature APIs remain authoritative for
 * writes; the browser queues those same validated requests while offline.
 */
export const syncRoutes = new Hono<Env>()
  .use("/api/sync/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/sync/bootstrap", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);

    // Receipts only exist to deduplicate reconnect retries. They are not game
    // history and may be pruned after the retry window has comfortably passed.
    c.executionCtx.waitUntil(
      binding
        .prepare(
          "DELETE FROM offline_sync_mutations WHERE user_id = ? AND created_at < unixepoch() - 2592000",
        )
        .bind(session.user.id)
        .run()
        .catch((error) => console.error("Unable to prune offline sync receipts", { error })),
    );

    const ownedCampaigns = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.ownerUserId, session.user.id))
      .all();
    const ownedCharacters = await db
      .select()
      .from(characters)
      .where(eq(characters.ownerUserId, session.user.id))
      .all();
    const worldIds = ownedCampaigns
      .map((campaign) => campaign.worldId)
      .filter((worldId): worldId is string => Boolean(worldId));
    const ownedWorlds = worldIds.length
      ? await db.select().from(worlds).where(inArray(worlds.id, worldIds)).all()
      : [];
    const ownedMaps = await db
      .select()
      .from(worldMaps)
      .where(eq(worldMaps.ownerUserId, session.user.id))
      .all();

    const versions = [
      ...ownedCampaigns.map((campaign) =>
        versionEntry("campaign", campaign.id, timestampVersion(campaign.updatedAt)),
      ),
      ...ownedCharacters.map((character) =>
        versionEntry("character", character.id, timestampVersion(character.updatedAt)),
      ),
      ...ownedWorlds.map((world) =>
        versionEntry("world", world.id, timestampVersion(world.updatedAt)),
      ),
      ...ownedMaps.map((map) => versionEntry("map", map.id, map.revision)),
    ];

    return c.json({
      schemaVersion: 1,
      serverTime: Date.now(),
      userId: session.user.id,
      versions,
      resources: {
        campaigns: ownedCampaigns,
        characters: ownedCharacters,
        worlds: ownedWorlds,
        maps: ownedMaps,
      },
    });
  })
  .get("/api/worlds/:worldId/maps", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireDatabase(c.env.DB));
    const world = await requireOwnedWorld({
      db,
      worldId: c.req.param("worldId"),
      userId: session.user.id,
    });
    const items = await db
      .select()
      .from(worldMaps)
      .where(and(eq(worldMaps.worldId, world.id), eq(worldMaps.ownerUserId, session.user.id)))
      .all();
    return c.json({ items });
  })
  .post("/api/worlds/:worldId/maps", zValidator("json", createMapSchema), async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const input = c.req.valid("json");
    const db = createDatabase(requireDatabase(c.env.DB));
    const world = await requireOwnedWorld({
      db,
      worldId: c.req.param("worldId"),
      userId: session.user.id,
    });
    const id = input.id ?? crypto.randomUUID();
    const existing = await db.select({ id: worldMaps.id }).from(worldMaps).where(eq(worldMaps.id, id)).get();
    if (existing) throw new ConflictError("A map with this id already exists.");

    await db.insert(worldMaps).values({
      id,
      worldId: world.id,
      ownerUserId: session.user.id,
      name: input.name,
      kind: input.kind,
      data: input.data,
    });
    const created = await db.select().from(worldMaps).where(eq(worldMaps.id, id)).get();
    return c.json(created, 201);
  })
  .patch("/api/maps/:mapId", zValidator("json", updateMapSchema), async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const input = c.req.valid("json");
    const db = createDatabase(requireDatabase(c.env.DB));
    const map = await requireOwnedMap({
      db,
      mapId: c.req.param("mapId"),
      userId: session.user.id,
    });
    await db
      .update(worldMaps)
      .set({
        ...input,
        revision: sql`${worldMaps.revision} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(worldMaps.id, map.id))
      .run();
    return c.json(await db.select().from(worldMaps).where(eq(worldMaps.id, map.id)).get());
  })
  .delete("/api/maps/:mapId", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireDatabase(c.env.DB));
    const map = await requireOwnedMap({
      db,
      mapId: c.req.param("mapId"),
      userId: session.user.id,
    });
    await db.delete(worldMaps).where(eq(worldMaps.id, map.id)).run();
    return c.json({ deleted: true, mapId: map.id });
  });
