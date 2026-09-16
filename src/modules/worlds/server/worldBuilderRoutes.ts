/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase, type Database } from "@/infrastructure/database/client";
import {
  campaignMemberships,
  campaigns,
  gameActors,
  worldMaps,
  type WorldMapData,
} from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import {
  loadActiveGameContext,
  loadEncumbranceSnapshot,
} from "@/modules/game/server/d1Dnd35State";
import { D1GameEventStore } from "@/modules/game/server/d1GameEventStore";
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
  type AtlasPath,
  type AtlasPlace,
  type AtlasRegion,
  type WorldAtlasDocument,
} from "../domain/atlas";
import { type AtlasTravelWeather } from "../domain/overlandTravel";
import {
  applyAtlasEdit,
  commitAtlasTravel,
  createInitialExplorationState,
  explorationState,
  inspectAtlas,
  planAtlasTravel,
  withExplorationState,
  type AtlasExplorationState,
  type WorldAtlasEditOperation,
} from "../domain/worldBuilder";
import { enqueueWorldAtlasBuild, type WorldAtlasJob } from "./worldAtlasJobs";

interface Bindings extends AuthEnv {
  DB?: D1Database;
  BACKGROUND_QUEUE?: Queue<WorldAtlasJob>;
}

type Env = { Bindings: Bindings };

type CampaignRole = "owner" | "gm" | "player" | "observer";

const PLACE_KINDS = [
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
const PATH_KINDS = ["road", "trail", "sea-route"] as const;
const BIOMES = [
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
const WEATHER = [
  "clear",
  "rain",
  "storm",
  "snow",
  "blizzard",
  "extreme-heat",
  "extreme-cold",
] as const;

const pointSchema = z.object({ x: z.number().finite(), y: z.number().finite() });
const revisionSchema = z.number().int().positive();

const placePatchSchema = z.object({
  landmassId: z.string().trim().min(1).optional(),
  regionId: z.string().trim().min(1).nullable().optional(),
  name: z.string().trim().min(1).max(120).optional(),
  kind: z.enum(PLACE_KINDS).optional(),
  x: z.number().finite().optional(),
  y: z.number().finite().optional(),
  importance: z.number().min(0.1).max(1).optional(),
  population: z.number().int().nonnegative().optional(),
  description: z.string().trim().max(1000).optional(),
  tags: z.array(z.string().trim().min(1).max(80)).max(24).optional(),
});

const regionPatchSchema = z.object({
  landmassId: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  center: pointSchema.optional(),
  biome: z.enum(BIOMES).optional(),
  importance: z.number().min(0.1).max(1).optional(),
});

const pathPatchSchema = z.object({
  kind: z.enum(PATH_KINDS).optional(),
  fromPlaceId: z.string().trim().min(1).optional(),
  toPlaceId: z.string().trim().min(1).optional(),
  points: z.array(pointSchema).min(2).max(64).optional(),
});

const editSchema = z.object({
  revision: revisionSchema,
  operation: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("place.create"),
      value: z.object({
        name: z.string().trim().min(1).max(120),
        kind: z.enum(PLACE_KINDS),
        x: z.number().finite(),
        y: z.number().finite(),
        landmassId: z.string().trim().min(1).optional(),
        regionId: z.string().trim().min(1).nullable().optional(),
        importance: z.number().min(0.1).max(1).default(0.5),
        population: z.number().int().nonnegative().optional(),
        description: z.string().trim().max(1000).default("A GM-created location."),
        tags: z.array(z.string().trim().min(1).max(80)).max(24).default([]),
      }),
    }),
    z.object({ type: z.literal("place.update"), id: z.string().min(1), patch: placePatchSchema }),
    z.object({ type: z.literal("place.delete"), id: z.string().min(1) }),
    z.object({
      type: z.literal("region.create"),
      value: z.object({
        name: z.string().trim().min(1).max(120),
        center: pointSchema,
        biome: z.enum(BIOMES),
        landmassId: z.string().trim().min(1).optional(),
        importance: z.number().min(0.1).max(1).default(0.6),
      }),
    }),
    z.object({ type: z.literal("region.update"), id: z.string().min(1), patch: regionPatchSchema }),
    z.object({ type: z.literal("region.delete"), id: z.string().min(1) }),
    z.object({
      type: z.literal("path.create"),
      value: z.object({
        kind: z.enum(PATH_KINDS),
        fromPlaceId: z.string().trim().min(1),
        toPlaceId: z.string().trim().min(1),
        points: z.array(pointSchema).min(2).max(64).optional(),
      }),
    }),
    z.object({ type: z.literal("path.update"), id: z.string().min(1), patch: pathPatchSchema }),
    z.object({ type: z.literal("path.delete"), id: z.string().min(1) }),
  ]),
});

