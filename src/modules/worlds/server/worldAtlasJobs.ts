/// <reference types="@cloudflare/workers-types" />

import type { OpenAICompatibleEnv } from "@/infrastructure/ai/openaiCompatible";
import {
  atlasSearchText,
  hashedAtlasEmbedding,
  isWorldAtlasDocument,
  type WorldAtlasDocument,
} from "../domain/atlas";
import {
  renderWorldAtlasWithAI,
  WORLD_ATLAS_RENDERER_VERSION,
} from "./renderAtlasAiSatellite";
import {
  renderWorldAtlasDetailWithAI,
  WORLD_ATLAS_DETAIL_RENDERER_VERSION,
  type AtlasDetailViewport,
} from "./renderAtlasAiDetail";

export { WORLD_ATLAS_RENDERER_VERSION } from "./renderAtlasAiSatellite";
export { WORLD_ATLAS_DETAIL_RENDERER_VERSION } from "./renderAtlasAiDetail";

export interface WorldAtlasRenderJob {
  type: "world.atlas.render";
  worldId: string;
  mapId: string;
  revision: number;
  enqueuedAt: string;
}

export interface WorldAtlasDetailRenderJob {
  type: "world.atlas.detail-render";
  worldId: string;
  mapId: string;
  revision: number;
  detailKey: string;
  level: number;
  viewport: AtlasDetailViewport;
  enqueuedAt: string;
}

export interface WorldAtlasVectorizeJob {
  type: "world.atlas.vectorize";
  worldId: string;
  mapId: string;
  revision: number;
  enqueuedAt: string;
}

export type WorldAtlasJob =
  | WorldAtlasRenderJob
  | WorldAtlasDetailRenderJob
  | WorldAtlasVectorizeJob;

export interface WorldAtlasJobBindings {
  DB?: D1Database;
  R2_BUCKET?: R2Bucket;
  RUNTIME_CACHE?: KVNamespace;
  WORLD_VECTOR_INDEX?: VectorizeIndex;
  AI?: OpenAICompatibleEnv["AI"];
  AI_MAP_IMAGE_MODEL?: string;
}

interface AtlasMapRow {
  id: string;
  world_id: string;
  name: string;
  data: string;
  revision: number;
}

export interface WorldAtlasDetailManifest {
  revision: number;
  rendererVersion: string;
  r2Key: string;
  renderedAt: string;
  aiImageModel: string;
  level: number;
  viewport: AtlasDetailViewport;
}

export interface WorldAtlasAssetManifest {
  worldId: string;
  mapId: string;
  revision: number;
  rendererVersion?: string;
  aiImageModel?: string;
  r2Key?: string;
  renderedAt?: string;
  vectorizedAt?: string;
  details?: Record<string, WorldAtlasDetailManifest>;
}

function manifestKey(worldId: string): string {
  return `world:${worldId}:atlas:manifest`;
}

async function loadAtlas(database: D1Database, job: WorldAtlasJob): Promise<{
  row: AtlasMapRow;
  atlas: WorldAtlasDocument;
}> {
  const row = await database
    .prepare(
      `SELECT id, world_id, name, data, revision
       FROM world_maps
       WHERE id = ? AND world_id = ? AND kind = 'world'
       LIMIT 1`,
    )
    .bind(job.mapId, job.worldId)
    .first<AtlasMapRow>();
  if (!row) throw new Error(`World atlas map ${job.mapId} is unavailable.`);
  if (row.revision !== job.revision) {
    throw new Error(`World atlas map ${job.mapId} changed before background processing.`);
  }

  let value: unknown;
  try {
    value = JSON.parse(row.data);
  } catch {
    throw new Error(`World atlas map ${job.mapId} contains invalid JSON.`);
  }
  if (!isWorldAtlasDocument(value)) {
    throw new Error(`World atlas map ${job.mapId} is not an atlas document.`);
  }
  return { row, atlas: value };
}

async function readManifest(
  cache: KVNamespace | undefined,
  worldId: string,
): Promise<WorldAtlasAssetManifest | null> {
  if (!cache) return null;
  return cache.get<WorldAtlasAssetManifest>(manifestKey(worldId), "json");
}

