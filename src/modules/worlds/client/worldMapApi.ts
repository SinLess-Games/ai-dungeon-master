import {
  offlineRequestJson,
  removeCachedJson,
  updateCachedJson,
} from "@/infrastructure/offline";

export type WorldMapKind = "world" | "region" | "location" | "tactical";

export interface WorldMapDocument {
  id: string;
  worldId: string;
  ownerUserId: string;
  name: string;
  kind: WorldMapKind;
  data: Record<string, unknown>;
  revision: number;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
}

export interface CreateWorldMapInput {
  name: string;
  kind?: WorldMapKind;
  data?: Record<string, unknown>;
}

export interface UpdateWorldMapInput {
  name?: string;
  kind?: WorldMapKind;
  data?: Record<string, unknown>;
}

function listPath(worldId: string): string {
  return `/api/worlds/${encodeURIComponent(worldId)}/maps`;
}

export async function listWorldMaps(worldId: string): Promise<WorldMapDocument[]> {
  const result = await offlineRequestJson<{ items: WorldMapDocument[] }>(listPath(worldId));
  return result.items;
}

export function createWorldMap(
  worldId: string,
  input: CreateWorldMapInput,
): Promise<WorldMapDocument> {
  const id = crypto.randomUUID();
  const now = Date.now();
  const optimistic: WorldMapDocument = {
    id,
    worldId,
    ownerUserId: "offline",
    name: input.name,
    kind: input.kind ?? "world",
    data: input.data ?? {},
    revision: 1,
    createdAt: now,
    updatedAt: now,
  };
  return offlineRequestJson<WorldMapDocument>(
    listPath(worldId),
    {
      method: "POST",
      body: JSON.stringify({ id, ...input }),
    },
    {
      queueWhenOffline: true,
      resource: { kind: "map", id },
      optimistic,
      onQueued: async (map) => {
        await updateCachedJson<{ items: WorldMapDocument[] }>(listPath(worldId), (current) => ({
          items: [map, ...(current?.items ?? []).filter((existing) => existing.id !== map.id)],
        }));
      },
    },
  );
}

export async function updateWorldMap(
  map: WorldMapDocument,
  input: UpdateWorldMapInput,
): Promise<WorldMapDocument> {
  const optimistic: WorldMapDocument = {
    ...map,
    ...input,
    data: input.data ?? map.data,
    revision: map.revision + 1,
    updatedAt: Date.now(),
  };
  return offlineRequestJson<WorldMapDocument>(
    `/api/maps/${encodeURIComponent(map.id)}`,
    { method: "PATCH", body: JSON.stringify(input) },
    {
      queueWhenOffline: true,
      resource: { kind: "map", id: map.id },
      optimistic,
      onQueued: async (updated) => {
        await updateCachedJson<{ items: WorldMapDocument[] }>(listPath(map.worldId), (current) => ({
          items: (current?.items ?? []).map((existing) =>
            existing.id === map.id ? updated : existing,
          ),
        }));
      },
    },
  );
}

export function deleteWorldMap(
  map: WorldMapDocument,
): Promise<{ deleted: true; mapId: string }> {
  const optimistic = { deleted: true as const, mapId: map.id };
  return offlineRequestJson(
    `/api/maps/${encodeURIComponent(map.id)}`,
    { method: "DELETE" },
    {
      queueWhenOffline: true,
      resource: { kind: "map", id: map.id },
      optimistic,
      onQueued: async () => {
        await updateCachedJson<{ items: WorldMapDocument[] }>(listPath(map.worldId), (current) => ({
          items: (current?.items ?? []).filter((existing) => existing.id !== map.id),
        }));
        await removeCachedJson(`/api/maps/${encodeURIComponent(map.id)}`);
      },
    },
  );
}