const regenerateSchema = z.object({
  revision: revisionSchema,
  seedMode: z.enum(["same", "new"]).default("new"),
});

const weatherSchema = z.object({ revision: revisionSchema, weather: z.enum(WEATHER) });
const positionSchema = z.object({ revision: revisionSchema, placeId: z.string().trim().min(1) });
const travelSchema = z.object({ destinationPlaceId: z.string().trim().min(1) });
const travelCommitSchema = z.object({
  revision: revisionSchema,
  destinationPlaceId: z.string().trim().min(1),
});
const clearEncounterSchema = z.object({ revision: revisionSchema });

function requireDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("World builder storage is unavailable.");
  return binding;
}

async function requireCampaignAccess(input: {
  db: Database;
  campaignId: string;
  userId: string;
}): Promise<{
  campaign: {
    id: string;
    ownerUserId: string;
    worldId: string | null;
    name: string;
    status: string;
    rulesetId: string;
    rulesetVersion: string;
  };
  role: CampaignRole;
}> {
  const campaign = await input.db
    .select({
      id: campaigns.id,
      ownerUserId: campaigns.ownerUserId,
      worldId: campaigns.worldId,
      name: campaigns.name,
      status: campaigns.status,
      rulesetId: campaigns.rulesetId,
      rulesetVersion: campaigns.rulesetVersion,
    })
    .from(campaigns)
    .where(eq(campaigns.id, input.campaignId))
    .get();
  if (!campaign) throw new NotFoundError("Campaign not found.");
  if (campaign.ownerUserId === input.userId) return { campaign, role: "owner" };

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
  return { campaign, role: membership.role };
}

function requireGm(role: CampaignRole): void {
  if (role !== "owner" && role !== "gm") {
    throw new ForbiddenError("Only the campaign owner or GM can edit the world atlas.");
  }
}

function requireTraveler(role: CampaignRole): void {
  if (role === "observer") {
    throw new ForbiddenError("Observers cannot move the campaign party.");
  }
}

async function loadAtlas(db: Database, worldId: string) {
  const map = await db
    .select()
    .from(worldMaps)
    .where(and(eq(worldMaps.worldId, worldId), eq(worldMaps.kind, "world")))
    .orderBy(desc(worldMaps.updatedAt))
    .get();
  if (!map) throw new NotFoundError("This campaign does not have a world atlas.");
  if (!isWorldAtlasDocument(map.data)) {
    throw new ServiceUnavailableError("The campaign world map is not a supported atlas document.");
  }
  return { map, atlas: map.data };
}

