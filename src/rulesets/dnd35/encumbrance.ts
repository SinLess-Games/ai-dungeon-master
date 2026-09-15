import type { Dnd35Size, LoadCategory } from "./types";

const HEAVY_LOAD_BY_STRENGTH: readonly number[] = [
  0,
  10,
  20,
  30,
  40,
  50,
  60,
  70,
  80,
  90,
  100,
  115,
  130,
  150,
  175,
  200,
  230,
  260,
  300,
  350,
  400,
  460,
  520,
  600,
  700,
  800,
  920,
  1040,
  1200,
  1400,
] as const;

const BIPED_SIZE_MULTIPLIER: Record<Dnd35Size, number> = {
  fine: 1 / 8,
  diminutive: 1 / 4,
  tiny: 1 / 2,
  small: 3 / 4,
  medium: 1,
  large: 2,
  huge: 4,
  gargantuan: 8,
  colossal: 16,
};

const QUADRUPED_SIZE_MULTIPLIER: Record<Dnd35Size, number> = {
  fine: 1 / 4,
  diminutive: 1 / 2,
  tiny: 3 / 4,
  small: 1,
  medium: 1.5,
  large: 3,
  huge: 6,
  gargantuan: 12,
  colossal: 24,
};

export interface CarryingCapacity {
  strength: number;
  size: Dnd35Size;
  quadruped: boolean;
  lightMaximum: number;
  mediumMaximum: number;
  heavyMaximum: number;
  liftOverHead: number;
  liftOffGround: number;
  pushOrDrag: number;
}

export interface EncumbrancePenaltyProfile {
  /** The load that is mechanically applied after the character-level toggle is considered. */
  load: LoadCategory;
  /** Null means no encumbrance Dexterity cap. */
  maxDexterityBonus: number | null;
  /** Armor-check-style penalty. This is never stacked with armor; use the worse value. */
  armorCheckPenalty: number;
  /** Normal running multiplier before other effects. Zero means running is unavailable. */
  runMultiplier: number;
  movement: "normal" | "reduced" | "stagger" | "immobile";
}

export type MovementRestriction = EncumbrancePenaltyProfile["movement"];

const MOVEMENT_RESTRICTION_SEVERITY: Record<MovementRestriction, number> = {
  normal: 0,
  reduced: 1,
  stagger: 2,
  immobile: 3,
};

export interface EncumbranceState extends EncumbrancePenaltyProfile {
  enabled: boolean;
  carriedWeight: number;
  actualLoad: LoadCategory;
  capacity: CarryingCapacity;
  baseLandSpeedFeet: number;
  landSpeedFeet: number;
}

function assertStrength(strength: number): void {
  if (!Number.isSafeInteger(strength) || strength < 0) {
    throw new RangeError("Strength must be a non-negative safe integer.");
  }
}

function mediumHeavyLoad(strength: number): number {
  assertStrength(strength);
  if (strength === 0) return 0;

  let normalized = strength;
  let multiplier = 1;
  while (normalized > 29) {
    normalized -= 10;
    multiplier *= 4;
  }

  const base = HEAVY_LOAD_BY_STRENGTH[normalized];
  if (base === undefined) throw new RangeError("Unsupported Strength value.");
  return base * multiplier;
}

export function carryingCapacity(
  strength: number,
  options: { size?: Dnd35Size; quadruped?: boolean } = {},
): CarryingCapacity {
  const size = options.size ?? "medium";
  const quadruped = options.quadruped ?? false;
  const sizeMultiplier = quadruped
    ? QUADRUPED_SIZE_MULTIPLIER[size]
    : BIPED_SIZE_MULTIPLIER[size];
  const heavyMaximum = mediumHeavyLoad(strength) * sizeMultiplier;

  return {
    strength,
    size,
    quadruped,
    lightMaximum: Math.floor(heavyMaximum / 3),
    mediumMaximum: Math.floor((heavyMaximum * 2) / 3),
    heavyMaximum,
    liftOverHead: heavyMaximum,
    liftOffGround: heavyMaximum * 2,
    pushOrDrag: heavyMaximum * 5,
  };
}

export function classifyLoad(weight: number, capacity: CarryingCapacity): LoadCategory {
  if (!Number.isFinite(weight) || weight < 0) {
    throw new RangeError("Carried weight must be a non-negative finite number.");
  }

  if (weight <= capacity.lightMaximum) return "light";
  if (weight <= capacity.mediumMaximum) return "medium";
  if (weight <= capacity.heavyMaximum) return "heavy";
  return "overloaded";
}

