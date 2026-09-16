/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import {
  campaignMemberships,
  campaigns,
  characters,
  gameSessions,
  worldMaps,
} from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import { loadEncumbranceSnapshot } from "@/modules/game/server/d1Dnd35State";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from "@/server/middleware/errors";
import {
  generateWorldAtlas,
  isWorldAtlasDocument,
  type AtlasBiome,
  type AtlasPathKind,
  type AtlasPlaceKind,
  type WorldAtlasDocument,
} from "../domain/atlas";
import {
  calculateDnd35TravelTiming,
  planAtlasRoute,
  travelEncounterPolicy,
  type TravelWeather,
} from "../domain/travel";
import { applyWorldAtlasEdit, type WorldAtlasEdit } from "../domain/worldBuilder";
import { enqueueWorldAtlasBuild, type WorldAtlasJob } from "./worldAtlasJobs";

interface Bindings extends AuthEnv {
  DB?: D1Database;
  BACKGROUND_QUEUE?: Queue<WorldAtlasJob>;
}

type Env = { Bindings: Bindings };
type CampaignRole = "owner" | "gm" | "player" | "observer";

const weatherKinds = [
  "clear",
  "rain",
  "snow",
  "heavy-snow",
  "sleet",
  "hail",
  "fog",
  "storm",
  "blizzard",
  "duststorm",
] as const;
const placeKinds = [
  "capital",
  "city",
  "town",
  "village",
  "hamlet",
  "port",
  "fort",
  "castle",
  "dungeon",
  "ruin",
  "temple",
  "tower",
  "mine",
  "cave",
  "landmark",
  "planar-gate",
] as const;
const pathKinds = ["road", "trail", "sea-route"] as const;
const biomes = [
  "temperate",
  "forest",
  "tundra",
  "desert",
  "steppe",
  "swamp",
  "jungle",
  "highlands",
  "badlands",
  "enchanted",
] as const;

const editSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("place.create"),
    expectedRevision: z.number().int().positive(),
    name: z.string().trim().min(1).max(120),
    kind: z.enum(placeKinds),
    x: z.number().finite().nonnegative(),
    y: z.number().finite().nonnegative(),
    description: z.string().trim().max(1000).default("A location added by the campaign GM."),
    tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
    population: z.number().int().nonnegative().optional(),
  }),
  z.object({
    type: z.literal("place.update"),
    expectedRevision: z.number().int().positive(),
    placeId: z.string().min(1),
    name: z.string().trim().min(1).max(120).optional(),
    kind: z.enum(placeKinds).optional(),
    description: z.string().trim().max(1000).optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
    population: z.number().int().nonnegative().nullable().optional(),
  }),
  z.object({
    type: z.literal("place.move"),
    expectedRevision: z.number().int().positive(),
    placeId: z.string().min(1),
    x: z.number().finite().nonnegative(),
    y: z.number().finite().nonnegative(),
  }),
  z.object({
    type: z.literal("place.delete"),
    expectedRevision: z.number().int().positive(),
    placeId: z.string().min(1),
  }),
  z.object({
    type: z.literal("region.create"),
    expectedRevision: z.number().int().positive(),
    name: z.string().trim().min(1).max(120),
    biome: z.enum(biomes),
    x: z.number().finite().nonnegative(),
    y: z.number().finite().nonnegative(),
    importance: z.number().min(0.1).max(1).default(0.7),
  }),
  z.object({
    type: z.literal("region.update"),
    expectedRevision: z.number().int().positive(),
    regionId: z.string().min(1),
    name: z.string().trim().min(1).max(120).optional(),
    biome: z.enum(biomes).optional(),
    importance: z.number().min(0.1).max(1).optional(),
  }),
  z.object({
    type: z.literal("region.move"),
    expectedRevision: z.number().int().positive(),
    regionId: z.string().min(1),
    x: z.number().finite().nonnegative(),
    y: z.number().finite().nonnegative(),
  }),
  z.object({
    type: z.literal("region.delete"),
    expectedRevision: z.number().int().positive(),
    regionId: z.string().min(1),
  }),
  z.object({
    type: z.literal("path.create"),
    expectedRevision: z.number().int().positive(),
    kind: z.enum(pathKinds),
    fromPlaceId: z.string().min(1),
    toPlaceId: z.string().min(1),
  }),
  z.object({
    type: z.literal("path.update"),
    expectedRevision: z.number().int().positive(),
    pathId: z.string().min(1),
    kind: z.enum(pathKinds).optional(),
  }),
  z.object({
    type: z.literal("path.delete"),
    expectedRevision: z.number().int().positive(),
    pathId: z.string().min(1),
  }),
  z.object({
    type: z.literal("atlas.regenerate"),
    expectedRevision: z.number().int().positive(),
  }),
]);

