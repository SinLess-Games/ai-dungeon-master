/// <reference types="@cloudflare/workers-types" />

import type { Database } from "@/infrastructure/database/client";
import {
  alignmentToScores,
  applyAlignmentDrift,
  applyHealing,
  applyLethalDamage,
  consciousnessState,
  type Dnd35Alignment,
} from "@/rulesets/dnd35";
import { createRoundConditionAnchor } from "../domain/conditionTiming";
import { loadActorDefenseSnapshot } from "./actorCombatState";
import { D1ActorHealthStore } from "./d1ActorHealthStore";
import { loadActiveGameContext } from "./d1Dnd35State";
import type { GameEventWrite } from "./d1GameEventStore";

export interface DmStateMutationDependencies {
  db: Database;
  binding: D1Database;
  createId?: () => string;
  now?: () => Date;
}

interface CharacterActorRow {
  actorId: string;
  characterId: string;
  name: string;
}

interface AlignmentStateRow {
  lawChaosScore: number;
  goodEvilScore: number;
}

function createId(deps: DmStateMutationDependencies): string {
  return deps.createId?.() ?? crypto.randomUUID();
}

function currentTime(deps: DmStateMutationDependencies): Date {
  return deps.now?.() ?? new Date();
}

function changed(result: D1Result<unknown> | undefined): number {
  return result?.meta?.changes ?? 0;
}

function sequenceConflict(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /game_events_campaign_sequence_uidx|UNIQUE constraint failed: game_events\.campaign_id, game_events\.sequence/i.test(
    message,
  );
}

function gameEventStatement(
  binding: D1Database,
  event: GameEventWrite,
  guardSql = "1 = 1",
  guardBindings: readonly unknown[] = [],
): D1PreparedStatement {
  const timestamp = Math.floor(event.occurredAt.getTime() / 1000);
  return binding
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

async function commitGuarded(
  binding: D1Database,
  statements: readonly D1PreparedStatement[],
  requiredChangedIndexes: readonly number[],
): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const results = await binding.batch([...statements]);
      return requiredChangedIndexes.every((index) => changed(results[index]) === 1);
    } catch (error) {
      if (attempt === 0 && sequenceConflict(error)) continue;
      throw error;
    }
  }
  return false;
}

async function requireContext(deps: DmStateMutationDependencies, campaignId: string) {
  const context = await loadActiveGameContext(deps.db, campaignId);
  if (!context) throw new Error("CAMPAIGN_GAME_NOT_ACTIVE");
  if (context.rulesetId !== "dnd35" || context.rulesetVersion !== "3.5") {
    throw new Error("CAMPAIGN_RULESET_UNSUPPORTED");
  }
  return context;
}

async function requireCharacterActor(
  deps: DmStateMutationDependencies,
  campaignId: string,
  actorId: string,
): Promise<CharacterActorRow> {
  const row = await deps.binding
    .prepare(
      `SELECT id AS actorId, character_id AS characterId, name
       FROM game_actors
       WHERE id = ?
         AND campaign_id = ?
         AND kind = 'character'
         AND character_id IS NOT NULL
         AND status = 'active'
       LIMIT 1`,
    )
    .bind(actorId, campaignId)
    .first<CharacterActorRow>();
  if (!row) throw new Error("GAME_CHARACTER_ACTOR_NOT_FOUND");
  return row;
}

