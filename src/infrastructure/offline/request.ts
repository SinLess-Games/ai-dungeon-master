import { resolveOfflinePathAliases, resolveOfflineResource } from "./aliases";
import {
  cacheJsonResponse,
  getActiveOfflineUserId,
  getResourceVersion,
  queueOfflineMutation,
  readCachedJson,
  setResourceVersion,
} from "./store";
import type { OfflineResourceRef } from "./types";

interface ErrorEnvelope {
  error?: string | { code?: string; message?: string };
  message?: string;
}

export class OfflineUnavailableError extends Error {
  constructor(message = "This action needs a connection and cannot be queued offline.") {
    super(message);
    this.name = "OfflineUnavailableError";
  }
}

export class OfflineHttpError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(status: number, message: string, code: string | null = null) {
    super(message);
    this.name = "OfflineHttpError";
    this.status = status;
    this.code = code;
  }
}

export interface OfflineRequestOptions<T> {
  /** Queue JSON writes after a network failure or while navigator reports offline. */
  queueWhenOffline?: boolean;
  /** Explicit resource identity for optimistic conflict detection. */
  resource?: OfflineResourceRef | null;
  /** Value returned immediately when the write is queued. */
  optimistic?: T | (() => T | Promise<T>);
  /** Apply local list/detail cache updates after the mutation has been queued. */
  onQueued?: (value: T) => void | Promise<void>;
  /** Disable GET caching for endpoints that should never be persisted locally. */
  cacheGet?: boolean;
  onlineOnlyMessage?: string;
}

function pathFor(input: RequestInfo | URL): string {
  if (input instanceof URL) return `${input.pathname}${input.search}`;
  if (typeof input === "string") {
    try {
      const url = new URL(
        input,
        typeof location === "undefined" ? "https://offline.invalid" : location.origin,
      );
      return `${url.pathname}${url.search}`;
    } catch {
      return input;
    }
  }
  try {
    const url = new URL(input.url);
    return `${url.pathname}${url.search}`;
  } catch {
    return input.url;
  }
}