const destinationSchema = z.object({ destinationPlaceId: z.string().min(1) });
const weatherSchema = z.object({ weather: z.enum(weatherKinds) });
const revealSchema = z.object({
  entityKind: z.enum(["region", "place", "path"]),
  entityId: z.string().min(1),
  userId: z.string().min(1).optional(),
});

function requireDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("World travel storage is unavailable.");
  return binding;
}

async function requireCampaignAccess(input: {
  db: ReturnType<typeof createDatabase>;
  campaignId: string;
  userId: string;
}) {
  const campaign = await input.db
    .select({
      id: campaigns.id,
      ownerUserId: campaigns.ownerUserId,
      worldId: campaigns.worldId,
      name: campaigns.name,
      status: campaigns.status,
      generationSeed: campaigns.generationSeed,
    })
    .from(campaigns)
    .where(eq(campaigns.id, input.campaignId))
    .get();
  if (!campaign) throw new NotFoundError("Campaign not found.");
  if (campaign.ownerUserId === input.userId) return { campaign, role: "owner" as const };
  const membership = await input.db
    .select({ role: campaignMemberships.role, status: campaignMemberships.status })
    .from(campaignMemberships)
    .where(
      and(
        eq(campaignMemberships.campaignId, input.campaignId),
        eq(campaignMemberships.userId, input.userId),
      ),
    )
    .get();
  if (!membership || membership.status !== "active") {
    throw new ForbiddenError("You do not have access to this campaign world.");
  }
  return { campaign, role: membership.role as CampaignRole };
}

async function loadAtlas(input: {
  db: ReturnType<typeof createDatabase>;
  worldId: string;
}): Promise<{ id: string; revision: number; atlas: WorldAtlasDocument }> {
  const map = await input.db
    .select({ id: worldMaps.id, revision: worldMaps.revision, data: worldMaps.data })
    .from(worldMaps)
    .where(and(eq(worldMaps.worldId, input.worldId), eq(worldMaps.kind, "world")))
    .orderBy(desc(worldMaps.updatedAt))
    .get();
  if (!map) throw new NotFoundError("Campaign atlas not found.");
  if (!isWorldAtlasDocument(map.data)) throw new ServiceUnavailableError("Campaign atlas format is unsupported.");
  return { id: map.id, revision: map.revision, atlas: map.data };
}

function startingPlace(atlas: WorldAtlasDocument) {
  const priorities: readonly AtlasPlaceKind[] = ["capital", "city", "town", "village", "port", "fort"];
  for (const kind of priorities) {
    const candidates = atlas.places
      .filter((place) => place.kind === kind)
      .sort((left, right) => right.importance - left.importance);
    if (candidates[0]) return candidates[0];
  }
  return atlas.places[0] ?? null;
}

function travelStorageUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /no such table: campaign_world_states|no such table: campaign_world_discoveries|no such table: campaign_travel_events/i.test(
    message,
  );
}

interface WorldStateRow {
  campaignId: string;
  worldId: string;
  currentPlaceId: string | null;
  currentX: number;
  currentY: number;
  elapsedMinutes: number;
  weather: TravelWeather;
  weatherDay: number;
  revision: number;
}