async function applyActorHealthChange(
  deps: DmStateMutationDependencies,
  input: {
    campaignId: string;
    targetId: string;
    amount: number;
    sourceActorId?: string;
    reason: string;
    mode: "damage" | "heal";
  },
) {
  if (!Number.isSafeInteger(input.amount) || input.amount < 0) {
    throw new RangeError(`${input.mode === "damage" ? "Damage" : "Healing"} must be a non-negative safe integer.`);
  }
  const context = await requireContext(deps, input.campaignId);
  const defense = await loadActorDefenseSnapshot({
    db: deps.db,
    campaignId: input.campaignId,
    actorId: input.targetId,
  });
  if (!defense) throw new Error("GAME_TARGET_HEALTH_UNAVAILABLE");

  const application =
    input.mode === "damage" ? applyLethalDamage(defense.health, input.amount) : null;
  const after = application ? application.after : applyHealing(defense.health, input.amount);
  const eventId = createId(deps);
  const event: GameEventWrite = {
    id: eventId,
    campaignId: context.campaignId,
    sessionId: context.sessionId,
    eventType: input.mode === "damage" ? "health.damage" : "health.healing",
    occurredAt: currentTime(deps),
    actorId: input.sourceActorId ?? null,
    targetIds: [input.targetId],
    payload: {
      amount: input.amount,
      reason: input.reason,
      healthState: consciousnessState(after),
      ...(application
        ? {
            absorbedByTemporaryHitPoints: application.absorbedByTemporaryHitPoints,
            hitPointDamage: application.hitPointDamage,
          }
        : {}),
    },
    deltas: [
      ...(defense.health.currentHitPoints === after.currentHitPoints
        ? []
        : [
            {
              id: `${eventId}:hp`,
              entityId: input.targetId,
              path: ["dnd35", "currentHitPoints"],
              before: defense.health.currentHitPoints,
              after: after.currentHitPoints,
              reason: input.reason,
            },
          ]),
      ...(defense.health.temporaryHitPoints === after.temporaryHitPoints
        ? []
        : [
            {
              id: `${eventId}:temp-hp`,
              entityId: input.targetId,
              path: ["dnd35", "temporaryHitPoints"],
              before: defense.health.temporaryHitPoints,
              after: after.temporaryHitPoints,
              reason: input.reason,
            },
          ]),
      ...(defense.health.nonlethalDamage === after.nonlethalDamage
        ? []
        : [
            {
              id: `${eventId}:nonlethal`,
              entityId: input.targetId,
              path: ["dnd35", "nonlethalDamage"],
              before: defense.health.nonlethalDamage,
              after: after.nonlethalDamage,
              reason: input.reason,
            },
          ]),
    ],
  };

  const persisted = await new D1ActorHealthStore(deps.binding).commit({
    event,
    health: {
      actorId: input.targetId,
      kind: defense.healthKind,
      expected: {
        currentHitPoints: defense.health.currentHitPoints,
        temporaryHitPoints: defense.health.temporaryHitPoints,
        nonlethalDamage: defense.health.nonlethalDamage,
        stable: defense.health.stable,
      },
      next: {
        currentHitPoints: after.currentHitPoints,
        temporaryHitPoints: after.temporaryHitPoints,
        nonlethalDamage: after.nonlethalDamage,
        stable: after.stable,
      },
    },
  });
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");
  return {
    eventId,
    sessionId: context.sessionId,
    amount: input.amount,
    before: defense.health,
    after,
  };
}

export function applyDirectActorDamage(
  deps: DmStateMutationDependencies,
  input: {
    campaignId: string;
    targetId: string;
    amount: number;
    sourceActorId?: string;
    reason: string;
  },
) {
  return applyActorHealthChange(deps, { ...input, mode: "damage" });
}

export function applyDirectActorHealing(
  deps: DmStateMutationDependencies,
  input: {
    campaignId: string;
    targetId: string;
    amount: number;
    sourceActorId?: string;
    reason: string;
  },
) {
  return applyActorHealthChange(deps, { ...input, mode: "heal" });
}

