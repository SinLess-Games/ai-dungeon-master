/// <reference types="@cloudflare/workers-types" />

import type { CampaignRoom } from "@/modules/game/live/CampaignRoom";
import {
  processWorldAtlasJob,
  type WorldAtlasJob,
  type WorldAtlasJobBindings,
} from "@/modules/worlds/server/worldAtlasJobs";

export interface GameEventPostprocessJob {
  type: "game.event.postprocess";
  campaignId: string;
  sessionId: string;
  eventId: string;
  enqueuedAt: string;
}

export type BackgroundJob = GameEventPostprocessJob | WorldAtlasJob;

export interface BackgroundJobBindings extends WorldAtlasJobBindings {
  CAMPAIGN_ROOM?: DurableObjectNamespace<CampaignRoom>;
}

interface EventRow {
  id: string;
  campaign_id: string;
  session_id: string;
  sequence: number;
  event_type: string;
  occurred_at: number;
  actor_id: string | null;
  source_id: string | null;
  target_ids: string;
}

export interface GameEventEnvelope {
  eventId: string;
  campaignId: string;
  sessionId: string;
  sequence: number;
  eventType: string;
  occurredAt: string;
  actorId: string | null;
  sourceId: string | null;
  targetIds: string[];
}

function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string")
      ? parsed
      : [];
  } catch {
    return [];
  }
}

async function loadCommittedGameEvent(
  database: D1Database,
  input: { campaignId: string; sessionId: string; eventId: string },
): Promise<GameEventEnvelope> {
  const event = await database
    .prepare(
      `SELECT id, campaign_id, session_id, sequence, event_type, occurred_at,
              actor_id, source_id, target_ids
       FROM game_events
       WHERE id = ? AND campaign_id = ? AND session_id = ?`,
    )
    .bind(input.eventId, input.campaignId, input.sessionId)
    .first<EventRow>();
  if (!event) {
    throw new Error(`Game event ${input.eventId} is not yet available.`);
  }

  return {
    eventId: event.id,
    campaignId: event.campaign_id,
    sessionId: event.session_id,
    sequence: event.sequence,
    eventType: event.event_type,
    occurredAt: new Date(event.occurred_at * 1000).toISOString(),
    actorId: event.actor_id,
    sourceId: event.source_id,
    targetIds: parseStringArray(event.target_ids),
  };
}

async function broadcastGameEvent(
  room: DurableObjectNamespace<CampaignRoom> | undefined,
  event: GameEventEnvelope,
): Promise<void> {
  if (!room) return;
  await room.getByName(event.campaignId).publish({
    type: "game.event",
    campaignId: event.campaignId,
    occurredAt: event.occurredAt,
    payload: {
      eventId: event.eventId,
      sessionId: event.sessionId,
      sequence: event.sequence,
      eventType: event.eventType,
      actorId: event.actorId,
      sourceId: event.sourceId,
      targetIds: event.targetIds,
    },
  });
}

/**
 * Publish a freshly committed D1 event without waiting for Queue delivery.
 *
 * This is best-effort live fan-out only. D1 remains authoritative and the
 * queued post-processing path publishes the same event again, so clients must
 * deduplicate by eventId/sequence. The queued copy provides eventual live
 * delivery if the immediate Durable Object call fails.
 */
export async function publishCommittedGameEvent(
  env: Pick<BackgroundJobBindings, "DB" | "CAMPAIGN_ROOM">,
  input: { campaignId: string; sessionId: string; eventId: string },
): Promise<void> {
  if (!env.DB || !env.CAMPAIGN_ROOM) return;
  const event = await loadCommittedGameEvent(env.DB, input);
  await broadcastGameEvent(env.CAMPAIGN_ROOM, event);
}

export async function enqueueGameEventPostprocess(
  queue: Queue<BackgroundJob> | undefined,
  input: Omit<GameEventPostprocessJob, "type" | "enqueuedAt">,
): Promise<void> {
  if (!queue) return;
  await queue.send({
    type: "game.event.postprocess",
    ...input,
    enqueuedAt: new Date().toISOString(),
  });
}

async function processGameEventPostprocess(
  env: BackgroundJobBindings,
  job: GameEventPostprocessJob,
): Promise<void> {
  if (!env.DB) throw new Error("Background event processing requires the D1 binding.");

  const event = await loadCommittedGameEvent(env.DB, job);

  if (env.RUNTIME_CACHE) {
    await env.RUNTIME_CACHE.put(
      `campaign:${event.campaignId}:event-cursor`,
      JSON.stringify({
        eventId: event.eventId,
        campaignId: event.campaignId,
        sessionId: event.sessionId,
        sequence: event.sequence,
        eventType: event.eventType,
        occurredAt: event.occurredAt,
      }),
      { expirationTtl: 86_400 },
    );
  }

  await broadcastGameEvent(env.CAMPAIGN_ROOM, event);
}

export async function processBackgroundJobBatch(
  batch: MessageBatch<BackgroundJob>,
  env: BackgroundJobBindings,
): Promise<void> {
  await Promise.all(
    batch.messages.map(async (message) => {
      try {
        switch (message.body.type) {
          case "game.event.postprocess":
            await processGameEventPostprocess(env, message.body);
            break;
          case "world.atlas.render":
          case "world.atlas.detail-render":
          case "world.atlas.vectorize":
            await processWorldAtlasJob(env, message.body);
            break;
        }
        message.ack();
      } catch (error) {
        console.error("Background queue job failed", { type: message.body.type, error });
        message.retry();
      }
    }),
  );
}
