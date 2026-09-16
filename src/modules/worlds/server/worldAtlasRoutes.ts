/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { OpenAICompatibleEnv } from "@/infrastructure/ai/openaiCompatible";
import { createDatabase } from "@/infrastructure/database/client";
import { campaignMemberships, campaigns, worldMaps } from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from "@/server/middleware/errors";
import {
  hashedAtlasEmbedding,
  isWorldAtlasDocument,
  type WorldAtlasDocument,
} from "../domain/atlas";
import {
  createInitialExplorationState,
  explorationState,
  inspectAtlas,
  withExplorationState,
} from "../domain/worldBuilder";
import {
  generateHybridCampaignWorldAtlas,
  storedAIPlan,
  storedAIRealismAudit,
} from "./finalizedHybridCampaignAtlas";
import {
  enqueueWorldAtlasBuild,
  getWorldAtlasManifest,
  type WorldAtlasJob,
} from "./worldAtlasJobs";
import { worldBuilderRoutes } from "./worldBuilderRoutes";

interface Bindings extends AuthEnv, OpenAICompatibleEnv {
  DB?: D1Database;
  R2_BUCKET?: R2Bucket;
  RUNTIME_CACHE?: KVNamespace;
  BACKGROUND_QUEUE?: Queue<WorldAtlasJob>;
  WORLD_VECTOR_INDEX?: VectorizeIndex;
}

type Env = { Bindings: Bindings };

const searchSchema = z.object({
  query: z.string().trim().min(2).max(200),
});
const regenerateSchema = z.object({
  revision: z.number().int().positive(),
  seedMode: z.enum(["same", "new"]).default("new"),
});

function requireDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("World atlas storage is unavailable.");
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
      description: campaigns.description,
      settings: campaigns.settings,
      status: campaigns.status,
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
  return { campaign, role: membership.role };
}

async function loadAtlas(input: {
  db: ReturnType<typeof createDatabase>;
  worldId: string;
}) {
  let map;
  try {
    map = await input.db
      .select()
      .from(worldMaps)
      .where(and(eq(worldMaps.worldId, input.worldId), eq(worldMaps.kind, "world")))
      .orderBy(desc(worldMaps.updatedAt))
      .get();
  } catch (error) {
    console.error("World atlas read failed", { worldId: input.worldId, error });
    throw new ServiceUnavailableError(
      "World atlas storage is not ready. Apply the offline/world-map migration before enabling the atlas.",
    );
  }
  if (!map) throw new NotFoundError("This campaign does not have a generated world atlas yet.");
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
    .bind(JSON.stringify(input.atlas), input.mapId, input.expectedRevision)
    .run();
  if ((result.meta.changes ?? 0) !== 1) {
    throw new ConflictError("The world changed before regeneration was saved. Refresh and try again.");
  }
  return input.expectedRevision + 1;
}

async function maybeQueueBuild(input: {
  env: Bindings;
  worldId: string;
  mapId: string;
  revision: number;
}): Promise<void> {
  const manifest = await getWorldAtlasManifest(input.env, input.worldId);
  if (manifest?.revision === input.revision && manifest.r2Key) return;
  const lockKey = `world:${input.worldId}:atlas:queue-lock:${input.revision}`;
  if (input.env.RUNTIME_CACHE) {
    const locked = await input.env.RUNTIME_CACHE.get(lockKey);
    if (locked) return;
    await input.env.RUNTIME_CACHE.put(lockKey, "1", { expirationTtl: 300 });
  }
  await enqueueWorldAtlasBuild(input.env.BACKGROUND_QUEUE, {
    worldId: input.worldId,
    mapId: input.mapId,
    revision: input.revision,
  });
}

function renderUrl(campaignId: string): string {
  return `/api/campaigns/${encodeURIComponent(campaignId)}/atlas/render`;
}