export async function applyActorCondition(
  deps: DmStateMutationDependencies,
  input: {
    campaignId: string;
    targetId: string;
    conditionId: string;
    sourceActorId?: string;
    sourceDescription?: string;
    durationKind: "rounds" | "until_time" | "permanent" | "concentration" | "special";
    remainingRounds?: number;
    expiresAt?: Date;
    reason: string;
  },
) {
  const context = await requireContext(deps, input.campaignId);
  if (input.durationKind === "rounds") {
    if (!Number.isSafeInteger(input.remainingRounds) || (input.remainingRounds ?? 0) < 1) {
      throw new RangeError("Round-based conditions require at least one round.");
    }
  } else if (input.remainingRounds !== undefined) {
    throw new RangeError("remainingRounds is only valid for round-based conditions.");
  }
  if (input.durationKind === "until_time" && !input.expiresAt) {
    throw new RangeError("Time-based conditions require an expiration time.");
  }
  if (input.durationKind !== "until_time" && input.expiresAt) {
    throw new RangeError("expiresAt is only valid for time-based conditions.");
  }

  const [actor, condition] = await Promise.all([
    deps.binding
      .prepare(
        `SELECT id
         FROM game_actors
         WHERE id = ? AND campaign_id = ? AND status = 'active'
         LIMIT 1`,
      )
      .bind(input.targetId, input.campaignId)
      .first<{ id: string }>(),
    deps.binding
      .prepare(
        `SELECT id, stacking
         FROM dnd35_conditions
         WHERE id = ? AND is_enabled = 1 AND owner_user_id IS NULL
         LIMIT 1`,
      )
      .bind(input.conditionId)
      .first<{ id: string; stacking: "replace" | "independent" | "cumulative" | "special" }>(),
  ]);
  if (!actor) throw new Error("GAME_ACTOR_NOT_FOUND");
  if (!condition) throw new Error("GAME_CONDITION_NOT_FOUND");

  let encounterId: string | null = null;
  let expiresEncounterRound: number | null = null;
  let expiresTurnOrder: number | null = null;
  if (input.durationKind === "rounds" && input.remainingRounds !== undefined) {
    const encounter = await deps.binding
      .prepare(
        `SELECT encounter.id,
                encounter.round_number AS roundNumber,
                encounter.active_turn_index AS activeTurnIndex
         FROM game_encounters encounter
         JOIN game_encounter_participants participant
           ON participant.encounter_id = encounter.id
         WHERE encounter.campaign_id = ?
           AND encounter.session_id = ?
           AND encounter.status = 'active'
           AND participant.actor_id = ?
           AND participant.status = 'active'
         LIMIT 1`,
      )
      .bind(input.campaignId, context.sessionId, input.targetId)
      .first<{ id: string; roundNumber: number; activeTurnIndex: number }>();
    if (encounter) {
      const anchor = createRoundConditionAnchor({
        currentRound: encounter.roundNumber,
        currentTurnOrder: encounter.activeTurnIndex,
        durationRounds: input.remainingRounds,
      });
      encounterId = encounter.id;
      expiresEncounterRound = anchor.expiresEncounterRound;
      expiresTurnOrder = anchor.expiresTurnOrder;
    }
  }

  const eventId = createId(deps);
  const conditionRuntimeId = createId(deps);
  const occurredAt = currentTime(deps);
  const timestamp = Math.floor(occurredAt.getTime() / 1000);
  const event: GameEventWrite = {
    id: eventId,
    campaignId: context.campaignId,
    sessionId: context.sessionId,
    eventType: "condition.applied",
    occurredAt,
    actorId: input.sourceActorId ?? null,
    sourceId: input.conditionId,
    targetIds: [input.targetId],
    payload: {
      conditionRuntimeId,
      conditionId: input.conditionId,
      durationKind: input.durationKind,
      remainingRounds: input.remainingRounds ?? null,
      encounterId,
      expiresEncounterRound,
      expiresTurnOrder,
      expiresAt: input.expiresAt?.toISOString() ?? null,
      reason: input.reason,
    },
  };
  const eventGuard =
    "EXISTS (SELECT 1 FROM game_actors WHERE id = ? AND campaign_id = ? AND status = 'active') AND EXISTS (SELECT 1 FROM dnd35_conditions WHERE id = ? AND is_enabled = 1 AND owner_user_id IS NULL)";
  const statements: D1PreparedStatement[] = [
    gameEventStatement(deps.binding, event, eventGuard, [
      input.targetId,
      input.campaignId,
      input.conditionId,
    ]),
  ];
  if (condition.stacking === "replace") {
    statements.push(
      deps.binding
        .prepare(
          `DELETE FROM runtime_dnd35_actor_conditions
           WHERE actor_id = ? AND condition_id = ?
             AND EXISTS (SELECT 1 FROM game_events WHERE id = ?)`,
        )
        .bind(input.targetId, input.conditionId, eventId),
    );
  }
  const insertIndex = statements.length;
  statements.push(
    deps.binding
      .prepare(
        `INSERT INTO runtime_dnd35_actor_conditions (
          id, actor_id, condition_id, source_actor_id, source_description,
          duration_kind, remaining_rounds, encounter_id, expires_encounter_round,
          expires_turn_order, expires_at, state, created_at, updated_at
        )
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?
        WHERE EXISTS (SELECT 1 FROM game_events WHERE id = ?)`,
      )
      .bind(
        conditionRuntimeId,
        input.targetId,
        input.conditionId,
        input.sourceActorId ?? null,
        input.sourceDescription ?? input.reason,
        input.durationKind,
        input.remainingRounds ?? null,
        encounterId,
        expiresEncounterRound,
        expiresTurnOrder,
        input.expiresAt ? Math.floor(input.expiresAt.getTime() / 1000) : null,
        timestamp,
        timestamp,
        eventId,
      ),
  );
  const persisted = await commitGuarded(deps.binding, statements, [0, insertIndex]);
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");
  return {
    eventId,
    sessionId: context.sessionId,
    conditionRuntimeId,
    conditionId: input.conditionId,
    targetId: input.targetId,
  };
}

