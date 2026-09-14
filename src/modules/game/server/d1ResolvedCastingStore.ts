/// <reference types="@cloudflare/workers-types" />

import type { RuntimeDnd35ActorConditionState } from "@/infrastructure/database/schema";
import type { ActorHealthMutation } from "./d1ActorHealthStore";
import type { EncounterActionMutation, GameEventWrite } from "./d1GameEventStore";

export interface ResolvedCastingConditionMutation {
  id: string;
  actorId: string;
  conditionId: string;
  sourceActorId?: string | null;
  sourceDescription?: string | null;
  durationKind: "rounds" | "permanent" | "special";
  remainingRounds?: number | null;
  encounterId?: string | null;
  expiresEncounterRound?: number | null;
  expiresTurnOrder?: number | null;
  state?: RuntimeDnd35ActorConditionState | null;
}

export interface ResolvedCastingEffects {
  health?: readonly ActorHealthMutation[];
  conditions?: readonly ResolvedCastingConditionMutation[];
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

function bool(value: boolean): number {
  return value ? 1 : 0;
}

function combineGuards(guards: readonly { sql: string; bindings: readonly unknown[] }[]): {
  sql: string;
  bindings: readonly unknown[];
} {
  if (guards.length === 0) return { sql: "1 = 1", bindings: [] };
  return {
    sql: guards.map((guard) => `(${guard.sql})`).join(" AND "),
    bindings: guards.flatMap((guard) => [...guard.bindings]),
  };
}

function eventStatement(
  db: D1Database,
  event: GameEventWrite,
  guard: { sql: string; bindings: readonly unknown[] },
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
      WHERE ${guard.sql}`,
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
      ...guard.bindings,
    );
}

function actionGuard(action: EncounterActionMutation) {
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
  } as const;
}

function actionUpdate(db: D1Database, event: GameEventWrite, action: EncounterActionMutation) {
  const guard = actionGuard(action);
  return db
    .prepare(
      `UPDATE game_encounter_participants
       SET standard_available = ?, move_available = ?, swift_available = ?,
           swift_debt_next_turn = ?, attacks_of_opportunity_per_round = ?,
           attacks_of_opportunity_remaining = ?, last_turn_round = ?, updated_at = ?
       WHERE encounter_id = ? AND actor_id = ? AND ${guard.sql}
         AND EXISTS (SELECT 1 FROM game_events WHERE id = ?)`,
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
      event.id,
    );
}

function healthGuard(mutation: ActorHealthMutation) {
  const table =
    mutation.kind === "character" ? "dnd35_characters" : "runtime_dnd35_monster_instances";
  const id = mutation.kind === "character" ? "character_id" : "actor_id";
  return {
    sql: `EXISTS (
      SELECT 1 FROM ${table}
      WHERE ${id} = ?
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
  } as const;
}

function healthUpdate(db: D1Database, event: GameEventWrite, mutation: ActorHealthMutation) {
  const table =
    mutation.kind === "character" ? "dnd35_characters" : "runtime_dnd35_monster_instances";
  const id = mutation.kind === "character" ? "character_id" : "actor_id";
  return db
    .prepare(
      `UPDATE ${table}
       SET current_hit_points = ?, temporary_hit_points = ?, nonlethal_damage = ?, stable = ?, updated_at = ?
       WHERE ${id} = ?
         AND current_hit_points = ?
         AND temporary_hit_points = ?
         AND nonlethal_damage = ?
         AND stable = ?
         AND EXISTS (SELECT 1 FROM game_events WHERE id = ?)`,
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
      event.id,
    );
}

function conditionGuard(condition: ResolvedCastingConditionMutation) {
  return {
    sql: `EXISTS (SELECT 1 FROM game_actors WHERE id = ? AND status = 'active')
          AND EXISTS (SELECT 1 FROM dnd35_conditions WHERE id = ?)`,
    bindings: [condition.actorId, condition.conditionId],
  } as const;
}

function conditionInsert(
  db: D1Database,
  event: GameEventWrite,
  condition: ResolvedCastingConditionMutation,
) {
  const timestamp = Math.floor(event.occurredAt.getTime() / 1000);
  return db
    .prepare(
      `INSERT INTO runtime_dnd35_actor_conditions (
        id, actor_id, condition_id, source_actor_id, source_description,
        duration_kind, remaining_rounds, encounter_id, expires_encounter_round,
        expires_turn_order, expires_at, state, created_at, updated_at
      )
      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?
      WHERE EXISTS (SELECT 1 FROM game_events WHERE id = ?)`,
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
      condition.state === undefined || condition.state === null
        ? null
        : JSON.stringify(condition.state),
      timestamp,
      timestamp,
      event.id,
    );
}

function preparedGuard(input: {
  preparationId: string;
  characterId: string;
  expectedExpendedCount: number;
}) {
  return {
    sql: `EXISTS (
      SELECT 1
      FROM dnd35_character_spell_preparations preparation
      JOIN dnd35_character_casting_tracks track ON track.id = preparation.casting_track_id
      WHERE preparation.id = ? AND track.character_id = ? AND preparation.expended_count = ?
    )`,
    bindings: [input.preparationId, input.characterId, input.expectedExpendedCount],
  } as const;
}

function spontaneousGuard(input: {
  castingTrackId: string;
  spellLevel: number;
  expectedExpendedCount: number;
}) {
  return {
    sql: `COALESCE((
      SELECT expended_count FROM runtime_dnd35_character_spontaneous_slot_usage
      WHERE casting_track_id = ? AND spell_level = ?
    ), 0) = ?`,
    bindings: [input.castingTrackId, input.spellLevel, input.expectedExpendedCount],
  } as const;
}

function powerPointGuard(input: { characterId: string; expectedSpent: number }) {
  return {
    sql: `EXISTS (
      SELECT 1 FROM dnd35_characters WHERE character_id = ? AND power_points_spent = ?
    )`,
    bindings: [input.characterId, input.expectedSpent],
  } as const;
}

function focusGuard(input: { characterId: string; expectedFocused: boolean }) {
  return {
    sql: `COALESCE((
      SELECT focused FROM runtime_dnd35_character_psionic_states WHERE character_id = ?
    ), 0) = ?`,
    bindings: [input.characterId, bool(input.expectedFocused)],
  } as const;
}

export class D1ResolvedCastingStore {
  constructor(private readonly binding: D1Database) {}

