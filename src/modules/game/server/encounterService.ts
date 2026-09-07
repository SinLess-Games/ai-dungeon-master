/// <reference types="@cloudflare/workers-types" />

import { and, asc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/infrastructure/database/client";
import {
  characters,
  gameEncounterParticipants,
  gameEncounters,
} from "@/infrastructure/database/schema";
import { abilityModifier } from "@/rulesets/dnd35";
import {
  advanceEncounterTurn,
  createEncounterState,
  currentEncounterParticipant,
  type EncounterParticipantState,
  type EncounterState,
} from "../domain/encounterRuntime";
import { loadActiveGameContext, loadEffectiveAbility } from "./d1Dnd35State";

export interface EncounterServiceDependencies {
  db: Database;
  binding: D1Database;
  createId?: () => string;
  now?: () => Date;
  rollInitiative?: () => number;
}

export interface ActiveEncounterView {
  id: string;
  campaignId: string;
  sessionId: string;
  status: "active";
  roundNumber: number;
  activeTurnIndex: number;
  /** Legacy name retained at the domain boundary; value is the canonical actor id. */
  currentCharacterId: string;
  participants: readonly EncounterParticipantState[];
}

function runtime(deps: EncounterServiceDependencies) {
  return {
    id: deps.createId ?? (() => crypto.randomUUID()),
    now: deps.now ?? (() => new Date()),
    initiative: deps.rollInitiative ?? (() => Math.floor(Math.random() * 20) + 1),
  };
}

function unix(date: Date): number {
  return Math.floor(date.getTime() / 1000);
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

function eventInsert(
  binding: D1Database,
  input: {
    id: string;
    campaignId: string;
    sessionId: string;
    eventType: string;
    occurredAt: Date;
    actorId?: string | null;
    targetIds?: readonly string[];
    payload?: Record<string, unknown>;
    guardSql?: string;
    guardBindings?: readonly unknown[];
  },
): D1PreparedStatement {
  const guard = input.guardSql ?? "1 = 1";
  const timestamp = unix(input.occurredAt);
  return binding
    .prepare(
      `INSERT INTO game_events (
        id, campaign_id, session_id, sequence, event_type, occurred_at,
        actor_id, source_id, target_ids, payload, deltas, created_at
      )
      SELECT ?, ?, ?,
        (SELECT COALESCE(MAX(sequence), 0) + 1 FROM game_events WHERE campaign_id = ?),
        ?, ?, ?, NULL, ?, ?, '[]', ?
      WHERE ${guard}`,
    )
    .bind(
      input.id,
      input.campaignId,
      input.sessionId,
      input.campaignId,
      input.eventType,
      timestamp,
      input.actorId ?? null,
      JSON.stringify(input.targetIds ?? []),
      JSON.stringify(input.payload ?? {}),
      timestamp,
      ...(input.guardBindings ?? []),
    );
}

async function requireDnd35Context(deps: EncounterServiceDependencies, campaignId: string) {
  const context = await loadActiveGameContext(deps.db, campaignId);
  if (!context) throw new Error("CAMPAIGN_GAME_NOT_ACTIVE");
  if (context.rulesetId !== "dnd35" || context.rulesetVersion !== "3.5") {
    throw new Error("CAMPAIGN_RULESET_UNSUPPORTED");
  }
  return context;
}

function rowToParticipant(row: typeof gameEncounterParticipants.$inferSelect): EncounterParticipantState {
  return {
    characterId: row.actorId,
    initiativeRoll: row.initiativeRoll,
    initiativeModifier: row.initiativeModifier,
    initiativeTotal: row.initiativeTotal,
    tieBreaker: row.tieBreaker,
    turnOrder: row.turnOrder,
    standardAvailable: row.standardAvailable,
    moveAvailable: row.moveAvailable,
    swiftAvailable: row.swiftAvailable,
    swiftDebtNextTurn: row.swiftDebtNextTurn,
    attacksOfOpportunityPerRound: row.attacksOfOpportunityPerRound,
    attacksOfOpportunityRemaining: row.attacksOfOpportunityRemaining,
    lastTurnRound: row.lastTurnRound,
  };
}

async function loadEncounterRows(
  deps: EncounterServiceDependencies,
  campaignId: string,
  encounterId?: string,
) {
  const context = await requireDnd35Context(deps, campaignId);
  const clauses = [
    eq(gameEncounters.campaignId, campaignId),
    eq(gameEncounters.sessionId, context.sessionId),
    eq(gameEncounters.status, "active"),
  ];
  if (encounterId !== undefined) clauses.push(eq(gameEncounters.id, encounterId));

  const encounter = await deps.db
    .select()
    .from(gameEncounters)
    .where(and(...clauses))
    .get();
  if (!encounter) return { context, encounter: null, participants: [] as const };

  const participants = await deps.db
    .select()
    .from(gameEncounterParticipants)
    .where(eq(gameEncounterParticipants.encounterId, encounter.id))
    .orderBy(asc(gameEncounterParticipants.turnOrder))
    .all();
  return { context, encounter, participants };
}

function encounterState(
  encounter: typeof gameEncounters.$inferSelect,
  participants: readonly (typeof gameEncounterParticipants.$inferSelect)[],
): EncounterState {
  return {
    roundNumber: encounter.roundNumber,
    activeTurnIndex: encounter.activeTurnIndex,
    participants: participants.map(rowToParticipant),
  };
}

export async function getActiveEncounter(
  deps: EncounterServiceDependencies,
  campaignId: string,
): Promise<ActiveEncounterView | null> {
  const loaded = await loadEncounterRows(deps, campaignId);
  if (!loaded.encounter) return null;
  const state = encounterState(loaded.encounter, loaded.participants);
  const current = currentEncounterParticipant(state);
  if (!current) throw new Error("ENCOUNTER_STATE_INVALID");
  return {
    id: loaded.encounter.id,
    campaignId: loaded.encounter.campaignId,
    sessionId: loaded.encounter.sessionId,
    status: "active",
    roundNumber: state.roundNumber,
    activeTurnIndex: state.activeTurnIndex,
    currentCharacterId: current.characterId,
    participants: state.participants,
  };
}

export async function startEncounter(
  deps: EncounterServiceDependencies,
  input: { campaignId: string; participantIds: readonly string[] },
): Promise<ActiveEncounterView> {
  if (input.participantIds.length === 0) throw new RangeError("An encounter requires participants.");
  const participantIds = [...new Set(input.participantIds.map((id) => id.trim()))];
  if (participantIds.some((id) => id.length === 0) || participantIds.length !== input.participantIds.length) {
    throw new RangeError("Encounter participants must be unique, non-empty character ids.");
  }

  const context = await requireDnd35Context(deps, input.campaignId);
  const existing = await deps.db
    .select({ id: gameEncounters.id })
    .from(gameEncounters)
    .where(and(eq(gameEncounters.sessionId, context.sessionId), eq(gameEncounters.status, "active")))
    .get();
  if (existing) throw new Error("ENCOUNTER_ALREADY_ACTIVE");

  const characterRows = await deps.db
    .select({ id: characters.id })
    .from(characters)
    .where(
      and(
        eq(characters.campaignId, input.campaignId),
        eq(characters.status, "active"),
        inArray(characters.id, participantIds),
      ),
    )
    .all();
  if (characterRows.length !== participantIds.length) throw new Error("ENCOUNTER_PARTICIPANT_INVALID");

  const rt = runtime(deps);
  const seeds = await Promise.all(
    participantIds.map(async (characterId) => {
      const dexterity = await loadEffectiveAbility(deps.db, characterId, "dex");
      if (dexterity === null) throw new Error("ENCOUNTER_PARTICIPANT_INVALID");
      const initiativeRoll = rt.initiative();
      if (!Number.isSafeInteger(initiativeRoll) || initiativeRoll < 1 || initiativeRoll > 20) {
        throw new RangeError("Initiative roller must return an integer from 1 through 20.");
      }
      const initiativeModifier = abilityModifier(dexterity);
      return { characterId, initiativeRoll, initiativeModifier, tieBreaker: initiativeModifier };
    }),
  );
  const state = createEncounterState(seeds);
  const encounterId = rt.id();
  const eventId = rt.id();
  const occurredAt = rt.now();
  const timestamp = unix(occurredAt);

  const encounterInsert = deps.binding
    .prepare(
      `INSERT INTO game_encounters (
        id, campaign_id, session_id, status, round_number, active_turn_index,
        started_at, created_at, updated_at
      ) VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?)`,
    )
    .bind(encounterId, context.campaignId, context.sessionId, state.roundNumber, state.activeTurnIndex, timestamp, timestamp, timestamp);

  const participantInserts = state.participants.map((participant) =>
    deps.binding
      .prepare(
        `INSERT INTO game_encounter_participants (
          id, encounter_id, actor_id, character_id, status,
          initiative_roll, initiative_modifier, initiative_total, tie_breaker, turn_order,
          standard_available, move_available, swift_available, swift_debt_next_turn,
          attacks_of_opportunity_per_round, attacks_of_opportunity_remaining,
          last_turn_round, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        rt.id(), encounterId, participant.characterId, participant.characterId,
        participant.initiativeRoll, participant.initiativeModifier, participant.initiativeTotal,
        participant.tieBreaker, participant.turnOrder,
        participant.standardAvailable ? 1 : 0, participant.moveAvailable ? 1 : 0,
        participant.swiftAvailable ? 1 : 0, participant.swiftDebtNextTurn ? 1 : 0,
        participant.attacksOfOpportunityPerRound, participant.attacksOfOpportunityRemaining,
        participant.lastTurnRound, timestamp, timestamp,
      ),
  );

  const startedEvent = eventInsert(deps.binding, {
    id: eventId,
    campaignId: context.campaignId,
    sessionId: context.sessionId,
    eventType: "encounter.started",
    occurredAt,
    targetIds: state.participants.map((participant) => participant.characterId),
    payload: {
      encounterId,
      roundNumber: state.roundNumber,
      currentActorId: state.participants[state.activeTurnIndex]?.characterId ?? null,
      initiative: state.participants.map((participant) => ({
        actorId: participant.characterId,
        roll: participant.initiativeRoll,
        modifier: participant.initiativeModifier,
        total: participant.initiativeTotal,
        turnOrder: participant.turnOrder,
      })),
    },
  });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await deps.binding.batch([encounterInsert, ...participantInserts, startedEvent]);
      break;
    } catch (error) {
      if (attempt === 0 && shouldRetrySequence(error)) continue;
      const message = error instanceof Error ? error.message : String(error);
      if (/game_encounters_one_active_per_session_uidx|UNIQUE constraint failed: game_encounters\.session_id/i.test(message)) {
        throw new Error("ENCOUNTER_ALREADY_ACTIVE");
      }
      throw error;
    }
  }

  const current = currentEncounterParticipant(state);
  if (!current) throw new Error("ENCOUNTER_STATE_INVALID");
  return {
    id: encounterId,
    campaignId: context.campaignId,
    sessionId: context.sessionId,
    status: "active",
    roundNumber: state.roundNumber,
    activeTurnIndex: state.activeTurnIndex,
    currentCharacterId: current.characterId,
    participants: state.participants,
  };
}

export async function endEncounterTurn(
  deps: EncounterServiceDependencies,
  input: { campaignId: string; encounterId: string; actorId: string },
): Promise<ActiveEncounterView & { roundAdvanced: boolean; previousCharacterId: string }> {
  const loaded = await loadEncounterRows(deps, input.campaignId, input.encounterId);
  if (!loaded.encounter) throw new Error("ENCOUNTER_NOT_ACTIVE");
  const before = encounterState(loaded.encounter, loaded.participants);
  const current = currentEncounterParticipant(before);
  if (!current) throw new Error("ENCOUNTER_STATE_INVALID");
  if (current.characterId !== input.actorId) throw new Error("ENCOUNTER_NOT_ACTORS_TURN");

  const advanced = advanceEncounterTurn(before);
  if (!advanced.ok) throw new Error(advanced.errors[0]?.message ?? "Unable to advance encounter turn.");
  const rt = runtime(deps);
  const occurredAt = rt.now();
  const timestamp = unix(occurredAt);
  const conditionEncounterId = loaded.encounter.id;
  const guardSql = `EXISTS (
    SELECT 1 FROM game_encounters
    WHERE id = ? AND campaign_id = ? AND session_id = ? AND status = 'active'
      AND round_number = ? AND active_turn_index = ?
  )`;
  const guardBindings = [
    loaded.encounter.id, loaded.encounter.campaignId, loaded.encounter.sessionId,
    loaded.encounter.roundNumber, loaded.encounter.activeTurnIndex,
  ] as const;

  const turnEvent = eventInsert(deps.binding, {
    id: rt.id(),
    campaignId: loaded.encounter.campaignId,
    sessionId: loaded.encounter.sessionId,
    eventType: advanced.value.roundAdvanced ? "encounter.round_advanced" : "encounter.turn_advanced",
    occurredAt,
    actorId: input.actorId,
    targetIds: [advanced.value.currentCharacterId],
    payload: {
      encounterId: loaded.encounter.id,
      previousActorId: advanced.value.previousCharacterId,
      currentActorId: advanced.value.currentCharacterId,
      roundNumber: advanced.value.state.roundNumber,
      roundAdvanced: advanced.value.roundAdvanced,
    },
    guardSql,
    guardBindings,
  });

  const participantUpdates = advanced.value.state.participants.map((participant) =>
    deps.binding
      .prepare(
        `UPDATE game_encounter_participants
         SET standard_available = ?, move_available = ?, swift_available = ?, swift_debt_next_turn = ?,
             attacks_of_opportunity_per_round = ?, attacks_of_opportunity_remaining = ?,
             last_turn_round = ?, updated_at = ?
         WHERE encounter_id = ? AND actor_id = ? AND ${guardSql}`,
      )
      .bind(
        participant.standardAvailable ? 1 : 0, participant.moveAvailable ? 1 : 0,
        participant.swiftAvailable ? 1 : 0, participant.swiftDebtNextTurn ? 1 : 0,
        participant.attacksOfOpportunityPerRound, participant.attacksOfOpportunityRemaining,
        participant.lastTurnRound, timestamp, conditionEncounterId, participant.characterId,
        ...guardBindings,
      ),
  );

  const destinationRound = advanced.value.state.roundNumber;
  const destinationTurnOrder = advanced.value.state.activeTurnIndex;

  function expiryStatements(tableName: string): D1PreparedStatement[] {
    return [
      deps.binding
        .prepare(
          `DELETE FROM ${tableName}
           WHERE encounter_id = ? AND duration_kind = 'rounds'
             AND expires_encounter_round IS NOT NULL AND expires_turn_order IS NOT NULL
             AND (expires_encounter_round < ? OR (expires_encounter_round = ? AND expires_turn_order <= ?))
             AND ${guardSql}`,
        )
        .bind(conditionEncounterId, destinationRound, destinationRound, destinationTurnOrder, ...guardBindings),
      deps.binding
        .prepare(
          `UPDATE ${tableName}
           SET remaining_rounds = remaining_rounds - 1, updated_at = ?
           WHERE encounter_id = ? AND duration_kind = 'rounds'
             AND expires_encounter_round IS NOT NULL AND expires_turn_order = ?
             AND expires_encounter_round > ? AND remaining_rounds > 1
             AND ${guardSql}`,
        )
        .bind(timestamp, conditionEncounterId, destinationTurnOrder, destinationRound, ...guardBindings),
    ];
  }

  const conditionStatements = [
    ...expiryStatements("dnd35_character_conditions"),
    ...expiryStatements("runtime_dnd35_actor_conditions"),
  ];

  const encounterUpdate = deps.binding
    .prepare(
      `UPDATE game_encounters
       SET round_number = ?, active_turn_index = ?, updated_at = ?
       WHERE id = ? AND campaign_id = ? AND session_id = ? AND status = 'active'
         AND round_number = ? AND active_turn_index = ?`,
    )
    .bind(
      advanced.value.state.roundNumber, advanced.value.state.activeTurnIndex, timestamp,
      loaded.encounter.id, loaded.encounter.campaignId, loaded.encounter.sessionId,
      loaded.encounter.roundNumber, loaded.encounter.activeTurnIndex,
    );

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const results = await deps.binding.batch([turnEvent, ...participantUpdates, ...conditionStatements, encounterUpdate]);
      if (changes(results[0]) !== 1 || changes(results.at(-1)) !== 1) throw new Error("GAME_STATE_CONFLICT");
      break;
    } catch (error) {
      if (attempt === 0 && shouldRetrySequence(error)) continue;
      throw error;
    }
  }

  const next = currentEncounterParticipant(advanced.value.state);
  if (!next) throw new Error("ENCOUNTER_STATE_INVALID");
  return {
    id: loaded.encounter.id,
    campaignId: loaded.encounter.campaignId,
    sessionId: loaded.encounter.sessionId,
    status: "active",
    roundNumber: advanced.value.state.roundNumber,
    activeTurnIndex: advanced.value.state.activeTurnIndex,
    currentCharacterId: next.characterId,
    participants: advanced.value.state.participants,
    roundAdvanced: advanced.value.roundAdvanced,
    previousCharacterId: advanced.value.previousCharacterId,
  };
}

export async function finishEncounter(
  deps: EncounterServiceDependencies,
  input: { campaignId: string; encounterId: string; status?: "completed" | "abandoned" },
): Promise<{ encounterId: string; status: "completed" | "abandoned" }> {
  const loaded = await loadEncounterRows(deps, input.campaignId, input.encounterId);
  if (!loaded.encounter) throw new Error("ENCOUNTER_NOT_ACTIVE");
  const status = input.status ?? "completed";
  const rt = runtime(deps);
  const occurredAt = rt.now();
  const timestamp = unix(occurredAt);
  const guardSql = `EXISTS (
    SELECT 1 FROM game_encounters WHERE id = ? AND campaign_id = ? AND session_id = ? AND status = 'active'
  )`;
  const guardBindings = [loaded.encounter.id, loaded.encounter.campaignId, loaded.encounter.sessionId] as const;
  const event = eventInsert(deps.binding, {
    id: rt.id(),
    campaignId: loaded.encounter.campaignId,
    sessionId: loaded.encounter.sessionId,
    eventType: status === "completed" ? "encounter.completed" : "encounter.abandoned",
    occurredAt,
    targetIds: loaded.participants.map((participant) => participant.actorId),
    payload: { encounterId: loaded.encounter.id, roundNumber: loaded.encounter.roundNumber },
    guardSql,
    guardBindings,
  });
  const update = deps.binding
    .prepare(
      `UPDATE game_encounters
       SET status = ?, ended_at = ?, updated_at = ?
       WHERE id = ? AND campaign_id = ? AND session_id = ? AND status = 'active'`,
    )
    .bind(status, timestamp, timestamp, loaded.encounter.id, loaded.encounter.campaignId, loaded.encounter.sessionId);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const results = await deps.binding.batch([event, update]);
      if (changes(results[0]) !== 1 || changes(results[1]) !== 1) throw new Error("GAME_STATE_CONFLICT");
      return { encounterId: loaded.encounter.id, status };
    } catch (error) {
      if (attempt === 0 && shouldRetrySequence(error)) continue;
      throw error;
    }
  }
  throw new Error("GAME_STATE_CONFLICT");
}

export async function loadEncounterStateForAction(
  deps: EncounterServiceDependencies,
  campaignId: string,
): Promise<{ encounterId: string; state: EncounterState } | null> {
  const loaded = await loadEncounterRows(deps, campaignId);
  if (!loaded.encounter) return null;
  return { encounterId: loaded.encounter.id, state: encounterState(loaded.encounter, loaded.participants) };
}
