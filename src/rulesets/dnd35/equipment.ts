import type { DamageComponent } from "./damage";
import type { ArmorClassModifier } from "./combat";

export interface RuntimeArmor {
  id: string;
  name?: string;
  acBonus: number;
  maxDexBonus: number | null;
  armorCheckPenalty: number;
  arcaneSpellFailurePercent: number;
  speedAt30Feet: number | null;
  speedAt20Feet: number | null;
  enhancementBonus?: number;
}

export interface WeaponRangeResult {
  distanceFeet: number;
  rangeIncrementFeet: number;
  increments: number;
  maximumIncrements: number;
  inRange: boolean;
  penalty: number;
}

function assertFiniteNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative finite number.`);
  }
}

export function armorClassModifierFromArmor(armor: RuntimeArmor): ArmorClassModifier {
  if (!armor.id.trim()) throw new RangeError("Armor id cannot be empty.");
  assertFiniteNonNegative(armor.acBonus, "Armor AC bonus");
  const enhancementBonus = armor.enhancementBonus ?? 0;
  assertFiniteNonNegative(enhancementBonus, "Armor enhancement bonus");

  return {
    id: `armor:${armor.id}`,
    source: armor.name?.trim() || armor.id,
    kind: "armor",
    value: armor.acBonus + enhancementBonus,
  };
}

export function validateRuntimeArmor(armor: RuntimeArmor): RuntimeArmor {
  armorClassModifierFromArmor(armor);
  if (armor.maxDexBonus !== null) assertFiniteNonNegative(armor.maxDexBonus, "Armor maximum Dexterity bonus");
  if (!Number.isFinite(armor.armorCheckPenalty) || armor.armorCheckPenalty > 0) {
    throw new RangeError("Armor check penalty must be zero or negative.");
  }
  if (
    !Number.isFinite(armor.arcaneSpellFailurePercent) ||
    armor.arcaneSpellFailurePercent < 0 ||
    armor.arcaneSpellFailurePercent > 100
  ) {
    throw new RangeError("Arcane spell failure chance must be between 0 and 100.");
  }
  if (armor.speedAt30Feet !== null) assertFiniteNonNegative(armor.speedAt30Feet, "Armor speed at 30 feet");
  if (armor.speedAt20Feet !== null) assertFiniteNonNegative(armor.speedAt20Feet, "Armor speed at 20 feet");
  return armor;
}

/** Apply the speed columns stored on an armor definition for the common 30/20 ft base speeds. */
export function armorAdjustedSpeed(baseSpeedFeet: number, armor: RuntimeArmor): number {
  assertFiniteNonNegative(baseSpeedFeet, "Base speed");
  validateRuntimeArmor(armor);
  if (baseSpeedFeet === 30 && armor.speedAt30Feet !== null) return armor.speedAt30Feet;
  if (baseSpeedFeet === 20 && armor.speedAt20Feet !== null) return armor.speedAt20Feet;
  return baseSpeedFeet;
}

/** Nonproficiency with a weapon imposes the standard -4 attack penalty. */
export function weaponNonproficiencyPenalty(proficient: boolean): number {
  return proficient ? 0 : -4;
}

/**
 * Calculate the -2-per-extra-range-increment attack penalty. Projectile weapons
 * normally use 10 increments; thrown weapons should pass maximumIncrements: 5.
 */
export function weaponRangePenalty(input: {
  distanceFeet: number;
  rangeIncrementFeet: number;
  maximumIncrements?: number;
}): WeaponRangeResult {
  assertFiniteNonNegative(input.distanceFeet, "Weapon distance");
  if (!Number.isFinite(input.rangeIncrementFeet) || input.rangeIncrementFeet <= 0) {
    throw new RangeError("Range increment must be a positive finite number.");
  }

  const maximumIncrements = input.maximumIncrements ?? 10;
  if (!Number.isSafeInteger(maximumIncrements) || maximumIncrements < 1) {
    throw new RangeError("Maximum range increments must be a positive safe integer.");
  }

  const increments = Math.max(1, Math.ceil(input.distanceFeet / input.rangeIncrementFeet));
  const inRange = increments <= maximumIncrements;
  const penaltySteps = inRange ? increments - 1 : maximumIncrements - 1;
  const penalty = penaltySteps === 0 ? 0 : -2 * penaltySteps;

  return {
    distanceFeet: input.distanceFeet,
    rangeIncrementFeet: input.rangeIncrementFeet,
    increments,
    maximumIncrements,
    inRange,
    penalty,
  };
}

/** Build the critical-eligible base weapon damage component consumed by resolveDamage(). */
export function weaponDamageComponent(input: {
  weaponId: string;
  weaponName?: string;
  dice: string;
  staticBonus?: number;
}): DamageComponent {
  if (!input.weaponId.trim()) throw new RangeError("Weapon id cannot be empty.");
  if (!input.dice.trim()) throw new RangeError("Weapon damage dice cannot be empty.");
  const staticBonus = input.staticBonus ?? 0;
  if (!Number.isFinite(staticBonus)) throw new RangeError("Weapon static damage bonus must be finite.");

  return {
    id: `weapon:${input.weaponId}`,
    source: input.weaponName?.trim() || input.weaponId,
    dice: input.dice,
    flat: staticBonus,
    criticalEligible: true,
  };
}
