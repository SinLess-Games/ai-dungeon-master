import type {
  OfflineCachedResponse,
  OfflineMutation,
  OfflineResourceRef,
  OfflineResourceVersion,
  OfflineSyncSummary,
} from "./types";

const DB_NAME = "endless-codex-offline";
const DB_VERSION = 1;
const LAST_USER_KEY = "endless-codex:last-offline-user";
const LAST_SYNC_KEY = "lastSyncedAt";

let activeUserId: string | null = null;
let databasePromise: Promise<IDBDatabase | null> | undefined;

const memoryResponses = new Map<string, OfflineCachedResponse>();
const memoryMutations = new Map<string, OfflineMutation>();
const memoryVersions = new Map<string, OfflineResourceVersion>();
const memoryMeta = new Map<string, unknown>();

function hasIndexedDb(): boolean {
  return typeof indexedDB !== "undefined";
}

function responseKey(userId: string, url: string): string {
  return `${userId}:${url}`;
}

function versionKey(userId: string, resource: OfflineResourceRef): string {
  return `${userId}:${resource.kind}:${resource.id}`;
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (!hasIndexedDb()) return Promise.resolve(null);
  databasePromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Unable to open offline save database."));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("responses")) {
        const store = db.createObjectStore("responses", { keyPath: "key" });
        store.createIndex("userId", "userId", { unique: false });
      }
      if (!db.objectStoreNames.contains("mutations")) {
        const store = db.createObjectStore("mutations", { keyPath: "id" });
        store.createIndex("userId", "userId", { unique: false });
        store.createIndex("state", "state", { unique: false });
      }
      if (!db.objectStoreNames.contains("versions")) {
        const store = db.createObjectStore("versions", { keyPath: "key" });
        store.createIndex("userId", "userId", { unique: false });
      }
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
  }).catch((error) => {
    console.warn("IndexedDB is unavailable; using in-memory offline storage.", { error });
    return null;
  });
  return databasePromise;
}

async function put(storeName: string, value: unknown): Promise<void> {
  const db = await openDatabase();
  if (!db) return;
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const request = transaction.objectStore(storeName).put(value);
    request.onerror = () => reject(request.error ?? new Error(`Unable to write ${storeName}.`));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error(`Unable to write ${storeName}.`));
  });
}

async function remove(storeName: string, key: IDBValidKey): Promise<void> {
  const db = await openDatabase();
  if (!db) return;
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error(`Unable to delete ${storeName}.`));
  });
}

async function get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDatabase();
  if (!db) return undefined;
  return new Promise<T | undefined>((resolve, reject) => {
    const request = db.transaction(storeName, "readonly").objectStore(storeName).get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error ?? new Error(`Unable to read ${storeName}.`));
  });
}

async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  if (!db) return [];
  return new Promise<T[]>((resolve, reject) => {
    const request = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
    request.onsuccess = () => resolve((request.result ?? []) as T[]);
    request.onerror = () => reject(request.error ?? new Error(`Unable to read ${storeName}.`));
  });
}

export function setActiveOfflineUser(userId: string | null): void {
  activeUserId = userId;
  if (!userId || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(LAST_USER_KEY, userId);
  } catch {
    /* Identity fallback is optional when browser storage is restricted. */
  }
}

export function getActiveOfflineUserId(): string | null {
  return activeUserId;
}

export function getLastOfflineUserId(): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(LAST_USER_KEY);
  } catch {
    return null;
  }
}

function requireUser(): string {
  const userId = activeUserId;
  if (!userId) throw new Error("Offline saves require a verified or previously verified account.");
  return userId;
}

export async function cacheJsonResponse(url: string, payload: unknown): Promise<void> {
  const userId = requireUser();
  const row: OfflineCachedResponse = {
    key: responseKey(userId, url),
    userId,
    url,
    payload,
    savedAt: Date.now(),
  };
  memoryResponses.set(row.key, row);
  await put("responses", row);
}

export async function readCachedJson<T>(url: string): Promise<T | undefined> {
  const userId = activeUserId;
  if (!userId) return undefined;
  const key = responseKey(userId, url);
  const memory = memoryResponses.get(key);
  if (memory) return memory.payload as T;
  const row = await get<OfflineCachedResponse>("responses", key);
  if (row) memoryResponses.set(key, row);
  return row?.payload as T | undefined;
}