export async function removeActorCondition(
  deps: DmStateMutationDependencies,
  input: {
    campaignId: string;
    runtimeConditionId: string;
    reason: string;
    sourceActorId?: string;
  },
) {
  const context = await requireContext(deps, input.campaignId);
  const condition = await deps.binding
    .prepare(
      `SELECT runtime.id,
              runtime.actor_id AS actorId,
              runtime.condition_id AS conditionId
       FROM runtime_dnd35_actor_conditions runtime
       JOIN game_actors actor ON actor.id = runtime.actor_id
       WHERE runtime.id = ? AND actor.campaign_id = ?
       LIMIT 1`,
    )
    .bind(input.runtimeConditionId, input.campaignId)
    .first<{ id: string; actorId: string; conditionId: string }>();
  if (!condition) throw new Error("GAME_CONDITION_INSTANCE_NOT_FOUND");

  const eventId = createId(deps);
  const event: GameEventWrite = {
    id: eventId,
    campaignId: context.campaignId,
    sessionId: context.sessionId,
    eventType: "condition.removed",
    occurredAt: currentTime(deps),
    actorId: input.sourceActorId ?? null,
    sourceId: condition.conditionId,
    targetIds: [condition.actorId],
    payload: {
      conditionRuntimeId: condition.id,
      conditionId: condition.conditionId,
      reason: input.reason,
    },
  };
  const persisted = await commitGuarded(
    deps.binding,
    [
      gameEventStatement(
        deps.binding,
        event,
        "EXISTS (SELECT 1 FROM runtime_dnd35_actor_conditions WHERE id = ? AND actor_id = ?)",
        [condition.id, condition.actorId],
      ),
      deps.binding
        .prepare(
          `DELETE FROM runtime_dnd35_actor_conditions
           WHERE id = ? AND actor_id = ?
             AND EXISTS (SELECT 1 FROM game_events WHERE id = ?)`,
        )
        .bind(condition.id, condition.actorId, eventId),
    ],
    [0, 1],
  );
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");
  return { eventId, sessionId: context.sessionId, ...condition };
}

export async function grantCharacterExperience(
  deps: DmStateMutationDependencies,
  input: { campaignId: string; actorId: string; amount: number; reason: string },
) {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
    throw new RangeError("Experience award must be a positive safe integer.");
  }
  const context = await requireContext(deps, input.campaignId);
  const actor = await requireCharacterActor(deps, input.campaignId, input.actorId);
  const state = await deps.binding
    .prepare(
      `SELECT experience_points AS experiencePoints
       FROM dnd35_characters
       WHERE character_id = ?
       LIMIT 1`,
    )
    .bind(actor.characterId)
    .first<{ experiencePoints: number }>();
  if (!state) throw new Error("GAME_CHARACTER_STATE_NOT_FOUND");
  const next = state.experiencePoints + input.amount;
  if (!Number.isSafeInteger(next)) {
    throw new RangeError("Experience total exceeds the safe integer range.");
  }

  const eventId = createId(deps);
  const occurredAt = currentTime(deps);
  const event: GameEventWrite = {
    id: eventId,
    campaignId: context.campaignId,
    sessionId: context.sessionId,
    eventType: "progression.xp.granted",
    occurredAt,
    actorId: input.actorId,
    targetIds: [input.actorId],
    payload: {
      amount: input.amount,
      before: state.experiencePoints,
      after: next,
      reason: input.reason,
    },
    deltas: [
      {
        id: `${eventId}:xp`,
        entityId: actor.characterId,
        path: ["dnd35", "experiencePoints"],
        before: state.experiencePoints,
        after: next,
        reason: input.reason,
      },
    ],
  };
  const persisted = await commitGuarded(
    deps.binding,
    [
      gameEventStatement(
        deps.binding,
        event,
        "EXISTS (SELECT 1 FROM dnd35_characters WHERE character_id = ? AND experience_points = ?)",
        [actor.characterId, state.experiencePoints],
      ),
      deps.binding
        .prepare(
          `UPDATE dnd35_characters
           SET experience_points = ?, updated_at = ?
           WHERE character_id = ? AND experience_points = ?
             AND EXISTS (SELECT 1 FROM game_events WHERE id = ?)`,
        )
        .bind(
          next,
          Math.floor(occurredAt.getTime() / 1000),
          actor.characterId,
          state.experiencePoints,
          eventId,
        ),
    ],
    [0, 1],
  );
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");
  return {
    eventId,
    sessionId: context.sessionId,
    characterId: actor.characterId,
    before: state.experiencePoints,
    after: next,
    amount: input.amount,
  };
}

