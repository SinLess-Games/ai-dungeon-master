export type WeaponHandUse = "primary" | "off_hand" | "two_handed";
export type WeaponAttackMode = "melee" | "thrown" | "projectile";

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite.`);
}

/**
 * Strength contribution to weapon damage. A negative Strength modifier is not
 * increased by two-handed use; off-hand attacks apply half the modifier with
 * normal mathematical floor behavior for the integer modifier.
 */
export function strengthDamageModifier(input: {
  strengthModifier: number;
  handUse: WeaponHandUse;
  attackMode?: WeaponAttackMode;
  compositeBowStrengthRating?: number | null;
}): number {
  assertFinite(input.strengthModifier, "Strength modifier");
  const attackMode = input.attackMode ?? "melee";

  if (attackMode === "projectile") {
    const rating = input.compositeBowStrengthRating;
    if (rating === undefined || rating === null) {
      return Math.min(0, input.strengthModifier);
    }
    if (!Number.isSafeInteger(rating) || rating < 0) {
      throw new RangeError("Composite-bow Strength rating must be a non-negative safe integer.");
    }
    return Math.min(input.strengthModifier, rating);
  }

  if (input.handUse === "off_hand") return Math.floor(input.strengthModifier / 2);
  if (input.handUse === "two_handed" && input.strengthModifier > 0) {
    return Math.floor(input.strengthModifier * 1.5);
  }
  return input.strengthModifier;
}

export interface TwoWeaponPenalties {
  primary: number;
  offHand: number;
}

/** Core 3.5 two-weapon penalties before special class features or feats beyond TWF. */
export function twoWeaponFightingPenalties(input: {
  offHandIsLight: boolean;
  hasTwoWeaponFighting: boolean;
}): TwoWeaponPenalties {
  let primary = -6;
  let offHand = -10;
  if (input.offHandIsLight) {
    primary += 2;
    offHand += 2;
  }
  if (input.hasTwoWeaponFighting) {
    primary += 2;
    offHand += 6;
  }
  return { primary, offHand };
}

export function powerAttackExchange(input: {
  baseAttackBonus: number;
  penalty: number;
  twoHandedWeapon: boolean;
  lightWeapon?: boolean;
}): { attackPenalty: number; damageBonus: number } {
  if (!Number.isSafeInteger(input.baseAttackBonus) || input.baseAttackBonus < 1) {
    throw new RangeError("Power Attack requires a positive safe-integer base attack bonus.");
  }
  if (!Number.isSafeInteger(input.penalty) || input.penalty < 0 || input.penalty > input.baseAttackBonus) {
    throw new RangeError("Power Attack penalty must be between 0 and the base attack bonus.");
  }
  if (input.lightWeapon) return { attackPenalty: 0, damageBonus: 0 };
  return {
    attackPenalty: -input.penalty,
    damageBonus: input.penalty * (input.twoHandedWeapon ? 2 : 1),
  };
}

/** Melee reach check after the map layer has produced distance in feet. */
export function canReachMeleeTarget(input: {
  distanceFeet: number;
  reachFeet: number;
  minimumReachFeet?: number;
}): boolean {
  if (!Number.isFinite(input.distanceFeet) || input.distanceFeet < 0) {
    throw new RangeError("Melee distance must be non-negative and finite.");
  }
  if (!Number.isFinite(input.reachFeet) || input.reachFeet < 0) {
    throw new RangeError("Melee reach must be non-negative and finite.");
  }
  const minimumReachFeet = input.minimumReachFeet ?? 0;
  if (!Number.isFinite(minimumReachFeet) || minimumReachFeet < 0 || minimumReachFeet > input.reachFeet) {
    throw new RangeError("Minimum reach must be between zero and maximum reach.");
  }
  return input.distanceFeet >= minimumReachFeet && input.distanceFeet <= input.reachFeet;
}

export function criticalDamageMultiplier(baseMultiplier: number, multiplierIncrease = 0): number {
  if (!Number.isSafeInteger(baseMultiplier) || baseMultiplier < 2) {
    throw new RangeError("Weapon critical multiplier must be at least 2.");
  }
  if (!Number.isSafeInteger(multiplierIncrease) || multiplierIncrease < 0) {
    throw new RangeError("Critical multiplier increase must be a non-negative safe integer.");
  }
  return baseMultiplier + multiplierIncrease;
}
