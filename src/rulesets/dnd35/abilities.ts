function assertAbilityScore(score: number): void {
  if (!Number.isSafeInteger(score) || score < 0) {
    throw new RangeError("Ability score must be a non-negative safe integer.");
  }
}

function assertAdjustment(value: number, name: string): void {
  if (!Number.isSafeInteger(value)) throw new RangeError(`${name} must be a safe integer.`);
}

/** D&D 3.5 ability modifier: floor((score - 10) / 2). */
export function abilityModifier(score: number): number {
  assertAbilityScore(score);
  return Math.floor((score - 10) / 2);
}

export function applyAbilityScoreAdjustment(score: number, adjustment: number): number {
  assertAbilityScore(score);
  assertAdjustment(adjustment, "Ability score adjustment");

  const result = score + adjustment;
  if (result < 0 || !Number.isSafeInteger(result)) {
    throw new RangeError("Adjusted ability score must be a non-negative safe integer.");
  }

  return result;
}

export interface EffectiveAbilityScoreInput {
  /** null represents a creature that has no score for this ability. */
  baseScore: number | null;
  racialAdjustment?: number;
  inherentBonus?: number;
  levelAdjustment?: number;
  temporaryAdjustment?: number;
  abilityDamage?: number;
  abilityDrain?: number;
}

/**
 * Resolve the score representation used by the D&D character schema. Sourced
 * magical/effect adjustments can be folded into temporaryAdjustment by the
 * caller without teaching this pure function about persistence or conditions.
 */
export function effectiveAbilityScore(input: EffectiveAbilityScoreInput): number | null {
  if (input.baseScore === null) return null;
  assertAbilityScore(input.baseScore);

  const racialAdjustment = input.racialAdjustment ?? 0;
  const inherentBonus = input.inherentBonus ?? 0;
  const levelAdjustment = input.levelAdjustment ?? 0;
  const temporaryAdjustment = input.temporaryAdjustment ?? 0;
  const abilityDamage = input.abilityDamage ?? 0;
  const abilityDrain = input.abilityDrain ?? 0;

  assertAdjustment(racialAdjustment, "Racial adjustment");
  assertAdjustment(inherentBonus, "Inherent bonus");
  assertAdjustment(levelAdjustment, "Level adjustment");
  assertAdjustment(temporaryAdjustment, "Temporary adjustment");
  assertAbilityScore(abilityDamage);
  assertAbilityScore(abilityDrain);

  return Math.max(
    0,
    input.baseScore +
      racialAdjustment +
      inherentBonus +
      levelAdjustment +
      temporaryAdjustment -
      abilityDamage -
      abilityDrain,
  );
}

export function canUseAbility(score: number | null): boolean {
  if (score === null) return false;
  assertAbilityScore(score);
  return score > 0;
}