async function loadOrCreateWorldState(input: {
  binding: D1Database;
  campaignId: string;
  worldId: string;
  atlas: WorldAtlasDocument;
}): Promise<WorldStateRow> {
  try {
    const existing = await input.binding
      .prepare(
        `SELECT campaign_id AS campaignId, world_id AS worldId, current_place_id AS currentPlaceId,
                current_x AS currentX, current_y AS currentY, elapsed_minutes AS elapsedMinutes,
                weather, weather_day AS weatherDay, revision
         FROM campaign_world_states WHERE campaign_id = ? LIMIT 1`,
      )
      .bind(input.campaignId)
      .first<WorldStateRow>();
    if (existing) return existing;
    const start = startingPlace(input.atlas);
    if (!start) throw new ServiceUnavailableError("The atlas has no place where the party can begin.");
    await input.binding
      .prepare(
        `INSERT INTO campaign_world_states
          (campaign_id, world_id, current_place_id, current_x, current_y, elapsed_minutes, weather, weather_day, revision, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, 'clear', 0, 1, unixepoch())
         ON CONFLICT(campaign_id) DO NOTHING`,
      )
      .bind(input.campaignId, input.worldId, start.id, start.x, start.y)
      .run();
    const created = await input.binding
      .prepare(
        `SELECT campaign_id AS campaignId, world_id AS worldId, current_place_id AS currentPlaceId,
                current_x AS currentX, current_y AS currentY, elapsed_minutes AS elapsedMinutes,
                weather, weather_day AS weatherDay, revision
         FROM campaign_world_states WHERE campaign_id = ? LIMIT 1`,
      )
      .bind(input.campaignId)
      .first<WorldStateRow>();
    if (!created) throw new ServiceUnavailableError("Unable to initialize campaign world state.");
    return created;
  } catch (error) {
    if (travelStorageUnavailable(error)) {
      throw new ServiceUnavailableError(
        "World travel is not migrated yet. Apply migration 0028_campaign_world_travel.sql.",
      );
    }
    throw error;
  }
}

async function reveal(input: {
  binding: D1Database;
  campaignId: string;
  userId: string;
  entityKind: "region" | "place" | "path";
  entityId: string;
}): Promise<void> {
  await input.binding
    .prepare(
      `INSERT INTO campaign_world_discoveries
        (campaign_id, user_id, entity_kind, entity_id, discovered_at)
       VALUES (?, ?, ?, ?, unixepoch())
       ON CONFLICT(campaign_id, user_id, entity_kind, entity_id) DO NOTHING`,
    )
    .bind(input.campaignId, input.userId, input.entityKind, input.entityId)
    .run();
}

async function ensureCurrentDiscovery(input: {
  binding: D1Database;
  campaignId: string;
  userId: string;
  state: WorldStateRow;
  atlas: WorldAtlasDocument;
}): Promise<void> {
  if (!input.state.currentPlaceId) return;
  const place = input.atlas.places.find((entry) => entry.id === input.state.currentPlaceId);
  if (!place) return;
  await reveal({
    binding: input.binding,
    campaignId: input.campaignId,
    userId: input.userId,
    entityKind: "place",
    entityId: place.id,
  });
  if (place.regionId) {
    await reveal({
      binding: input.binding,
      campaignId: input.campaignId,
      userId: input.userId,
      entityKind: "region",
      entityId: place.regionId,
    });
  }
  const connected = input.atlas.paths.filter(
    (path) => path.fromPlaceId === place.id || path.toPlaceId === place.id,
  );
  await Promise.all(
    connected.map((path) =>
      reveal({
        binding: input.binding,
        campaignId: input.campaignId,
        userId: input.userId,
        entityKind: "path",
        entityId: path.id,
      }),
    ),
  );
}

async function discoveryForUser(binding: D1Database, campaignId: string, userId: string) {
  const result = await binding
    .prepare(
      `SELECT entity_kind AS entityKind, entity_id AS entityId
       FROM campaign_world_discoveries
       WHERE campaign_id = ? AND user_id = ?`,
    )
    .bind(campaignId, userId)
    .all<{ entityKind: "region" | "place" | "path"; entityId: string }>();
  return {
    regionIds: result.results.filter((entry) => entry.entityKind === "region").map((entry) => entry.entityId),
    placeIds: result.results.filter((entry) => entry.entityKind === "place").map((entry) => entry.entityId),
    pathIds: result.results.filter((entry) => entry.entityKind === "path").map((entry) => entry.entityId),
  };
}