  private effectGuards(effects: ResolvedCastingEffects | undefined) {
    return [
      ...(effects?.health ?? []).map(healthGuard),
      ...(effects?.conditions ?? []).map(conditionGuard),
    ];
  }

  private effectStatements(
    event: GameEventWrite,
    effects: ResolvedCastingEffects | undefined,
  ): D1PreparedStatement[] {
    return [
      ...(effects?.health ?? []).map((mutation) => healthUpdate(this.binding, event, mutation)),
      ...(effects?.conditions ?? []).map((mutation) =>
        conditionInsert(this.binding, event, mutation),
      ),
    ];
  }

  async commitPrepared(input: {
    event: GameEventWrite;
    characterId: string;
    preparationId: string;
    expectedExpendedCount: number;
    nextExpendedCount: number;
    action?: EncounterActionMutation;
    effects?: ResolvedCastingEffects;
  }): Promise<boolean> {
    const guard = combineGuards([
      preparedGuard(input),
      ...(input.action ? [actionGuard(input.action)] : []),
      ...this.effectGuards(input.effects),
    ]);
    const timestamp = Math.floor(input.event.occurredAt.getTime() / 1000);
    return this.commitBatch(input.event, guard, [
      this.binding
        .prepare(
          `UPDATE dnd35_character_spell_preparations
             SET expended_count = ?, updated_at = ?
             WHERE id = ? AND expended_count = ?
               AND EXISTS (SELECT 1 FROM game_events WHERE id = ?)`,
        )
        .bind(
          input.nextExpendedCount,
          timestamp,
          input.preparationId,
          input.expectedExpendedCount,
          input.event.id,
        ),
      ...this.effectStatements(input.event, input.effects),
      ...(input.action ? [actionUpdate(this.binding, input.event, input.action)] : []),
    ]);
  }

