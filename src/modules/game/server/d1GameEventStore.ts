/// <reference types="@cloudflare/workers-types" />

import { createRoundConditionAnchor } from "../domain/conditionTiming";

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

export interface EncounterActionEconomyState {
  standardAvailable: boolean;
  moveAvailable: boolean;
  swiftAvailable: boolean;
  swiftDebtNextTurn: boolean;
  attacksOfOpportunityPerRound: number;
  attacksOfOpportunityRemaining: number;
  lastTurnRound: number;
}

export interface EncounterActionMutation {
  encounterId: string;
  characterId: string;
  roundNumber: number;
  activeTurnIndex: number;
  turnOrder: number;
  expected: EncounterActionEconomyState;
  next: EncounterActionEconomyState;
}

function eventStatement(
  db: D1Database,
  event: GameEventWrite,
  guardSql = "1 = 1",
  guardBindings: readonly unknown[] = [],
) {
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
    ...guardBindings,
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

function booleanInt(value: boolean): number {
  return value ? 1 : 0;
}

function healthGuard(mutation: HealthMutation): { sql: string; bindings: readonly unknown[] } {
  return {
    sql: `EXISTS (
      SELECT 1 FROM dnd35_characters
      WHERE character_id = ?
        AND current_hit_points = ?
        AND temporary_hit_points = ?
        AND nonlethal_damage = ?
    )`,
    bindings: [
      mutation.characterId,
      mutation.expected.currentHitPoints,
      mutation.expected.temporaryHitPoints,
      mutation.expected.nonlethalDamage,
    ],
  };
}

function encounterActionGuard(mutation: EncounterActionMutation): {
  sql: string;
  bindings: readonly unknown[];
} {
  return {
    sql: `EXISTS (
      SELECT 1
      FROM game_encounters encounter
      JOIN game_encounter_participants participant
        ON participant.encounter_id = encounter.id
      WHERE encounter.id = ?
        AND encounter.status = 'active'
        AND encounter.round_number = ?
        AND encounter.active_turn_index = ?
        AND participant.character_id = ?
        AND participant.turn_order = ?
        AND participant.turn_order = encounter.active_turn_index
        AND participant.status = 'active'
        AND participant.standard_available = ?
        AND participant.move_available = ?
        AND participant.swift_available = ?
        AND participant.swift_debt_next_turn = ?
        AND participant.attacks_of_opportunity_per_round = ?
        AND participant.attacks_of_opportunity_remaining = ?
        AND participant.last_turn_round = ?
    )`,
    bindings: [
      mutation.encounterId,
      mutation.roundNumber,
      mutation.activeTurnIndex,
      mutation.characterId,
      mutation.turnOrder,
      booleanInt(mutation.expected.standardAvailable),
      booleanInt(mutation.expected.moveAvailable),
      booleanInt(mutation.expected.swiftAvailable),
      booleanInt(mutation.expected.swiftDebtNextTurn),
      mutation.expected.attacksOfOpportunityPerRound,
      mutation.expected.attacksOfOpportunityRemaining,
      mutation.expected.lastTurnRound,
    ],
  };
}

function healthUpdate(db: D1Database, event: GameEventWrite, mutation: HealthMutation) {
  return db
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
}

function encounterActionUpdate(
  db: D1Database,
  event: GameEventWrite,
  mutation: EncounterActionMutation,
) {
  const guard = encounterActionGuard(mutation);
  return db
    .prepare(
      `UPDATE game_encounter_participants
       SET standard_available = ?, move_available = ?, swift_available = ?,
           swift_debt_next_turn = ?, attacks_of_opportunity_per_round = ?,
           attacks_of_opportunity_remaining = ?, last_turn_round = ?, updated_at = ?
       WHERE encounter_id = ? AND character_id = ? AND ${guard.sql}`,
    )
    .bind(
      booleanInt(mutation.next.standardAvailable),
      booleanInt(mutation.next.moveAvailable),
      booleanInt(mutation.next.swiftAvailable),
      booleanInt(mutation.next.swiftDebtNextTurn),
      mutation.next.attacksOfOpportunityPerRound,
      mutation.next.attacksOfOpportunityRemaining,
      mutation.next.lastTurnRound,
      Math.floor(event.occurredAt.getTime() / 1000),
      mutation.encounterId,
      mutation.characterId,
      ...guard.bindings,
    );
}

async function inferConditionAnchor(
  db: D1Database,
  input: {
    event: GameEventWrite;
    characterId: string;
    durationKind: "rounds" | "until_time" | "permanent" | "concentration" | "special";
    remainingRounds?: number | null;
  },
): Promise<{
  encounterId: string;
  expiresEncounterRound: number;
  expiresTurnOrder: number;
} | null> {
  if (input.durationKind !== "rounds") return null;
  const durationRounds = input.remainingRounds;
  if (!Number.isSafeInteger(durationRounds) || (durationRounds ?? 0) < 1) {
    throw new RangeError("Round duration requires a positive integer remainingRounds value.");
  }

  const row = await db
    .prepare(
      `SELECT encounter.id AS encounter_id,
              encounter.round_number AS round_number,
              encounter.active_turn_index AS active_turn_index
       FROM game_encounters encounter
       JOIN game_encounter_participants participant
         ON participant.encounter_id = encounter.id
       WHERE encounter.campaign_id = ?
         AND encounter.session_id = ?
         AND encounter.status = 'active'
         AND participant.character_id = ?
         AND participant.status = 'active'
       LIMIT 1`,
    )
    .bind(input.event.campaignId, input.event.sessionId, input.characterId)
    .first<{ encounter_id: string; round_number: number; active_turn_index: number }>();
  if (!row) return null;

  const anchor = createRoundConditionAnchor({
    currentRound: row.round_number,
    currentTurnOrder: row.active_turn_index,
    durationRounds: durationRounds as number,
  });
  return {
    encounterId: row.encounter_id,
    ...anchor,
  };
}

export class D1GameEventStore {
  constructor(private readonly binding: D1Database) {}

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

  async applyHealth(event: GameEventWrite, mutation: HealthMutation): Promise<boolean> {
    const guard = healthGuard(mutation);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const guardedEvent = eventStatement(this.binding, event, guard.sql, guard.bindings);
        const update = healthUpdate(this.binding, event, mutation);
        const results = await this.binding.batch([guardedEvent, update]);
        return changes(results[0]) === 1 && changes(results[1]) === 1;
      } catch (error) {
        if (attempt === 0 && shouldRetry(error)) continue;
        throw error;
      }
    }
    return false;
  }

  async commitEncounterAction(input: {
    event: GameEventWrite;
    action: EncounterActionMutation;
    health?: HealthMutation;
  }): Promise<boolean> {
    const actionGuard = encounterActionGuard(input.action);
    const health = input.health === undefined ? null : healthGuard(input.health);
    const combinedGuard =
      health === null ? actionGuard.sql : `(${actionGuard.sql}) AND (${health.sql})`;
    const combinedBindings =
      health === null ? actionGuard.bindings : [...actionGuard.bindings, ...health.bindings];

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const statements: D1PreparedStatement[] = [
          eventStatement(this.binding, input.event, combinedGuard, combinedBindings),
        ];
        if (input.health !== undefined) statements.push(healthUpdate(this.binding, input.event, input.health));
        statements.push(encounterActionUpdate(this.binding, input.event, input.action));
        const results = await this.binding.batch(statements);
        return results.every((result) => changes(result) === 1);
      } catch (error) {
        if (attempt === 0 && shouldRetry(error)) continue;
        throw error;
      }
    }
    return false;
  }

  async applyCondition(input: {
    event: GameEventWrite;
    condition: {
      id: string;
      characterId: string;
      conditionId: string;
      sourceCharacterId?: string | null;
      encounterId?: string | null;
      expiresEncounterRound?: number | null;
      expiresTurnOrder?: number | null;
      sourceDescription?: string | null;
      durationKind: "rounds" | "until_time" | "permanent" | "concentration" | "special";
      remainingRounds?: number | null;
      expiresAt?: Date | null;
      state?: Record<string, unknown> | null;
    };
  }): Promise<void> {
    const timestamp = Math.floor(input.event.occurredAt.getTime() / 1000);
    const inferred = await inferConditionAnchor(this.binding, {
      event: input.event,
      characterId: input.condition.characterId,
      durationKind: input.condition.durationKind,
      remainingRounds: input.condition.remainingRounds,
    });
    const encounterId = input.condition.encounterId ?? inferred?.encounterId ?? null;
    const expiresEncounterRound =
      input.condition.expiresEncounterRound ?? inferred?.expiresEncounterRound ?? null;
    const expiresTurnOrder = input.condition.expiresTurnOrder ?? inferred?.expiresTurnOrder ?? null;
    const event: GameEventWrite = {
      ...input.event,
      payload: {
        ...(input.event.payload ?? {}),
        encounterId,
        expiresEncounterRound,
        expiresTurnOrder,
      },
    };

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const conditionInsert = this.binding
          .prepare(
            `INSERT INTO dnd35_character_conditions (
              id, character_id, condition_id, source_character_id,
              encounter_id, expires_encounter_round, expires_turn_order,
              source_description, duration_kind, remaining_rounds, expires_at,
              state, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            input.condition.id,
            input.condition.characterId,
            input.condition.conditionId,
            input.condition.sourceCharacterId ?? null,
            encounterId,
            expiresEncounterRound,
            expiresTurnOrder,
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
        await this.binding.batch([conditionInsert, eventStatement(this.binding, event)]);
        return;
      } catch (error) {
        if (attempt === 0 && shouldRetry(error)) continue;
        throw error;
      }
    }
  }
}
