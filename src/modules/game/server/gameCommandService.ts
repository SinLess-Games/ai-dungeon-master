import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";
import type { Database } from "@/infrastructure/database/client";
import { gameEvents } from "@/infrastructure/database/schema";
import type { Dnd35AttackKind, Dnd35SaveKind } from "../domain/dnd35ActionRuntime";
import { performActorAttack } from "./actorCombatService";
import { performActorSavingThrow } from "./actorCheckService";
import { startActorEncounter } from "./actorEncounterService";
import {
  applyActorCondition,
  applyActorHealing,
  applyActorLethalDamage,
  applyActorNonlethalDamage,
  attemptActorStabilization,
  grantActorTemporaryHitPoints,
} from "./actorStateMutationService";
import { endEncounterTurn, finishEncounter } from "./encounterService";
import { performSkillCheck } from "./gameActionService";
import {
  castPreparedSpellResolved,
  castSpontaneousSpellResolved,
  manifestPowerResolved,
} from "./resolvedCastingService";
import type { RequestedPowerAugmentation } from "./castingService";

export interface GameCommandDependencies {
  db: Database;
  binding: D1Database;
  createId?: () => string;
  now?: () => Date;
}

export type GameCommand =
  | {
      type: "attack";
      actorId: string;
      targetId: string;
      kind: Dnd35AttackKind;
      weaponInventoryId?: string;
      monsterAttackId?: string;
    }
  | {
      type: "skill_check";
      actorId: string;
      skillId: string;
      specialization?: string;
      dc: number;
    }
  | {
      type: "saving_throw";
      actorId: string;
      save: Dnd35SaveKind;
      dc: number;
      sourceId?: string;
    }
  | {
      type: "damage";
      actorId?: string;
      targetId: string;
      amount: number;
      sourceId?: string;
      reason?: string;
    }
  | {
      type: "healing";
      actorId?: string;
      targetId: string;
      amount: number;
      sourceId?: string;
      reason?: string;
    }
  | {
      type: "nonlethal_damage";
      actorId?: string;
      targetId: string;
      amount: number;
      reason?: string;
    }
  | {
      type: "temporary_hit_points";
      actorId?: string;
      targetId: string;
      amount: number;
      reason?: string;
    }
  | {
      type: "apply_condition";
      actorId?: string;
      targetId: string;
      conditionId: string;
      sourceDescription?: string;
      durationKind: "rounds" | "until_time" | "permanent" | "concentration" | "special";
      remainingRounds?: number;
      expiresAt?: Date;
      state?: Record<string, unknown>;
    }
  | {
      type: "stabilize";
      actorId: string;
    }
  | {
      type: "start_encounter";
      participantIds: readonly string[];
    }
  | {
      type: "end_turn";
      actorId: string;
      encounterId: string;
    }
  | {
      type: "finish_encounter";
      encounterId: string;
      status?: "completed" | "abandoned";
    }
  | {
      type: "cast_spell";
      mode: "prepared";
      actorId: string;
      castingTrackId: string;
      spellId: string;
      preparationId: string;
      targetIds?: readonly string[];
    }
  | {
      type: "cast_spell";
      mode: "spontaneous";
      actorId: string;
      castingTrackId: string;
      spellId: string;
      slotLevel?: number;
      targetIds?: readonly string[];
    }
  | {
      type: "manifest_power";
      actorId: string;
      castingTrackId: string;
      powerId: string;
      augmentations?: readonly RequestedPowerAugmentation[];
      targetIds?: readonly string[];
    };

export interface GameCommandResult {
  commandType: GameCommand["type"];
  result: unknown;
  eventId?: string;
  sessionId?: string;
  eventSequence?: number;
}

async function latestSequence(db: Database, campaignId: string): Promise<number> {
  const row = await db
    .select({ sequence: sql<number>`coalesce(max(${gameEvents.sequence}), 0)` })
    .from(gameEvents)
    .where(eq(gameEvents.campaignId, campaignId))
    .get();
  return Number(row?.sequence ?? 0);
}