async function persistAtlas(input: {
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
    .bind(JSON.stringify(input.atlas satisfies WorldMapData), input.mapId, input.expectedRevision)
    .run();
  if ((result.meta.changes ?? 0) !== 1) {
    throw new ConflictError("The world changed before this edit was saved. Refresh and try again.");
  }
  return input.expectedRevision + 1;
}

function nearestLandmass(atlas: WorldAtlasDocument, point: { x: number; y: number }) {
  let selected = atlas.landmasses[0];
  let selectedDistance = Number.POSITIVE_INFINITY;
  for (const landmass of atlas.landmasses) {
    const candidate = Math.hypot(point.x - landmass.center.x, point.y - landmass.center.y);
    if (candidate < selectedDistance) {
      selected = landmass;
      selectedDistance = candidate;
    }
  }
  if (!selected) throw new BadRequestError("The atlas does not contain a landmass.");
  return selected;
}

function nearestRegion(atlas: WorldAtlasDocument, landmassId: string, point: { x: number; y: number }) {
  let selected: AtlasRegion | null = null;
  let selectedDistance = Number.POSITIVE_INFINITY;
  for (const region of atlas.regions) {
    if (region.landmassId !== landmassId) continue;
    const candidate = Math.hypot(point.x - region.center.x, point.y - region.center.y);
    if (candidate < selectedDistance) {
      selected = region;
      selectedDistance = candidate;
    }
  }
  return selected;
}

function makeOperation(
  atlas: WorldAtlasDocument,
  operation: z.infer<typeof editSchema>["operation"],
): WorldAtlasEditOperation {
  switch (operation.type) {
    case "place.create": {
      const point = { x: operation.value.x, y: operation.value.y };
      const landmass = operation.value.landmassId
        ? atlas.landmasses.find((candidate) => candidate.id === operation.value.landmassId)
        : nearestLandmass(atlas, point);
      if (!landmass) throw new BadRequestError("The selected landmass does not exist.");
      const region =
        operation.value.regionId === null
          ? null
          : operation.value.regionId
            ? atlas.regions.find((candidate) => candidate.id === operation.value.regionId) ?? null
            : nearestRegion(atlas, landmass.id, point);
      if (operation.value.regionId && !region) {
        throw new BadRequestError("The selected region does not exist.");
      }
      const place: AtlasPlace = {
        id: `gm-place-${crypto.randomUUID()}`,
        landmassId: landmass.id,
        regionId: region?.id ?? null,
        name: operation.value.name,
        kind: operation.value.kind,
        x: point.x,
        y: point.y,
        importance: operation.value.importance,
        ...(operation.value.population === undefined
          ? {}
          : { population: operation.value.population }),
        description: operation.value.description,
        tags: operation.value.tags,
      };
      return { type: "place.create", place };
    }
    case "place.update":
      return { type: "place.update", id: operation.id, patch: operation.patch };
    case "place.delete":
      return { type: "place.delete", id: operation.id };
    case "region.create": {
      const landmass = operation.value.landmassId
        ? atlas.landmasses.find((candidate) => candidate.id === operation.value.landmassId)
        : nearestLandmass(atlas, operation.value.center);
      if (!landmass) throw new BadRequestError("The selected landmass does not exist.");
      const region: AtlasRegion = {
        id: `gm-region-${crypto.randomUUID()}`,
        landmassId: landmass.id,
        name: operation.value.name,
        center: operation.value.center,
        biome: operation.value.biome as AtlasBiome,
        importance: operation.value.importance,
      };
      return { type: "region.create", region };
    }
    case "region.update":
      return { type: "region.update", id: operation.id, patch: operation.patch };
    case "region.delete":
      return { type: "region.delete", id: operation.id };
    case "path.create": {
      const from = atlas.places.find((place) => place.id === operation.value.fromPlaceId);
      const to = atlas.places.find((place) => place.id === operation.value.toPlaceId);
      if (!from || !to) throw new BadRequestError("Both path endpoints must exist.");
      if (from.id === to.id) throw new BadRequestError("A path needs two different endpoints.");
      const points = operation.value.points ?? [
        { x: from.x, y: from.y },
        { x: to.x, y: to.y },
      ];
      const path: AtlasPath = {
        id: `gm-path-${crypto.randomUUID()}`,
        kind: operation.value.kind,
        fromPlaceId: from.id,
        toPlaceId: to.id,
        distanceMiles: Math.max(1, Math.round(Math.hypot(to.x - from.x, to.y - from.y))),
        points,
      };
      return { type: "path.create", path };
    }
    case "path.update":
      return { type: "path.update", id: operation.id, patch: operation.patch };
    case "path.delete":
      return { type: "path.delete", id: operation.id };
  }
}

async function partyLandSpeed(db: Database, campaignId: string): Promise<number> {
  const actors = await db
    .select({ characterId: gameActors.characterId })
    .from(gameActors)
    .where(
      and(
        eq(gameActors.campaignId, campaignId),
        eq(gameActors.kind, "character"),
        eq(gameActors.status, "active"),
      ),
    )
    .all();
  const characterIds = actors
    .map((actor) => actor.characterId)
    .filter((characterId): characterId is string => Boolean(characterId));
  if (characterIds.length === 0) {
    throw new ServiceUnavailableError("The campaign party does not have an active character.");
  }
  const snapshots = await Promise.all(
    characterIds.map((characterId) =>
      loadEncumbranceSnapshot({ db, campaignId, characterId }),
    ),
  );
  const speeds = snapshots
    .map((snapshot) => snapshot?.landSpeedFeet ?? 0)
    .filter((speed) => speed > 0);
  if (speeds.length !== characterIds.length) {
    throw new ServiceUnavailableError("An active character is missing authoritative travel speed data.");
  }
  return Math.min(...speeds);
}

function randomUnit(): number {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0]! / 4294967296;
}