export const worldAtlasRoutes = new Hono<Env>()
  .post(
    "/api/campaigns/:campaignId/world/regenerate",
    zValidator("json", regenerateSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const access = await requireCampaignAccess({
        db,
        campaignId: c.req.param("campaignId"),
        userId: session.user.id,
      });
      if (access.role !== "owner" && access.role !== "gm") {
        throw new ForbiddenError("Only the campaign owner or GM can regenerate the world atlas.");
      }
      if (!access.campaign.worldId) throw new NotFoundError("Campaign world not found.");

      const body = c.req.valid("json");
      const { map, atlas } = await loadAtlas({ db, worldId: access.campaign.worldId });
      if (map.revision !== body.revision) {
        throw new ConflictError("The world has changed. Refresh before regenerating.");
      }

      const seed =
        body.seedMode === "same"
          ? atlas.seed
          : `${atlas.seed}:gm:${crypto.randomUUID()}`;
      const generated = await generateHybridCampaignWorldAtlas({
        env: c.env,
        request: {
          campaign: {
            name: access.campaign.name,
            description: access.campaign.description,
            settings: access.campaign.settings,
          },
          seed,
          generatedAt: new Date().toISOString(),
        },
        existingPlan: body.seedMode === "same" ? storedAIPlan(atlas) : null,
        existingAudit: body.seedMode === "same" ? storedAIRealismAudit(atlas) : null,
      });
      const next = withExplorationState(generated, createInitialExplorationState(generated));
      const revision = await persistAtlas({
        binding,
        mapId: map.id,
        expectedRevision: body.revision,
        atlas: next,
      });

      c.executionCtx.waitUntil(
        maybeQueueBuild({
          env: c.env,
          worldId: access.campaign.worldId,
          mapId: map.id,
          revision,
        }).catch((error) => console.error("Unable to queue regenerated atlas assets", { error })),
      );

      return c.json({
        revision,
        atlas: next,
        exploration: explorationState(next),
        inspector: inspectAtlas(next),
      });
    },
  )
  .route("/", worldBuilderRoutes)
  .get("/api/campaigns/:campaignId/atlas", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireDatabase(c.env.DB));
    const access = await requireCampaignAccess({
      db,
      campaignId: c.req.param("campaignId"),
      userId: session.user.id,
    });
    if (!access.campaign.worldId) {
      throw new NotFoundError("This campaign has not generated its world yet.");
    }
    const { map, atlas } = await loadAtlas({ db, worldId: access.campaign.worldId });
    const manifest = await getWorldAtlasManifest(c.env, access.campaign.worldId);
    c.executionCtx.waitUntil(
      maybeQueueBuild({
        env: c.env,
        worldId: access.campaign.worldId,
        mapId: map.id,
        revision: map.revision,
      }).catch((error) => console.error("Unable to queue atlas assets", { error })),
    );
    const ready = manifest?.revision === map.revision && Boolean(manifest.r2Key);
    return c.json({
      campaignId: access.campaign.id,
      worldId: access.campaign.worldId,
      mapId: map.id,
      revision: map.revision,
      atlas,
      asset: {
        status: ready ? ("ready" as const) : ("pending" as const),
        renderUrl: ready ? renderUrl(access.campaign.id) : null,
        renderedAt: manifest?.renderedAt ?? null,
        vectorizedAt: manifest?.vectorizedAt ?? null,
      },
    });
  })
  .post("/api/campaigns/:campaignId/atlas/assets", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireDatabase(c.env.DB));
    const access = await requireCampaignAccess({
      db,
      campaignId: c.req.param("campaignId"),
      userId: session.user.id,
    });
    if (access.role !== "owner" && access.role !== "gm") {
      throw new ForbiddenError("Only the campaign owner or GM can rebuild atlas assets.");
    }
    if (!access.campaign.worldId) throw new NotFoundError("Campaign world not found.");
    const { map } = await loadAtlas({ db, worldId: access.campaign.worldId });
    const queued = await enqueueWorldAtlasBuild(c.env.BACKGROUND_QUEUE, {
      worldId: access.campaign.worldId,
      mapId: map.id,
      revision: map.revision,
    });
    return c.json({
      queued,
      worldId: access.campaign.worldId,
      mapId: map.id,
      revision: map.revision,
    });
  })
  .get("/api/campaigns/:campaignId/atlas/render", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireDatabase(c.env.DB));
    const access = await requireCampaignAccess({
      db,
      campaignId: c.req.param("campaignId"),
      userId: session.user.id,
    });
    if (!access.campaign.worldId) throw new NotFoundError("Campaign world not found.");
    if (!c.env.R2_BUCKET) throw new ServiceUnavailableError("Atlas object storage is unavailable.");
    const manifest = await getWorldAtlasManifest(c.env, access.campaign.worldId);
    if (!manifest?.r2Key) throw new NotFoundError("Rendered atlas asset is still being prepared.");
    const object = await c.env.R2_BUCKET.get(manifest.r2Key);
    if (!object) throw new NotFoundError("Rendered atlas asset is unavailable.");
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("ETag", object.httpEtag);
    headers.set("Cache-Control", "private, max-age=300");
    return new Response(object.body, { headers });
  })
  .post("/api/campaigns/:campaignId/atlas/search", zValidator("json", searchSchema), async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireDatabase(c.env.DB));
    const access = await requireCampaignAccess({
      db,
      campaignId: c.req.param("campaignId"),
      userId: session.user.id,
    });
    if (!access.campaign.worldId) throw new NotFoundError("Campaign world not found.");
    if (!c.env.WORLD_VECTOR_INDEX) return c.json({ items: [] });

    const vector = hashedAtlasEmbedding(c.req.valid("json").query);
    const result = await c.env.WORLD_VECTOR_INDEX.query(vector, {
      topK: 30,
      returnMetadata: "all",
    });
    const items = result.matches
      .filter((match) => match.metadata?.["worldId"] === access.campaign.worldId)
      .slice(0, 12)
      .map((match) => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata ?? {},
      }));
    return c.json({ items });
  });