async function eventAfter(
  db: Database,
  input: { campaignId: string; afterSequence: number; eventTypes: readonly string[] },
) {
  const rows = await db
    .select({ id: gameEvents.id, sessionId: gameEvents.sessionId, sequence: gameEvents.sequence })
    .from(gameEvents)
    .where(
      and(
        eq(gameEvents.campaignId, input.campaignId),
        gt(gameEvents.sequence, input.afterSequence),
        inArray(gameEvents.eventType, [...input.eventTypes]),
      ),
    )
    .orderBy(asc(gameEvents.sequence))
    .limit(1)
    .all();
  return rows[0] ?? null;
}

function withEvent(
  commandType: GameCommand["type"],
  result: unknown,
): GameCommandResult {
  const candidate = result as { eventId?: unknown; sessionId?: unknown } | null;
  return {
    commandType,
    result,
    ...(typeof candidate?.eventId === "string" ? { eventId: candidate.eventId } : {}),
    ...(typeof candidate?.sessionId === "string" ? { sessionId: candidate.sessionId } : {}),
  };
}

/**
 * Single application boundary shared by UI clients and future AI tools.
 *
 * Authorization deliberately remains at the route/tool adapter. This service
 * only dispatches commands into authoritative D&D/application services so no
 * caller can bypass deterministic resolution by writing persistence directly.
 */