async function queueRebuild(
  env: Bindings,
  worldId: string,
  mapId: string,
  revision: number,
): Promise<void> {
  await enqueueWorldAtlasBuild(env.BACKGROUND_QUEUE, { worldId, mapId, revision });
}

function movedState(atlas: WorldAtlasDocument, state: AtlasExplorationState, placeId: string) {
  const place = atlas.places.find((candidate) => candidate.id === placeId);
  if (!place) throw new BadRequestError("That party destination does not exist.");
  const discoveredPlaceIds = new Set(state.discoveredPlaceIds);
  const discoveredRegionIds = new Set(state.discoveredRegionIds);
  discoveredPlaceIds.add(place.id);
  if (place.regionId) discoveredRegionIds.add(place.regionId);
  return {
    ...state,
    discoveredPlaceIds: [...discoveredPlaceIds],
    discoveredRegionIds: [...discoveredRegionIds],
    partyPosition: { placeId: place.id, x: place.x, y: place.y },
  };
}

export const worldBuilderRoutes = new Hono<Env>()
  .get("/api/campaigns/:campaignId/world/state", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const access = await requireCampaignAccess({
      db,
      campaignId: c.req.param("campaignId"),
      userId: session.user.id,
    });
    if (!access.campaign.worldId) throw new NotFoundError("Campaign world not found.");
    const { map, atlas } = await loadAtlas(db, access.campaign.worldId);
    const state = explorationState(atlas);
    return c.json({
      campaignId: access.campaign.id,
      worldId: access.campaign.worldId,
      revision: map.revision,
      role: access.role,
      canEdit: access.role === "owner" || access.role === "gm",
      canTravel: access.role !== "observer",
      exploration: state,
      inspector: access.role === "owner" || access.role === "gm" ? inspectAtlas(atlas) : null,
    });
  })
  .post("/api/campaigns/:campaignId/world/edit", zValidator("json", editSchema), async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const access = await requireCampaignAccess({ db, campaignId: c.req.param("campaignId"), userId: session.user.id });
    requireGm(access.role);
    if (!access.campaign.worldId) throw new NotFoundError("Campaign world not found.");
    const body = c.req.valid("json");
    const { map, atlas } = await loadAtlas(db, access.campaign.worldId);
    if (map.revision !== body.revision) throw new ConflictError("The world has changed. Refresh before editing.");
    let next: WorldAtlasDocument;
    try {
      next = applyAtlasEdit(atlas, makeOperation(atlas, body.operation));
    } catch (error) {
      if (error instanceof RangeError) throw new BadRequestError(error.message);
      throw error;
    }
    const revision = await persistAtlas({ binding, mapId: map.id, expectedRevision: body.revision, atlas: next });
    c.executionCtx.waitUntil(queueRebuild(c.env, access.campaign.worldId, map.id, revision));
    return c.json({ revision, atlas: next, inspector: inspectAtlas(next) });
  })
  .post("/api/campaigns/:campaignId/world/regenerate", zValidator("json", regenerateSchema), async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const access = await requireCampaignAccess({ db, campaignId: c.req.param("campaignId"), userId: session.user.id });
    requireGm(access.role);
    if (!access.campaign.worldId) throw new NotFoundError("Campaign world not found.");
    const body = c.req.valid("json");
    const { map, atlas } = await loadAtlas(db, access.campaign.worldId);
    if (map.revision !== body.revision) throw new ConflictError("The world has changed. Refresh before regenerating.");
    const seed = body.seedMode === "same" ? atlas.seed : `${atlas.seed}:gm:${crypto.randomUUID()}`;
    const generated = generateWorldAtlas({
      seed,
      title: atlas.title,
      templateId: atlas.campaignDecisions.templateId,
      styleIds: atlas.campaignDecisions.styleIds,
      structure: atlas.campaignDecisions.structure,
      scale: atlas.campaignDecisions.scale,
      pace: atlas.campaignDecisions.pace,
      multiPlanar: atlas.campaignDecisions.multiPlanar,
      epic: atlas.campaignDecisions.epic,
      generatedAt: new Date().toISOString(),
    });
    const next = withExplorationState(generated, createInitialExplorationState(generated));
    const revision = await persistAtlas({ binding, mapId: map.id, expectedRevision: body.revision, atlas: next });
    c.executionCtx.waitUntil(queueRebuild(c.env, access.campaign.worldId, map.id, revision));
    return c.json({ revision, atlas: next, exploration: explorationState(next), inspector: inspectAtlas(next) });
  })
  .post("/api/campaigns/:campaignId/world/weather", zValidator("json", weatherSchema), async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const access = await requireCampaignAccess({ db, campaignId: c.req.param("campaignId"), userId: session.user.id });
    requireGm(access.role);
    if (!access.campaign.worldId) throw new NotFoundError("Campaign world not found.");
    const body = c.req.valid("json");
    const { map, atlas } = await loadAtlas(db, access.campaign.worldId);
    if (map.revision !== body.revision) throw new ConflictError("The world has changed. Refresh before changing weather.");
    const state = { ...explorationState(atlas), weather: body.weather as AtlasTravelWeather };
    const next = withExplorationState(atlas, state);
    const revision = await persistAtlas({ binding, mapId: map.id, expectedRevision: body.revision, atlas: next });
    return c.json({ revision, exploration: state });
  })
  .post("/api/campaigns/:campaignId/world/party-position", zValidator("json", positionSchema), async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const access = await requireCampaignAccess({ db, campaignId: c.req.param("campaignId"), userId: session.user.id });
    requireGm(access.role);
    if (!access.campaign.worldId) throw new NotFoundError("Campaign world not found.");
    const body = c.req.valid("json");
    const { map, atlas } = await loadAtlas(db, access.campaign.worldId);
    if (map.revision !== body.revision) throw new ConflictError("The world has changed. Refresh before moving the party.");
    const state = movedState(atlas, explorationState(atlas), body.placeId);
    const next = withExplorationState(atlas, state);
    const revision = await persistAtlas({ binding, mapId: map.id, expectedRevision: body.revision, atlas: next });
    return c.json({ revision, exploration: state });
  })
  .post("/api/campaigns/:campaignId/world/travel/plan", zValidator("json", travelSchema), async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const access = await requireCampaignAccess({ db, campaignId: c.req.param("campaignId"), userId: session.user.id });
    requireTraveler(access.role);
    if (access.campaign.rulesetId !== "dnd35") throw new BadRequestError("Overland travel currently requires the D&D 3.5 ruleset.");
    if (!access.campaign.worldId) throw new NotFoundError("Campaign world not found.");
    const { map, atlas } = await loadAtlas(db, access.campaign.worldId);
    const state = explorationState(atlas);
    if (state.pendingEncounter) throw new ConflictError("Resolve the pending travel encounter before planning another journey.");
    const speedFeet = await partyLandSpeed(db, access.campaign.id);
    let plan;
    try {
      plan = planAtlasTravel({ atlas, state, destinationPlaceId: c.req.valid("json").destinationPlaceId, speedFeet });
    } catch (error) {
      if (error instanceof RangeError) throw new BadRequestError(error.message);
      throw error;
    }
    return c.json({ revision: map.revision, speedFeet, plan });
  })
  .post("/api/campaigns/:campaignId/world/travel/commit", zValidator("json", travelCommitSchema), async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const access = await requireCampaignAccess({ db, campaignId: c.req.param("campaignId"), userId: session.user.id });
    requireTraveler(access.role);
    if (access.campaign.rulesetId !== "dnd35") throw new BadRequestError("Overland travel currently requires the D&D 3.5 ruleset.");
    if (!access.campaign.worldId) throw new NotFoundError("Campaign world not found.");
    const body = c.req.valid("json");
    const { map, atlas } = await loadAtlas(db, access.campaign.worldId);
    if (map.revision !== body.revision) throw new ConflictError("The world has changed. Re-plan this journey.");
    const state = explorationState(atlas);
    if (state.pendingEncounter) throw new ConflictError("Resolve the pending travel encounter before travelling again.");
    const speedFeet = await partyLandSpeed(db, access.campaign.id);
    let plan;
    try {
      plan = planAtlasTravel({ atlas, state, destinationPlaceId: body.destinationPlaceId, speedFeet });
    } catch (error) {
      if (error instanceof RangeError) throw new BadRequestError(error.message);
      throw error;
    }
    const travelId = crypto.randomUUID();
    const encounterRoll = randomUnit();
    const nextState = commitAtlasTravel({ atlas, state, plan, travelId, encounterRoll });
    const next = withExplorationState(atlas, nextState);
    const revision = await persistAtlas({ binding, mapId: map.id, expectedRevision: body.revision, atlas: next });

    const context = await loadActiveGameContext(db, access.campaign.id);
    if (context) {
      const store = new D1GameEventStore(binding);
      const completedAt = new Date();
      c.executionCtx.waitUntil(
        (async () => {
          await store.append({
            id: `travel-${travelId}`,
            campaignId: access.campaign.id,
            sessionId: context.sessionId,
            eventType: "travel.completed",
            occurredAt: completedAt,
            payload: {
              fromPlaceId: plan.fromPlaceId,
              toPlaceId: plan.toPlaceId,
              pathIds: plan.pathIds,
              distanceMiles: plan.distanceMiles,
              durationMinutes: plan.durationMinutes,
              speedFeet: plan.speedFeet,
              weather: plan.weather,
              encounterChance: plan.encounterChance,
              encounterRoll,
              encounterTriggered: Boolean(nextState.pendingEncounter),
              campaignMinutes: nextState.campaignMinutes,
            },
          });
          if (nextState.pendingEncounter) {
            await store.append({
              id: nextState.pendingEncounter.id,
              campaignId: access.campaign.id,
              sessionId: context.sessionId,
              eventType: "travel.encounter.triggered",
              occurredAt: completedAt,
              payload: {
                placeId: nextState.pendingEncounter.placeId,
                travelRecordId: nextState.pendingEncounter.travelRecordId,
                chance: nextState.pendingEncounter.chance,
                roll: nextState.pendingEncounter.roll,
              },
            });
          }
        })().catch((error) => console.error("Unable to append travel game event", { error })),
      );
    }

    return c.json({ revision, exploration: nextState, plan, encounterRoll });
  })
  .post("/api/campaigns/:campaignId/world/travel/encounter/clear", zValidator("json", clearEncounterSchema), async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const access = await requireCampaignAccess({ db, campaignId: c.req.param("campaignId"), userId: session.user.id });
    requireGm(access.role);
    if (!access.campaign.worldId) throw new NotFoundError("Campaign world not found.");
    const body = c.req.valid("json");
    const { map, atlas } = await loadAtlas(db, access.campaign.worldId);
    if (map.revision !== body.revision) throw new ConflictError("The world has changed. Refresh and try again.");
    const state = { ...explorationState(atlas), pendingEncounter: null };
    const next = withExplorationState(atlas, state);
    const revision = await persistAtlas({ binding, mapId: map.id, expectedRevision: body.revision, atlas: next });
    return c.json({ revision, exploration: state });
  });
