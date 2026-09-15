/// <reference types="@cloudflare/workers-types" />

import { createMiddleware } from "hono/factory";
import type { AuthEnv } from "@/modules/auth/server/auth";
import { createAuth } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";

type ResourceKind = "campaign" | "character" | "world" | "map";

interface Bindings extends AuthEnv {
  DB?: D1Database;
}

type Env = { Bindings: Bindings };

interface ReceiptRow {
  userId: string;
  responseStatus: number;
  responseHeaders: string;
  responseBody: string | null;
}

interface ResourceRef {
  kind: ResourceKind;
  id: string;
}

const replayMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const mutationIdPattern = /^[A-Za-z0-9._:-]{8,160}$/;
const resourceIdPattern = /^[A-Za-z0-9._:-]{1,240}$/;
const reservationStatus = 0;

function parseResourceRef(headers: Headers): ResourceRef | null {
  const kind = headers.get("X-Endless-Codex-Resource-Kind");
  const id = headers.get("X-Endless-Codex-Resource-Id");
  if (!kind || !id) return null;
  if (!["campaign", "character", "world", "map"].includes(kind)) return null;
  if (!resourceIdPattern.test(id)) return null;
  return { kind: kind as ResourceKind, id };
}

function parseBaseVersion(headers: Headers): number | null {
  const value = headers.get("X-Endless-Codex-Base-Version");
  if (!value) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function parseStoredHeaders(value: string): HeadersInit {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const result: Record<string, string> = {};
    for (const [key, headerValue] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof headerValue === "string") result[key] = headerValue;
    }
    return result;
  } catch {
    return {};
  }
}

async function syncSchemaReady(db: D1Database): Promise<boolean> {
  try {
    const row = await db
      .prepare(
        `SELECT count(*) AS count
         FROM sqlite_master
         WHERE type = 'table'
           AND name IN ('offline_sync_mutations', 'world_maps')`,
      )
      .first<{ count: number }>();
    return Number(row?.count ?? 0) === 2;
  } catch {
    return false;
  }
}

async function loadReceipt(db: D1Database, mutationId: string): Promise<ReceiptRow | null> {
  return db
    .prepare(
      `SELECT user_id AS userId,
              response_status AS responseStatus,
              response_headers AS responseHeaders,
              response_body AS responseBody
       FROM offline_sync_mutations
       WHERE id = ?
       LIMIT 1`,
    )
    .bind(mutationId)
    .first<ReceiptRow>();
}

function completedReceiptResponse(receipt: ReceiptRow): Response {
  return new Response(receipt.responseBody, {
    status: receipt.responseStatus,
    headers: parseStoredHeaders(receipt.responseHeaders),
  });
}

function mutationInProgressResponse(): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: "OFFLINE_SYNC_MUTATION_IN_PROGRESS",
        message: "This save is already being synchronized by another request.",
      },
    }),
    {
      status: 425,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "1",
      },
    },
  );
}

async function reserveMutation(
  db: D1Database,
  input: { id: string; userId: string; method: string; path: string },
): Promise<boolean> {
  const row = await db
    .prepare(
      `INSERT OR IGNORE INTO offline_sync_mutations
         (id, user_id, request_method, request_path, response_status, response_headers, response_body)
       VALUES (?, ?, ?, ?, ?, '{}', NULL)
       RETURNING id`,
    )
    .bind(input.id, input.userId, input.method, input.path, reservationStatus)
    .first<{ id: string }>();
  return Boolean(row?.id);
}

async function releaseReservation(
  db: D1Database,
  mutationId: string,
  userId: string,
): Promise<void> {
  await db
    .prepare(
      "DELETE FROM offline_sync_mutations WHERE id = ? AND user_id = ? AND response_status = ?",
    )
    .bind(mutationId, userId, reservationStatus)
    .run();
}

async function loadResourceVersion(
  db: D1Database,
  userId: string,
  resource: ResourceRef,
): Promise<number | null> {
  if (resource.kind === "campaign") {
    const row = await db
      .prepare(
        "SELECT updated_at AS version FROM campaigns WHERE id = ? AND owner_user_id = ? LIMIT 1",
      )
      .bind(resource.id, userId)
      .first<{ version: number }>();
    return row?.version ?? null;
  }
  if (resource.kind === "character") {
    const row = await db
      .prepare(
        "SELECT updated_at AS version FROM characters WHERE id = ? AND owner_user_id = ? LIMIT 1",
      )
      .bind(resource.id, userId)
      .first<{ version: number }>();
    return row?.version ?? null;
  }
  if (resource.kind === "world") {
    const row = await db
      .prepare(
        `SELECT w.updated_at AS version
         FROM worlds w
         JOIN campaigns c ON c.world_id = w.id
         WHERE w.id = ? AND c.owner_user_id = ?
         LIMIT 1`,
      )
      .bind(resource.id, userId)
      .first<{ version: number }>();
    return row?.version ?? null;
  }
  const row = await db
    .prepare(
      "SELECT revision AS version FROM world_maps WHERE id = ? AND owner_user_id = ? LIMIT 1",
    )
    .bind(resource.id, userId)
    .first<{ version: number }>();
  return row?.version ?? null;
}