export async function grantCharacterItem(
  deps: DmStateMutationDependencies,
  input: {
    campaignId: string;
    actorId: string;
    itemId: string;
    quantity: number;
    reason: string;
    location?: "carried" | "stored" | "party";
  },
) {
  if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) {
    throw new RangeError("Item quantity must be a positive safe integer.");
  }
  const context = await requireContext(deps, input.campaignId);
  const actor = await requireCharacterActor(deps, input.campaignId, input.actorId);
  const item = await deps.binding
    .prepare(
      `SELECT id, name
       FROM dnd35_items
       WHERE id = ? AND is_enabled = 1 AND owner_user_id IS NULL
       LIMIT 1`,
    )
    .bind(input.itemId)
    .first<{ id: string; name: string }>();
  if (!item) throw new Error("GAME_ITEM_NOT_FOUND");

  const eventId = createId(deps);
  const inventoryId = createId(deps);
  const occurredAt = currentTime(deps);
  const timestamp = Math.floor(occurredAt.getTime() / 1000);
  const location = input.location ?? "carried";
  const event: GameEventWrite = {
    id: eventId,
    campaignId: context.campaignId,
    sessionId: context.sessionId,
    eventType: "inventory.item.granted",
    occurredAt,
    actorId: input.actorId,
    sourceId: item.id,
    targetIds: [input.actorId],
    payload: {
      inventoryId,
      itemId: item.id,
      itemName: item.name,
      quantity: input.quantity,
      location,
      reason: input.reason,
    },
  };
  const persisted = await commitGuarded(
    deps.binding,
    [
      gameEventStatement(
        deps.binding,
        event,
        "EXISTS (SELECT 1 FROM dnd35_characters WHERE character_id = ?) AND EXISTS (SELECT 1 FROM dnd35_items WHERE id = ? AND is_enabled = 1 AND owner_user_id IS NULL)",
        [actor.characterId, item.id],
      ),
      deps.binding
        .prepare(
          `INSERT INTO dnd35_character_inventory
             (id, character_id, item_id, quantity, equipped, equipped_slot,
              container_inventory_id, location, location_id, notes, created_at, updated_at)
           SELECT ?, ?, ?, ?, 0, NULL, NULL, ?, NULL, ?, ?, ?
           WHERE EXISTS (SELECT 1 FROM game_events WHERE id = ?)`,
        )
        .bind(
          inventoryId,
          actor.characterId,
          item.id,
          input.quantity,
          location,
          input.reason,
          timestamp,
          timestamp,
          eventId,
        ),
    ],
    [0, 1],
  );
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");
  return {
    eventId,
    sessionId: context.sessionId,
    inventoryId,
    itemId: item.id,
    itemName: item.name,
    quantity: input.quantity,
    location,
  };
}

