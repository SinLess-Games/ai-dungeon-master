/// <reference types="@cloudflare/workers-types" />

import { and, eq, inArray } from "drizzle-orm";
import type { Database } from "@/infrastructure/database/client";
import {
  gameActors,
  gameEncounters,
  monsters,
  runtimeDnd35MonsterInstances,
} from "@/infrastructure/database/schema";
import { abilityModifier } from "@/rulesets/dnd35";
import { createEncounterState, currentEncounterParticipant } from "../domain/encounterRuntime";
import { loadActiveGameContext, loadEffectiveAbility } from "./d1Dnd35State";
import type { ActiveEncounterView, EncounterServiceDependencies } from "./encounterService";

async function requireContext(deps: EncounterServiceDependencies, campaignId: string) {
  const context = await loadActiveGameContext(deps.db, campaignId);
  if (!context) throw new Error("CAMPAIGN_GAME_NOT_ACTIVE");
  if (context.rulesetId !== "dnd35" || context.rulesetVersion !== "3.5") {
    throw new Error("CAMPAIGN_RULESET_UNSUPPORTED");
  }
  return context;
}

function unix(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

function shouldRetrySequence(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /game_events_campaign_sequence_uidx|UNIQUE constraint failed: game_events\.campaign_id, game_events\.sequence/i.test(
    message,
  );
}

async function initiativeModifierForActor(
  db: Database,
  actor: typeof gameActors.$inferSelect,
): Promise<number> {
  if (actor.kind === "character") {
    if (!actor.characterId) throw new Error("ENCOUNTER_PARTICIPANT_INVALID");
    const dexterity = await loadEffectiveAbility(db, actor.characterId, "dex");
    if (dexterity === null) throw new Error("ENCOUNTER_PARTICIPANT_INVALID");
    return abilityModifier(dexterity);
  }

  if (actor.kind === "monster") {
    const row = await db
      .select({ dexterity: monsters.dex })
      .from(runtimeDnd35MonsterInstances)
      .innerJoin(monsters, eq(runtimeDnd35MonsterInstances.monsterId, monsters.id))
      .where(eq(runtimeDnd35MonsterInstances.actorId, actor.id))
      .get();
    if (!row) throw new Error("ENCOUNTER_PARTICIPANT_INVALID");
    return row.dexterity === null ? 0 : abilityModifier(row.dexterity);
  }

  // Generic NPC actors do not yet have a ruleset-specific combat snapshot.
  // Reject them instead of inventing ability scores; a later NPC runtime can
  // opt them into combat by providing the same authoritative adapter.
  throw new Error("ENCOUNTER_PARTICIPANT_INVALID");
}

export async function startActorEncounter(
  deps: EncounterServiceDependencies,
  input: { campaignId: string; participantIds: readonly string[] },
): Promise<ActiveEncounterView> {
  if (input.participantIds.length === 0) {
    throw new RangeError("An encounter requires participants.");
  }

  const participantIds = [...new Set(input.participantIds.map((id) => id.trim()))];
  if (
    participantIds.some((id) => id.length === 0) ||
    participantIds.length !== input.participantIds.length
  ) {
    throw new RangeError("Encounter participants must be unique, non-empty actor ids.");
  }

  const context = await requireContext(deps, input.campaignId);
  const existing = await deps.db
    .select({ id: gameEncounters.id })
    .from(gameEncounters)
    .where(
      and(
        eq(gameEncounters.sessionId, context.sessionId),
        eq(gameEncounters.status, "active"),
      ),
    )
    .get();
  if (existing) throw new Error("ENCOUNTER_ALREADY_ACTIVE");

  const actors = await deps.db
    .select()
    .from(gameActors)
    .where(
      and(
        eq(gameActors.campaignId, input.campaignId),
        eq(gameActors.worldId, context.worldId),
        eq(gameActors.status, "active"),
        inArray(gameActors.id, participantIds),
      ),
    )
    .all();
  if (actors.length !== participantIds.length) {
    throw new Error("ENCOUNTER_PARTICIPANT_INVALID");
  }
  const byId = new Map(actors.map((actor) => [actor.id, actor]));

  const initiativeRoller = deps.rollInitiative ?? (() => Math.floor(Math.random() * 20) + 1);
  const seeds = await Promise.all(
    participantIds.map(async (actorId) => {
      const actor = byId.get(actorId);
      if (!actor) throw new Error("ENCOUNTER_PARTICIPANT_INVALID");
      const initiativeRoll = initiativeRoller();
      if (!Number.isSafeInteger(initiativeRoll) || initiativeRoll < 1 || initiativeRoll > 20) {
        throw new RangeError("Initiative roller must return an integer from 1 through 20.");
      }
      const initiativeModifier = await initiativeModifierForActor(deps.db, actor);
      // Encounter runtime predates GameActor and calls the identity characterId.
      // At this boundary the value is intentionally the canonical actor id.
      return {
        characterId: actorId,
        initiativeRoll,
        initiativeModifier,
        tieBreaker: initiativeModifier,
      };
    }),
  );

  const state = createEncounterState(seeds);
  const createId = deps.createId ?? (() => crypto.randomUUID());
  const now = deps.now ?? (() => new Date());
  const encounterId = createId();
  const eventId = createId();
  const occurredAt = now();
  const timestamp = unix(occurredAt);

  const encounterInsert = deps.binding
    .prepare(
      `INSERT INTO game_encounters (
        id, campaign_id, session_id, status, round_number, active_turn_index,
        started_at, created_at, updated_at
      ) VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?)`,
    )
    .bind(
      encounterId,
      context.campaignId,
      context.sessionId,
      state.roundNumber,
      state.activeTurnIndex,
      timestamp,
      timestamp,
      timestamp,
    );

  const participantInserts = state.participants.map((participant) => {
    const actor = byId.get(participant.characterId);
    if (!actor) throw new Error("ENCOUNTER_PARTICIPANT_INVALID");
    return deps.binding
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
        createId(),
        encounterId,
        actor.id,
        actor.characterId,
        participant.initiativeRoll,
        participant.initiativeModifier,
        participant.initiativeTotal,
        participant.tieBreaker,
        participant.turnOrder,
        participant.standardAvailable ? 1 : 0,
        participant.moveAvailable ? 1 : 0,
        participant.swiftAvailable ? 1 : 0,
        participant.swiftDebtNextTurn ? 1 : 0,
        participant.attacksOfOpportunityPerRound,
        participant.attacksOfOpportunityRemaining,
        participant.lastTurnRound,
        timestamp,
        timestamp,
      );
  });

  const event = deps.binding
    .prepare(
      `INSERT INTO game_events (
        id, campaign_id, session_id, sequence, event_type, occurred_at,
        actor_id, source_id, target_ids, payload, deltas, created_at
      ) VALUES (
        ?, ?, ?,
        (SELECT COALESCE(MAX(sequence), 0) + 1 FROM game_events WHERE campaign_id = ?),
        'encounter.started', ?, NULL, NULL, ?, ?, '[]', ?
      )`,
    )
    .bind(
      eventId,
      context.campaignId,
      context.sessionId,
      context.campaignId,
      timestamp,
      JSON.stringify(state.participants.map((participant) => participant.characterId)),
      JSON.stringify({
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
      }),
      timestamp,
    );

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await deps.binding.batch([encounterInsert, ...participantInserts, event]);
      break;
    } catch (error) {
      if (attempt === 0 && shouldRetrySequence(error)) continue;
      const message = error instanceof Error ? error.message : String(error);
      if (
        /game_encounters_one_active_per_session_uidx|UNIQUE constraint failed: game_encounters\.session_id/i.test(
          message,
        )
      ) {
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