async function bumpMutableResourceVersion(
  db: D1Database,
  userId: string,
  resource: ResourceRef,
): Promise<number | null> {
  if (resource.kind === "campaign") {
    await db
      .prepare(
        `UPDATE campaigns
         SET updated_at = CASE WHEN updated_at >= unixepoch() THEN updated_at + 1 ELSE unixepoch() END
         WHERE id = ? AND owner_user_id = ?`,
      )
      .bind(resource.id, userId)
      .run();
  } else if (resource.kind === "character") {
    await db
      .prepare(
        `UPDATE characters
         SET updated_at = CASE WHEN updated_at >= unixepoch() THEN updated_at + 1 ELSE unixepoch() END
         WHERE id = ? AND owner_user_id = ?`,
      )
      .bind(resource.id, userId)
      .run();
  } else if (resource.kind === "world") {
    await db
      .prepare(
        `UPDATE worlds
         SET updated_at = CASE WHEN updated_at >= unixepoch() THEN updated_at + 1 ELSE unixepoch() END
         WHERE id = ? AND EXISTS (
           SELECT 1 FROM campaigns c WHERE c.world_id = worlds.id AND c.owner_user_id = ?
         )`,
      )
      .bind(resource.id, userId)
      .run();
  }
  return loadResourceVersion(db, userId, resource);
}

function responseHeaderSnapshot(response: Response): Record<string, string> {
  const result: Record<string, string> = {};
  const contentType = response.headers.get("Content-Type");
  if (contentType) result["Content-Type"] = contentType;
  const resourceVersion = response.headers.get("X-Endless-Codex-Resource-Version");
  if (resourceVersion) result["X-Endless-Codex-Resource-Version"] = resourceVersion;
  return result;
}

/**
 * Wraps queued write replays with server-side idempotency and optimistic
 * concurrency. Normal application requests without the sync headers pass
 * through unchanged. Until migration 0026 exists remotely, sync-aware online
 * requests also pass through unchanged so deploying the code cannot break the
 * existing application before the D1 migration is applied.
 */
export const offlineMutationMiddleware = createMiddleware<Env>(async (c, next) => {
  const method = c.req.method.toUpperCase();
  if (!replayMethods.has(method) || c.req.path.startsWith("/api/auth/")) {
    await next();
    return;
  }

  const mutationId = c.req.header("X-Endless-Codex-Mutation-Id");
  if (!mutationId) {
    await next();
    return;
  }
  if (!mutationIdPattern.test(mutationId)) {
    return c.json(
      {
        error: {
          code: "OFFLINE_SYNC_MUTATION_ID_INVALID",
          message: "Invalid offline mutation id.",
        },
      },
      400,
    );
  }
  if (!c.env.DB) {
    await next();
    return;
  }

  const db = c.env.DB;
  if (!(await syncSchemaReady(db))) {
    await next();
    return;
  }

  const session = await requireUser(createAuth(c.env), c.req.raw.headers);
  const existingReceipt = await loadReceipt(db, mutationId);
  if (existingReceipt) {
    if (existingReceipt.userId !== session.user.id) {
      return c.json(
        {
          error: {
            code: "OFFLINE_SYNC_MUTATION_ID_REUSED",
            message: "This offline mutation id has already been used.",
          },
        },
        409,
      );
    }
    if (existingReceipt.responseStatus === reservationStatus) {
      return mutationInProgressResponse();
    }
    return completedReceiptResponse(existingReceipt);
  }

  const resource = parseResourceRef(c.req.raw.headers);
  const baseVersion = parseBaseVersion(c.req.raw.headers);
  const forceLocal = c.req.header("X-Endless-Codex-Conflict-Policy") === "local-wins";
  if (resource && baseVersion !== null && !forceLocal) {
    const currentVersion = await loadResourceVersion(db, session.user.id, resource);
    if (currentVersion !== null && currentVersion !== baseVersion) {
      return c.json(
        {
          error: {
            code: "OFFLINE_SYNC_CONFLICT",
            message: "This save changed in the cloud while this device was offline.",
          },
          resource,
          baseVersion,
          currentVersion,
        },
        409,
      );
    }
  }

  const ownsReservation = await reserveMutation(db, {
    id: mutationId,
    userId: session.user.id,
    method,
    path: c.req.path,
  });
  if (!ownsReservation) {
    const receipt = await loadReceipt(db, mutationId);
    if (!receipt || receipt.responseStatus === reservationStatus) {
      return mutationInProgressResponse();
    }
    if (receipt.userId !== session.user.id) {
      return c.json(
        {
          error: {
            code: "OFFLINE_SYNC_MUTATION_ID_REUSED",
            message: "This offline mutation id has already been used.",
          },
        },
        409,
      );
    }
    return completedReceiptResponse(receipt);
  }

  let handlerSucceeded = false;
  try {
    await next();
    handlerSucceeded = c.res.status >= 200 && c.res.status < 400;
    if (!handlerSucceeded) return;

    if (resource && method !== "DELETE") {
      const version = await bumpMutableResourceVersion(db, session.user.id, resource);
      if (version !== null) {
        c.res.headers.set("X-Endless-Codex-Resource-Version", String(version));
      }
    }

    const clone = c.res.clone();
    const responseBody = await clone.text();
    if (responseBody.length > 1_000_000) {
      console.error("Offline sync response exceeded receipt limit", {
        mutationId,
        path: c.req.path,
        responseBytes: responseBody.length,
      });
      return;
    }

    await db
      .prepare(
        `UPDATE offline_sync_mutations
         SET response_status = ?, response_headers = ?, response_body = ?
         WHERE id = ? AND user_id = ? AND response_status = ?`,
      )
      .bind(
        c.res.status,
        JSON.stringify(responseHeaderSnapshot(c.res)),
        responseBody || null,
        mutationId,
        session.user.id,
        reservationStatus,
      )
      .run();
  } finally {
    if (!handlerSucceeded) {
      await releaseReservation(db, mutationId, session.user.id);
    }
  }

  return;
});