export async function removeCharacterItem(
  deps: DmStateMutationDependencies,
  input: {
    campaignId: string;
    actorId: string;
    inventoryId: string;
    quantity: number;
    reason: string;
  },
) {
  if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) {
    throw new RangeError("Item quantity must be a positive safe integer.");
  }
  const context = await requireContext(deps, input.campaignId);
  const actor = await requireCharacterActor(deps, input.campaignId, input.actorId);
  const row = await deps.binding
    .prepare(
      `SELECT inventory.id,
              inventory.item_id AS itemId,
              inventory.quantity,
              inventory.equipped,
              item.name AS itemName
       FROM dnd35_character_inventory inventory
       JOIN dnd35_items item ON item.id = inventory.item_id
       WHERE inventory.id = ? AND inventory.character_id = ?
       LIMIT 1`,
    )
    .bind(input.inventoryId, actor.characterId)
    .first<{
      id: string;
      itemId: string;
      quantity: number;
      equipped: number;
      itemName: string;
    }>();
  if (!row) throw new Error("GAME_INVENTORY_ITEM_NOT_FOUND");
  if (row.equipped) throw new Error("GAME_INVENTORY_ITEM_EQUIPPED");
  if (input.quantity > row.quantity) {
    throw new RangeError("Cannot remove more items than the character owns in this stack.");
  }
  const nextQuantity = row.quantity - input.quantity;
  const eventId = createId(deps);
  const occurredAt = currentTime(deps);
  const event: GameEventWrite = {
    id: eventId,
    campaignId: context.campaignId,
    sessionId: context.sessionId,
    eventType: "inventory.item.removed",
    occurredAt,
    actorId: input.actorId,
    sourceId: row.itemId,
    targetIds: [input.actorId],
    payload: {
      inventoryId: row.id,
      itemId: row.itemId,
      itemName: row.itemName,
      quantity: input.quantity,
      before: row.quantity,
      after: nextQuantity,
      reason: input.reason,
    },
  };
  const guard =
    "EXISTS (SELECT 1 FROM dnd35_character_inventory WHERE id = ? AND character_id = ? AND quantity = ? AND equipped = 0)";
  const mutation =
    nextQuantity === 0
      ? deps.binding
          .prepare(
            `DELETE FROM dnd35_character_inventory
             WHERE id = ? AND character_id = ? AND quantity = ? AND equipped = 0
               AND EXISTS (SELECT 1 FROM game_events WHERE id = ?)`,
          )
          .bind(row.id, actor.characterId, row.quantity, eventId)
      : deps.binding
          .prepare(
            `UPDATE dnd35_character_inventory
             SET quantity = ?, updated_at = ?
             WHERE id = ? AND character_id = ? AND quantity = ? AND equipped = 0
               AND EXISTS (SELECT 1 FROM game_events WHERE id = ?)`,
          )
          .bind(
            nextQuantity,
            Math.floor(occurredAt.getTime() / 1000),
            row.id,
            actor.characterId,
            row.quantity,
            eventId,
          );
  const persisted = await commitGuarded(
    deps.binding,
    [
      gameEventStatement(deps.binding, event, guard, [
        row.id,
        actor.characterId,
        row.quantity,
      ]),
      mutation,
    ],
    [0, 1],
  );
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");
  return {
    eventId,
    sessionId: context.sessionId,
    inventoryId: row.id,
    itemId: row.itemId,
    itemName: row.itemName,
    removed: input.quantity,
    remaining: nextQuantity,
  };
}

