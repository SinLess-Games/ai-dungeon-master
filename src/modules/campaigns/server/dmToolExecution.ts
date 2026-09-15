/// <reference types="@cloudflare/workers-types" />

import { createDatabase } from "@/infrastructure/database/client";
import {
  executeGameCommand,
  type GameCommand,
  type GameCommandResult,
} from "@/modules/game/server/gameCommandService";
import type { DmPlannerCommand, DmPlannerContext } from "./dmToolPlanner";

async function resolveSharedItem(binding: D1Database, ref: string): Promise<string> {
  const normalized = ref.trim();
  const row = await binding
    .prepare(
      `SELECT id
       FROM dnd35_items
       WHERE is_enabled = 1
         AND owner_user_id IS NULL
         AND (id = ? OR lower(slug) = lower(?) OR lower(name) = lower(?))
       ORDER BY CASE
         WHEN id = ? THEN 0
         WHEN lower(slug) = lower(?) THEN 1
         ELSE 2
       END,
       source_id,
       id
       LIMIT 1`,
    )
    .bind(normalized, normalized, normalized, normalized, normalized)
    .first<{ id: string }>();
  if (!row) throw new Error("AI_DM_ITEM_REF_NOT_FOUND");
  return row.id;
}

async function resolveCondition(binding: D1Database, ref: string): Promise<string> {
  const normalized = ref.trim();
  const row = await binding
    .prepare(
      `SELECT id
       FROM dnd35_conditions
       WHERE is_enabled = 1
         AND owner_user_id IS NULL
         AND (id = ? OR lower(slug) = lower(?) OR lower(name) = lower(?))
       ORDER BY CASE
         WHEN id = ? THEN 0
         WHEN lower(slug) = lower(?) THEN 1
         ELSE 2
       END,
       source_id,
       id
       LIMIT 1`,
    )
    .bind(normalized, normalized, normalized, normalized, normalized)
    .first<{ id: string }>();
  if (!row) throw new Error("AI_DM_CONDITION_REF_NOT_FOUND");
  return row.id;
}

export async function plannerCommandToGameCommand(
  binding: D1Database,
  context: DmPlannerContext,
  command: DmPlannerCommand,
): Promise<GameCommand> {
  const actorId = context.character.character.actorId;
  switch (command.type) {
    case "encounter.start":
      return { type: command.type, participantIds: command.participantIds };
    case "encounter.end_turn": {
      const encounter = context.encounter;
      if (!encounter || !encounter.currentActorId) throw new Error("AI_DM_ENCOUNTER_NOT_ACTIVE");
      return { type: command.type, encounterId: encounter.id, actorId: encounter.currentActorId };
    }
    case "encounter.finish": {
      const encounter = context.encounter;
      if (!encounter) throw new Error("AI_DM_ENCOUNTER_NOT_ACTIVE");
      return {
        type: command.type,
        encounterId: encounter.id,
        ...(command.status === undefined ? {} : { status: command.status }),
      };
    }
    case "combat.attack":
      return {
        type: command.type,
        attackerId: actorId,
        targetId: command.targetId,
        kind: command.kind,
        ...(command.weaponInventoryId === undefined
          ? {}
          : { weaponInventoryId: command.weaponInventoryId }),
      };
    case "spell.cast.prepared":
      return {
        type: command.type,
        actorId,
        castingTrackId: command.castingTrackId,
        spellId: command.spellId,
        preparationId: command.preparationId,
        ...(command.targetIds === undefined ? {} : { targetIds: command.targetIds }),
      };
    case "spell.cast.spontaneous":
      return {
        type: command.type,
        actorId,
        castingTrackId: command.castingTrackId,
        spellId: command.spellId,
        ...(command.slotLevel === undefined ? {} : { slotLevel: command.slotLevel }),
        ...(command.targetIds === undefined ? {} : { targetIds: command.targetIds }),
      };
    case "power.manifest":
      return {
        type: command.type,
        actorId,
        castingTrackId: command.castingTrackId,
        powerId: command.powerId,
        ...(command.augmentations === undefined ? {} : { augmentations: command.augmentations }),
        ...(command.targetIds === undefined ? {} : { targetIds: command.targetIds }),
      };
    case "health.damage":
      return {
        type: command.type,
        targetId: command.targetId,
        amount: command.amount,
        reason: command.reason,
      };
    case "health.heal":
      return {
        type: command.type,
        targetId: command.targetId,
        amount: command.amount,
        reason: command.reason,
      };
    case "condition.apply":
      return {
        type: command.type,
        targetId: command.targetId,
        conditionId: await resolveCondition(binding, command.conditionRef),
        durationKind: command.durationKind,
        reason: command.reason,
        ...(command.remainingRounds === undefined
          ? {}
          : { remainingRounds: command.remainingRounds }),
      };
    case "condition.remove":
      return {
        type: command.type,
        runtimeConditionId: command.runtimeConditionId,
        reason: command.reason,
      };
    case "inventory.grant":
      return {
        type: command.type,
        actorId,
        itemId: await resolveSharedItem(binding, command.itemRef),
        quantity: command.quantity,
        reason: command.reason,
        ...(command.location === undefined ? {} : { location: command.location }),
      };
    case "inventory.remove":
      return {
        type: command.type,
        actorId,
        inventoryId: command.inventoryId,
        quantity: command.quantity,
        reason: command.reason,
      };
    case "progression.xp.grant":
      return {
        type: command.type,
        actorId,
        amount: command.amount,
        reason: command.reason,
      };
  }
}

export async function executeDmPlannerCommand(input: {
  binding: D1Database;
  campaignId: string;
  context: DmPlannerContext;
  command: DmPlannerCommand;
}): Promise<GameCommandResult> {
  const gameCommand = await plannerCommandToGameCommand(input.binding, input.context, input.command);
  return executeGameCommand(
    { db: createDatabase(input.binding), binding: input.binding },
    input.campaignId,
    gameCommand,
  );
}
