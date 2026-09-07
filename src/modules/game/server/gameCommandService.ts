/// <reference types="@cloudflare/workers-types" />

import type { Database } from "@/infrastructure/database/client";
import { performActorAttack } from "./actorCombatService";
import { startActorEncounter } from "./actorEncounterService";
import { endEncounterTurn, finishEncounter } from "./encounterService";
import { performSavingThrow, performSkillCheck } from "./gameActionService";
import {
  castPreparedSpellResolved,
  castSpontaneousSpellResolved,
  manifestPowerResolved,
  type RequestedResolvedPowerAugmentation,
} from "./resolvedCastingService";

export interface GameCommandDependencies {
  db: Database;
  binding: D1Database;
}

export type GameCommand =
  | {
      type: "encounter.start";
      participantIds: readonly string[];
    }
  | {
      type: "encounter.end_turn";
      encounterId: string;
      actorId: string;
    }
  | {
      type: "encounter.finish";
      encounterId: string;
      status?: "completed" | "abandoned";
    }
  | {
      type: "combat.attack";
      attackerId: string;
      targetId: string;
      kind: "melee" | "ranged";
      weaponInventoryId?: string;
      monsterAttackId?: string;
    }
  | {
      type: "check.skill";
      actorId: string;
      skillId: string;
      specialization?: string;
      dc: number;
    }
  | {
      type: "check.save";
      actorId: string;
      save: "fort" | "ref" | "will";
      dc: number;
      sourceId?: string;
    }
  | {
      type: "spell.cast.prepared";
      actorId: string;
      castingTrackId: string;
      spellId: string;
      preparationId: string;
      targetIds?: readonly string[];
    }
  | {
      type: "spell.cast.spontaneous";
      actorId: string;
      castingTrackId: string;
      spellId: string;
      slotLevel?: number;
      targetIds?: readonly string[];
    }
  | {
      type: "power.manifest";
      actorId: string;
      castingTrackId: string;
      powerId: string;
      augmentations?: readonly RequestedResolvedPowerAugmentation[];
      targetIds?: readonly string[];
    };

export type GameCommandResult = {
  type: GameCommand["type"];
  value: unknown;
};

/**
 * Single authoritative application boundary for commands issued by either the
 * UI or the AI Dungeon Master. The command dispatcher itself owns no rules and
 * no persistent state: it delegates to the existing deterministic services,
 * which validate rules and commit state/events to D1 atomically.
 */
export async function executeGameCommand(
  deps: GameCommandDependencies,
  campaignId: string,
  command: GameCommand,
): Promise<GameCommandResult> {
  switch (command.type) {
    case "encounter.start":
      return {
        type: command.type,
        value: await startActorEncounter(deps, {
          campaignId,
          participantIds: command.participantIds,
        }),
      };
    case "encounter.end_turn":
      return {
        type: command.type,
        value: await endEncounterTurn(deps, {
          campaignId,
          encounterId: command.encounterId,
          actorId: command.actorId,
        }),
      };
    case "encounter.finish":
      return {
        type: command.type,
        value: await finishEncounter(deps, {
          campaignId,
          encounterId: command.encounterId,
          ...(command.status === undefined ? {} : { status: command.status }),
        }),
      };
    case "combat.attack":
      return {
        type: command.type,
        value: await performActorAttack(deps, {
          campaignId,
          attackerId: command.attackerId,
          targetId: command.targetId,
          kind: command.kind,
          ...(command.weaponInventoryId === undefined
            ? {}
            : { weaponInventoryId: command.weaponInventoryId }),
          ...(command.monsterAttackId === undefined
            ? {}
            : { monsterAttackId: command.monsterAttackId }),
        }),
      };
    case "check.skill":
      return {
        type: command.type,
        value: await performSkillCheck(deps, {
          campaignId,
          actorId: command.actorId,
          skillId: command.skillId,
          dc: command.dc,
          ...(command.specialization === undefined
            ? {}
            : { specialization: command.specialization }),
        }),
      };
    case "check.save":
      return {
        type: command.type,
        value: await performSavingThrow(deps, {
          campaignId,
          actorId: command.actorId,
          save: command.save,
          dc: command.dc,
          ...(command.sourceId === undefined ? {} : { sourceId: command.sourceId }),
        }),
      };
    case "spell.cast.prepared":
      return {
        type: command.type,
        value: await castPreparedSpellResolved(deps, {
          campaignId,
          actorId: command.actorId,
          castingTrackId: command.castingTrackId,
          spellId: command.spellId,
          preparationId: command.preparationId,
          ...(command.targetIds === undefined ? {} : { targetIds: command.targetIds }),
        }),
      };
    case "spell.cast.spontaneous":
      return {
        type: command.type,
        value: await castSpontaneousSpellResolved(deps, {
          campaignId,
          actorId: command.actorId,
          castingTrackId: command.castingTrackId,
          spellId: command.spellId,
          ...(command.slotLevel === undefined ? {} : { slotLevel: command.slotLevel }),
          ...(command.targetIds === undefined ? {} : { targetIds: command.targetIds }),
        }),
      };
    case "power.manifest":
      return {
        type: command.type,
        value: await manifestPowerResolved(deps, {
          campaignId,
          actorId: command.actorId,
          castingTrackId: command.castingTrackId,
          powerId: command.powerId,
          ...(command.augmentations === undefined
            ? {}
            : { augmentations: command.augmentations }),
          ...(command.targetIds === undefined ? {} : { targetIds: command.targetIds }),
        }),
      };
  }
}
