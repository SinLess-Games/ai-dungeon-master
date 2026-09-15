import type { OfflineResourceKind, OfflineResourceRef } from "./types";

const PREFIX = "endless-codex:offline-alias:";
const memory = new Map<string, string>();

function key(userId: string, kind: OfflineResourceKind, id: string): string {
  return `${userId}:${kind}:${id}`;
}

function storageKey(userId: string, kind: OfflineResourceKind, id: string): string {
  return `${PREFIX}${key(userId, kind, id)}`;
}

export function setOfflineResourceAlias(
  userId: string,
  resource: OfflineResourceRef,
  cloudId: string,
): void {
  if (resource.id === cloudId) return;
  const aliasKey = key(userId, resource.kind, resource.id);
  memory.set(aliasKey, cloudId);
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(storageKey(userId, resource.kind, resource.id), cloudId);
  } catch {
    /* Alias remains valid for this runtime when persistent storage is restricted. */
  }
}

export function resolveOfflineResourceId(
  userId: string | null,
  kind: OfflineResourceKind,
  id: string,
): string {
  if (!userId) return id;
  const aliasKey = key(userId, kind, id);
  const memoryValue = memory.get(aliasKey);
  if (memoryValue) return memoryValue;
  if (typeof localStorage === "undefined") return id;
  try {
    const value = localStorage.getItem(storageKey(userId, kind, id));
    if (value) {
      memory.set(aliasKey, value);
      return value;
    }
  } catch {
    /* Use the original id. */
  }
  return id;
}

export function resolveOfflineResource(
  userId: string | null,
  resource: OfflineResourceRef | null,
): OfflineResourceRef | null {
  if (!resource) return null;
  return {
    kind: resource.kind,
    id: resolveOfflineResourceId(userId, resource.kind, resource.id),
  };
}

/** Resolve temporary campaign/character/map ids embedded in API paths. */
export function resolveOfflinePathAliases(userId: string | null, path: string): string {
  if (!userId) return path;
  const replacements: Array<[RegExp, OfflineResourceKind]> = [
    [/\/api\/campaigns\/([^/?]+)/g, "campaign"],
    [/\/api\/characters\/([^/?]+)/g, "character"],
    [/\/api\/worlds\/([^/?]+)/g, "world"],
    [/\/api\/maps\/([^/?]+)/g, "map"],
  ];
  let resolved = path;
  for (const [pattern, kind] of replacements) {
    resolved = resolved.replace(pattern, (match, encodedId: string) => {
      const decoded = decodeURIComponent(encodedId);
      const next = resolveOfflineResourceId(userId, kind, decoded);
      return match.replace(encodedId, encodeURIComponent(next));
    });
  }
  return resolved;
}
