export type Dnd35HealthState = "conscious" | "disabled" | "dying" | "dead";

export interface HitPointCalculation {
  hitDieResults: readonly number[];
  constitutionModifier: number;
  perHitDieBonus: number;
  perDieTotals: readonly number[];
  maximumHitPoints: number;
}

function assertFiniteInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value)) throw new RangeError(`${name} must be a safe integer.`);
}

/**
 * Calculate maximum HP from already-resolved hit-die results. Each Hit Die has
 * a minimum contribution of 1 HP after Constitution and per-HD adjustments.
 */
export function calculateMaximumHitPoints(input: {
  hitDieResults: readonly number[];
  constitutionModifier: number;
  perHitDieBonus?: number;
}): HitPointCalculation {
  assertFiniteInteger(input.constitutionModifier, "Constitution modifier");
  const perHitDieBonus = input.perHitDieBonus ?? 0;
  assertFiniteInteger(perHitDieBonus, "Per-Hit-Die bonus");

  if (input.hitDieResults.length === 0) {
    throw new RangeError("At least one Hit Die result is required.");
  }

  for (const result of input.hitDieResults) {
    if (!Number.isSafeInteger(result) || result < 1) {
      throw new RangeError("Hit Die results must be positive safe integers.");
    }
  }

  const perDieTotals = input.hitDieResults.map((result) =>
    Math.max(1, result + input.constitutionModifier + perHitDieBonus),
  );

  return {
    hitDieResults: [...input.hitDieResults],
    constitutionModifier: input.constitutionModifier,
    perHitDieBonus,
    perDieTotals,
    maximumHitPoints: perDieTotals.reduce((total, value) => total + value, 0),
  };
}

/** Core 3.5 HP state without optional death-threshold or stabilization variants. */
export function healthStateForHitPoints(currentHitPoints: number): Dnd35HealthState {
  assertFiniteInteger(currentHitPoints, "Current hit points");
  if (currentHitPoints <= -10) return "dead";
  if (currentHitPoints < 0) return "dying";
  if (currentHitPoints === 0) return "disabled";
  return "conscious";
}

export function isAliveAtHitPoints(currentHitPoints: number): boolean {
  return healthStateForHitPoints(currentHitPoints) !== "dead";
}
