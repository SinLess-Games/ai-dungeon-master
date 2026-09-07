import { engineFailure, engineSuccess, type EngineResult } from "@engine/result";
import { resolveAttackRoll, type AttackRollResult } from "./combat";
import { iterativeBaseAttackBonuses } from "./progression";

export interface ChargeValidation {
  distanceFeet: number;
  maximumDistanceFeet: number;
  attackModifier: number;
  armorClassModifier: number;
}

function assertNonNegativeFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be non-negative and finite.`);
  }
}

/**
 * Validate the core movement constraints of a D&D 3.5 charge. Terrain and exact
 * path geometry stay outside the ruleset; callers report the authoritative map
 * facts. A normal charge is a full-round action and may move up to double speed.
 * When a creature is restricted to one standard/move action, the special
 * standard-action charge is limited to its speed.
 */
export function validateCharge(input: {
  speedFeet: number;
  distanceFeet: number;
  straightLine: boolean;
  clearPath: boolean;
  targetReachable: boolean;
  restrictedToStandardAction?: boolean;
}): EngineResult<ChargeValidation> {
  assertNonNegativeFinite(input.speedFeet, "Speed");
  assertNonNegativeFinite(input.distanceFeet, "Charge distance");
  const restrictedToStandardAction = input.restrictedToStandardAction ?? false;
  const maximumDistanceFeet = input.speedFeet * (restrictedToStandardAction ? 1 : 2);

  if (input.distanceFeet < 10) {
    return engineFailure(
      "DND35_CHARGE_TOO_SHORT",
      "A charge must move at least 10 feet toward the target.",
    );
  }
  if (input.distanceFeet > maximumDistanceFeet) {
    return engineFailure(
      "DND35_CHARGE_TOO_FAR",
      restrictedToStandardAction
        ? "A standard-action charge cannot move farther than the charger's speed."
        : "The target is beyond twice the charger's speed.",
    );
  }
  if (!input.straightLine) {
    return engineFailure(
      "DND35_CHARGE_NOT_STRAIGHT",
      "A charge requires a straight path toward the target.",
    );
  }
  if (!input.clearPath) {
    return engineFailure(
      "DND35_CHARGE_PATH_BLOCKED",
      "A charge cannot pass through blocking, slowing, or occupied terrain.",
    );
  }
  if (!input.targetReachable) {
    return engineFailure(
      "DND35_CHARGE_TARGET_UNREACHABLE",
      "The charger cannot end in the closest legal space from which the target can be attacked.",
    );
  }

  return engineSuccess({
    distanceFeet: input.distanceFeet,
    maximumDistanceFeet,
    attackModifier: 2,
    armorClassModifier: -2,
  });
}

/** Semantic alias for callers that think in terms of action resolution. */
export const resolveCharge = validateCharge;

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
  if (!Number.isFinite(input.fixedAttackModifier)) {
    throw new RangeError("Fixed attack modifier must be finite.");
  }
  if (!Number.isFinite(input.armorClass)) {
    throw new RangeError("Armor Class must be finite.");
  }

  const iterative = iterativeBaseAttackBonuses(input.baseAttackBonus);
  if (input.rolls && input.rolls.length !== iterative.length) {
    throw new RangeError(
      `Expected ${iterative.length} explicit attack rolls, received ${input.rolls.length}.`,
    );
  }

  return iterative.map((baseAttackBonus, index) => {
    const totalAttackBonus = baseAttackBonus + input.fixedAttackModifier;
    const roll = input.rolls?.[index];
    const result = resolveAttackRoll({
      attackBonus: totalAttackBonus,
      armorClass: input.armorClass,
      ...(input.threatMinimum === undefined
        ? {}
        : { threatMinimum: input.threatMinimum }),
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
    ...(input.confirmationRoll === undefined
      ? {}
      : { roll: input.confirmationRoll }),
  });

  return {
    threatened: true,
    confirmed: confirmation.hit,
    confirmation,
  };
}
