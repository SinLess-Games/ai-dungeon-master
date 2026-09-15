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

async function loadResourceVersion(
  db: D1Database,
  userId: string,
  resource: ResourceRef,
): Promise<number | null> {
  if (resource.kind === "campaign") {
    const row = await db
      .prepare("SELECT updated_at AS version FROM campaigns WHERE id = ? AND owner_user_id = ? LIMIT 1")
      .bind(resource.id, userId)
      .first<{ version: number }>();
    return row?.version ?? null;
  }
  if (resource.kind === "character") {
    const row = await db
      .prepare("SELECT updated_at AS version FROM characters WHERE id = ? AND owner_user_id = ? LIMIT 1")
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
    .prepare("SELECT revision AS version FROM world_maps WHERE id = ? AND owner_user_id = ? LIMIT 1")
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
 * through unchanged.
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
    return c.json({ error: { code: "OFFLINE_SYNC_MUTATION_ID_INVALID", message: "Invalid offline mutation id." } }, 400);
  }
  if (!c.env.DB) {
    return c.json({ error: { code: "OFFLINE_SYNC_UNAVAILABLE", message: "Offline sync storage is unavailable." } }, 503);
  }

  const session = await requireUser(createAuth(c.env), c.req.raw.headers);
  const db = c.env.DB;
  const receipt = await db
    .prepare(
      `SELECT response_status AS responseStatus,
              response_headers AS responseHeaders,
              response_body AS responseBody
       FROM offline_sync_mutations
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
    )
    .bind(mutationId, session.user.id)
    .first<ReceiptRow>();

  if (receipt) {
    return new Response(receipt.responseBody, {
      status: receipt.responseStatus,
      headers: parseStoredHeaders(receipt.responseHeaders),
    });
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

  await next();

  if (c.res.status < 200 || c.res.status >= 400) return;

  if (resource && method !== "DELETE") {
    const version = await bumpMutableResourceVersion(db, session.user.id, resource);
    if (version !== null) c.res.headers.set("X-Endless-Codex-Resource-Version", String(version));
  }

  const clone = c.res.clone();
  const responseBody = await clone.text();
  if (responseBody.length > 1_000_000) return;

  await db
    .prepare(
      `INSERT INTO offline_sync_mutations
         (id, user_id, request_method, request_path, response_status, response_headers, response_body)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      mutationId,
      session.user.id,
      method,
      c.req.path,
      c.res.status,
      JSON.stringify(responseHeaderSnapshot(c.res)),
      responseBody || null,
    )
    .run();
});
