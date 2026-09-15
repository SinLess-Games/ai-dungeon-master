/// <reference types="@cloudflare/workers-types" />

import type { Database } from "@/infrastructure/database/client";
import type { EquipmentSlot } from "@/infrastructure/database/schema/dnd35/primitives";
import { performActorAttack } from "./actorCombatService";
import { startActorEncounter } from "./actorEncounterService";
import { endEncounterTurn, finishEncounter } from "./encounterService";
import { performSavingThrow, performSkillCheck } from "./gameActionService";
import {
  applyActorCondition,
  applyDirectActorDamage,
  applyDirectActorHealing,
  grantCharacterExperience,
  grantCharacterItem,
  recordCharacterAlignmentAction,
  removeActorCondition,
  removeCharacterItem,
} from "./dmStateMutationService";
import { configureCharacterInventory } from "./inventoryConfigurationService";
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
  | { type: "encounter.start"; participantIds: readonly string[] }
  | { type: "encounter.end_turn"; encounterId: string; actorId: string }
  | { type: "encounter.finish"; encounterId: string; status?: "completed" | "abandoned" }
  | {
      type: "combat.attack";
      attackerId: string;
      targetId: string;
      kind: "melee" | "ranged";
      weaponInventoryId?: string;
      monsterAttackId?: string;
      attackRoll?: number;
      confirmationRoll?: number;
      damageRolls?: readonly number[];
    }
  | {
      type: "check.skill";
      actorId: string;
      skillId: string;
      specialization?: string;
      dc: number;
      /** Optional player-supplied natural d20 result. */
      roll?: number;
    }
  | {
      type: "check.save";
      actorId: string;
      save: "fort" | "ref" | "will";
      dc: number;
      sourceId?: string;
      /** Optional player-supplied natural d20 result. */
      roll?: number;
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
    }
  | {
      type: "health.damage";
      targetId: string;
      amount: number;
      sourceActorId?: string;
      reason: string;
    }
  | {
      type: "health.heal";
      targetId: string;
      amount: number;
      sourceActorId?: string;
      reason: string;
    }
  | {
      type: "condition.apply";
      targetId: string;
      conditionId: string;
      sourceActorId?: string;
      sourceDescription?: string;
      durationKind: "rounds" | "permanent" | "special";
      remainingRounds?: number;
      reason: string;
    }
  | {
      type: "condition.remove";
      runtimeConditionId: string;
      sourceActorId?: string;
      reason: string;
    }
  | {
      type: "inventory.grant";
      actorId: string;
      itemId: string;
      quantity: number;
      location?: "carried" | "stored" | "party";
      reason: string;
    }
  | {
      type: "inventory.remove";
      actorId: string;
      inventoryId: string;
      quantity: number;
      reason: string;
    }
  | {
      type: "inventory.configure";
      actorId: string;
      inventoryId: string;
      location?: "carried" | "stored" | "party";
      equippedSlot?: EquipmentSlot | null;
      notes?: string | null;
      reason: string;
    }
  | {
      type: "progression.xp.grant";
      actorId: string;
      amount: number;
      reason: string;
    }
  | {
      type: "alignment.record";
      actorId: string;
      lawChaosDelta: number;
      goodEvilDelta: number;
      reason: string;
    };

export type GameCommandResult = { type: GameCommand["type"]; value: unknown };

export interface GameCommandHandlers {
  startEncounter: typeof startActorEncounter;
  endTurn: typeof endEncounterTurn;
  finishEncounter: typeof finishEncounter;
  attack: typeof performActorAttack;
  skillCheck: typeof performSkillCheck;
  savingThrow: typeof performSavingThrow;
  castPrepared: typeof castPreparedSpellResolved;
  castSpontaneous: typeof castSpontaneousSpellResolved;
  manifestPower: typeof manifestPowerResolved;
  damage: typeof applyDirectActorDamage;
  heal: typeof applyDirectActorHealing;
  applyCondition: typeof applyActorCondition;
  removeCondition: typeof removeActorCondition;
  grantItem: typeof grantCharacterItem;
  removeItem: typeof removeCharacterItem;
  configureInventory: typeof configureCharacterInventory;
  grantXp: typeof grantCharacterExperience;
  recordAlignment: typeof recordCharacterAlignmentAction;
}

export const defaultGameCommandHandlers: GameCommandHandlers = {
  startEncounter: startActorEncounter,
  endTurn: endEncounterTurn,
  finishEncounter,
  attack: performActorAttack,
  skillCheck: performSkillCheck,
  savingThrow: performSavingThrow,
  castPrepared: castPreparedSpellResolved,
  castSpontaneous: castSpontaneousSpellResolved,
  manifestPower: manifestPowerResolved,
  damage: applyDirectActorDamage,
  heal: applyDirectActorHealing,
  applyCondition: applyActorCondition,
  removeCondition: removeActorCondition,
  grantItem: grantCharacterItem,
  removeItem: removeCharacterItem,
  configureInventory: configureCharacterInventory,
  grantXp: grantCharacterExperience,
  recordAlignment: recordCharacterAlignmentAction,
};

/**
 * Single authoritative application boundary for commands issued by either the
 * UI or the AI Dungeon Master. The dispatcher owns no rules and no state: all
 * validation and persistence remain in the deterministic command handlers.
 */
