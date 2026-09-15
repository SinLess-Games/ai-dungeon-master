/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import { campaignMemberships, campaigns, worldMaps } from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import {
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
  enqueueWorldAtlasBuild,
  getWorldAtlasManifest,
  type WorldAtlasJob,
} from "./worldAtlasJobs";

interface Bindings extends AuthEnv {
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
