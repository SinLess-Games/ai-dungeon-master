import { abilityModifier } from "./abilities";
import { resolveDnd35Modifiers, type Dnd35Modifier, type Dnd35ModifierResolution } from "./modifiers";

function assertPowerLevel(powerLevel: number): void {
  if (!Number.isSafeInteger(powerLevel) || powerLevel < 0 || powerLevel > 9) {
    throw new RangeError("Power level must be an integer from 0 through 9.");
  }
}

export function canManifestPowerLevel(abilityScore: number, powerLevel: number): boolean {
  assertPowerLevel(powerLevel);
  return abilityScore >= 10 + powerLevel;
}

export function calculatePowerSaveDc(input: {
  powerLevel: number;
  manifestingAbilityModifier: number;
  modifiers?: readonly Dnd35Modifier[];
}): Dnd35ModifierResolution {
  assertPowerLevel(input.powerLevel);
  if (!Number.isFinite(input.manifestingAbilityModifier)) {
    throw new RangeError("Manifesting ability modifier must be finite.");
  }

  return resolveDnd35Modifiers(
    input.modifiers ?? [],
    10 + input.powerLevel + input.manifestingAbilityModifier,
  );
}

/**
 * D&D 3.5 psionic bonus power points: one-half key ability modifier times
 * manifester level, rounded down. Non-positive modifiers grant no bonus PP.
 */
export function bonusPowerPoints(abilityScore: number, manifesterLevel: number): number {
  if (!Number.isSafeInteger(manifesterLevel) || manifesterLevel < 0) {
    throw new RangeError("Manifester level must be a non-negative safe integer.");
  }

  const modifier = abilityModifier(abilityScore);
  return modifier <= 0 ? 0 : Math.floor((modifier * manifesterLevel) / 2);
}
