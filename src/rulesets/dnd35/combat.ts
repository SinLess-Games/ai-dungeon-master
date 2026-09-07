import { resolveCheck, type CheckResult, type RandomSource } from "@/engine";
import { resolveDnd35Modifiers, type Dnd35Modifier, type Dnd35ModifierResolution } from "./modifiers";
import type { Dnd35Size } from "./types";

const AC_SIZE_MODIFIER: Record<Dnd35Size, number> = {
  fine: 8,
  diminutive: 4,
  tiny: 2,
  small: 1,
  medium: 0,
  large: -1,
  huge: -2,
  gargantuan: -4,
  colossal: -8,
};

const GRAPPLE_SIZE_MODIFIER: Record<Dnd35Size, number> = {
  fine: -16,
  diminutive: -12,
  tiny: -8,
  small: -4,
  medium: 0,
  large: 4,
  huge: 8,
  gargantuan: 12,
  colossal: 16,
};

export interface ArmorClassModifier extends Dnd35Modifier {
  appliesTo?: readonly ("normal" | "touch" | "flat-footed")[];
}

export interface ArmorClassResult {
  normal: number;
  touch: number;
  flatFooted: number;
  dexterityModifierApplied: number;
  sizeModifier: number;
  normalResolution: Dnd35ModifierResolution;
  touchResolution: Dnd35ModifierResolution;
  flatFootedResolution: Dnd35ModifierResolution;
}

function defaultAcApplicability(kind: string): readonly ("normal" | "touch" | "flat-footed")[] {
  switch (kind.trim().toLowerCase()) {
    case "armor":
    case "shield":
    case "natural-armor":
      return ["normal", "flat-footed"];
    case "dodge":
      return ["normal", "touch"];
    default:
      return ["normal", "touch", "flat-footed"];
  }
}

function modifiersForAc(
  modifiers: readonly ArmorClassModifier[],
  mode: "normal" | "touch" | "flat-footed",
): readonly Dnd35Modifier[] {
  return modifiers.filter((modifier) =>
    (modifier.appliesTo ?? defaultAcApplicability(modifier.kind)).includes(mode),
  );
}

export function armorClassSizeModifier(size: Dnd35Size): number {
  return AC_SIZE_MODIFIER[size];
}

export function grappleSizeModifier(size: Dnd35Size): number {
  return GRAPPLE_SIZE_MODIFIER[size];
}

export function calculateArmorClass(input: {
  dexterityModifier: number;
  size?: Dnd35Size;
  modifiers?: readonly ArmorClassModifier[];
  maxDexterityBonus?: number | null;
  retainDexterityWhenFlatFooted?: boolean;
}): ArmorClassResult {
  if (!Number.isFinite(input.dexterityModifier)) {
    throw new RangeError("Dexterity modifier must be finite.");
  }

  if (
    input.maxDexterityBonus !== undefined &&
    input.maxDexterityBonus !== null &&
    (!Number.isFinite(input.maxDexterityBonus) || input.maxDexterityBonus < 0)
  ) {
    throw new RangeError("Maximum Dexterity bonus must be a non-negative finite number or null.");
  }

  const size = input.size ?? "medium";
  const sizeModifier = armorClassSizeModifier(size);
  const dexterityModifierApplied =
    input.dexterityModifier > 0 && input.maxDexterityBonus !== undefined && input.maxDexterityBonus !== null
      ? Math.min(input.dexterityModifier, input.maxDexterityBonus)
      : input.dexterityModifier;
  const modifiers = input.modifiers ?? [];

  const normalBase = 10 + dexterityModifierApplied + sizeModifier;
  const touchBase = 10 + dexterityModifierApplied + sizeModifier;
  const flatDex = input.retainDexterityWhenFlatFooted ? dexterityModifierApplied : Math.min(0, dexterityModifierApplied);
  const flatBase = 10 + flatDex + sizeModifier;

  const normalResolution = resolveDnd35Modifiers(modifiersForAc(modifiers, "normal"), normalBase);
  const touchResolution = resolveDnd35Modifiers(modifiersForAc(modifiers, "touch"), touchBase);
  const flatFootedResolution = resolveDnd35Modifiers(
    modifiersForAc(modifiers, "flat-footed"),
    flatBase,
  );

  return {
    normal: normalResolution.total,
    touch: touchResolution.total,
    flatFooted: flatFootedResolution.total,
    dexterityModifierApplied,
    sizeModifier,
    normalResolution,
    touchResolution,
    flatFootedResolution,
  };
}

