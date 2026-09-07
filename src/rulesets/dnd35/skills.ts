import { resolveCheck, type CheckResult, type RandomSource } from "@/engine";
import { resolveDnd35Modifiers, type Dnd35Modifier, type Dnd35ModifierResolution } from "./modifiers";

function assertCharacterLevel(level: number): void {
  if (!Number.isSafeInteger(level) || level < 1) {
    throw new RangeError("Character level must be a positive safe integer.");
  }
}

function assertRanks(ranks: number): void {
  if (!Number.isFinite(ranks) || ranks < 0 || Math.round(ranks * 2) !== ranks * 2) {
    throw new RangeError("Skill ranks must be a non-negative multiple of 0.5.");
  }
}

export function maximumSkillRanks(characterLevel: number, classSkill: boolean): number {
  assertCharacterLevel(characterLevel);
  return classSkill ? characterLevel + 3 : (characterLevel + 3) / 2;
}

export function skillPointCostForRanks(ranks: number, classSkill: boolean): number {
  assertRanks(ranks);
  return ranks * (classSkill ? 1 : 2);
}

export interface SkillModifierCalculation {
  ranks: number;
  abilityModifier: number;
  armorCheckPenalty: number;
  modifierResolution: Dnd35ModifierResolution;
  total: number;
}

export function calculateSkillModifier(input: {
  ranks: number;
  abilityModifier: number;
  armorCheckPenalty?: number;
  modifiers?: readonly Dnd35Modifier[];
}): SkillModifierCalculation {
  assertRanks(input.ranks);
  if (!Number.isFinite(input.abilityModifier)) {
    throw new RangeError("Skill ability modifier must be finite.");
  }

  const armorCheckPenalty = input.armorCheckPenalty ?? 0;
  if (!Number.isFinite(armorCheckPenalty) || armorCheckPenalty > 0) {
    throw new RangeError("Armor check penalty must be zero or negative.");
  }

  const base = input.ranks + input.abilityModifier + armorCheckPenalty;
  const modifierResolution = resolveDnd35Modifiers(input.modifiers ?? [], base);

  return {
    ranks: input.ranks,
    abilityModifier: input.abilityModifier,
    armorCheckPenalty,
    modifierResolution,
    total: modifierResolution.total,
  };
}

/** Skill checks do not treat natural 1 or natural 20 as automatic outcomes. */
export function resolveSkillCheck(input: {
  bonus: number;
  dc: number;
  roll?: number;
  random?: RandomSource;
}): CheckResult {
  const request = {
    bonus: input.bonus,
    target: input.dc,
    ...(input.roll === undefined ? {} : { roll: input.roll }),
    ...(input.random === undefined ? {} : { random: input.random }),
  };
  return resolveCheck(request);
}