async function loadOrInitializeAlignmentState(
  deps: DmStateMutationDependencies,
  characterId: string,
  alignment: Dnd35Alignment,
): Promise<AlignmentStateRow> {
  let state = await deps.binding
    .prepare(
      `SELECT law_chaos_score AS lawChaosScore,
              good_evil_score AS goodEvilScore
       FROM runtime_dnd35_alignment_states
       WHERE character_id = ?
       LIMIT 1`,
    )
    .bind(characterId)
    .first<AlignmentStateRow>();
  if (state) return state;

  const seeded = alignmentToScores(alignment);
  await deps.binding
    .prepare(
      `INSERT OR IGNORE INTO runtime_dnd35_alignment_states
         (character_id, law_chaos_score, good_evil_score, last_reason)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(
      characterId,
      seeded.lawChaos,
      seeded.goodEvil,
      "Initialized from character alignment",
    )
    .run();
  state = await deps.binding
    .prepare(
      `SELECT law_chaos_score AS lawChaosScore,
              good_evil_score AS goodEvilScore
       FROM runtime_dnd35_alignment_states
       WHERE character_id = ?
       LIMIT 1`,
    )
    .bind(characterId)
    .first<AlignmentStateRow>();
  if (!state) throw new Error("GAME_ALIGNMENT_STATE_UNAVAILABLE");
  return state;
}

export async function recordCharacterAlignmentAction(
  deps: DmStateMutationDependencies,
  input: {
    campaignId: string;
    actorId: string;
    lawChaosDelta: number;
    goodEvilDelta: number;
    reason: string;
  },
) {
  if (!input.reason.trim()) throw new RangeError("Alignment changes require a reason.");
  const context = await requireContext(deps, input.campaignId);
  const actor = await requireCharacterActor(deps, input.campaignId, input.actorId);
  const character = await deps.binding
    .prepare(
      `SELECT alignment
       FROM dnd35_characters
       WHERE character_id = ?
       LIMIT 1`,
    )
    .bind(actor.characterId)
    .first<{ alignment: Dnd35Alignment }>();
  if (!character) throw new Error("GAME_CHARACTER_STATE_NOT_FOUND");
  const state = await loadOrInitializeAlignmentState(
    deps,
    actor.characterId,
    character.alignment,
  );
  const next = applyAlignmentDrift(
    { lawChaos: state.lawChaosScore, goodEvil: state.goodEvilScore },
    { lawChaosDelta: input.lawChaosDelta, goodEvilDelta: input.goodEvilDelta },
  );

  const eventId = createId(deps);
  const occurredAt = currentTime(deps);
  const timestamp = Math.floor(occurredAt.getTime() / 1000);
  const event: GameEventWrite = {
    id: eventId,
    campaignId: context.campaignId,
    sessionId: context.sessionId,
    eventType: "alignment.drift",
    occurredAt,
    actorId: input.actorId,
    targetIds: [input.actorId],
    payload: {
      reason: input.reason,
      lawChaosDelta: input.lawChaosDelta,
      goodEvilDelta: input.goodEvilDelta,
      beforeScores: {
        lawChaos: state.lawChaosScore,
        goodEvil: state.goodEvilScore,
      },
      afterScores: next.scores,
      beforeAlignment: character.alignment,
      afterAlignment: next.alignment,
      alignmentChanged: character.alignment !== next.alignment,
    },
    deltas: [
      ...(character.alignment === next.alignment
        ? []
        : [
            {
              id: `${eventId}:alignment`,
              entityId: actor.characterId,
              path: ["dnd35", "alignment"],
              before: character.alignment,
              after: next.alignment,
              reason: input.reason,
            },
          ]),
    ],
  };
  const guard =
    "EXISTS (SELECT 1 FROM runtime_dnd35_alignment_states WHERE character_id = ? AND law_chaos_score = ? AND good_evil_score = ?) AND EXISTS (SELECT 1 FROM dnd35_characters WHERE character_id = ? AND alignment = ?)";
  const persisted = await commitGuarded(
    deps.binding,
    [
      gameEventStatement(deps.binding, event, guard, [
        actor.characterId,
        state.lawChaosScore,
        state.goodEvilScore,
        actor.characterId,
        character.alignment,
      ]),
      deps.binding
        .prepare(
          `UPDATE runtime_dnd35_alignment_states
           SET law_chaos_score = ?, good_evil_score = ?, last_reason = ?, updated_at = ?
           WHERE character_id = ? AND law_chaos_score = ? AND good_evil_score = ?
             AND EXISTS (SELECT 1 FROM game_events WHERE id = ?)`,
        )
        .bind(
          next.scores.lawChaos,
          next.scores.goodEvil,
          input.reason,
          timestamp,
          actor.characterId,
          state.lawChaosScore,
          state.goodEvilScore,
          eventId,
        ),
      deps.binding
        .prepare(
          `UPDATE dnd35_characters
           SET alignment = ?, updated_at = ?
           WHERE character_id = ? AND alignment = ?
             AND EXISTS (SELECT 1 FROM game_events WHERE id = ?)`,
        )
        .bind(next.alignment, timestamp, actor.characterId, character.alignment, eventId),
    ],
    [0, 1, 2],
  );
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");
  return {
    eventId,
    sessionId: context.sessionId,
    characterId: actor.characterId,
    before: {
      alignment: character.alignment,
      lawChaos: state.lawChaosScore,
      goodEvil: state.goodEvilScore,
    },
    after: {
      alignment: next.alignment,
      lawChaos: next.scores.lawChaos,
      goodEvil: next.scores.goodEvil,
    },
    changed: character.alignment !== next.alignment,
  };
}
