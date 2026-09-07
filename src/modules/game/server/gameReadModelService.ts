/// <reference types="@cloudflare/workers-types" />

import type { Database } from "@/infrastructure/database/client";
import { consciousnessState, type Dnd35HealthPool } from "@/rulesets/dnd35";
import { loadActiveGameContext, loadHealthSnapshot } from "./d1Dnd35State";

export interface GameReadModelDependencies {
  db: Database;
  binding: D1Database;
}

interface ActorRow {
  id: string;
  kind: "character" | "monster" | "npc";
  character_id: string | null;
  controller_user_id: string | null;
  name: string;
  status: string;
  metadata: string;
  character_stable: number | null;
  monster_maximum_hit_points: number | null;
  monster_current_hit_points: number | null;
  monster_temporary_hit_points: number | null;
  monster_nonlethal_damage: number | null;
  monster_stable: number | null;
}

interface EncounterRow {
  id: string;
  round_number: number;
  active_turn_index: number;
  started_at: number;
}

interface ParticipantRow {
  actor_id: string;
  status: string;
  initiative_roll: number;
  initiative_modifier: number;
  initiative_total: number;
  turn_order: number;
  standard_available: number;
  move_available: number;
  swift_available: number;
  attacks_of_opportunity_remaining: number;
}

interface ConditionRow {
  id: string;
  actor_id: string;
  condition_id: string;
  source_actor_id: string | null;
  source_description: string | null;
  duration_kind: string;
  remaining_rounds: number | null;
  encounter_id: string | null;
  expires_encounter_round: number | null;
  expires_turn_order: number | null;
  expires_at: number | null;
  state: string | null;
}

interface EventRow {
  id: string;
  sequence: number;
  event_type: string;
  occurred_at: number;
  actor_id: string | null;
  source_id: string | null;
  target_ids: string;
  payload: string;
  deltas: string;
}

function json<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function healthView(pool: Dnd35HealthPool) {
  return {
    maximumHitPoints: pool.maximumHitPoints,
    currentHitPoints: pool.currentHitPoints,
    temporaryHitPoints: pool.temporaryHitPoints,
    nonlethalDamage: pool.nonlethalDamage,
    stable: pool.stable,
    state: consciousnessState(pool),
  };
}

async function actorHealth(
  deps: GameReadModelDependencies,
  campaignId: string,
  row: ActorRow,
) {
  if (row.kind === "character") {
    if (!row.character_id) return null;
    const snapshot = await loadHealthSnapshot({
      db: deps.db,
      campaignId,
      characterId: row.character_id,
    });
    if (!snapshot || row.character_stable === null) return null;
    return healthView({
      maximumHitPoints: snapshot.maximumHitPoints,
      currentHitPoints: snapshot.currentHitPoints,
      temporaryHitPoints: snapshot.temporaryHitPoints,
      nonlethalDamage: snapshot.nonlethalDamage,
      stable: row.character_stable !== 0,
    });
  }

  if (row.kind === "monster") {
    if (
      row.monster_maximum_hit_points === null ||
      row.monster_current_hit_points === null ||
      row.monster_stable === null
    ) {
      return null;
    }
    return healthView({
      maximumHitPoints: row.monster_maximum_hit_points,
      currentHitPoints: row.monster_current_hit_points,
      temporaryHitPoints: row.monster_temporary_hit_points ?? 0,
      nonlethalDamage: row.monster_nonlethal_damage ?? 0,
      stable: row.monster_stable !== 0,
    });
  }

  return null;
}

/**
 * Stable hydration/reconnect projection for UI and AI consumers.
 * D1 is read directly so a hibernated/missing Durable Object can never block
 * authoritative state reconstruction.
 */