async function partyLandSpeed(input: {
  db: ReturnType<typeof createDatabase>;
  campaignId: string;
}): Promise<number> {
  const party = await input.db
    .select({ id: characters.id })
    .from(characters)
    .where(and(eq(characters.campaignId, input.campaignId), eq(characters.status, "active")))
    .all();
  const snapshots = await Promise.all(
    party.map((character) =>
      loadEncumbranceSnapshot({
        db: input.db,
        campaignId: input.campaignId,
        characterId: character.id,
      }),
    ),
  );
  const speeds = snapshots
    .map((snapshot) => snapshot?.landSpeedFeet ?? 0)
    .filter((speed) => Number.isFinite(speed) && speed > 0);
  if (speeds.length === 0) {
    throw new ServiceUnavailableError("No active party member has a valid authoritative land speed.");
  }
  return Math.min(...speeds);
}

function randomD100(): number {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return ((values[0] ?? 0) % 100) + 1;
}

function materializeEdit(value: z.infer<typeof editSchema>): WorldAtlasEdit | "regenerate" {
  switch (value.type) {
    case "atlas.regenerate":
      return "regenerate";
    case "place.create":
      return {
        type: value.type,
        id: `gm-place-${crypto.randomUUID()}`,
        name: value.name,
        kind: value.kind as AtlasPlaceKind,
        x: value.x,
        y: value.y,
        description: value.description,
        tags: value.tags,
        ...(value.population === undefined ? {} : { population: value.population }),
      };
    case "region.create":
      return {
        type: value.type,
        id: `gm-region-${crypto.randomUUID()}`,
        name: value.name,
        biome: value.biome as AtlasBiome,
        x: value.x,
        y: value.y,
        importance: value.importance,
      };
    case "path.create":
      return {
        type: value.type,
        id: `gm-path-${crypto.randomUUID()}`,
        kind: value.kind as AtlasPathKind,
        fromPlaceId: value.fromPlaceId,
        toPlaceId: value.toPlaceId,
      };
    default: {
      const { expectedRevision: _expectedRevision, ...edit } = value;
      return edit as WorldAtlasEdit;
    }
  }
}

async function saveAtlas(input: {
  binding: D1Database;
  mapId: string;
  expectedRevision: number;
  atlas: WorldAtlasDocument;
}): Promise<number> {
  const result = await input.binding
    .prepare(
      `UPDATE world_maps
       SET data = ?, revision = revision + 1, updated_at = unixepoch()
       WHERE id = ? AND revision = ?`,
    )
    .bind(JSON.stringify(input.atlas), input.mapId, input.expectedRevision)
    .run();
  if ((result.meta.changes ?? 0) !== 1) {
    throw new ConflictError("The atlas changed before this edit could be saved. Reload and try again.");
  }
  return input.expectedRevision + 1;
}

async function planTravel(input: {
  db: ReturnType<typeof createDatabase>;
  atlas: WorldAtlasDocument;
  state: WorldStateRow;
  campaignId: string;
  destinationPlaceId: string;
}) {
  if (!input.state.currentPlaceId) throw new BadRequestError("The party does not have a current map location.");
  const route = planAtlasRoute(input.atlas, input.state.currentPlaceId, input.destinationPlaceId);
  if (!route) throw new BadRequestError("No traversable land route connects the party to that destination.");
  const speed = await partyLandSpeed({ db: input.db, campaignId: input.campaignId });
  const timing = calculateDnd35TravelTiming({
    route,
    partySpeedFeet: speed,
    weather: input.state.weather,
  });
  const encounter = travelEncounterPolicy({
    route,
    weather: input.state.weather,
    travelMinutes: timing.travelMinutes,
  });
  return { route, timing, encounter };
}

