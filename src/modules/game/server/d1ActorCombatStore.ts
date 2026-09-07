/// <reference types="@cloudflare/workers-types" />

import type {
  EncounterActionMutation,
  GameEventWrite,
} from "./d1GameEventStore";

export interface ActorCombatHealthState {
  currentHitPoints: number;
  temporaryHitPoints: number;
  nonlethalDamage: number;
  stable: boolean;
}

export type ActorCombatHealthMutation =
  | {
      kind: "character";
      actorId: string;
      characterId: string;
      expected: ActorCombatHealthState;
      next: ActorCombatHealthState;
    }
  | {
      kind: "monster";
      actorId: string;
      expected: ActorCombatHealthState;
      next: ActorCombatHealthState;
    };

function changes(result: D1Result<unknown> | undefined): number {
  return result?.meta?.changes ?? 0;
}

function bool(value: boolean): number {
  return value ? 1 : 0;
}

function shouldRetrySequence(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /game_events_campaign_sequence_uidx|UNIQUE constraint failed: game_events\.campaign_id, game_events\.sequence/i.test(
    message,
  );
}

function actionGuard(action: EncounterActionMutation): {
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
        AND participant.actor_id = ?
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
      action.encounterId,
      action.roundNumber,
      action.activeTurnIndex,
      action.characterId,
      action.turnOrder,
      bool(action.expected.standardAvailable),
      bool(action.expected.moveAvailable),
      bool(action.expected.swiftAvailable),
      bool(action.expected.swiftDebtNextTurn),
      action.expected.attacksOfOpportunityPerRound,
      action.expected.attacksOfOpportunityRemaining,
      action.expected.lastTurnRound,
    ],
  };
}

function healthGuard(health: ActorCombatHealthMutation): {
  sql: string;
  bindings: readonly unknown[];
} {
  if (health.kind === "character") {
    return {
      sql: `EXISTS (
        SELECT 1
        FROM game_actors actor
        JOIN dnd35_characters state ON state.character_id = actor.character_id
        WHERE actor.id = ?
          AND actor.kind = 'character'
          AND actor.character_id = ?
          AND state.current_hit_points = ?
          AND state.temporary_hit_points = ?
          AND state.nonlethal_damage = ?
          AND state.stable = ?
      )`,
      bindings: [
        health.actorId,
        health.characterId,
        health.expected.currentHitPoints,
        health.expected.temporaryHitPoints,
        health.expected.nonlethalDamage,
        bool(health.expected.stable),
      ],
    };
  }

  return {
    sql: `EXISTS (
      SELECT 1
      FROM game_actors actor
      JOIN runtime_dnd35_monster_instances state ON state.actor_id = actor.id
      WHERE actor.id = ?
        AND actor.kind = 'monster'
        AND state.current_hit_points = ?
        AND state.temporary_hit_points = ?
        AND state.nonlethal_damage = ?
        AND state.stable = ?
    )`,
    bindings: [
      health.actorId,
      health.expected.currentHitPoints,
      health.expected.temporaryHitPoints,
      health.expected.nonlethalDamage,
      bool(health.expected.stable),
    ],
  };
}

function eventStatement(
  db: D1Database,
  event: GameEventWrite,
  guardSql: string,
  guardBindings: readonly unknown[],
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
      WHERE ${guardSql}`,
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
      ...guardBindings,
    );
}

function actionUpdate(
  db: D1Database,
  event: GameEventWrite,
  action: EncounterActionMutation,
): D1PreparedStatement {
  const guard = actionGuard(action);
  return db
    .prepare(
      `UPDATE game_encounter_participants
       SET standard_available = ?, move_available = ?, swift_available = ?,
           swift_debt_next_turn = ?, attacks_of_opportunity_per_round = ?,
           attacks_of_opportunity_remaining = ?, last_turn_round = ?, updated_at = ?
       WHERE encounter_id = ? AND actor_id = ? AND ${guard.sql}`,
    )
    .bind(
      bool(action.next.standardAvailable),
      bool(action.next.moveAvailable),
      bool(action.next.swiftAvailable),
      bool(action.next.swiftDebtNextTurn),
      action.next.attacksOfOpportunityPerRound,
      action.next.attacksOfOpportunityRemaining,
      action.next.lastTurnRound,
      Math.floor(event.occurredAt.getTime() / 1000),
      action.encounterId,
      action.characterId,
      ...guard.bindings,
    );
}

function healthUpdate(
  db: D1Database,
  event: GameEventWrite,
  health: ActorCombatHealthMutation,
): D1PreparedStatement {
  const timestamp = Math.floor(event.occurredAt.getTime() / 1000);
  if (health.kind === "character") {
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
        health.next.currentHitPoints,
        health.next.temporaryHitPoints,
        health.next.nonlethalDamage,
        bool(health.next.stable),
        timestamp,
        health.characterId,
        health.expected.currentHitPoints,
        health.expected.temporaryHitPoints,
        health.expected.nonlethalDamage,
        bool(health.expected.stable),
      );
  }

  return db
    .prepare(
      `UPDATE runtime_dnd35_monster_instances
       SET current_hit_points = ?, temporary_hit_points = ?, nonlethal_damage = ?,
           stable = ?, updated_at = ?
       WHERE actor_id = ?
         AND current_hit_points = ?
         AND temporary_hit_points = ?
         AND nonlethal_damage = ?
         AND stable = ?`,
    )
    .bind(
      health.next.currentHitPoints,
      health.next.temporaryHitPoints,
      health.next.nonlethalDamage,
      bool(health.next.stable),
      timestamp,
      health.actorId,
      health.expected.currentHitPoints,
      health.expected.temporaryHitPoints,
      health.expected.nonlethalDamage,
      bool(health.expected.stable),
    );
}

/**
 * Commits an attack event, optional target-health mutation and optional
 * encounter action expenditure as one D1 batch. The event insert is guarded by
 * all mutable state so a stale command cannot leave a partial history record.
 */
export class D1ActorCombatStore {
  constructor(private readonly binding: D1Database) {}

  async commit(input: {
    event: GameEventWrite;
    action?: EncounterActionMutation;
    health?: ActorCombatHealthMutation;
  }): Promise<boolean> {
    const guards: string[] = [];
    const guardBindings: unknown[] = [];
    if (input.action) {
      const guard = actionGuard(input.action);
      guards.push(`(${guard.sql})`);
      guardBindings.push(...guard.bindings);
    }
    if (input.health) {
      const guard = healthGuard(input.health);
      guards.push(`(${guard.sql})`);
      guardBindings.push(...guard.bindings);
    }
    const guardSql = guards.length === 0 ? "1 = 1" : guards.join(" AND ");

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const statements: D1PreparedStatement[] = [
          eventStatement(this.binding, input.event, guardSql, guardBindings),
        ];
        if (input.health) statements.push(healthUpdate(this.binding, input.event, input.health));
        if (input.action) statements.push(actionUpdate(this.binding, input.event, input.action));
        const results = await this.binding.batch(statements);
        return results.length === statements.length && results.every((result) => changes(result) === 1);
      } catch (error) {
        if (attempt === 0 && shouldRetrySequence(error)) continue;
        throw error;
      }
    }
    return false;
  }
}