/**
 * D&D 3.5 medium/heavy load restrictions mirror the corresponding armor
 * restrictions. An overloaded character cannot move normally; if the load can
 * still be lifted off the ground, movement is limited to the five-foot stagger.
 */
export function encumbrancePenaltyProfile(
  load: LoadCategory,
  options: { overloadedCanLift?: boolean } = {},
): EncumbrancePenaltyProfile {
  switch (load) {
    case "light":
      return {
        load,
        maxDexterityBonus: null,
        armorCheckPenalty: 0,
        runMultiplier: 4,
        movement: "normal",
      };
    case "medium":
      return {
        load,
        maxDexterityBonus: 3,
        armorCheckPenalty: -3,
        runMultiplier: 4,
        movement: "reduced",
      };
    case "heavy":
      return {
        load,
        maxDexterityBonus: 1,
        armorCheckPenalty: -6,
        runMultiplier: 3,
        movement: "reduced",
      };
    case "overloaded":
      return {
        load,
        maxDexterityBonus: 0,
        armorCheckPenalty: -6,
        runMultiplier: 0,
        movement: options.overloadedCanLift === false ? "immobile" : "stagger",
      };
  }
}

/** Return the most restrictive movement state from load, armor, and other effects. */
export function combineMovementRestriction(
  ...restrictions: readonly MovementRestriction[]
): MovementRestriction {
  let result: MovementRestriction = "normal";
  for (const restriction of restrictions) {
    if (MOVEMENT_RESTRICTION_SEVERITY[restriction] > MOVEMENT_RESTRICTION_SEVERITY[result]) {
      result = restriction;
    }
  }
  return result;
}

function reducedLandSpeed(baseSpeedFeet: number): number {
  if (!Number.isSafeInteger(baseSpeedFeet) || baseSpeedFeet < 0) {
    throw new RangeError("Base land speed must be a non-negative safe integer.");
  }
  if (baseSpeedFeet === 0) return 0;
  // The medium/heavy armor progression is two-thirds speed rounded up to the
  // next five-foot square: 20 -> 15, 30 -> 20, 40 -> 30, 50 -> 35, and so on.
  return Math.max(5, Math.ceil(((baseSpeedFeet * 2) / 3) / 5) * 5);
}

export function encumberedLandSpeed(
  baseSpeedFeet: number,
  profile: EncumbrancePenaltyProfile,
): number {
  switch (profile.movement) {
    case "normal":
      return baseSpeedFeet;
    case "reduced":
      return reducedLandSpeed(baseSpeedFeet);
    case "stagger":
      return baseSpeedFeet === 0 ? 0 : 5;
    case "immobile":
      return 0;
  }
}

export function calculateEncumbranceState(input: {
  strength: number;
  size?: Dnd35Size;
  quadruped?: boolean;
  carriedWeight: number;
  baseLandSpeedFeet: number;
  enabled: boolean;
}): EncumbranceState {
  const capacity = carryingCapacity(input.strength, {
    ...(input.size === undefined ? {} : { size: input.size }),
    ...(input.quadruped === undefined ? {} : { quadruped: input.quadruped }),
  });
  const actualLoad = classifyLoad(input.carriedWeight, capacity);
  const appliedLoad: LoadCategory = input.enabled ? actualLoad : "light";
  const profile = encumbrancePenaltyProfile(appliedLoad, {
    overloadedCanLift: input.carriedWeight <= capacity.liftOffGround,
  });

  return {
    enabled: input.enabled,
    carriedWeight: input.carriedWeight,
    actualLoad,
    capacity,
    baseLandSpeedFeet: input.baseLandSpeedFeet,
    landSpeedFeet: encumberedLandSpeed(input.baseLandSpeedFeet, profile),
    ...profile,
  };
}

/** Armor and encumbrance restrictions do not stack; the worse cap applies. */
export function combineMaximumDexterityBonus(
  armorMaximum: number | null,
  encumbranceMaximum: number | null,
): number | null {
  if (armorMaximum === null) return encumbranceMaximum;
  if (encumbranceMaximum === null) return armorMaximum;
  return Math.min(armorMaximum, encumbranceMaximum);
}

/** Armor and encumbrance check penalties do not stack; the worse penalty applies. */
export function combineArmorCheckPenalty(armorPenalty: number, encumbrancePenalty: number): number {
  if (!Number.isFinite(armorPenalty) || !Number.isFinite(encumbrancePenalty)) {
    throw new RangeError("Armor check penalties must be finite numbers.");
  }
  return Math.min(armorPenalty, encumbrancePenalty);
}