async function revealTravelToParty(input: {
  binding: D1Database;
  db: ReturnType<typeof createDatabase>;
  campaignId: string;
  ownerUserId: string;
  atlas: WorldAtlasDocument;
  placeIds: readonly string[];
  pathIds: readonly string[];
}) {
  const memberships = await input.db
    .select({ userId: campaignMemberships.userId })
    .from(campaignMemberships)
    .where(and(eq(campaignMemberships.campaignId, input.campaignId), eq(campaignMemberships.status, "active")))
    .all();
  const userIds = [...new Set([input.ownerUserId, ...memberships.map((entry) => entry.userId)])];
  const regionIds = new Set<string>();
  for (const placeId of input.placeIds) {
    const regionId = input.atlas.places.find((place) => place.id === placeId)?.regionId;
    if (regionId) regionIds.add(regionId);
  }
  for (const userId of userIds) {
    for (const placeId of input.placeIds) {
      await reveal({ binding: input.binding, campaignId: input.campaignId, userId, entityKind: "place", entityId: placeId });
    }
    for (const pathId of input.pathIds) {
      await reveal({ binding: input.binding, campaignId: input.campaignId, userId, entityKind: "path", entityId: pathId });
    }
    for (const regionId of regionIds) {
      await reveal({ binding: input.binding, campaignId: input.campaignId, userId, entityKind: "region", entityId: regionId });
    }
  }
}