async function writeManifest(
  cache: KVNamespace | undefined,
  manifest: WorldAtlasAssetManifest,
): Promise<void> {
  if (!cache) return;
  await cache.put(manifestKey(manifest.worldId), JSON.stringify(manifest), {
    expirationTtl: 60 * 60 * 24 * 30,
  });
}

export function isCurrentWorldAtlasRender(
  manifest: WorldAtlasAssetManifest | null | undefined,
  revision: number,
): boolean {
  return Boolean(
    manifest?.revision === revision &&
      manifest.r2Key &&
      manifest.rendererVersion === WORLD_ATLAS_RENDERER_VERSION,
  );
}

export function currentWorldAtlasDetail(
  manifest: WorldAtlasAssetManifest | null | undefined,
  revision: number,
  detailKey: string,
): WorldAtlasDetailManifest | null {
  const detail = manifest?.details?.[detailKey];
  return detail &&
    detail.revision === revision &&
    detail.rendererVersion === WORLD_ATLAS_DETAIL_RENDERER_VERSION
    ? detail
    : null;
}

async function renderAtlas(
  env: WorldAtlasJobBindings,
  job: WorldAtlasRenderJob,
): Promise<void> {
  if (!env.DB) throw new Error("World atlas rendering requires D1.");
  if (!env.R2_BUCKET) throw new Error("World atlas rendering requires R2.");
  if (!env.AI) throw new Error("World atlas rendering requires the Workers AI binding.");

  const { atlas } = await loadAtlas(env.DB, job);
  const rendered = await renderWorldAtlasWithAI(
    env.AI as unknown as Ai,
    atlas,
    env.AI_MAP_IMAGE_MODEL,
  );
  const key = `worlds/${job.worldId}/atlas/world-v${job.revision}-${WORLD_ATLAS_RENDERER_VERSION}.${rendered.extension}`;

  await env.R2_BUCKET.put(key, rendered.bytes, {
    httpMetadata: {
      contentType: rendered.contentType,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      worldId: job.worldId,
      mapId: job.mapId,
      revision: String(job.revision),
      generatorVersion: atlas.generatorVersion,
      rendererVersion: WORLD_ATLAS_RENDERER_VERSION,
      aiImageModel: rendered.model,
      width: String(rendered.width),
      height: String(rendered.height),
    },
  });

  const previous = await readManifest(env.RUNTIME_CACHE, job.worldId);
  await writeManifest(env.RUNTIME_CACHE, {
    ...(previous ?? { worldId: job.worldId, mapId: job.mapId, revision: job.revision }),
    worldId: job.worldId,
    mapId: job.mapId,
    revision: job.revision,
    rendererVersion: WORLD_ATLAS_RENDERER_VERSION,
    aiImageModel: rendered.model,
    r2Key: key,
    renderedAt: new Date().toISOString(),
    details: previous?.revision === job.revision ? previous.details : undefined,
  });
}

async function renderAtlasDetail(
  env: WorldAtlasJobBindings,
  job: WorldAtlasDetailRenderJob,
): Promise<void> {
  if (!env.DB) throw new Error("World atlas detail rendering requires D1.");
  if (!env.R2_BUCKET) throw new Error("World atlas detail rendering requires R2.");
  if (!env.AI) throw new Error("World atlas detail rendering requires the Workers AI binding.");

  const { atlas } = await loadAtlas(env.DB, job);
  const rendered = await renderWorldAtlasDetailWithAI(
    env.AI as unknown as Ai,
    atlas,
    job.viewport,
    job.level,
    env.AI_MAP_IMAGE_MODEL,
  );
  const key = `worlds/${job.worldId}/atlas/details/v${job.revision}/${WORLD_ATLAS_DETAIL_RENDERER_VERSION}/${job.detailKey}.${rendered.extension}`;
  const renderedAt = new Date().toISOString();

  await env.R2_BUCKET.put(key, rendered.bytes, {
    httpMetadata: {
      contentType: rendered.contentType,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      worldId: job.worldId,
      mapId: job.mapId,
      revision: String(job.revision),
      rendererVersion: WORLD_ATLAS_DETAIL_RENDERER_VERSION,
      aiImageModel: rendered.model,
      detailKey: job.detailKey,
      level: String(job.level),
      viewport: JSON.stringify(job.viewport),
      width: String(rendered.width),
      height: String(rendered.height),
    },
  });

  const previous = await readManifest(env.RUNTIME_CACHE, job.worldId);
  const details = previous?.revision === job.revision ? { ...(previous.details ?? {}) } : {};
  details[job.detailKey] = {
    revision: job.revision,
    rendererVersion: WORLD_ATLAS_DETAIL_RENDERER_VERSION,
    r2Key: key,
    renderedAt,
    aiImageModel: rendered.model,
    level: job.level,
    viewport: job.viewport,
  };
  await writeManifest(env.RUNTIME_CACHE, {
    ...(previous ?? { worldId: job.worldId, mapId: job.mapId, revision: job.revision }),
    worldId: job.worldId,
    mapId: job.mapId,
    revision: job.revision,
    details,
  });
}

