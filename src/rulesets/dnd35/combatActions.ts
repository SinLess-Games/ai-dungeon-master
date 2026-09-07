import { engineFailure, engineSuccess, type EngineResult } from "@engine/result";
import { iterativeBaseAttackBonuses } from "./progression";
import { resolveAttackRoll, type AttackRollResult } from "./combat";

export interface ChargeValidation {
  distanceFeet: number;
  maximumDistanceFeet: number;
  attackModifier: number;
  armorClassModifier: number;
}

function assertNonNegativeFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be non-negative and finite.`);
}

/**
 * Validate the core geometry/action constraints of a charge. Terrain/pathfinding
 * stays outside the ruleset; the caller reports whether a straight clear path exists.
 */
export function validateCharge(input: {
  speedFeet: number;
  distanceFeet: number;
  straightLine: boolean;
  clearPath: boolean;
  targetReachable: boolean;
}): EngineResult<ChargeValidation> {
  assertNonNegativeFinite(input.speedFeet, "Speed");
  assertNonNegativeFinite(input.distanceFeet, "Charge distance");
  const maximumDistanceFeet = input.speedFeet * 2;

  if (input.distanceFeet <= 0) {
    return engineFailure("DND35_CHARGE_NO_MOVEMENT", "A charge must include movement toward the target.");
  }
  if (input.distanceFeet > maximumDistanceFeet) {
    return engineFailure("DND35_CHARGE_TOO_FAR", "The target is beyond twice the charger's speed.");
  }
  if (!input.straightLine) {
    return engineFailure("DND35_CHARGE_NOT_STRAIGHT", "A charge requires a straight path toward the target.");
  }
  if (!input.clearPath) {
    return engineFailure("DND35_CHARGE_PATH_BLOCKED", "A charge cannot pass through blocking terrain or creatures.");
  }
  if (!input.targetReachable) {
    return engineFailure("DND35_CHARGE_TARGET_UNREACHABLE", "The charger cannot end in a space from which the target can be attacked.");
  }

  return engineSuccess({
    distanceFeet: input.distanceFeet,
    maximumDistanceFeet,
    attackModifier: 2,
    armorClassModifier: -2,
  });
}

export interface FullAttackEntry {
  index: number;
  baseAttackBonus: number;
  totalAttackBonus: number;
  result: AttackRollResult;
}

/** Resolve the normal iterative attacks granted by BAB. Extra natural/TWF attacks are separate sources. */
export function resolveFullAttack(input: {
  baseAttackBonus: number;
  fixedAttackModifier: number;
  armorClass: number;
  threatMinimum?: number;
  rolls?: readonly number[];
}): readonly FullAttackEntry[] {
  if (!Number.isSafeInteger(input.baseAttackBonus) || input.baseAttackBonus < 0) {
    throw new RangeError("Full-attack BAB must be a non-negative safe integer.");
  }
  if (!Number.isFinite(input.fixedAttackModifier)) throw new RangeError("Fixed attack modifier must be finite.");
  if (!Number.isFinite(input.armorClass)) throw new RangeError("Armor Class must be finite.");

  const iterative = iterativeBaseAttackBonuses(input.baseAttackBonus);
  if (input.rolls && input.rolls.length !== iterative.length) {
    throw new RangeError(`Expected ${iterative.length} explicit attack rolls, received ${input.rolls.length}.`);
  }

  return iterative.map((baseAttackBonus, index) => {
    const totalAttackBonus = baseAttackBonus + input.fixedAttackModifier;
    const roll = input.rolls?.[index];
    const result = resolveAttackRoll({
      attackBonus: totalAttackBonus,
      armorClass: input.armorClass,
      ...(input.threatMinimum === undefined ? {} : { threatMinimum: input.threatMinimum }),
      ...(roll === undefined ? {} : { roll }),
    });
    return { index, baseAttackBonus, totalAttackBonus, result };
  });
}

export interface CriticalConfirmationResult {
  threatened: boolean;
  confirmed: boolean;
  confirmation: AttackRollResult | null;
}

/** A threat only becomes a critical hit after a second attack roll hits the same AC. */
export function resolveCriticalConfirmation(input: {
  threat: AttackRollResult;
  attackBonus: number;
  armorClass: number;
  confirmationRoll?: number;
}): CriticalConfirmationResult {
  if (!input.threat.criticalThreat) {
    return { threatened: false, confirmed: false, confirmation: null };
  }

  const confirmation = resolveAttackRoll({
    attackBonus: input.attackBonus,
    armorClass: input.armorClass,
    ...(input.confirmationRoll === undefined ? {} : { roll: input.confirmationRoll }),
  });

  return {
    threatened: true,
    confirmed: confirmation.hit,
    confirmation,
  };
}
