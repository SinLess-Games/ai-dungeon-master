/// <reference types="@cloudflare/workers-types" />

import type { CampaignRoom } from "@/modules/game/live/CampaignRoom";

export interface GameEventPostprocessJob {
  type: "game.event.postprocess";
  campaignId: string;
  sessionId: string;
  eventId: string;
  enqueuedAt: string;
}

export type BackgroundJob = GameEventPostprocessJob;

export interface BackgroundJobBindings {
  DB?: D1Database;
  RUNTIME_CACHE?: KVNamespace;
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

  const event = await env.DB
    .prepare(
      `SELECT id, campaign_id, session_id, sequence, event_type, occurred_at,
              actor_id, source_id, target_ids
       FROM game_events
       WHERE id = ? AND campaign_id = ? AND session_id = ?`,
    )
    .bind(job.eventId, job.campaignId, job.sessionId)
    .first<EventRow>();
  if (!event) {
    // The command transaction should commit the event before enqueueing. A
    // missing event is treated as retryable rather than caching a false state.
    throw new Error(`Game event ${job.eventId} is not yet available.`);
  }

  const cursor = {
    eventId: event.id,
    campaignId: event.campaign_id,
    sessionId: event.session_id,
    sequence: event.sequence,
    eventType: event.event_type,
    occurredAt: new Date(event.occurred_at * 1000).toISOString(),
  };

  if (env.RUNTIME_CACHE) {
    await env.RUNTIME_CACHE.put(
      `campaign:${event.campaign_id}:event-cursor`,
      JSON.stringify(cursor),
      { expirationTtl: 86_400 },
    );
  }

  if (env.CAMPAIGN_ROOM) {
    await env.CAMPAIGN_ROOM.getByName(event.campaign_id).publish({
      type: "game.event",
      campaignId: event.campaign_id,
      occurredAt: cursor.occurredAt,
      payload: {
        eventId: event.id,
        sessionId: event.session_id,
        sequence: event.sequence,
        eventType: event.event_type,
        actorId: event.actor_id,
        sourceId: event.source_id,
        targetIds: parseStringArray(event.target_ids),
      },
    });
  }
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
        }
        message.ack();
      } catch (error) {
        console.error("Background job failed", {
          jobType: message.body.type,
          messageId: message.id,
          error,
        });
        message.retry();
      }
    }),
  );
}
