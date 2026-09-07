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
