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
import { isWorldAtlasDocument, type WorldAtlasDocument } from "../domain/atlas";
import {
  currentWorldAtlasDetail,
  enqueueWorldAtlasDetailBuild,
  getWorldAtlasManifest,
  WORLD_ATLAS_DETAIL_RENDERER_VERSION,
  type WorldAtlasJob,
} from "./worldAtlasJobs";

interface Bindings extends AuthEnv {
  DB?: D1Database;
  R2_BUCKET?: R2Bucket;
  RUNTIME_CACHE?: KVNamespace;
  BACKGROUND_QUEUE?: Queue<WorldAtlasJob>;
}

type Env = { Bindings: Bindings };

const detailSchema = z.object({
  x: z.coerce.number().finite(),
  y: z.coerce.number().finite(),
  width: z.coerce.number().finite().positive(),
  height: z.coerce.number().finite().positive(),
  level: z.coerce.number().int().min(1).max(3),
});

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function requireDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("World atlas storage is unavailable.");
  return binding;
}

async function requireCampaignWorld(input: {
  binding: D1Database;
  campaignId: string;
  userId: string;
}): Promise<{ worldId: string; mapId: string; revision: number; atlas: WorldAtlasDocument }> {
  const db = createDatabase(input.binding);
  const campaign = await db
    .select({ id: campaigns.id, ownerUserId: campaigns.ownerUserId, worldId: campaigns.worldId })
    .from(campaigns)
    .where(eq(campaigns.id, input.campaignId))
    .get();
  if (!campaign) throw new NotFoundError("Campaign not found.");
  if (campaign.ownerUserId !== input.userId) {
    const membership = await db
      .select({ status: campaignMemberships.status })
      .from(campaignMemberships)
      .where(
        and(
          eq(campaignMemberships.campaignId, campaign.id),
          eq(campaignMemberships.userId, input.userId),
        ),
      )
      .get();
    if (!membership || membership.status !== "active") {
      throw new ForbiddenError("You do not have access to this campaign world.");
    }
  }
  if (!campaign.worldId) throw new NotFoundError("Campaign world not found.");
  const map = await db
    .select()
    .from(worldMaps)
    .where(and(eq(worldMaps.worldId, campaign.worldId), eq(worldMaps.kind, "world")))
    .orderBy(desc(worldMaps.updatedAt))
    .get();
  if (!map || !isWorldAtlasDocument(map.data)) {
    throw new NotFoundError("Campaign world atlas not found.");
  }
  return { worldId: campaign.worldId, mapId: map.id, revision: map.revision, atlas: map.data };
}

function detailViewport(
  atlas: WorldAtlasDocument,
  request: z.infer<typeof detailSchema>,
): { x: number; y: number; width: number; height: number } {
  const widthShare = request.level === 1 ? 0.6 : request.level === 2 ? 0.32 : 0.16;
  const width = atlas.widthMiles * widthShare;
  const height = width * (atlas.heightMiles / atlas.widthMiles);
  const requestCenterX = request.x + request.width / 2;
  const requestCenterY = request.y + request.height / 2;
  const stepX = width * 0.25;
  const stepY = height * 0.25;
  const centerX = Math.round(requestCenterX / stepX) * stepX;
  const centerY = Math.round(requestCenterY / stepY) * stepY;
  return {
    x: clamp(centerX - width / 2, 0, Math.max(0, atlas.widthMiles - width)),
    y: clamp(centerY - height / 2, 0, Math.max(0, atlas.heightMiles - height)),
    width,
    height,
  };
}

function detailKey(
  level: number,
  viewport: { x: number; y: number; width: number; height: number },
): string {
  return [
    `l${level}`,
    `x${Math.round(viewport.x)}`,
    `y${Math.round(viewport.y)}`,
    `w${Math.round(viewport.width)}`,
    `h${Math.round(viewport.height)}`,
  ].join("-");
}

function detailRenderUrl(campaignId: string, key: string): string {
  return `/api/campaigns/${encodeURIComponent(campaignId)}/atlas/detail/render/${encodeURIComponent(key)}`;
}

export const worldAtlasDetailRoutes = new Hono<Env>()
  .get(
    "/api/campaigns/:campaignId/atlas/detail",
    zValidator("query", detailSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const binding = requireDatabase(c.env.DB);
      const world = await requireCampaignWorld({
        binding,
        campaignId: c.req.param("campaignId"),
        userId: session.user.id,
      });
      const request = c.req.valid("query");
      const viewport = detailViewport(world.atlas, request);
      const key = detailKey(request.level, viewport);
      const manifest = await getWorldAtlasManifest(c.env, world.worldId);
      const ready = currentWorldAtlasDetail(manifest, world.revision, key);
      if (!ready) {
        const lockKey = `world:${world.worldId}:atlas:detail-lock:${world.revision}:${WORLD_ATLAS_DETAIL_RENDERER_VERSION}:${key}`;
        let queue = true;
        if (c.env.RUNTIME_CACHE) {
          const locked = await c.env.RUNTIME_CACHE.get(lockKey);
          queue = !locked;
          if (queue) await c.env.RUNTIME_CACHE.put(lockKey, "1", { expirationTtl: 600 });
        }
        if (queue) {
          c.executionCtx.waitUntil(
            enqueueWorldAtlasDetailBuild(c.env.BACKGROUND_QUEUE, {
              worldId: world.worldId,
              mapId: world.mapId,
              revision: world.revision,
              detailKey: key,
              level: request.level,
              viewport,
            }).catch((error) => console.error("Unable to queue atlas detail render", { error })),
          );
        }
      }
      return c.json({
        status: ready ? ("ready" as const) : ("pending" as const),
        detailKey: key,
        level: request.level,
        viewport,
        renderUrl: ready ? detailRenderUrl(c.req.param("campaignId"), key) : null,
        renderedAt: ready?.renderedAt ?? null,
      });
    },
  )
  .get("/api/campaigns/:campaignId/atlas/detail/render/:detailKey", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const world = await requireCampaignWorld({
      binding,
      campaignId: c.req.param("campaignId"),
      userId: session.user.id,
    });
    if (!c.env.R2_BUCKET) throw new ServiceUnavailableError("Atlas object storage is unavailable.");
    const manifest = await getWorldAtlasManifest(c.env, world.worldId);
    const detail = currentWorldAtlasDetail(manifest, world.revision, c.req.param("detailKey"));
    if (!detail) throw new NotFoundError("Detailed satellite imagery is still being prepared.");
    const object = await c.env.R2_BUCKET.get(detail.r2Key);
    if (!object) throw new NotFoundError("Detailed satellite imagery is unavailable.");
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("ETag", object.httpEtag);
    headers.set("Cache-Control", "private, max-age=600");
    return new Response(object.body, { headers });
  });
