import { engineFailure, engineSuccess, type EngineResult } from "@/engine";
import type { Dnd35Modifier } from "./modifiers";

export type ConcealmentLevel = "none" | "concealment" | "total";
export type CoverLevel = "none" | "cover" | "improved" | "total";

export interface CoverBenefits {
  armorClassBonus: number;
  reflexSaveBonus: number;
  targetable: boolean;
}

export function coverBenefits(level: CoverLevel): CoverBenefits {
  switch (level) {
    case "none":
      return { armorClassBonus: 0, reflexSaveBonus: 0, targetable: true };
    case "cover":
      return { armorClassBonus: 4, reflexSaveBonus: 2, targetable: true };
    case "improved":
      return { armorClassBonus: 8, reflexSaveBonus: 4, targetable: true };
    case "total":
      return { armorClassBonus: 0, reflexSaveBonus: 0, targetable: false };
  }
}

export function coverModifiers(level: CoverLevel, source = "cover"): readonly Dnd35Modifier[] {
  const benefits = coverBenefits(level);
  if (!benefits.targetable || level === "none") return [];
  return [
    {
      id: `${source}:ac`,
      source,
      kind: "cover",
      value: benefits.armorClassBonus,
      stacking: "overlap",
    },
    {
      id: `${source}:reflex`,
      source,
      kind: "cover",
      value: benefits.reflexSaveBonus,
      stacking: "overlap",
    },
  ];
}

export function concealmentMissChance(level: ConcealmentLevel): number {
  switch (level) {
    case "none":
      return 0;
    case "concealment":
      return 20;
    case "total":
      return 50;
  }
}

/** Resolve the miss chance after an attack otherwise hits. */
export function resolveConcealment(input: {
  level: ConcealmentLevel;
  percentileRoll: number;
  ignoreConcealment?: boolean;
}): EngineResult<{ missed: boolean; missChance: number; roll: number }> {
  if (!Number.isSafeInteger(input.percentileRoll) || input.percentileRoll < 1 || input.percentileRoll > 100) {
    throw new RangeError("Concealment roll must be an integer from 1 through 100.");
  }
  const missChance = input.ignoreConcealment ? 0 : concealmentMissChance(input.level);
  return engineSuccess({
    missed: input.percentileRoll <= missChance,
    missChance,
    roll: input.percentileRoll,
  });
}

export function flankingAttackModifier(flanking: boolean): number {
  return flanking ? 2 : 0;
}

export function fightingDefensivelyModifiers(): {
  attack: number;
  dodgeArmorClass: number;
} {
  return { attack: -4, dodgeArmorClass: 2 };
}

export function totalDefenseArmorClassBonus(): number {
  return 4;
}

export function rangedAttackIntoMeleePenalty(input: {
  targetInMelee: boolean;
  hasPreciseShot: boolean;
}): number {
  return input.targetInMelee && !input.hasPreciseShot ? -4 : 0;
}

export function proneCombatModifiers(input: { attackingWithRangedWeapon: boolean }): {
  attackModifier: number;
  armorClassVsMelee: number;
  armorClassVsRanged: number;
} {
  return {
    attackModifier: input.attackingWithRangedWeapon ? 0 : -4,
    armorClassVsMelee: -4,
    armorClassVsRanged: 4,
  };
}

export function validateTargetVisibility(input: {
  cover: CoverLevel;
  lineOfEffect: boolean;
  targetKnown: boolean;
}): EngineResult<true> {
  if (input.cover === "total") {
    return engineFailure("DND35_TOTAL_COVER", "A creature with total cover cannot be directly targeted.");
  }
  if (!input.lineOfEffect) {
    return engineFailure("DND35_NO_LINE_OF_EFFECT", "There is no line of effect to the target.");
  }
  if (!input.targetKnown) {
    return engineFailure("DND35_TARGET_LOCATION_UNKNOWN", "The target's location is unknown.");
  }
  return engineSuccess(true);
}