export const worldTravelRoutes = new Hono<Env>()
  .get("/api/campaigns/:campaignId/world-state", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const access = await requireCampaignAccess({ db, campaignId: c.req.param("campaignId"), userId: session.user.id });
    if (!access.campaign.worldId) throw new NotFoundError("Campaign world not found.");
    const map = await loadAtlas({ db, worldId: access.campaign.worldId });
    const state = await loadOrCreateWorldState({
      binding,
      campaignId: access.campaign.id,
      worldId: access.campaign.worldId,
      atlas: map.atlas,
    });
    await ensureCurrentDiscovery({ binding, campaignId: access.campaign.id, userId: session.user.id, state, atlas: map.atlas });
    const discovery = await discoveryForUser(binding, access.campaign.id, session.user.id);
    return c.json({
      campaignId: access.campaign.id,
      worldId: access.campaign.worldId,
      mapId: map.id,
      atlasRevision: map.revision,
      role: access.role,
      canEdit: access.role === "owner" || access.role === "gm",
      state,
      discovery,
    });
  })
  .post("/api/campaigns/:campaignId/world-builder", zValidator("json", editSchema), async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const access = await requireCampaignAccess({ db, campaignId: c.req.param("campaignId"), userId: session.user.id });
    if (access.role !== "owner" && access.role !== "gm") {
      throw new ForbiddenError("Only the campaign owner or GM can edit the world atlas.");
    }
    if (!access.campaign.worldId) throw new NotFoundError("Campaign world not found.");
    const body = c.req.valid("json");
    const map = await loadAtlas({ db, worldId: access.campaign.worldId });
    if (body.expectedRevision !== map.revision) {
      throw new ConflictError("The atlas changed before this edit began. Reload and try again.");
    }
    const edit = materializeEdit(body);
    const atlas =
      edit === "regenerate"
        ? generateWorldAtlas({
            seed: map.atlas.seed,
            title: map.atlas.title,
            templateId: map.atlas.campaignDecisions.templateId,
            styleIds: map.atlas.campaignDecisions.styleIds,
            structure: map.atlas.campaignDecisions.structure,
            scale: map.atlas.campaignDecisions.scale,
            pace: map.atlas.campaignDecisions.pace,
            multiPlanar: map.atlas.campaignDecisions.multiPlanar,
            epic: map.atlas.campaignDecisions.epic,
          })
        : applyWorldAtlasEdit(map.atlas, edit);
    const revision = await saveAtlas({ binding, mapId: map.id, expectedRevision: map.revision, atlas });
    const current = await loadOrCreateWorldState({
      binding,
      campaignId: access.campaign.id,
      worldId: access.campaign.worldId,
      atlas,
    });
    if (!current.currentPlaceId || !atlas.places.some((place) => place.id === current.currentPlaceId)) {
      const start = startingPlace(atlas);
      if (start) {
        await binding
          .prepare(
            `UPDATE campaign_world_states
             SET current_place_id = ?, current_x = ?, current_y = ?, revision = revision + 1, updated_at = unixepoch()
             WHERE campaign_id = ?`,
          )
          .bind(start.id, start.x, start.y, access.campaign.id)
          .run();
      }
    }
    c.executionCtx.waitUntil(
      enqueueWorldAtlasBuild(c.env.BACKGROUND_QUEUE, {
        worldId: access.campaign.worldId,
        mapId: map.id,
        revision,
      }).catch((error) => console.error("Unable to rebuild edited atlas assets", { error })),
    );
    return c.json({ atlas, revision });
  })
  .post("/api/campaigns/:campaignId/world-state/weather", zValidator("json", weatherSchema), async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const access = await requireCampaignAccess({ db, campaignId: c.req.param("campaignId"), userId: session.user.id });
    if (access.role !== "owner" && access.role !== "gm") throw new ForbiddenError("Only the owner or GM can set world weather.");
    if (!access.campaign.worldId) throw new NotFoundError("Campaign world not found.");
    const map = await loadAtlas({ db, worldId: access.campaign.worldId });
    await loadOrCreateWorldState({ binding, campaignId: access.campaign.id, worldId: access.campaign.worldId, atlas: map.atlas });
    await binding
      .prepare(
        `UPDATE campaign_world_states
         SET weather = ?, revision = revision + 1, updated_at = unixepoch()
         WHERE campaign_id = ?`,
      )
      .bind(c.req.valid("json").weather, access.campaign.id)
      .run();
    return c.json({ weather: c.req.valid("json").weather });
  })
  .post("/api/campaigns/:campaignId/world-state/reveal", zValidator("json", revealSchema), async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const access = await requireCampaignAccess({ db, campaignId: c.req.param("campaignId"), userId: session.user.id });
    if (access.role !== "owner" && access.role !== "gm") throw new ForbiddenError("Only the owner or GM can reveal atlas entities.");
    const body = c.req.valid("json");
    await reveal({
      binding,
      campaignId: access.campaign.id,
      userId: body.userId ?? session.user.id,
      entityKind: body.entityKind,
      entityId: body.entityId,
    });
    return c.json({ revealed: true });
  })
  .post("/api/campaigns/:campaignId/travel/plan", zValidator("json", destinationSchema), async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const access = await requireCampaignAccess({ db, campaignId: c.req.param("campaignId"), userId: session.user.id });
    if (access.role === "observer") throw new ForbiddenError("Observers cannot move the party.");
    if (!access.campaign.worldId) throw new NotFoundError("Campaign world not found.");
    const map = await loadAtlas({ db, worldId: access.campaign.worldId });
    const state = await loadOrCreateWorldState({ binding, campaignId: access.campaign.id, worldId: access.campaign.worldId, atlas: map.atlas });
    const plan = await planTravel({
      db,
      atlas: map.atlas,
      state,
      campaignId: access.campaign.id,
      destinationPlaceId: c.req.valid("json").destinationPlaceId,
    });
    return c.json({ ...plan, weather: state.weather, stateRevision: state.revision });
  })
  .post("/api/campaigns/:campaignId/travel", zValidator("json", destinationSchema), async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const access = await requireCampaignAccess({ db, campaignId: c.req.param("campaignId"), userId: session.user.id });
    if (access.role === "observer") throw new ForbiddenError("Observers cannot move the party.");
    if (!access.campaign.worldId) throw new NotFoundError("Campaign world not found.");
    const map = await loadAtlas({ db, worldId: access.campaign.worldId });
    const state = await loadOrCreateWorldState({ binding, campaignId: access.campaign.id, worldId: access.campaign.worldId, atlas: map.atlas });
    const destination = map.atlas.places.find((place) => place.id === c.req.valid("json").destinationPlaceId);
    if (!destination) throw new NotFoundError("Travel destination not found.");
    const plan = await planTravel({
      db,
      atlas: map.atlas,
      state,
      campaignId: access.campaign.id,
      destinationPlaceId: destination.id,
    });
    const rolls = Array.from({ length: plan.encounter.checks }, () => randomD100());
    const encounterTriggered = rolls.some((roll) => roll <= plan.encounter.threshold);
    const update = await binding
      .prepare(
        `UPDATE campaign_world_states
         SET current_place_id = ?, current_x = ?, current_y = ?,
             elapsed_minutes = elapsed_minutes + ?, weather_day = CAST((elapsed_minutes + ?) / 1440 AS INTEGER),
             revision = revision + 1, updated_at = unixepoch()
         WHERE campaign_id = ? AND revision = ?`,
      )
      .bind(
        destination.id,
        destination.x,
        destination.y,
        plan.timing.elapsedClockMinutes,
        plan.timing.elapsedClockMinutes,
        access.campaign.id,
        state.revision,
      )
      .run();
    if ((update.meta.changes ?? 0) !== 1) throw new ConflictError("Party position changed while travel was being resolved. Plan the route again.");

    const travelId = crypto.randomUUID();
    await binding
      .prepare(
        `INSERT INTO campaign_travel_events
          (id, campaign_id, requested_user_id, from_place_id, to_place_id, route_place_ids,
           route_path_ids, distance_miles, travel_minutes, elapsed_clock_minutes, party_speed_feet,
           terrain_multiplier, weather, weather_multiplier, encounter_rolls, encounter_threshold,
           encounter_triggered, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`,
      )
      .bind(
        travelId,
        access.campaign.id,
        session.user.id,
        state.currentPlaceId,
        destination.id,
        JSON.stringify(plan.route.placeIds),
        JSON.stringify(plan.route.pathIds),
        plan.route.distanceMiles,
        plan.timing.travelMinutes,
        plan.timing.elapsedClockMinutes,
        plan.timing.partySpeedFeet,
        plan.route.terrainMultiplier,
        state.weather,
        plan.timing.weatherMultiplier,
        JSON.stringify(rolls),
        plan.encounter.threshold,
        encounterTriggered ? 1 : 0,
        encounterTriggered ? "encounter-pending" : "completed",
      )
      .run();

    await revealTravelToParty({
      binding,
      db,
      campaignId: access.campaign.id,
      ownerUserId: access.campaign.ownerUserId,
      atlas: map.atlas,
      placeIds: plan.route.placeIds,
      pathIds: plan.route.pathIds,
    });

    const activeSession = await db
      .select({ id: gameSessions.id })
      .from(gameSessions)
      .where(and(eq(gameSessions.campaignId, access.campaign.id), eq(gameSessions.status, "active")))
      .orderBy(desc(gameSessions.ordinal))
      .get();
    if (activeSession) {
      const eventType = encounterTriggered ? "world.travel.encounter" : "world.travel.completed";
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        travelId,
        fromPlaceId: state.currentPlaceId,
        toPlaceId: destination.id,
        destinationName: destination.name,
        routePlaceIds: plan.route.placeIds,
        routePathIds: plan.route.pathIds,
        distanceMiles: plan.route.distanceMiles,
        travelMinutes: plan.timing.travelMinutes,
        elapsedClockMinutes: plan.timing.elapsedClockMinutes,
        partySpeedFeet: plan.timing.partySpeedFeet,
        terrainMultiplier: plan.route.terrainMultiplier,
        weather: state.weather,
        weatherMultiplier: plan.timing.weatherMultiplier,
        encounterRolls: rolls,
        encounterThreshold: plan.encounter.threshold,
        encounterTriggered,
      };
      await binding
        .prepare(
          `INSERT INTO game_events
            (id, campaign_id, session_id, sequence, event_type, occurred_at, actor_id, source_id,
             target_ids, payload, deltas, created_at)
           VALUES (?, ?, ?,
             (SELECT COALESCE(MAX(sequence), 0) + 1 FROM game_events WHERE campaign_id = ?),
             ?, ?, NULL, ?, '[]', ?, '[]', ?)`,
        )
        .bind(
          crypto.randomUUID(),
          access.campaign.id,
          activeSession.id,
          access.campaign.id,
          eventType,
          now,
          travelId,
          JSON.stringify(payload),
          now,
        )
        .run();
    }

    return c.json({
      travelId,
      destination,
      ...plan,
      weather: state.weather,
      encounter: {
        rolls,
        threshold: plan.encounter.threshold,
        triggered: encounterTriggered,
        status: encounterTriggered ? ("encounter-pending" as const) : ("completed" as const),
      },
    });
  });