async function vectorizeAtlas(
  env: WorldAtlasJobBindings,
  job: WorldAtlasVectorizeJob,
): Promise<void> {
  if (!env.DB) throw new Error("World atlas vectorization requires D1.");
  if (!env.WORLD_VECTOR_INDEX) return;
  const { atlas } = await loadAtlas(env.DB, job);
  const documents = atlasSearchText(atlas);
  const chunkSize = 250;
  for (let offset = 0; offset < documents.length; offset += chunkSize) {
    const chunk = documents.slice(offset, offset + chunkSize);
    await env.WORLD_VECTOR_INDEX.upsert(
      chunk.map((document) => ({
        id: `${job.worldId}:${document.id}`,
        values: hashedAtlasEmbedding(document.text),
        metadata: {
          ...document.metadata,
          worldId: job.worldId,
          mapId: job.mapId,
          atlasRevision: job.revision,
        },
      })),
    );
  }

  const previous = await readManifest(env.RUNTIME_CACHE, job.worldId);
  await writeManifest(env.RUNTIME_CACHE, {
    ...(previous ?? { worldId: job.worldId, mapId: job.mapId, revision: job.revision }),
    worldId: job.worldId,
    mapId: job.mapId,
    revision: job.revision,
    vectorizedAt: new Date().toISOString(),
  });
}

export async function processWorldAtlasJob(
  env: WorldAtlasJobBindings,
  job: WorldAtlasJob,
): Promise<void> {
  switch (job.type) {
    case "world.atlas.render":
      await renderAtlas(env, job);
      return;
    case "world.atlas.detail-render":
      await renderAtlasDetail(env, job);
      return;
    case "world.atlas.vectorize":
      await vectorizeAtlas(env, job);
      return;
  }
}

export async function enqueueWorldAtlasBuild(
  queue: Queue<WorldAtlasJob> | undefined,
  input: { worldId: string; mapId: string; revision: number },
): Promise<boolean> {
  if (!queue) return false;
  const enqueuedAt = new Date().toISOString();
  await queue.sendBatch([
    {
      body: {
        type: "world.atlas.render",
        ...input,
        enqueuedAt,
      },
    },
    {
      body: {
        type: "world.atlas.vectorize",
        ...input,
        enqueuedAt,
      },
    },
  ]);
  return true;
}

export async function enqueueWorldAtlasDetailBuild(
  queue: Queue<WorldAtlasJob> | undefined,
  input: {
    worldId: string;
    mapId: string;
    revision: number;
    detailKey: string;
    level: number;
    viewport: AtlasDetailViewport;
  },
): Promise<boolean> {
  if (!queue) return false;
  await queue.send({
    type: "world.atlas.detail-render",
    ...input,
    enqueuedAt: new Date().toISOString(),
  });
  return true;
}

export async function getWorldAtlasManifest(
  env: Pick<WorldAtlasJobBindings, "RUNTIME_CACHE">,
  worldId: string,
): Promise<WorldAtlasAssetManifest | null> {
  return readManifest(env.RUNTIME_CACHE, worldId);
}
