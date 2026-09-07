/// <reference types="@cloudflare/workers-types" />

import type { GameEventWrite } from "./d1GameEventStore";

export interface PersistentHealthState {
  currentHitPoints: number;
  temporaryHitPoints: number;
  nonlethalDamage: number;
  stable: boolean;
}

export interface PersistentHealthMutation {
  characterId: string;
  expected: PersistentHealthState;
  next: PersistentHealthState;
}

function changes(result: D1Result<unknown> | undefined): number {
  return result?.meta?.changes ?? 0;
}

function shouldRetrySequence(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /game_events_campaign_sequence_uidx|UNIQUE constraint failed: game_events\.campaign_id, game_events\.sequence/i.test(
    message,
  );
}

function bool(value: boolean): number {
  return value ? 1 : 0;
}

function eventStatement(
  db: D1Database,
  event: GameEventWrite,
  mutation: PersistentHealthMutation,
): D1PreparedStatement {
  const timestamp = Math.floor(event.occurredAt.getTime() / 1000);
  return db
    .prepare(
      `INSERT INTO game_events (
        id, campaign_id, session_id, sequence, event_type, occurred_at,
        actor_id, source_id, target_ids, payload, deltas, created_at
      )
      SELECT ?, ?, ?,
        (SELECT COALESCE(MAX(sequence), 0) + 1 FROM game_events WHERE campaign_id = ?),
        ?, ?, ?, ?, ?, ?, ?, ?
      WHERE EXISTS (
        SELECT 1 FROM dnd35_characters
        WHERE character_id = ?
          AND current_hit_points = ?
          AND temporary_hit_points = ?
          AND nonlethal_damage = ?
          AND stable = ?
      )`,
    )
    .bind(
      event.id,
      event.campaignId,
      event.sessionId,
      event.campaignId,
      event.eventType,
      timestamp,
      event.actorId ?? null,
      event.sourceId ?? null,
      JSON.stringify(event.targetIds ?? []),
      JSON.stringify(event.payload ?? {}),
      JSON.stringify(event.deltas ?? []),
      timestamp,
      mutation.characterId,
      mutation.expected.currentHitPoints,
      mutation.expected.temporaryHitPoints,
      mutation.expected.nonlethalDamage,
      bool(mutation.expected.stable),
    );
}

function healthStatement(
  db: D1Database,
  event: GameEventWrite,
  mutation: PersistentHealthMutation,
): D1PreparedStatement {
  return db
    .prepare(
      `UPDATE dnd35_characters
       SET current_hit_points = ?, temporary_hit_points = ?, nonlethal_damage = ?,
           stable = ?, updated_at = ?
       WHERE character_id = ?
         AND current_hit_points = ?
         AND temporary_hit_points = ?
         AND nonlethal_damage = ?
         AND stable = ?`,
    )
    .bind(
      mutation.next.currentHitPoints,
      mutation.next.temporaryHitPoints,
      mutation.next.nonlethalDamage,
      bool(mutation.next.stable),
      Math.floor(event.occurredAt.getTime() / 1000),
      mutation.characterId,
      mutation.expected.currentHitPoints,
      mutation.expected.temporaryHitPoints,
      mutation.expected.nonlethalDamage,
      bool(mutation.expected.stable),
    );
}

/** Atomic event + health-state commit with optimistic concurrency. */
export class D1HealthLifecycleStore {
  constructor(private readonly binding: D1Database) {}

  async commit(event: GameEventWrite, mutation: PersistentHealthMutation): Promise<boolean> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const results = await this.binding.batch([
          eventStatement(this.binding, event, mutation),
          healthStatement(this.binding, event, mutation),
        ]);
        return results.length === 2 && results.every((result) => changes(result) === 1);
      } catch (error) {
        if (attempt === 0 && shouldRetrySequence(error)) continue;
        throw error;
      }
    }
    return false;
  }
}