export interface AttackBonusCalculation {
  baseAttackBonus: number;
  abilityModifier: number;
  sizeModifier: number;
  modifierResolution: Dnd35ModifierResolution;
  total: number;
}

export function calculateAttackBonus(input: {
  baseAttackBonus: number;
  abilityModifier: number;
  size?: Dnd35Size;
  modifiers?: readonly Dnd35Modifier[];
}): AttackBonusCalculation {
  if (!Number.isFinite(input.baseAttackBonus) || !Number.isFinite(input.abilityModifier)) {
    throw new RangeError("Attack bonus inputs must be finite.");
  }

  const sizeModifier = armorClassSizeModifier(input.size ?? "medium");
  const base = input.baseAttackBonus + input.abilityModifier + sizeModifier;
  const modifierResolution = resolveDnd35Modifiers(input.modifiers ?? [], base);

  return {
    baseAttackBonus: input.baseAttackBonus,
    abilityModifier: input.abilityModifier,
    sizeModifier,
    modifierResolution,
    total: modifierResolution.total,
  };
}

export interface AttackRollResult extends CheckResult {
  hit: boolean;
  automaticHit: boolean;
  automaticMiss: boolean;
  criticalThreat: boolean;
  threatMinimum: number;
}

export function resolveAttackRoll(input: {
  attackBonus: number;
  armorClass: number;
  threatMinimum?: number;
  roll?: number;
  random?: RandomSource;
}): AttackRollResult {
  const threatMinimum = input.threatMinimum ?? 20;
  if (!Number.isSafeInteger(threatMinimum) || threatMinimum < 2 || threatMinimum > 20) {
    throw new RangeError("Critical threat minimum must be an integer from 2 through 20.");
  }

  const check = resolveCheck({
    bonus: input.attackBonus,
    target: input.armorClass,
    ...(input.roll === undefined ? {} : { roll: input.roll }),
    ...(input.random === undefined ? {} : { random: input.random }),
  });

  const automaticMiss = check.naturalRoll === 1;
  const automaticHit = check.naturalRoll === 20;
  const hit = automaticMiss ? false : automaticHit ? true : check.success;

  return {
    ...check,
    hit,
    automaticHit,
    automaticMiss,
    criticalThreat: hit && check.naturalRoll >= threatMinimum,
    threatMinimum,
  };
}

export interface SavingThrowResult extends CheckResult {
  passed: boolean;
  automaticSuccess: boolean;
  automaticFailure: boolean;
}

export function resolveSavingThrow(input: {
  saveBonus: number;
  dc: number;
  roll?: number;
  random?: RandomSource;
}): SavingThrowResult {
  const check = resolveCheck({
    bonus: input.saveBonus,
    target: input.dc,
    ...(input.roll === undefined ? {} : { roll: input.roll }),
    ...(input.random === undefined ? {} : { random: input.random }),
  });

  const automaticFailure = check.naturalRoll === 1;
  const automaticSuccess = check.naturalRoll === 20;
  const passed = automaticFailure ? false : automaticSuccess ? true : check.success;
  return { ...check, passed, automaticSuccess, automaticFailure };
}

export function calculateInitiative(
  dexterityModifier: number,
  modifiers: readonly Dnd35Modifier[] = [],
): Dnd35ModifierResolution {
  if (!Number.isFinite(dexterityModifier)) throw new RangeError("Dexterity modifier must be finite.");
  return resolveDnd35Modifiers(modifiers, dexterityModifier);
}

export function calculateGrappleModifier(input: {
  baseAttackBonus: number;
  strengthModifier: number;
  size?: Dnd35Size;
  modifiers?: readonly Dnd35Modifier[];
}): Dnd35ModifierResolution {
  if (!Number.isFinite(input.baseAttackBonus) || !Number.isFinite(input.strengthModifier)) {
    throw new RangeError("Grapple inputs must be finite.");
  }

  const base =
    input.baseAttackBonus +
    input.strengthModifier +
    grappleSizeModifier(input.size ?? "medium");
  return resolveDnd35Modifiers(input.modifiers ?? [], base);
}