export async function getCampaignGameReadModel(
  deps: GameReadModelDependencies,
  input: { campaignId: string; afterSequence?: number; eventLimit?: number },
) {
  const context = await loadActiveGameContext(deps.db, input.campaignId);
  if (!context) throw new Error("CAMPAIGN_GAME_NOT_ACTIVE");

  const afterSequence = input.afterSequence ?? 0;
  const eventLimit = input.eventLimit ?? 100;
  if (!Number.isSafeInteger(afterSequence) || afterSequence < 0) {
    throw new RangeError("afterSequence must be a non-negative safe integer.");
  }
  if (!Number.isSafeInteger(eventLimit) || eventLimit < 1 || eventLimit > 500) {
    throw new RangeError("eventLimit must be an integer from 1 through 500.");
  }

  const [actorResult, encounter, sequenceRow, eventResult] = await Promise.all([
    deps.binding
      .prepare(
        `SELECT actor.id, actor.kind, actor.character_id, actor.controller_user_id,
                actor.name, actor.status, actor.metadata,
                dnd.stable AS character_stable,
                monster.maximum_hit_points AS monster_maximum_hit_points,
                monster.current_hit_points AS monster_current_hit_points,
                monster.temporary_hit_points AS monster_temporary_hit_points,
                monster.nonlethal_damage AS monster_nonlethal_damage,
                monster.stable AS monster_stable
         FROM game_actors actor
         LEFT JOIN dnd35_characters dnd ON dnd.character_id = actor.character_id
         LEFT JOIN runtime_dnd35_monster_instances monster ON monster.actor_id = actor.id
         WHERE actor.campaign_id = ? AND actor.world_id = ?
           AND actor.status IN ('active', 'defeated')
         ORDER BY actor.created_at ASC, actor.id ASC`,
      )
      .bind(context.campaignId, context.worldId)
      .all<ActorRow>(),
    deps.binding
      .prepare(
        `SELECT id, round_number, active_turn_index, started_at
         FROM game_encounters
         WHERE campaign_id = ? AND session_id = ? AND status = 'active'
         ORDER BY started_at DESC LIMIT 1`,
      )
      .bind(context.campaignId, context.sessionId)
      .first<EncounterRow>(),
    deps.binding
      .prepare(`SELECT COALESCE(MAX(sequence), 0) AS sequence FROM game_events WHERE campaign_id = ?`)
      .bind(context.campaignId)
      .first<{ sequence: number }>(),
    deps.binding
      .prepare(
        `SELECT id, sequence, event_type, occurred_at, actor_id, source_id,
                target_ids, payload, deltas
         FROM game_events
         WHERE campaign_id = ? AND sequence > ?
         ORDER BY sequence ASC
         LIMIT ?`,
      )
      .bind(context.campaignId, afterSequence, eventLimit)
      .all<EventRow>(),
  ]);

  const actors = await Promise.all(
    actorResult.results.map(async (row) => ({
      id: row.id,
      kind: row.kind,
      characterId: row.character_id,
      controllerUserId: row.controller_user_id,
      name: row.name,
      status: row.status,
      metadata: json<Record<string, unknown>>(row.metadata, {}),
      health: await actorHealth(deps, context.campaignId, row),
    })),
  );

  let activeEncounter: null | {
    id: string;
    roundNumber: number;
    activeTurnIndex: number;
    currentActorId: string | null;
    participants: Array<Record<string, unknown>>;
  } = null;
  if (encounter) {
    const participantResult = await deps.binding
      .prepare(
        `SELECT actor_id, status, initiative_roll, initiative_modifier, initiative_total,
                turn_order, standard_available, move_available, swift_available,
                attacks_of_opportunity_remaining
         FROM game_encounter_participants
         WHERE encounter_id = ?
         ORDER BY turn_order ASC`,
      )
      .bind(encounter.id)
      .all<ParticipantRow>();
    const participants = participantResult.results.map((row) => ({
      actorId: row.actor_id,
      status: row.status,
      initiativeRoll: row.initiative_roll,
      initiativeModifier: row.initiative_modifier,
      initiativeTotal: row.initiative_total,
      turnOrder: row.turn_order,
      actionEconomy: {
        standardAvailable: row.standard_available === 1,
        moveAvailable: row.move_available === 1,
        swiftAvailable: row.swift_available === 1,
        attacksOfOpportunityRemaining: row.attacks_of_opportunity_remaining,
      },
    }));
    activeEncounter = {
      id: encounter.id,
      roundNumber: encounter.round_number,
      activeTurnIndex: encounter.active_turn_index,
      currentActorId:
        (participants[encounter.active_turn_index] as { actorId?: string } | undefined)?.actorId ?? null,
      participants,
    };
  }

  const conditionResult = await deps.binding
    .prepare(
      `SELECT id, actor_id, condition_id, source_actor_id, source_description,
              duration_kind, remaining_rounds, encounter_id, expires_encounter_round,
              expires_turn_order, expires_at, state
       FROM runtime_dnd35_actor_conditions
       WHERE actor_id IN (
         SELECT id FROM game_actors
         WHERE campaign_id = ? AND status IN ('active', 'defeated')
       )
       UNION ALL
       SELECT condition.id, actor.id AS actor_id, condition.condition_id,
              condition.source_character_id AS source_actor_id, condition.source_description,
              condition.duration_kind, condition.remaining_rounds, condition.encounter_id,
              condition.expires_encounter_round, condition.expires_turn_order,
              condition.expires_at, condition.state
       FROM dnd35_character_conditions condition
       JOIN game_actors actor ON actor.character_id = condition.character_id
       WHERE actor.campaign_id = ? AND actor.status IN ('active', 'defeated')`,
    )
    .bind(context.campaignId, context.campaignId)
    .all<ConditionRow>();

  return {
    schemaVersion: 1 as const,
    campaignId: context.campaignId,
    worldId: context.worldId,
    sessionId: context.sessionId,
    ruleset: { id: context.rulesetId, version: context.rulesetVersion },
    sequence: sequenceRow?.sequence ?? 0,
    actors,
    encounter: activeEncounter,
    conditions: conditionResult.results.map((row) => ({
      id: row.id,
      actorId: row.actor_id,
      conditionId: row.condition_id,
      sourceActorId: row.source_actor_id,
      sourceDescription: row.source_description,
      durationKind: row.duration_kind,
      remainingRounds: row.remaining_rounds,
      encounterId: row.encounter_id,
      expiresEncounterRound: row.expires_encounter_round,
      expiresTurnOrder: row.expires_turn_order,
      expiresAt: row.expires_at,
      state: json<Record<string, unknown> | null>(row.state, null),
    })),
    events: eventResult.results.map((row) => ({
      id: row.id,
      sequence: row.sequence,
      type: row.event_type,
      occurredAt: row.occurred_at,
      actorId: row.actor_id,
      sourceId: row.source_id,
      targetIds: json<string[]>(row.target_ids, []),
      payload: json<Record<string, unknown>>(row.payload, {}),
      deltas: json<unknown[]>(row.deltas, []),
    })),
  };
}
