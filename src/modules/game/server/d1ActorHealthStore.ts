/// <reference types="@cloudflare/workers-types" />

import type { EncounterActionMutation, GameEventWrite } from "./d1GameEventStore";

export type ActorHealthKind = "character" | "monster";

export interface ActorHealthState {
  currentHitPoints: number;
  temporaryHitPoints: number;
  nonlethalDamage: number;
  stable: boolean;
}

export interface ActorHealthMutation {
  actorId: string;
  kind: ActorHealthKind;
  expected: ActorHealthState;
  next: ActorHealthState;
}

function bool(value: boolean): number {
  return value ? 1 : 0;
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

function healthGuard(mutation: ActorHealthMutation): {
  sql: string;
  bindings: readonly unknown[];
} {
  const table = mutation.kind === "character" ? "dnd35_characters" : "runtime_dnd35_monster_instances";
  const idColumn = mutation.kind === "character" ? "character_id" : "actor_id";
  return {
    sql: `EXISTS (
      SELECT 1 FROM ${table}
      WHERE ${idColumn} = ?
        AND current_hit_points = ?
        AND temporary_hit_points = ?
        AND nonlethal_damage = ?
        AND stable = ?
    )`,
    bindings: [
      mutation.actorId,
      mutation.expected.currentHitPoints,
      mutation.expected.temporaryHitPoints,
      mutation.expected.nonlethalDamage,
      bool(mutation.expected.stable),
    ],
  };
}

function healthUpdate(
  db: D1Database,
  event: GameEventWrite,
  mutation: ActorHealthMutation,
): D1PreparedStatement {
  const table = mutation.kind === "character" ? "dnd35_characters" : "runtime_dnd35_monster_instances";
  const idColumn = mutation.kind === "character" ? "character_id" : "actor_id";
  return db
    .prepare(
      `UPDATE ${table}
       SET current_hit_points = ?, temporary_hit_points = ?, nonlethal_damage = ?, stable = ?, updated_at = ?
       WHERE ${idColumn} = ?
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
      mutation.actorId,
      mutation.expected.currentHitPoints,
      mutation.expected.temporaryHitPoints,
      mutation.expected.nonlethalDamage,
      bool(mutation.expected.stable),
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

/**
 * Atomically appends an event, mutates any runtime actor's D&D health, and
 * optionally spends encounter action economy. D1 is the authoritative commit
 * boundary; Durable Objects only broadcast the committed event afterwards.
 */
export class D1ActorHealthStore {
  constructor(private readonly binding: D1Database) {}

  async commit(input: {
    event: GameEventWrite;
    health?: ActorHealthMutation;
    action?: EncounterActionMutation;
  }): Promise<boolean> {
    if (!input.health && !input.action) throw new RangeError("Actor commit requires a state mutation.");

    const guards = [
      ...(input.health ? [healthGuard(input.health)] : []),
      ...(input.action ? [actionGuard(input.action)] : []),
    ];
    const guardSql = guards.map((guard) => `(${guard.sql})`).join(" AND ");
    const guardBindings = guards.flatMap((guard) => [...guard.bindings]);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const statements: D1PreparedStatement[] = [
          eventStatement(this.binding, input.event, guardSql, guardBindings),
        ];
        if (input.health) statements.push(healthUpdate(this.binding, input.event, input.health));
        if (input.action) statements.push(actionUpdate(this.binding, input.event, input.action));
        const results = await this.binding.batch(statements);
        return results.every((result) => changes(result) === 1);
      } catch (error) {
        if (attempt === 0 && shouldRetry(error)) continue;
        throw error;
      }
    }
    return false;
  }
}