export async function updateCachedJson<T>(
  url: string,
  updater: (current: T | undefined) => T,
): Promise<T> {
  const next = updater(await readCachedJson<T>(url));
  await cacheJsonResponse(url, next);
  return next;
}

export async function removeCachedJson(url: string): Promise<void> {
  const userId = activeUserId;
  if (!userId) return;
  const key = responseKey(userId, url);
  memoryResponses.delete(key);
  await remove("responses", key);
}

export async function setResourceVersion(resource: OfflineResourceRef, version: number): Promise<void> {
  const userId = requireUser();
  const row: OfflineResourceVersion = {
    key: versionKey(userId, resource),
    userId,
    kind: resource.kind,
    id: resource.id,
    version,
    savedAt: Date.now(),
  };
  memoryVersions.set(row.key, row);
  await put("versions", row);
}

export async function getResourceVersion(resource: OfflineResourceRef): Promise<number | null> {
  const userId = activeUserId;
  if (!userId) return null;
  const key = versionKey(userId, resource);
  const memory = memoryVersions.get(key);
  if (memory) return memory.version;
  const row = await get<OfflineResourceVersion>("versions", key);
  if (row) memoryVersions.set(key, row);
  return row?.version ?? null;
}

export async function replaceResourceVersions(
  versions: Array<{ kind: OfflineResourceRef["kind"]; id: string; version: number }>,
): Promise<void> {
  for (const version of versions) {
    await setResourceVersion({ kind: version.kind, id: version.id }, version.version);
  }
}

export async function queueOfflineMutation(
  input: Omit<OfflineMutation, "userId" | "createdAt" | "updatedAt" | "attempts" | "state" | "lastError">,
): Promise<OfflineMutation> {
  const userId = requireUser();
  const now = Date.now();
  const row: OfflineMutation = {
    ...input,
    userId,
    createdAt: now,
    updatedAt: now,
    attempts: 0,
    state: "pending",
    lastError: null,
  };
  memoryMutations.set(row.id, row);
  await put("mutations", row);
  return row;
}

export async function listOfflineMutations(): Promise<OfflineMutation[]> {
  const userId = activeUserId;
  if (!userId) return [];
  const persisted = await getAll<OfflineMutation>("mutations");
  for (const row of persisted) memoryMutations.set(row.id, row);
  return [...memoryMutations.values()]
    .filter((row) => row.userId === userId)
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

export async function updateOfflineMutation(
  id: string,
  patch: Partial<
    Pick<OfflineMutation, "attempts" | "state" | "forceLocal" | "lastError" | "baseVersion">
  >,
): Promise<OfflineMutation | null> {
  const existing = memoryMutations.get(id) ?? (await get<OfflineMutation>("mutations", id));
  if (!existing || existing.userId !== activeUserId) return null;
  const next: OfflineMutation = { ...existing, ...patch, updatedAt: Date.now() };
  memoryMutations.set(id, next);
  await put("mutations", next);
  return next;
}

export async function deleteOfflineMutation(id: string): Promise<void> {
  memoryMutations.delete(id);
  await remove("mutations", id);
}

export async function deleteMutationsForResource(resource: OfflineResourceRef): Promise<void> {
  const rows = await listOfflineMutations();
  await Promise.all(
    rows
      .filter((row) => row.resource?.kind === resource.kind && row.resource.id === resource.id)
      .map((row) => deleteOfflineMutation(row.id)),
  );
}

export async function setLastSyncedAt(value: number): Promise<void> {
  memoryMeta.set(LAST_SYNC_KEY, value);
  await put("meta", { key: LAST_SYNC_KEY, value });
}

export async function getLastSyncedAt(): Promise<number | null> {
  const memory = memoryMeta.get(LAST_SYNC_KEY);
  if (typeof memory === "number") return memory;
  const row = await get<{ key: string; value: unknown }>("meta", LAST_SYNC_KEY);
  if (typeof row?.value === "number") {
    memoryMeta.set(LAST_SYNC_KEY, row.value);
    return row.value;
  }
  return null;
}

export async function getOfflineSyncSummary(
  online: boolean,
  syncing: boolean,
  offlineUserId: string | null,
): Promise<OfflineSyncSummary> {
  const rows = await listOfflineMutations();
  return {
    online,
    syncing,
    pending: rows.filter((row) => row.state === "pending").length,
    conflicts: rows.filter((row) => row.state === "conflict").length,
    errors: rows.filter((row) => row.state === "error").length,
    lastSyncedAt: await getLastSyncedAt(),
    offlineUserId,
  };
}
