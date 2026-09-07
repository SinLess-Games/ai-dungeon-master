import { resolveDnd35Modifiers, type Dnd35Modifier, type Dnd35ModifierResolution } from "./modifiers";

export interface SavingThrowBonusCalculation {
  baseSaveBonus: number;
  abilityModifier: number;
  modifierResolution: Dnd35ModifierResolution;
  total: number;
}

export function calculateSavingThrowBonus(input: {
  baseSaveBonus: number;
  abilityModifier: number;
  modifiers?: readonly Dnd35Modifier[];
}): SavingThrowBonusCalculation {
  if (!Number.isFinite(input.baseSaveBonus) || !Number.isFinite(input.abilityModifier)) {
    throw new RangeError("Saving throw inputs must be finite.");
  }

  const base = input.baseSaveBonus + input.abilityModifier;
  const modifierResolution = resolveDnd35Modifiers(input.modifiers ?? [], base);

  return {
    baseSaveBonus: input.baseSaveBonus,
    abilityModifier: input.abilityModifier,
    modifierResolution,
    total: modifierResolution.total,
  };
}
