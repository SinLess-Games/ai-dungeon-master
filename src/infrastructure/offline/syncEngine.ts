import {
  resolveOfflinePathAliases,
  resolveOfflineResource,
  setOfflineResourceAlias,
} from "./aliases";
import {
  cacheJsonResponse,
  deleteMutationsForResource,
  deleteOfflineMutation,
  getActiveOfflineUserId,
  listOfflineMutations,
  replaceResourceVersions,
  setLastSyncedAt,
  setResourceVersion,
  updateOfflineMutation,
} from "./store";
import type { OfflineMutation, SyncBootstrapResponse } from "./types";

let flushPromise: Promise<void> | null = null;

function emitChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("endless-codex:offline-sync-changed"));
  }
}

function isOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

async function cacheNetworkJson(url: string): Promise<unknown | undefined> {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return undefined;
  const text = await response.text();
  const value = text ? (JSON.parse(text) as unknown) : null;
  await cacheJsonResponse(url, value);
  return value;
}

export async function bootstrapOfflineCloudState(): Promise<SyncBootstrapResponse | null> {
  if (!isOnline() || !getActiveOfflineUserId()) return null;
  const response = await fetch("/api/sync/bootstrap", {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`Cloud sync bootstrap failed (${response.status}).`);
  const payload = (await response.json()) as SyncBootstrapResponse;
  if (payload.userId !== getActiveOfflineUserId()) {
    throw new Error("Cloud sync identity changed while synchronizing.");
  }
  await replaceResourceVersions(payload.versions);
  await cacheJsonResponse("/api/sync/bootstrap", payload);

  // Prime the core libraries and campaign details so a user who has opened the
  // application online can reopen their saves with no network connection.
  await Promise.allSettled([
    cacheNetworkJson("/api/campaigns"),
    cacheNetworkJson("/api/characters"),
  ]);
  await Promise.allSettled(
    payload.resources.campaigns
      .map((value) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) return null;
        const id = (value as Record<string, unknown>)["id"];
        return typeof id === "string"
          ? cacheNetworkJson(`/api/campaigns/${encodeURIComponent(id)}`)
          : null;
      })
      .filter((promise): promise is Promise<unknown | undefined> => promise !== null),
  );

  const mapsByWorld = new Map<string, unknown[]>();
  for (const map of payload.resources.maps) {
    if (!map || typeof map !== "object" || Array.isArray(map)) continue;
    const worldId = (map as Record<string, unknown>)["worldId"];
    if (typeof worldId !== "string") continue;
    const list = mapsByWorld.get(worldId) ?? [];
    list.push(map);
    mapsByWorld.set(worldId, list);
  }
  for (const world of payload.resources.worlds) {
    if (!world || typeof world !== "object" || Array.isArray(world)) continue;
    const worldId = (world as Record<string, unknown>)["id"];
    if (typeof worldId !== "string") continue;
    await cacheJsonResponse(`/api/worlds/${encodeURIComponent(worldId)}/maps`, {
      items: mapsByWorld.get(worldId) ?? [],
    });
  }

  await setLastSyncedAt(Date.now());
  emitChanged();
  return payload;
}

async function recordCreatedResourceAlias(
  row: OfflineMutation,
  response: Response,
): Promise<void> {
  if (row.method !== "POST" || !row.resource) return;
  try {
    const body = (await response.clone().json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) return;
    const cloudId = (body as Record<string, unknown>)["id"];
    if (typeof cloudId !== "string" || !cloudId || cloudId === row.resource.id) return;
    const userId = getActiveOfflineUserId();
    if (!userId) return;
    setOfflineResourceAlias(userId, row.resource, cloudId);
  } catch {
    /* Some successful mutations do not return an entity body. */
  }
}