  async commitSpontaneous(input: {
    event: GameEventWrite;
    castingTrackId: string;
    spellLevel: number;
    expectedExpendedCount: number;
    nextExpendedCount: number;
    action?: EncounterActionMutation;
    effects?: ResolvedCastingEffects;
  }): Promise<boolean> {
    const guard = combineGuards([
      spontaneousGuard(input),
      ...(input.action ? [actionGuard(input.action)] : []),
      ...this.effectGuards(input.effects),
    ]);
    const timestamp = Math.floor(input.event.occurredAt.getTime() / 1000);
    return this.commitBatch(input.event, guard, [
      this.binding
        .prepare(
          `INSERT INTO runtime_dnd35_character_spontaneous_slot_usage (
               casting_track_id, spell_level, expended_count, created_at, updated_at
             )
             SELECT ?, ?, ?, ?, ?
             WHERE EXISTS (SELECT 1 FROM game_events WHERE id = ?)
             ON CONFLICT(casting_track_id, spell_level) DO UPDATE SET
               expended_count = excluded.expended_count,
               updated_at = excluded.updated_at
             WHERE runtime_dnd35_character_spontaneous_slot_usage.expended_count = ?`,
        )
        .bind(
          input.castingTrackId,
          input.spellLevel,
          input.nextExpendedCount,
          timestamp,
          timestamp,
          input.event.id,
          input.expectedExpendedCount,
        ),
      ...this.effectStatements(input.event, input.effects),
      ...(input.action ? [actionUpdate(this.binding, input.event, input.action)] : []),
    ]);
  }

  async commitPower(input: {
    event: GameEventWrite;
    characterId: string;
    expectedPowerPointsSpent: number;
    nextPowerPointsSpent: number;
    expectedFocused?: boolean;
    nextFocused?: boolean;
    action?: EncounterActionMutation;
    effects?: ResolvedCastingEffects;
  }): Promise<boolean> {
    const guard = combineGuards([
      powerPointGuard({
        characterId: input.characterId,
        expectedSpent: input.expectedPowerPointsSpent,
      }),
      ...(input.expectedFocused === undefined
        ? []
        : [focusGuard({ characterId: input.characterId, expectedFocused: input.expectedFocused })]),
      ...(input.action ? [actionGuard(input.action)] : []),
      ...this.effectGuards(input.effects),
    ]);
    const timestamp = Math.floor(input.event.occurredAt.getTime() / 1000);
    const statements: D1PreparedStatement[] = [
      this.binding
        .prepare(
          `UPDATE dnd35_characters
           SET power_points_spent = ?, updated_at = ?
           WHERE character_id = ? AND power_points_spent = ?
             AND EXISTS (SELECT 1 FROM game_events WHERE id = ?)`,
        )
        .bind(
          input.nextPowerPointsSpent,
          timestamp,
          input.characterId,
          input.expectedPowerPointsSpent,
          input.event.id,
        ),
    ];
    if (input.nextFocused !== undefined) {
      statements.push(
        this.binding
          .prepare(
            `INSERT INTO runtime_dnd35_character_psionic_states (
               character_id, focused, created_at, updated_at
             )
             SELECT ?, ?, ?, ?
             WHERE EXISTS (SELECT 1 FROM game_events WHERE id = ?)
             ON CONFLICT(character_id) DO UPDATE SET
               focused = excluded.focused, updated_at = excluded.updated_at
             WHERE runtime_dnd35_character_psionic_states.focused = ?`,
          )
          .bind(
            input.characterId,
            bool(input.nextFocused),
            timestamp,
            timestamp,
            input.event.id,
            bool(input.expectedFocused ?? false),
          ),
      );
    }
    statements.push(...this.effectStatements(input.event, input.effects));
    if (input.action) statements.push(actionUpdate(this.binding, input.event, input.action));
    return this.commitBatch(input.event, guard, statements);
  }

  private async commitBatch(
    event: GameEventWrite,
    guard: { sql: string; bindings: readonly unknown[] },
    statements: readonly D1PreparedStatement[],
  ): Promise<boolean> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const results = await this.binding.batch([
          eventStatement(this.binding, event, guard),
          ...statements,
        ]);
        return results.every((result) => changes(result) === 1);
      } catch (error) {
        if (attempt === 0 && shouldRetry(error)) continue;
        throw error;
      }
    }
    return false;
  }
}
