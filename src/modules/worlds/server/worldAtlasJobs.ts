/// <reference types="@cloudflare/workers-types" />

import {
  atlasSearchText,
  hashedAtlasEmbedding,
  isWorldAtlasDocument,
  type WorldAtlasDocument,
} from "../domain/atlas";
import { renderWorldAtlasSvg } from "./renderAtlasSvg";

export interface WorldAtlasRenderJob {
  type: "world.atlas.render";
  worldId: string;
  mapId: string;
  revision: number;
  enqueuedAt: string;
}

export interface WorldAtlasVectorizeJob {
  type: "world.atlas.vectorize";
  worldId: string;
  mapId: string;
  revision: number;
  enqueuedAt: string;
}

export type WorldAtlasJob = WorldAtlasRenderJob | WorldAtlasVectorizeJob;

export interface WorldAtlasJobBindings {
  DB?: D1Database;
  R2_BUCKET?: R2Bucket;
  RUNTIME_CACHE?: KVNamespace;
  WORLD_VECTOR_INDEX?: VectorizeIndex;
}

interface AtlasMapRow {
  id: string;
  world_id: string;
  name: string;
  data: string;
  revision: number;
}

export interface WorldAtlasAssetManifest {
  worldId: string;
  mapId: string;
  revision: number;
  r2Key?: string;
  renderedAt?: string;
  vectorizedAt?: string;
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

async function renderAtlas(
  env: WorldAtlasJobBindings,
  job: WorldAtlasRenderJob,
): Promise<void> {
  if (!env.DB) throw new Error("World atlas rendering requires D1.");
  if (!env.R2_BUCKET) throw new Error("World atlas rendering requires R2.");
  const { atlas } = await loadAtlas(env.DB, job);
  const key = `worlds/${job.worldId}/atlas/world-v${job.revision}.svg`;
  const svg = renderWorldAtlasSvg(atlas);
  await env.R2_BUCKET.put(key, svg, {
    httpMetadata: {
      contentType: "image/svg+xml; charset=utf-8",
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      worldId: job.worldId,
      mapId: job.mapId,
      revision: String(job.revision),
      generatorVersion: atlas.generatorVersion,
    },
  });

  const previous = await readManifest(env.RUNTIME_CACHE, job.worldId);
  await writeManifest(env.RUNTIME_CACHE, {
    ...(previous ?? { worldId: job.worldId, mapId: job.mapId, revision: job.revision }),
    worldId: job.worldId,
    mapId: job.mapId,
    revision: job.revision,
    r2Key: key,
    renderedAt: new Date().toISOString(),
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

export async function getWorldAtlasManifest(
  env: Pick<WorldAtlasJobBindings, "RUNTIME_CACHE">,
  worldId: string,
): Promise<WorldAtlasAssetManifest | null> {
  return readManifest(env.RUNTIME_CACHE, worldId);
}
