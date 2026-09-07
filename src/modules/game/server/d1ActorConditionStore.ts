/// <reference types="@cloudflare/workers-types" />

import type { RuntimeDnd35ActorConditionState } from "@/infrastructure/database/schema";
import type { GameEventWrite } from "./d1GameEventStore";

export interface ActorConditionMutation {
  id: string;
  campaignId: string;
  actorId: string;
  conditionId: string;
  sourceActorId?: string | null;
  sourceDescription?: string | null;
  durationKind: "rounds" | "until_time" | "permanent" | "concentration" | "special";
  remainingRounds?: number | null;
  encounterId?: string | null;
  expiresEncounterRound?: number | null;
  expiresTurnOrder?: number | null;
  expiresAt?: Date | null;
  state?: RuntimeDnd35ActorConditionState | null;
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

function eventStatement(
  db: D1Database,
  event: GameEventWrite,
  condition: ActorConditionMutation,
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
        SELECT 1 FROM game_actors
        WHERE id = ? AND campaign_id = ? AND status = 'active'
      )
      AND EXISTS (SELECT 1 FROM dnd35_conditions WHERE id = ?)`,
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
      condition.actorId,
      condition.campaignId,
      condition.conditionId,
    );
}

function conditionInsert(
  db: D1Database,
  event: GameEventWrite,
  condition: ActorConditionMutation,
): D1PreparedStatement {
  const timestamp = Math.floor(event.occurredAt.getTime() / 1000);
  return db
    .prepare(
      `INSERT INTO runtime_dnd35_actor_conditions (
        id, actor_id, condition_id, source_actor_id, source_description,
        duration_kind, remaining_rounds, encounter_id, expires_encounter_round,
        expires_turn_order, expires_at, state, created_at, updated_at
      )
      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      WHERE EXISTS (
        SELECT 1 FROM game_actors
        WHERE id = ? AND campaign_id = ? AND status = 'active'
      )
      AND EXISTS (SELECT 1 FROM dnd35_conditions WHERE id = ?)`,
    )
    .bind(
      condition.id,
      condition.actorId,
      condition.conditionId,
      condition.sourceActorId ?? null,
      condition.sourceDescription ?? null,
      condition.durationKind,
      condition.remainingRounds ?? null,
      condition.encounterId ?? null,
      condition.expiresEncounterRound ?? null,
      condition.expiresTurnOrder ?? null,
      condition.expiresAt ? Math.floor(condition.expiresAt.getTime() / 1000) : null,
      condition.state == null ? null : JSON.stringify(condition.state),
      timestamp,
      timestamp,
      condition.actorId,
      condition.campaignId,
      condition.conditionId,
    );
}

/** Append the condition event and runtime condition instance in one D1 batch. */
export class D1ActorConditionStore {
  constructor(private readonly binding: D1Database) {}

  async commit(event: GameEventWrite, condition: ActorConditionMutation): Promise<boolean> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const results = await this.binding.batch([
          eventStatement(this.binding, event, condition),
          conditionInsert(this.binding, event, condition),
        ]);
        return changes(results[0]) === 1 && changes(results[1]) === 1;
      } catch (error) {
        if (attempt === 0 && shouldRetrySequence(error)) continue;
        throw error;
      }
    }
    return false;
  }
}
