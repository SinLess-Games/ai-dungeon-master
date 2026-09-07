import type { SavingThrowResult } from "./combat";
import { resolveSavingThrow } from "./combat";
import { resolveSpellResistanceCheck } from "./spellcastingRuntime";

export type SpellSavingThrowEffect = "negates" | "half" | "partial" | "disbelief" | "special";

export interface SpellTargetResolution {
  spellResistanceApplies: boolean;
  penetratedSpellResistance: boolean;
  spellResistanceCheck: ReturnType<typeof resolveSpellResistanceCheck> | null;
  savingThrow: SavingThrowResult | null;
  saveEffect: SpellSavingThrowEffect | null;
  affected: boolean;
  halfEffect: boolean;
  partialEffect: boolean;
}

/**
 * Resolve the common per-target gates for a spell. The actual spell effect is
 * content-driven; this result tells that effect whether it applies fully,
 * partially, at half strength, or not at all.
 */
export function resolveSpellTarget(input: {
  casterLevel: number;
  spellResistance?: number | null;
  spellResistanceApplies?: boolean;
  spellResistanceRoll?: number;
  savingThrowBonus?: number;
  savingThrowDc?: number;
  savingThrowRoll?: number;
  saveEffect?: SpellSavingThrowEffect | null;
}): SpellTargetResolution {
  const spellResistanceApplies =
    (input.spellResistanceApplies ?? true) &&
    input.spellResistance !== undefined &&
    input.spellResistance !== null;

  let spellResistanceCheck: ReturnType<typeof resolveSpellResistanceCheck> | null = null;
  let penetratedSpellResistance = true;
  if (spellResistanceApplies) {
    spellResistanceCheck = resolveSpellResistanceCheck({
      casterLevel: input.casterLevel,
      spellResistance: input.spellResistance as number,
      ...(input.spellResistanceRoll === undefined ? {} : { roll: input.spellResistanceRoll }),
    });
    penetratedSpellResistance = spellResistanceCheck.success;
  }

  if (!penetratedSpellResistance) {
    return {
      spellResistanceApplies,
      penetratedSpellResistance: false,
      spellResistanceCheck,
      savingThrow: null,
      saveEffect: input.saveEffect ?? null,
      affected: false,
      halfEffect: false,
      partialEffect: false,
    };
  }

  const hasSave = input.savingThrowBonus !== undefined || input.savingThrowDc !== undefined;
  if (hasSave && (input.savingThrowBonus === undefined || input.savingThrowDc === undefined)) {
    throw new RangeError("Saving throw bonus and DC must either both be provided or both be omitted.");
  }

  const savingThrow = hasSave
    ? resolveSavingThrow({
        saveBonus: input.savingThrowBonus as number,
        dc: input.savingThrowDc as number,
        ...(input.savingThrowRoll === undefined ? {} : { roll: input.savingThrowRoll }),
      })
    : null;
  const saveEffect = input.saveEffect ?? null;

  if (!savingThrow || !savingThrow.passed) {
    return {
      spellResistanceApplies,
      penetratedSpellResistance,
      spellResistanceCheck,
      savingThrow,
      saveEffect,
      affected: true,
      halfEffect: false,
      partialEffect: false,
    };
  }

  switch (saveEffect) {
    case "half":
      return {
        spellResistanceApplies,
        penetratedSpellResistance,
        spellResistanceCheck,
        savingThrow,
        saveEffect,
        affected: true,
        halfEffect: true,
        partialEffect: false,
      };
    case "partial":
    case "disbelief":
    case "special":
      return {
        spellResistanceApplies,
        penetratedSpellResistance,
        spellResistanceCheck,
        savingThrow,
        saveEffect,
        affected: true,
        halfEffect: false,
        partialEffect: true,
      };
    case "negates":
    case null:
      return {
        spellResistanceApplies,
        penetratedSpellResistance,
        spellResistanceCheck,
        savingThrow,
        saveEffect,
        affected: false,
        halfEffect: false,
        partialEffect: false,
      };
  }
}
