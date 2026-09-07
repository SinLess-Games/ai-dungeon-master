import { abilityModifier } from "./abilities";
import { resolveDnd35Modifiers, type Dnd35Modifier, type Dnd35ModifierResolution } from "./modifiers";

function assertSpellLevel(spellLevel: number): void {
  if (!Number.isSafeInteger(spellLevel) || spellLevel < 0 || spellLevel > 9) {
    throw new RangeError("Spell level must be an integer from 0 through 9.");
  }
}

export function canCastSpellLevel(abilityScore: number, spellLevel: number): boolean {
  assertSpellLevel(spellLevel);
  return abilityScore >= 10 + spellLevel;
}

/** Bonus spells from a high casting ability. Level 0 spells never receive bonus slots. */
export function bonusSpellsPerDay(abilityScore: number, spellLevel: number): number {
  assertSpellLevel(spellLevel);
  if (spellLevel === 0) return 0;

  const modifier = abilityModifier(abilityScore);
  if (modifier < spellLevel) return 0;
  return 1 + Math.floor((modifier - spellLevel) / 4);
}

export function calculateSpellSaveDc(input: {
  spellLevel: number;
  castingAbilityModifier: number;
  modifiers?: readonly Dnd35Modifier[];
}): Dnd35ModifierResolution {
  assertSpellLevel(input.spellLevel);
  if (!Number.isFinite(input.castingAbilityModifier)) {
    throw new RangeError("Casting ability modifier must be finite.");
  }

  return resolveDnd35Modifiers(
    input.modifiers ?? [],
    10 + input.spellLevel + input.castingAbilityModifier,
  );
}
