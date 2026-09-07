/// <reference types="@cloudflare/workers-types" />

import type { EncounterActionMutation, GameEventWrite } from "./d1GameEventStore";

function changes(result: D1Result<unknown> | undefined): number {
  return result?.meta?.changes ?? 0;
}

function shouldRetrySequence(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /game_events_campaign_sequence_uidx|UNIQUE constraint failed: game_events\.campaign_id, game_events\.sequence/i.test(
    message,
  );
}

function booleanInt(value: boolean): number {
  return value ? 1 : 0;
}

function eventStatement(
  db: D1Database,
  event: GameEventWrite,
  guardSql = "1 = 1",
  guardBindings: readonly unknown[] = [],
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
      action.encounterId,
      action.roundNumber,
      action.activeTurnIndex,
      action.characterId,
      action.turnOrder,
      booleanInt(action.expected.standardAvailable),
      booleanInt(action.expected.moveAvailable),
      booleanInt(action.expected.swiftAvailable),
      booleanInt(action.expected.swiftDebtNextTurn),
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
       WHERE encounter_id = ? AND character_id = ? AND ${guard.sql}`,
    )
    .bind(
      booleanInt(action.next.standardAvailable),
      booleanInt(action.next.moveAvailable),
      booleanInt(action.next.swiftAvailable),
      booleanInt(action.next.swiftDebtNextTurn),
      action.next.attacksOfOpportunityPerRound,
      action.next.attacksOfOpportunityRemaining,
      action.next.lastTurnRound,
      Math.floor(event.occurredAt.getTime() / 1000),
      action.encounterId,
      action.characterId,
      ...guard.bindings,
    );
}

function combineGuards(
  guards: readonly { sql: string; bindings: readonly unknown[] }[],
): { sql: string; bindings: readonly unknown[] } {
  if (guards.length === 0) return { sql: "1 = 1", bindings: [] };
  return {
    sql: guards.map((guard) => `(${guard.sql})`).join(" AND "),
    bindings: guards.flatMap((guard) => [...guard.bindings]),
  };
}

function preparedGuard(input: {
  preparationId: string;
  characterId: string;
  expectedExpendedCount: number;
}): { sql: string; bindings: readonly unknown[] } {
  return {
    sql: `EXISTS (
      SELECT 1
      FROM dnd35_character_spell_preparations preparation
      JOIN dnd35_character_casting_tracks track
        ON track.id = preparation.casting_track_id
      WHERE preparation.id = ?
        AND track.character_id = ?
        AND preparation.expended_count = ?
    )`,
    bindings: [input.preparationId, input.characterId, input.expectedExpendedCount],
  };
}

function spontaneousGuard(input: {
  castingTrackId: string;
  spellLevel: number;
  expectedExpendedCount: number;
}): { sql: string; bindings: readonly unknown[] } {
  return {
    sql: `COALESCE((
      SELECT expended_count
      FROM dnd35_character_spontaneous_slot_usage
      WHERE casting_track_id = ? AND spell_level = ?
    ), 0) = ?`,
    bindings: [input.castingTrackId, input.spellLevel, input.expectedExpendedCount],
  };
}

function powerPointGuard(input: {
  characterId: string;
  expectedSpent: number;
}): { sql: string; bindings: readonly unknown[] } {
  return {
    sql: `EXISTS (
      SELECT 1 FROM dnd35_characters
      WHERE character_id = ? AND power_points_spent = ?
    )`,
    bindings: [input.characterId, input.expectedSpent],
  };
}

function focusGuard(input: {
  characterId: string;
  expectedFocused: boolean;
}): { sql: string; bindings: readonly unknown[] } {
  return {
    sql: `COALESCE((
      SELECT focused FROM dnd35_character_psionic_states WHERE character_id = ?
    ), 0) = ?`,
    bindings: [input.characterId, booleanInt(input.expectedFocused)],
  };
}

export class D1CastingStore {
  constructor(private readonly binding: D1Database) {}

  async commitPreparedSpellCast(input: {
    event: GameEventWrite;
    characterId: string;
    preparationId: string;
    expectedExpendedCount: number;
    nextExpendedCount: number;
    action?: EncounterActionMutation;
  }): Promise<boolean> {
    const guards = [
      preparedGuard({
        preparationId: input.preparationId,
        characterId: input.characterId,
        expectedExpendedCount: input.expectedExpendedCount,
      }),
      ...(input.action === undefined ? [] : [actionGuard(input.action)]),
    ];
    const combined = combineGuards(guards);
    const timestamp = Math.floor(input.event.occurredAt.getTime() / 1000);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const statements: D1PreparedStatement[] = [
          eventStatement(this.binding, input.event, combined.sql, combined.bindings),
          this.binding
            .prepare(
              `UPDATE dnd35_character_spell_preparations
               SET expended_count = ?, updated_at = ?
               WHERE id = ? AND expended_count = ?`,
            )
            .bind(
              input.nextExpendedCount,
              timestamp,
              input.preparationId,
              input.expectedExpendedCount,
            ),
        ];
        if (input.action !== undefined) {
          statements.push(actionUpdate(this.binding, input.event, input.action));
        }
        const results = await this.binding.batch(statements);
        return results.every((result) => changes(result) === 1);
      } catch (error) {
        if (attempt === 0 && shouldRetrySequence(error)) continue;
        throw error;
      }
    }
    return false;
  }

  async commitSpontaneousSpellCast(input: {
    event: GameEventWrite;
    castingTrackId: string;
    spellLevel: number;
    expectedExpendedCount: number;
    nextExpendedCount: number;
    action?: EncounterActionMutation;
  }): Promise<boolean> {
    const guards = [
      spontaneousGuard({
        castingTrackId: input.castingTrackId,
        spellLevel: input.spellLevel,
        expectedExpendedCount: input.expectedExpendedCount,
      }),
      ...(input.action === undefined ? [] : [actionGuard(input.action)]),
    ];
    const combined = combineGuards(guards);
    const timestamp = Math.floor(input.event.occurredAt.getTime() / 1000);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const statements: D1PreparedStatement[] = [
          eventStatement(this.binding, input.event, combined.sql, combined.bindings),
          this.binding
            .prepare(
              `INSERT INTO dnd35_character_spontaneous_slot_usage (
                 casting_track_id, spell_level, expended_count, created_at, updated_at
               ) VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(casting_track_id, spell_level) DO UPDATE SET
                 expended_count = excluded.expended_count,
                 updated_at = excluded.updated_at
               WHERE dnd35_character_spontaneous_slot_usage.expended_count = ?`,
            )
            .bind(
              input.castingTrackId,
              input.spellLevel,
              input.nextExpendedCount,
              timestamp,
              timestamp,
              input.expectedExpendedCount,
            ),
        ];
        if (input.action !== undefined) {
          statements.push(actionUpdate(this.binding, input.event, input.action));
        }
        const results = await this.binding.batch(statements);
        return results.every((result) => changes(result) === 1);
      } catch (error) {
        if (attempt === 0 && shouldRetrySequence(error)) continue;
        throw error;
      }
    }
    return false;
  }

  async commitPowerManifestation(input: {
    event: GameEventWrite;
    characterId: string;
    expectedPowerPointsSpent: number;
    nextPowerPointsSpent: number;
    expectedFocused?: boolean;
    nextFocused?: boolean;
    action?: EncounterActionMutation;
  }): Promise<boolean> {
    const guards = [
      powerPointGuard({
        characterId: input.characterId,
        expectedSpent: input.expectedPowerPointsSpent,
      }),
      ...(input.expectedFocused === undefined
        ? []
        : [focusGuard({ characterId: input.characterId, expectedFocused: input.expectedFocused })]),
      ...(input.action === undefined ? [] : [actionGuard(input.action)]),
    ];
    const combined = combineGuards(guards);
    const timestamp = Math.floor(input.event.occurredAt.getTime() / 1000);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const statements: D1PreparedStatement[] = [
          eventStatement(this.binding, input.event, combined.sql, combined.bindings),
          this.binding
            .prepare(
              `UPDATE dnd35_characters
               SET power_points_spent = ?, updated_at = ?
               WHERE character_id = ? AND power_points_spent = ?`,
            )
            .bind(
              input.nextPowerPointsSpent,
              timestamp,
              input.characterId,
              input.expectedPowerPointsSpent,
            ),
        ];
        if (input.nextFocused !== undefined) {
          statements.push(
            this.binding
              .prepare(
                `INSERT INTO dnd35_character_psionic_states (
                   character_id, focused, created_at, updated_at
                 ) VALUES (?, ?, ?, ?)
                 ON CONFLICT(character_id) DO UPDATE SET
                   focused = excluded.focused,
                   updated_at = excluded.updated_at
                 WHERE dnd35_character_psionic_states.focused = ?`,
              )
              .bind(
                input.characterId,
                booleanInt(input.nextFocused),
                timestamp,
                timestamp,
                booleanInt(input.expectedFocused ?? false),
              ),
          );
        }
        if (input.action !== undefined) {
          statements.push(actionUpdate(this.binding, input.event, input.action));
        }
        const results = await this.binding.batch(statements);
        return results.every((result) => changes(result) === 1);
      } catch (error) {
        if (attempt === 0 && shouldRetrySequence(error)) continue;
        throw error;
      }
    }
    return false;
  }

  async commitPsionicFocusGain(input: {
    event: GameEventWrite;
    characterId: string;
    action?: EncounterActionMutation;
  }): Promise<boolean> {
    const guards = [
      focusGuard({ characterId: input.characterId, expectedFocused: false }),
      ...(input.action === undefined ? [] : [actionGuard(input.action)]),
    ];
    const combined = combineGuards(guards);
    const timestamp = Math.floor(input.event.occurredAt.getTime() / 1000);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const statements: D1PreparedStatement[] = [
          eventStatement(this.binding, input.event, combined.sql, combined.bindings),
          this.binding
            .prepare(
              `INSERT INTO dnd35_character_psionic_states (
                 character_id, focused, created_at, updated_at
               ) VALUES (?, 1, ?, ?)
               ON CONFLICT(character_id) DO UPDATE SET focused = 1, updated_at = excluded.updated_at
               WHERE dnd35_character_psionic_states.focused = 0`,
            )
            .bind(input.characterId, timestamp, timestamp),
        ];
        if (input.action !== undefined) {
          statements.push(actionUpdate(this.binding, input.event, input.action));
        }
        const results = await this.binding.batch(statements);
        return results.every((result) => changes(result) === 1);
      } catch (error) {
        if (attempt === 0 && shouldRetrySequence(error)) continue;
        throw error;
      }
    }
    return false;
  }

  async restoreDailyResources(input: {
    event: GameEventWrite;
    characterId: string;
  }): Promise<void> {
    const timestamp = Math.floor(input.event.occurredAt.getTime() / 1000);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await this.binding.batch([
          eventStatement(this.binding, input.event),
          this.binding
            .prepare(
              `UPDATE dnd35_character_spell_preparations
               SET expended_count = 0, updated_at = ?
               WHERE casting_track_id IN (
                 SELECT id FROM dnd35_character_casting_tracks WHERE character_id = ?
               )`,
            )
            .bind(timestamp, input.characterId),
          this.binding
            .prepare(
              `DELETE FROM dnd35_character_spontaneous_slot_usage
               WHERE casting_track_id IN (
                 SELECT id FROM dnd35_character_casting_tracks WHERE character_id = ?
               )`,
            )
            .bind(input.characterId),
          this.binding
            .prepare(
              `UPDATE dnd35_characters
               SET power_points_spent = 0, updated_at = ?
               WHERE character_id = ?`,
            )
            .bind(timestamp, input.characterId),
        ]);
        return;
      } catch (error) {
        if (attempt === 0 && shouldRetrySequence(error)) continue;
        throw error;
      }
    }
  }
}
