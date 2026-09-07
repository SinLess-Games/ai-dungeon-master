import { calculateMaximumHitPoints, type HitPointCalculation } from "./health";

export interface RuntimeClassLevelRow {
  classId: string;
  level: number;
  baseAttackBonus: number;
  fort: number;
  ref: number;
  will: number;
  hitDie?: number | null;
  skillPoints?: number | null;
  basePowerPoints?: number | null;
  powersKnown?: number | null;
  maxPowerLevel?: number | null;
}

export interface AggregatedClassProgression {
  characterLevel: number;
  classLevels: Readonly<Record<string, number>>;
  baseAttackBonus: number;
  fort: number;
  ref: number;
  will: number;
}

function validateClassLevelRow(row: RuntimeClassLevelRow): void {
  if (!row.classId.trim()) throw new RangeError("Class id cannot be empty.");
  if (!Number.isSafeInteger(row.level) || row.level < 1) {
    throw new RangeError("Class level must be a positive safe integer.");
  }
  for (const [name, value] of [
    ["base attack bonus", row.baseAttackBonus],
    ["Fortitude", row.fort],
    ["Reflex", row.ref],
    ["Will", row.will],
  ] as const) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError(`Class ${name} must be a non-negative safe integer.`);
    }
  }
}

/**
 * Character class-level history stores one cumulative class-level definition
 * for every gained level. Derived BAB/saves must use only the highest attained
 * row for each class, then add those class totals together.
 */
export function aggregateClassProgression(
  gainedLevels: readonly RuntimeClassLevelRow[],
): AggregatedClassProgression {
  if (gainedLevels.length === 0) {
    return {
      characterLevel: 0,
      classLevels: {},
      baseAttackBonus: 0,
      fort: 0,
      ref: 0,
      will: 0,
    };
  }

  const highestByClass = new Map<string, RuntimeClassLevelRow>();
  for (const row of gainedLevels) {
    validateClassLevelRow(row);
    const existing = highestByClass.get(row.classId);
    if (!existing || row.level > existing.level) highestByClass.set(row.classId, row);
  }

  const classLevels: Record<string, number> = {};
  let baseAttackBonus = 0;
  let fort = 0;
  let ref = 0;
  let will = 0;

  for (const row of highestByClass.values()) {
    classLevels[row.classId] = row.level;
    baseAttackBonus += row.baseAttackBonus;
    fort += row.fort;
    ref += row.ref;
    will += row.will;
  }

  return {
    characterLevel: gainedLevels.length,
    classLevels,
    baseAttackBonus,
    fort,
    ref,
    will,
  };
}

export function skillPointsForGainedLevel(input: {
  baseSkillPoints: number;
  intelligenceModifier: number;
  extraPerLevel?: number;
  firstCharacterLevel?: boolean;
}): number {
  if (!Number.isSafeInteger(input.baseSkillPoints) || input.baseSkillPoints < 0) {
    throw new RangeError("Base skill points must be a non-negative safe integer.");
  }
  if (!Number.isSafeInteger(input.intelligenceModifier)) {
    throw new RangeError("Intelligence modifier must be a safe integer.");
  }
  const extraPerLevel = input.extraPerLevel ?? 0;
  if (!Number.isSafeInteger(extraPerLevel) || extraPerLevel < 0) {
    throw new RangeError("Extra skill points per level must be a non-negative safe integer.");
  }

  const normal = Math.max(1, input.baseSkillPoints + input.intelligenceModifier) + extraPerLevel;
  return normal * (input.firstCharacterLevel ? 4 : 1);
}

/** Recalculate maximum HP from persisted per-level hitPointsGained values. */
export function hitPointsFromGainedLevels(input: {
  gainedHitPoints: readonly number[];
  constitutionModifier: number;
  perHitDieBonus?: number;
}): HitPointCalculation {
  return calculateMaximumHitPoints({
    hitDieResults: input.gainedHitPoints,
    constitutionModifier: input.constitutionModifier,
    ...(input.perHitDieBonus === undefined ? {} : { perHitDieBonus: input.perHitDieBonus }),
  });
}
