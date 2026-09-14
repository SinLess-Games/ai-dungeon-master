export interface ClassHitPointRow {
  characterLevel: number;
  hitPointsGained: number;
}

/**
 * Calculate class-derived maximum HP from persisted class-level selections.
 *
 * Gestalt characters can have more than one class row at the same character
 * level. D&D 3.5 gestalt takes the better Hit Die result for that level rather
 * than adding both tracks, so collapse rows by character level first.
 */
export function maximumHitPointsFromClassTracks(
  classRows: readonly ClassHitPointRow[],
  constitutionModifier: number,
): number {
  if (!Number.isSafeInteger(constitutionModifier)) {
    throw new RangeError("Constitution modifier must be a safe integer.");
  }

  const bestByLevel = new Map<number, number>();
  for (const row of classRows) {
    if (!Number.isSafeInteger(row.characterLevel) || row.characterLevel < 1) {
      throw new RangeError("Character level must be a positive safe integer.");
    }
    if (!Number.isSafeInteger(row.hitPointsGained) || row.hitPointsGained < 1) {
      throw new RangeError("Hit points gained must be a positive safe integer.");
    }
    bestByLevel.set(
      row.characterLevel,
      Math.max(bestByLevel.get(row.characterLevel) ?? 0, row.hitPointsGained),
    );
  }

  return [...bestByLevel.values()].reduce(
    (total, hitPointsGained) => total + Math.max(1, hitPointsGained + constitutionModifier),
    0,
  );
}
