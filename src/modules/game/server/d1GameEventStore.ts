/// <reference types="@cloudflare/workers-types" />

export interface GameEventWrite {
  id: string;
  campaignId: string;
  sessionId: string;
  eventType: string;
  occurredAt: Date;
  actorId?: string | null;
  sourceId?: string | null;
  targetIds?: readonly string[];
  payload?: Record<string, unknown>;
  deltas?: readonly Record<string, unknown>[];
}

export interface HealthMutation {
  characterId: string;
  expected: {
    currentHitPoints: number;
    temporaryHitPoints: number;
    nonlethalDamage: number;
  };
  next: {
    currentHitPoints: number;
    temporaryHitPoints: number;
    nonlethalDamage: number;
  };
}

function eventStatement(db: D1Database, event: GameEventWrite, guardSql = "1 = 1") {
  const sql = `
    INSERT INTO game_events (
      id, campaign_id, session_id, sequence, event_type, occurred_at,
      actor_id, source_id, target_ids, payload, deltas, created_at
    )
    SELECT ?, ?, ?,
      (SELECT COALESCE(MAX(sequence), 0) + 1 FROM game_events WHERE campaign_id = ?),
      ?, ?, ?, ?, ?, ?, ?, ?
    WHERE ${guardSql}
  `;
  const unixSeconds = Math.floor(event.occurredAt.getTime() / 1000);
  return db.prepare(sql).bind(
    event.id,
    event.campaignId,
    event.sessionId,
    event.campaignId,
    event.eventType,
    unixSeconds,
    event.actorId ?? null,
    event.sourceId ?? null,
    JSON.stringify(event.targetIds ?? []),
    JSON.stringify(event.payload ?? {}),
    JSON.stringify(event.deltas ?? []),
    unixSeconds,
  );
}

function changes(result: D1Result<unknown> | undefined): number {
  return result?.meta?.changes ?? 0;
}

function shouldRetry(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /game_events_campaign_sequence_uidx|UNIQUE constraint failed: game_events\.campaign_id, game_events\.sequence/i.test(
    message,
  );
}

export class D1GameEventStore {
  constructor(private readonly binding: D1Database) {}

  /** Append an immutable event, retrying once if two requests race for the same sequence. */
  async append(event: GameEventWrite): Promise<void> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await eventStatement(this.binding, event).run();
        return;
      } catch (error) {
        if (attempt === 0 && shouldRetry(error)) continue;
        throw error;
      }
    }
  }

  /**
   * Atomically write a health event and its HP mutation.
   *
   * The event INSERT is guarded by the exact state used to resolve the action.
   * D1 batch execution is transactional, so the guard and update cannot be
   * interleaved by another action. A stale command therefore writes neither
   * state nor history.
   */
  async applyHealth(event: GameEventWrite, mutation: HealthMutation): Promise<boolean> {
    const guard = `EXISTS (
      SELECT 1 FROM dnd35_characters
      WHERE character_id = ?
        AND current_hit_points = ?
        AND temporary_hit_points = ?
        AND nonlethal_damage = ?
    )`;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const guardedEvent = eventStatement(this.binding, event, guard).bind(
          event.id,
          event.campaignId,
          event.sessionId,
          event.campaignId,
          event.eventType,
          Math.floor(event.occurredAt.getTime() / 1000),
          event.actorId ?? null,
          event.sourceId ?? null,
          JSON.stringify(event.targetIds ?? []),
          JSON.stringify(event.payload ?? {}),
          JSON.stringify(event.deltas ?? []),
          Math.floor(event.occurredAt.getTime() / 1000),
          mutation.characterId,
          mutation.expected.currentHitPoints,
          mutation.expected.temporaryHitPoints,
          mutation.expected.nonlethalDamage,
        );

        const update = this.binding
          .prepare(
            `UPDATE dnd35_characters
             SET current_hit_points = ?, temporary_hit_points = ?, nonlethal_damage = ?, updated_at = ?
             WHERE character_id = ?
               AND current_hit_points = ?
               AND temporary_hit_points = ?
               AND nonlethal_damage = ?`,
          )
          .bind(
            mutation.next.currentHitPoints,
            mutation.next.temporaryHitPoints,
            mutation.next.nonlethalDamage,
            Math.floor(event.occurredAt.getTime() / 1000),
            mutation.characterId,
            mutation.expected.currentHitPoints,
            mutation.expected.temporaryHitPoints,
            mutation.expected.nonlethalDamage,
          );

        const results = await this.binding.batch([guardedEvent, update]);
        return changes(results[0]) === 1 && changes(results[1]) === 1;
      } catch (error) {
        if (attempt === 0 && shouldRetry(error)) continue;
        throw error;
      }
    }
    return false;
  }

  /** Atomically append an event and apply a persistent condition instance. */
  async applyCondition(input: {
    event: GameEventWrite;
    condition: {
      id: string;
      characterId: string;
      conditionId: string;
      sourceCharacterId?: string | null;
      sourceDescription?: string | null;
      durationKind: "rounds" | "until_time" | "permanent" | "concentration" | "special";
      remainingRounds?: number | null;
      expiresAt?: Date | null;
      state?: Record<string, unknown> | null;
    };
  }): Promise<void> {
    const timestamp = Math.floor(input.event.occurredAt.getTime() / 1000);
    const conditionInsert = this.binding
      .prepare(
        `INSERT INTO dnd35_character_conditions (
          id, character_id, condition_id, source_character_id, source_description,
          duration_kind, remaining_rounds, expires_at, state, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.condition.id,
        input.condition.characterId,
        input.condition.conditionId,
        input.condition.sourceCharacterId ?? null,
        input.condition.sourceDescription ?? null,
        input.condition.durationKind,
        input.condition.remainingRounds ?? null,
        input.condition.expiresAt ? Math.floor(input.condition.expiresAt.getTime() / 1000) : null,
        input.condition.state === undefined || input.condition.state === null
          ? null
          : JSON.stringify(input.condition.state),
        timestamp,
        timestamp,
      );

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await this.binding.batch([conditionInsert, eventStatement(this.binding, input.event)]);
        return;
      } catch (error) {
        if (attempt === 0 && shouldRetry(error)) continue;
        throw error;
      }
    }
  }
}