async function replayMutation(row: OfflineMutation): Promise<"done" | "stop"> {
  const userId = getActiveOfflineUserId();
  const resource = resolveOfflineResource(userId, row.resource);
  const resolvedUrl = resolveOfflinePathAliases(userId, row.url);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Endless-Codex-Mutation-Id": row.id,
  };
  if (resource) {
    headers["X-Endless-Codex-Resource-Kind"] = resource.kind;
    headers["X-Endless-Codex-Resource-Id"] = resource.id;
  }
  if (row.baseVersion !== null) {
    headers["X-Endless-Codex-Base-Version"] = String(row.baseVersion);
  }
  if (row.forceLocal) headers["X-Endless-Codex-Conflict-Policy"] = "local-wins";

  let response: Response;
  try {
    response = await fetch(resolvedUrl, {
      method: row.method,
      credentials: "same-origin",
      headers,
      ...(row.body === null ? {} : { body: row.body }),
    });
  } catch (error) {
    await updateOfflineMutation(row.id, {
      attempts: row.attempts + 1,
      state: "pending",
      lastError: error instanceof Error ? error.message : "Network unavailable.",
    });
    return "stop";
  }

  if (response.status === 401) return "stop";
  if (response.status === 409) {
    let message = "The cloud copy changed while this device was offline.";
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      /* Keep conflict fallback. */
    }
    await updateOfflineMutation(row.id, {
      attempts: row.attempts + 1,
      state: "conflict",
      lastError: message,
    });
    return "done";
  }
  if (response.status >= 500) {
    await updateOfflineMutation(row.id, {
      attempts: row.attempts + 1,
      state: "pending",
      lastError: `Cloud save failed (${response.status}).`,
    });
    return "stop";
  }
  if (!response.ok) {
    let message = `Queued save was rejected (${response.status}).`;
    try {
      const body = (await response.json()) as {
        error?: string | { message?: string };
        message?: string;
      };
      if (typeof body.error === "string") message = body.error;
      else if (body.error?.message) message = body.error.message;
      else if (body.message) message = body.message;
    } catch {
      /* Keep HTTP fallback. */
    }
    await updateOfflineMutation(row.id, {
      attempts: row.attempts + 1,
      state: "error",
      lastError: message,
    });
    return "done";
  }

  await recordCreatedResourceAlias(row, response);
  const resourceVersion = Number(response.headers.get("X-Endless-Codex-Resource-Version"));
  const resolvedResourceAfterCreate = resolveOfflineResource(userId, row.resource);
  if (
    resolvedResourceAfterCreate &&
    Number.isSafeInteger(resourceVersion) &&
    resourceVersion >= 0
  ) {
    await setResourceVersion(resolvedResourceAfterCreate, resourceVersion);
  }
  await deleteOfflineMutation(row.id);
  return "done";
}

export async function flushOfflineMutations(): Promise<void> {
  if (flushPromise) return flushPromise;
  if (!isOnline() || !getActiveOfflineUserId()) return;

  flushPromise = (async () => {
    emitChanged();
    const rows = await listOfflineMutations();
    for (const row of rows) {
      if (row.state !== "pending") continue;
      if (!isOnline()) break;
      const result = await replayMutation(row);
      emitChanged();
      if (result === "stop") break;
    }
    if (isOnline()) {
      try {
        await bootstrapOfflineCloudState();
      } catch (error) {
        console.warn("Cloud sync refresh failed after mutation replay", { error });
      }
    }
  })().finally(() => {
    flushPromise = null;
    emitChanged();
  });

  return flushPromise;
}

export async function resolveOfflineConflict(
  mutationId: string,
  strategy: "keep-local" | "use-cloud",
): Promise<void> {
  const row = (await listOfflineMutations()).find((mutation) => mutation.id === mutationId);
  if (!row || row.state !== "conflict") return;

  if (strategy === "keep-local") {
    await updateOfflineMutation(row.id, {
      state: "pending",
      forceLocal: true,
      lastError: null,
    });
    emitChanged();
    await flushOfflineMutations();
    return;
  }

  if (row.resource) await deleteMutationsForResource(row.resource);
  else await deleteOfflineMutation(row.id);
  if (isOnline()) await bootstrapOfflineCloudState();
  emitChanged();
}

export async function retryOfflineMutation(mutationId: string): Promise<void> {
  await updateOfflineMutation(mutationId, { state: "pending", lastError: null });
  emitChanged();
  await flushOfflineMutations();
}
