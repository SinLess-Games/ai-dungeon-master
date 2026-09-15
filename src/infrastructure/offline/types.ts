export type OfflineResourceKind = "campaign" | "character" | "world" | "map";

export interface OfflineResourceRef {
  kind: OfflineResourceKind;
  id: string;
}

export type OfflineMutationState = "pending" | "conflict" | "error";

export interface OfflineMutation {
  id: string;
  userId: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  body: string | null;
  createdAt: number;
  updatedAt: number;
  attempts: number;
  state: OfflineMutationState;
  resource: OfflineResourceRef | null;
  baseVersion: number | null;
  forceLocal: boolean;
  lastError: string | null;
}

export interface OfflineCachedResponse {
  key: string;
  userId: string;
  url: string;
  payload: unknown;
  savedAt: number;
}

export interface OfflineResourceVersion {
  key: string;
  userId: string;
  kind: OfflineResourceKind;
  id: string;
  version: number;
  savedAt: number;
}

export interface OfflineSyncSummary {
  online: boolean;
  syncing: boolean;
  pending: number;
  conflicts: number;
  errors: number;
  lastSyncedAt: number | null;
  offlineUserId: string | null;
}

export interface SyncBootstrapResponse {
  schemaVersion: number;
  serverTime: number;
  userId: string;
  versions: Array<{ kind: OfflineResourceKind; id: string; version: number }>;
  resources: {
    campaigns: unknown[];
    characters: unknown[];
    worlds: unknown[];
    maps: unknown[];
  };
}
