import type {
  BaseAttackProgression,
  ClassLevelProgression,
  ClassSaveProgression,
  SaveProgression,
} from "./types";

function assertLevel(level: number, allowZero = false): void {
  const minimum = allowZero ? 0 : 1;
  if (!Number.isSafeInteger(level) || level < minimum) {
    throw new RangeError(`Level must be a safe integer greater than or equal to ${minimum}.`);
  }
}

function assertCustomBonus(value: number | undefined, name: string): number {
  if (value === undefined || !Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer for custom progression.`);
  }
  return value;
}

export function baseAttackBonusForClass(
  levels: number,
  progression: BaseAttackProgression,
  customBonus?: number,
): number {
  assertLevel(levels, true);
  if (levels === 0) return 0;

  switch (progression) {
    case "full":
      return levels;
    case "three_quarters":
      return Math.floor((levels * 3) / 4);
    case "half":
      return Math.floor(levels / 2);
    case "custom":
      return assertCustomBonus(customBonus, "Custom base attack bonus");
  }
}

/** Multiclass BAB is the sum of each class's separately rounded progression. */
export function totalBaseAttackBonus(classes: readonly ClassLevelProgression[]): number {
  return classes.reduce(
    (total, entry) =>
      total + baseAttackBonusForClass(entry.levels, entry.baseAttack, entry.customBaseAttackBonus),
    0,
  );
}

/**
 * Return the normal iterative attack bonuses granted by BAB.
 * D&D 3.5 grants another attack at +6, +11, and +16, to a maximum of four.
 */
export function iterativeBaseAttackBonuses(baseAttackBonus: number): readonly number[] {
  if (!Number.isSafeInteger(baseAttackBonus) || baseAttackBonus < 0) {
    throw new RangeError("Base attack bonus must be a non-negative safe integer.");
  }

  if (baseAttackBonus === 0) return [0];

  const attacks: number[] = [];
  for (let bonus = baseAttackBonus; bonus >= 1 && attacks.length < 4; bonus -= 5) {
    attacks.push(bonus);
  }
  return attacks;
}

export function baseSaveBonusForClass(
  levels: number,
  progression: SaveProgression,
  customBonus?: number,
): number {
  assertLevel(levels, true);
  if (levels === 0) return 0;

  switch (progression) {
    case "good":
      return 2 + Math.floor(levels / 2);
    case "poor":
      return Math.floor(levels / 3);
    case "custom":
      return assertCustomBonus(customBonus, "Custom base save bonus");
  }
}

/** Multiclass saves sum each class's normal save progression separately. */
export function totalBaseSaveBonus(classes: readonly ClassSaveProgression[]): number {
  return classes.reduce(
    (total, entry) =>
      total + baseSaveBonusForClass(entry.levels, entry.progression, entry.customBaseSaveBonus),
    0,
  );
}

/** Standard D&D 3.5 XP threshold for attaining a character level. */
export function experienceForLevel(level: number): number {
  assertLevel(level);
  return 500 * level * (level - 1);
}

export function levelForExperience(experience: number): number {
  if (!Number.isSafeInteger(experience) || experience < 0) {
    throw new RangeError("Experience must be a non-negative safe integer.");
  }

  let level = Math.max(1, Math.floor((1 + Math.sqrt(1 + experience / 125)) / 2));
  while (experienceForLevel(level + 1) <= experience) level += 1;
  while (level > 1 && experienceForLevel(level) > experience) level -= 1;
  return level;
}

/** General feats: one at 1st level and one more every 3 character levels. */
export function generalFeatSlotsAtLevel(level: number): number {
  assertLevel(level);
  return 1 + Math.floor(level / 3);
}

/** Ability score increases are gained at 4th level and every four levels thereafter. */
export function abilityScoreIncreaseCount(level: number): number {
  assertLevel(level);
  return Math.floor(level / 4);
}