export async function executeGameCommand(
  deps: GameCommandDependencies,
  campaignId: string,
  command: GameCommand,
  handlers: GameCommandHandlers = defaultGameCommandHandlers,
): Promise<GameCommandResult> {
  switch (command.type) {
    case "encounter.start":
      return {
        type: command.type,
        value: await handlers.startEncounter(deps, {
          campaignId,
          participantIds: command.participantIds,
        }),
      };
    case "encounter.end_turn":
      return {
        type: command.type,
        value: await handlers.endTurn(deps, {
          campaignId,
          encounterId: command.encounterId,
          actorId: command.actorId,
        }),
      };
    case "encounter.finish":
      return {
        type: command.type,
        value: await handlers.finishEncounter(deps, {
          campaignId,
          encounterId: command.encounterId,
          ...(command.status === undefined ? {} : { status: command.status }),
        }),
      };
    case "combat.attack":
      return {
        type: command.type,
        value: await handlers.attack(deps, {
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
          ...(command.attackRoll === undefined ? {} : { attackRoll: command.attackRoll }),
          ...(command.confirmationRoll === undefined
            ? {}
            : { confirmationRoll: command.confirmationRoll }),
          ...(command.damageRolls === undefined ? {} : { damageRolls: command.damageRolls }),
        }),
      };
    case "check.skill":
      return {
        type: command.type,
        value: await handlers.skillCheck(deps, {
          campaignId,
          actorId: command.actorId,
          skillId: command.skillId,
          dc: command.dc,
          ...(command.specialization === undefined
            ? {}
            : { specialization: command.specialization }),
          ...(command.roll === undefined ? {} : { roll: command.roll }),
        }),
      };
    case "check.save":
      return {
        type: command.type,
        value: await handlers.savingThrow(deps, {
          campaignId,
          actorId: command.actorId,
          save: command.save,
          dc: command.dc,
          ...(command.sourceId === undefined ? {} : { sourceId: command.sourceId }),
          ...(command.roll === undefined ? {} : { roll: command.roll }),
        }),
      };
    case "spell.cast.prepared":
      return {
        type: command.type,
        value: await handlers.castPrepared(deps, {
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
        value: await handlers.castSpontaneous(deps, {
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
        value: await handlers.manifestPower(deps, {
          campaignId,
          actorId: command.actorId,
          castingTrackId: command.castingTrackId,
          powerId: command.powerId,
          ...(command.augmentations === undefined ? {} : { augmentations: command.augmentations }),
          ...(command.targetIds === undefined ? {} : { targetIds: command.targetIds }),
        }),
      };
    case "health.damage":
      return {
        type: command.type,
        value: await handlers.damage(deps, {
          campaignId,
          targetId: command.targetId,
          amount: command.amount,
          reason: command.reason,
          ...(command.sourceActorId === undefined ? {} : { sourceActorId: command.sourceActorId }),
        }),
      };
    case "health.heal":
      return {
        type: command.type,
        value: await handlers.heal(deps, {
          campaignId,
          targetId: command.targetId,
          amount: command.amount,
          reason: command.reason,
          ...(command.sourceActorId === undefined ? {} : { sourceActorId: command.sourceActorId }),
        }),
      };
    case "condition.apply":
      return {
        type: command.type,
        value: await handlers.applyCondition(deps, {
          campaignId,
          targetId: command.targetId,
          conditionId: command.conditionId,
          durationKind: command.durationKind,
          reason: command.reason,
          ...(command.sourceActorId === undefined ? {} : { sourceActorId: command.sourceActorId }),
          ...(command.sourceDescription === undefined
            ? {}
            : { sourceDescription: command.sourceDescription }),
          ...(command.remainingRounds === undefined
            ? {}
            : { remainingRounds: command.remainingRounds }),
        }),
      };
    case "condition.remove":
      return {
        type: command.type,
        value: await handlers.removeCondition(deps, {
          campaignId,
          runtimeConditionId: command.runtimeConditionId,
          reason: command.reason,
          ...(command.sourceActorId === undefined ? {} : { sourceActorId: command.sourceActorId }),
        }),
      };
    case "inventory.grant":
      return {
        type: command.type,
        value: await handlers.grantItem(deps, {
          campaignId,
          actorId: command.actorId,
          itemId: command.itemId,
          quantity: command.quantity,
          reason: command.reason,
          ...(command.location === undefined ? {} : { location: command.location }),
        }),
      };
    case "inventory.remove":
      return {
        type: command.type,
        value: await handlers.removeItem(deps, {
          campaignId,
          actorId: command.actorId,
          inventoryId: command.inventoryId,
          quantity: command.quantity,
          reason: command.reason,
        }),
      };
    case "inventory.configure":
      return {
        type: command.type,
        value: await handlers.configureInventory(deps, {
          campaignId,
          actorId: command.actorId,
          inventoryId: command.inventoryId,
          reason: command.reason,
          ...(command.location === undefined ? {} : { location: command.location }),
          ...(command.equippedSlot === undefined
            ? {}
            : { equippedSlot: command.equippedSlot }),
          ...(command.notes === undefined ? {} : { notes: command.notes }),
        }),
      };
    case "progression.xp.grant":
      return {
        type: command.type,
        value: await handlers.grantXp(deps, {
          campaignId,
          actorId: command.actorId,
          amount: command.amount,
          reason: command.reason,
        }),
      };
    case "alignment.record":
      return {
        type: command.type,
        value: await handlers.recordAlignment(deps, {
          campaignId,
          actorId: command.actorId,
          lawChaosDelta: command.lawChaosDelta,
          goodEvilDelta: command.goodEvilDelta,
          reason: command.reason,
        }),
      };
  }
}