function parseJsonBody(body: BodyInit | null | undefined): Record<string, unknown> | null {
  if (typeof body !== "string") return null;
  try {
    const parsed = JSON.parse(body) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function inferResource(
  path: string,
  method: string,
  body: BodyInit | null | undefined,
): OfflineResourceRef | null {
  const pathname = path.split("?", 1)[0] ?? path;
  const parsed = parseJsonBody(body);

  if (
    method === "POST" &&
    pathname === "/api/campaigns" &&
    typeof parsed?.["id"] === "string"
  ) {
    return { kind: "campaign", id: parsed["id"] };
  }

  const characterCreate = pathname.match(/^\/api\/campaigns\/[^/]+\/characters$/);
  if (method === "POST" && characterCreate && typeof parsed?.["id"] === "string") {
    return { kind: "character", id: parsed["id"] };
  }

  const character = pathname.match(/^\/api\/characters\/([^/]+)/);
  if (character?.[1]) return { kind: "character", id: decodeURIComponent(character[1]) };

  const map = pathname.match(/^\/api\/maps\/([^/]+)/);
  if (map?.[1]) return { kind: "map", id: decodeURIComponent(map[1]) };

  const mapCreate = pathname.match(/^\/api\/worlds\/([^/]+)\/maps$/);
  if (method === "POST" && mapCreate && typeof parsed?.["id"] === "string") {
    return { kind: "map", id: parsed["id"] };
  }

  const campaign = pathname.match(/^\/api\/campaigns\/([^/]+)/);
  if (campaign?.[1]) return { kind: "campaign", id: decodeURIComponent(campaign[1]) };

  const world = pathname.match(/^\/api\/worlds\/([^/]+)/);
  if (world?.[1]) return { kind: "world", id: decodeURIComponent(world[1]) };

  return null;
}

function defaultOfflineQueuePolicy(path: string, method: string): boolean {
  const pathname = path.split("?", 1)[0] ?? path;
  if (method === "POST" && pathname === "/api/campaigns") return true;
  if (method === "PATCH" && /^\/api\/campaigns\/[^/]+$/.test(pathname)) return true;
  if (method === "DELETE" && /^\/api\/campaigns\/[^/]+$/.test(pathname)) return true;
  if (method === "POST" && /^\/api\/campaigns\/[^/]+\/characters$/.test(pathname)) return true;
  if (method === "PATCH" && /^\/api\/characters\/[^/]+$/.test(pathname)) return true;
  if (method === "DELETE" && /^\/api\/characters\/[^/]+$/.test(pathname)) return true;
  if (method === "PUT" && /^\/api\/characters\/[^/]+\/.+/.test(pathname)) return true;
  if (method === "POST" && /^\/api\/characters\/[^/]+\/class-levels$/.test(pathname)) return true;
  return false;
}

function withTemporaryCreateId(
  path: string,
  method: string,
  body: BodyInit | null | undefined,
): { body: BodyInit | null | undefined; resource: OfflineResourceRef | null; tempId: string | null } {
  const pathname = path.split("?", 1)[0] ?? path;
  const parsed = parseJsonBody(body);
  if (method !== "POST" || !parsed) return { body, resource: null, tempId: null };

  if (pathname === "/api/campaigns") {
    const tempId = typeof parsed["id"] === "string" ? parsed["id"] : crypto.randomUUID();
    return {
      body: JSON.stringify({ ...parsed, id: tempId }),
      resource: { kind: "campaign", id: tempId },
      tempId,
    };
  }
  if (/^\/api\/campaigns\/[^/]+\/characters$/.test(pathname)) {
    const tempId = typeof parsed["id"] === "string" ? parsed["id"] : crypto.randomUUID();
    return {
      body: JSON.stringify({ ...parsed, id: tempId }),
      resource: { kind: "character", id: tempId },
      tempId,
    };
  }
  return { body, resource: null, tempId: null };
}

function automaticOptimisticValue<T>(
  path: string,
  method: string,
  body: BodyInit | null | undefined,
  tempId: string | null,
): T | undefined {
  if (!tempId || method !== "POST") return undefined;
  const pathname = path.split("?", 1)[0] ?? path;
  const parsed = parseJsonBody(body) ?? {};
  if (pathname === "/api/campaigns") {
    return {
      id: tempId,
      name: typeof parsed["name"] === "string" ? parsed["name"] : "Offline campaign",
      status: "draft",
      rulesetId: "dnd35",
      rulesetVersion: "3.5",
    } as T;
  }
  if (/^\/api\/campaigns\/[^/]+\/characters$/.test(pathname)) {
    return { id: tempId } as T;
  }
  return undefined;
}

async function errorFromResponse(response: Response): Promise<OfflineHttpError> {
  let message = `Request failed (${response.status}).`;
  let code: string | null = null;
  try {
    const body = (await response.clone().json()) as ErrorEnvelope;
    if (typeof body.error === "string") message = body.error;
    else if (body.error?.message) message = body.error.message;
    else if (body.message) message = body.message;
    if (typeof body.error === "object" && body.error?.code) code = body.error.code;
  } catch {
    /* Keep the HTTP fallback. */
  }
  return new OfflineHttpError(response.status, message, code);
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw await errorFromResponse(response);
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

function networkAvailable(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

async function optimisticValue<T>(
  options: OfflineRequestOptions<T>,
  automatic: T | undefined,
): Promise<T> {
  if (typeof options.optimistic === "function") {
    return (await (options.optimistic as () => T | Promise<T>)()) as T;
  }
  if (options.optimistic !== undefined) return options.optimistic;
  return automatic as T;
}

function replayableBody(body: BodyInit | null | undefined): string | null {
  if (body === undefined || body === null) return null;
  if (typeof body !== "string") {
    throw new OfflineUnavailableError("Only JSON save operations can be queued while offline.");
  }
  return body;
}

function requestInputWithResolvedPath(
  input: RequestInfo | URL,
  resolvedPath: string,
): RequestInfo | URL {
  return typeof input === "string" ? resolvedPath : input;
}

export async function offlineRequestJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: OfflineRequestOptions<T> = {},
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const requestedPath = pathFor(input);
  const userId = getActiveOfflineUserId();
  const resolvedPath = resolveOfflinePathAliases(userId, requestedPath);
  const resolvedInput = requestInputWithResolvedPath(input, resolvedPath);
  const cacheGet = options.cacheGet !== false;

  if (method === "GET") {
    if (networkAvailable()) {
      try {
        const response = await fetch(resolvedInput, {
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", ...init.headers },
          ...init,
        });
        const value = await parseResponse<T>(response);
        if (cacheGet && userId) {
          await cacheJsonResponse(requestedPath, value);
          if (resolvedPath !== requestedPath) await cacheJsonResponse(resolvedPath, value);
        }
        return value;
      } catch (error) {
        if (error instanceof OfflineHttpError) throw error;
      }
    }

    if (userId) {
      const cached = await readCachedJson<T>(requestedPath);
      if (cached !== undefined) return cached;
      if (resolvedPath !== requestedPath) {
        const resolvedCached = await readCachedJson<T>(resolvedPath);
        if (resolvedCached !== undefined) return resolvedCached;
      }
    }
    throw new OfflineUnavailableError("This data has not been saved on this device yet.");
  }

  const queueWhenOffline = options.queueWhenOffline ?? defaultOfflineQueuePolicy(requestedPath, method);
  const prepared = withTemporaryCreateId(requestedPath, method, init.body);
  const inferred = options.resource === undefined
    ? prepared.resource ?? inferResource(requestedPath, method, prepared.body)
    : options.resource;
  const resource = resolveOfflineResource(userId, inferred);
  const mutationId = crypto.randomUUID();
  const baseVersion = resource ? await getResourceVersion(resource) : null;
  const syncHeaders: Record<string, string> = {
    "X-Endless-Codex-Mutation-Id": mutationId,
    ...(resource
      ? {
          "X-Endless-Codex-Resource-Kind": resource.kind,
          "X-Endless-Codex-Resource-Id": resource.id,
        }
      : {}),
  };

  if (networkAvailable()) {
    try {
      const response = await fetch(resolvedInput, {
        credentials: "same-origin",
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...init.headers,
          ...syncHeaders,
        },
      });
      const value = await parseResponse<T>(response);
      const version = Number(response.headers.get("X-Endless-Codex-Resource-Version"));
      if (resource && Number.isSafeInteger(version) && version >= 0) {
        await setResourceVersion(resource, version);
      }
      return value;
    } catch (error) {
      if (error instanceof OfflineHttpError) throw error;
      if (!queueWhenOffline) {
        throw error instanceof Error ? error : new OfflineUnavailableError(options.onlineOnlyMessage);
      }
    }
  }

  if (!queueWhenOffline) {
    throw new OfflineUnavailableError(options.onlineOnlyMessage);
  }
  if (!userId) {
    throw new OfflineUnavailableError("Sign in once on this device before using offline saves.");
  }

  await queueOfflineMutation({
    id: mutationId,
    method: method as "POST" | "PUT" | "PATCH" | "DELETE",
    url: requestedPath,
    body: replayableBody(prepared.body),
    resource: inferred,
    baseVersion,
    forceLocal: false,
  });
  const automatic = automaticOptimisticValue<T>(
    requestedPath,
    method,
    prepared.body,
    prepared.tempId,
  );
  const value = await optimisticValue(options, automatic);
  await options.onQueued?.(value);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("endless-codex:offline-sync-changed"));
  }
  return value;
}
