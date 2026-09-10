import type { AbilityKey } from "@/infrastructure/database/schema/dnd35/primitives";

const monsterIntelligenceScores: Readonly<Record<number, readonly [number, number, number, number]>> = Object.freeze({
  18: [10, 12, 14, 16],
  17: [9, 11, 13, 15],
  16: [8, 10, 12, 14],
  15: [7, 9, 11, 13],
  14: [6, 8, 10, 12],
  13: [5, 7, 9, 11],
  12: [4, 6, 8, 10],
  11: [3, 5, 7, 9],
  10: [3, 5, 7, 9],
  9: [3, 5, 6, 8],
  8: [3, 4, 6, 8],
  7: [3, 4, 5, 7],
  6: [3, 4, 5, 6],
  5: [3, 3, 5, 5],
  4: [3, 3, 4, 4],
  3: [3, 3, 3, 3],
});

const monsterOtherAbilityScores: Readonly<Record<number, readonly [number, number, number, number, number]>> = Object.freeze({
  18: [8, 10, 12, 14, 16],
  17: [7, 9, 11, 13, 15],
  16: [6, 8, 10, 12, 14],
  15: [5, 7, 9, 11, 13],
  14: [4, 6, 8, 10, 12],
  13: [3, 5, 7, 9, 11],
  12: [2, 4, 6, 8, 10],
  11: [1, 3, 5, 7, 9],
  10: [1, 2, 4, 6, 8],
  9: [1, 2, 4, 6, 7],
  8: [1, 2, 4, 5, 6],
  7: [1, 1, 3, 5, 5],
  6: [1, 1, 2, 4, 4],
  5: [1, 1, 1, 3, 3],
  4: [1, 1, 1, 2, 2],
  3: [1, 1, 1, 1, 1],
});

function lookupColumn(ability: AbilityKey, monsterAverageScore: number): number {
  if (!Number.isInteger(monsterAverageScore) || monsterAverageScore < 1 || monsterAverageScore > 9) {
    throw new RangeError("A DMG monster-PC average ability score must be an integer from 1 through 9.");
  }
  if (ability === "int") {
    if (monsterAverageScore < 3) {
      throw new RangeError("A creature with Intelligence below 3 is not a playable monster PC.");
    }
    if (monsterAverageScore === 3) return 0;
    if (monsterAverageScore <= 5) return 1;
    if (monsterAverageScore <= 7) return 2;
    return 3;
  }
  if (monsterAverageScore === 1) return 0;
  if (monsterAverageScore <= 3) return 1;
  if (monsterAverageScore <= 5) return 2;
  if (monsterAverageScore <= 7) return 3;
  return 4;
}

/**
 * Apply the DMG p. 173 monster-PC table for a source average ability below 10.
 * The table is defined for generated base scores 3 through 18.
 */
export function monsterPcAbilityScore(
  baseScore: number,
  monsterAverageScore: number,
  ability: AbilityKey,
): number {
  if (!Number.isInteger(baseScore) || baseScore < 3 || baseScore > 18) {
    throw new RangeError("DMG monster-PC ability conversion requires a base score from 3 through 18.");
  }
  const column = lookupColumn(ability, monsterAverageScore);
  const row = ability === "int" ? monsterIntelligenceScores[baseScore] : monsterOtherAbilityScores[baseScore];
  if (!row) throw new RangeError("DMG monster-PC ability conversion row is unavailable.");
  return row[column]!;
}

/** Apply either a normal fixed racial modifier or the DMG low-average-score lookup rule. */
export function effectiveRacialAbilityScore(input: {
  baseScore: number;
  ability: AbilityKey;
  fixedModifier?: number | null;
  monsterAverageScore?: number | null;
}): number {
  if (input.monsterAverageScore != null) {
    return monsterPcAbilityScore(input.baseScore, input.monsterAverageScore, input.ability);
  }
  return input.baseScore + (input.fixedModifier ?? 0);
}