export async function executeGameCommand(
  deps: GameCommandDependencies,
  campaignId: string,
  command: GameCommand,
): Promise<GameCommandResult> {
  switch (command.type) {
    case "attack":
      return withEvent(
        command.type,
        await performActorAttack(deps, {
          campaignId,
          attackerId: command.actorId,
          targetId: command.targetId,
          kind: command.kind,
          ...(command.weaponInventoryId === undefined
            ? {}
            : { weaponInventoryId: command.weaponInventoryId }),
          ...(command.monsterAttackId === undefined
            ? {}
            : { monsterAttackId: command.monsterAttackId }),
        }),
      );

    case "skill_check":
      return withEvent(
        command.type,
        await performSkillCheck(deps, {
          campaignId,
          actorId: command.actorId,
          skillId: command.skillId,
          dc: command.dc,
          ...(command.specialization === undefined
            ? {}
            : { specialization: command.specialization }),
        }),
      );

    case "saving_throw":
      return withEvent(
        command.type,
        await performActorSavingThrow(deps, {
          campaignId,
          actorId: command.actorId,
          save: command.save,
          dc: command.dc,
          ...(command.sourceId === undefined ? {} : { sourceId: command.sourceId }),
        }),
      );

    case "damage":
      return withEvent(
        command.type,
        await applyActorLethalDamage(deps, {
          campaignId,
          targetId: command.targetId,
          amount: command.amount,
          ...(command.actorId === undefined ? {} : { actorId: command.actorId }),
          ...(command.sourceId === undefined ? {} : { sourceId: command.sourceId }),
          ...(command.reason === undefined ? {} : { reason: command.reason }),
        }),
      );

    case "healing":
      return withEvent(
        command.type,
        await applyActorHealing(deps, {
          campaignId,
          targetId: command.targetId,
          amount: command.amount,
          ...(command.actorId === undefined ? {} : { actorId: command.actorId }),
          ...(command.sourceId === undefined ? {} : { sourceId: command.sourceId }),
          ...(command.reason === undefined ? {} : { reason: command.reason }),
        }),
      );

    case "nonlethal_damage":
      return withEvent(
        command.type,
        await applyActorNonlethalDamage(deps, {
          campaignId,
          targetId: command.targetId,
          amount: command.amount,
          ...(command.actorId === undefined ? {} : { actorId: command.actorId }),
          ...(command.reason === undefined ? {} : { reason: command.reason }),
        }),
      );

    case "temporary_hit_points":
      return withEvent(
        command.type,
        await grantActorTemporaryHitPoints(deps, {
          campaignId,
          targetId: command.targetId,
          amount: command.amount,
          ...(command.actorId === undefined ? {} : { actorId: command.actorId }),
          ...(command.reason === undefined ? {} : { reason: command.reason }),
        }),
      );

    case "apply_condition":
      return withEvent(
        command.type,
        await applyActorCondition(deps, {
          campaignId,
          targetId: command.targetId,
          conditionId: command.conditionId,
          durationKind: command.durationKind,
          ...(command.actorId === undefined ? {} : { actorId: command.actorId }),
          ...(command.sourceDescription === undefined
            ? {}
            : { sourceDescription: command.sourceDescription }),
          ...(command.remainingRounds === undefined
            ? {}
            : { remainingRounds: command.remainingRounds }),
          ...(command.expiresAt === undefined ? {} : { expiresAt: command.expiresAt }),
          ...(command.state === undefined ? {} : { state: command.state }),
        }),
      );

    case "stabilize":
      return withEvent(
        command.type,
        await attemptActorStabilization(deps, { campaignId, actorId: command.actorId }),
      );

    case "start_encounter": {
      const before = await latestSequence(deps.db, campaignId);
      const result = await startActorEncounter(deps, {
        campaignId,
        participantIds: command.participantIds,
      });
      const event = await eventAfter(deps.db, {
        campaignId,
        afterSequence: before,
        eventTypes: ["encounter.started"],
      });
      return {
        commandType: command.type,
        result,
        ...(event
          ? { eventId: event.id, sessionId: event.sessionId, eventSequence: event.sequence }
          : {}),
      };
    }

    case "end_turn": {
      const before = await latestSequence(deps.db, campaignId);
      const result = await endEncounterTurn(deps, {
        campaignId,
        encounterId: command.encounterId,
        actorId: command.actorId,
      });
      const event = await eventAfter(deps.db, {
        campaignId,
        afterSequence: before,
        eventTypes: ["encounter.turn_advanced", "encounter.round_advanced"],
      });
      return {
        commandType: command.type,
        result,
        ...(event
          ? { eventId: event.id, sessionId: event.sessionId, eventSequence: event.sequence }
          : {}),
      };
    }

    case "finish_encounter": {
      const before = await latestSequence(deps.db, campaignId);
      const result = await finishEncounter(deps, {
        campaignId,
        encounterId: command.encounterId,
        ...(command.status === undefined ? {} : { status: command.status }),
      });
      const event = await eventAfter(deps.db, {
        campaignId,
        afterSequence: before,
        eventTypes: ["encounter.completed", "encounter.abandoned"],
      });
      return {
        commandType: command.type,
        result,
        ...(event
          ? { eventId: event.id, sessionId: event.sessionId, eventSequence: event.sequence }
          : {}),
      };
    }

    case "cast_spell":
      if (command.mode === "prepared") {
        return withEvent(
          command.type,
          await castPreparedSpellResolved(deps, {
            campaignId,
            actorId: command.actorId,
            castingTrackId: command.castingTrackId,
            spellId: command.spellId,
            preparationId: command.preparationId,
            ...(command.targetIds === undefined ? {} : { targetIds: command.targetIds }),
          }),
        );
      }
      return withEvent(
        command.type,
        await castSpontaneousSpellResolved(deps, {
          campaignId,
          actorId: command.actorId,
          castingTrackId: command.castingTrackId,
          spellId: command.spellId,
          ...(command.slotLevel === undefined ? {} : { slotLevel: command.slotLevel }),
          ...(command.targetIds === undefined ? {} : { targetIds: command.targetIds }),
        }),
      );

    case "manifest_power":
      return withEvent(
        command.type,
        await manifestPowerResolved(deps, {
          campaignId,
          actorId: command.actorId,
          castingTrackId: command.castingTrackId,
          powerId: command.powerId,
          ...(command.augmentations === undefined
            ? {}
            : { augmentations: command.augmentations }),
          ...(command.targetIds === undefined ? {} : { targetIds: command.targetIds }),
        }),
      );
  }
}
