import { resolveCheck, type CheckResult } from "@engine/checks";
import { engineFailure, engineSuccess, type EngineResult } from "@engine/result";
import { bonusSpellsPerDay, canCastSpellLevel } from "./spells";

export interface SpellProgressionRow {
  classLevel: number;
  spellLevel: number;
  slotsPerDay: number | null;
  spellsKnown: number | null;
}

export interface DailySpellSlots {
  spellLevel: number;
  base: number;
  bonus: number;
  total: number;
  accessible: boolean;
}

export interface PreparedSpellState {
  id: string;
  spellId: string;
  slotLevel: number;
  preparedCount: number;
  expendedCount: number;
}

export interface SpontaneousSlotState {
  spellLevel: number;
  maximum: number;
  expended: number;
}

function assertNonNegativeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer.`);
  }
}

function assertSpellLevelRuntime(level: number): void {
  if (!Number.isSafeInteger(level) || level < 0) {
    throw new RangeError("Runtime spell level must be a non-negative safe integer.");
  }
}

export function dailySpellSlots(input: {
  spellLevel: number;
  baseSlots: number | null;
  castingAbilityScore: number;
}): DailySpellSlots {
  assertSpellLevelRuntime(input.spellLevel);
  if (input.spellLevel > 9) throw new RangeError("Base D&D 3.5 spell levels cannot exceed 9.");
  if (input.baseSlots !== null) assertNonNegativeInteger(input.baseSlots, "Base spell slots");

  const accessible = input.baseSlots !== null && canCastSpellLevel(input.castingAbilityScore, input.spellLevel);
  if (!accessible) {
    return { spellLevel: input.spellLevel, base: 0, bonus: 0, total: 0, accessible: false };
  }

  const base = input.baseSlots ?? 0;
  const bonus = bonusSpellsPerDay(input.castingAbilityScore, input.spellLevel);
  return { spellLevel: input.spellLevel, base, bonus, total: base + bonus, accessible: true };
}

/** Resolve the rows for one effective class progression level. */
export function spellProgressionAtLevel(
  rows: readonly SpellProgressionRow[],
  effectiveClassLevel: number,
  castingAbilityScore: number,
): readonly DailySpellSlots[] {
  assertNonNegativeInteger(effectiveClassLevel, "Effective class level");
  const atLevel = rows.filter((row) => row.classLevel === effectiveClassLevel);
  const levels = new Set<number>();

  return atLevel
    .map((row) => {
      assertNonNegativeInteger(row.classLevel, "Progression class level");
      assertSpellLevelRuntime(row.spellLevel);
      if (row.spellLevel > 9) throw new RangeError("Progression spell level cannot exceed 9.");
      if (levels.has(row.spellLevel)) throw new Error(`Duplicate spell progression row for level ${row.spellLevel}.`);
      levels.add(row.spellLevel);
      return dailySpellSlots({
        spellLevel: row.spellLevel,
        baseSlots: row.slotsPerDay,
        castingAbilityScore,
      });
    })
    .sort((left, right) => left.spellLevel - right.spellLevel);
}

/**
 * Calculate caster level from a class track. Fractions are rounded down, then
 * explicit advancement and adjustment values are applied.
 */
export function calculateCasterLevel(input: {
  classLevels: number;
  numerator?: number;
  denominator?: number;
  advancedLevels?: number;
  adjustment?: number;
}): number {
  assertNonNegativeInteger(input.classLevels, "Class levels");
  const numerator = input.numerator ?? 1;
  const denominator = input.denominator ?? 1;
  const advancedLevels = input.advancedLevels ?? 0;
  const adjustment = input.adjustment ?? 0;

  if (!Number.isSafeInteger(numerator) || numerator < 1) throw new RangeError("Caster-level numerator must be positive.");
  if (!Number.isSafeInteger(denominator) || denominator < 1) throw new RangeError("Caster-level denominator must be positive.");
  assertNonNegativeInteger(advancedLevels, "Advanced caster levels");
  if (!Number.isSafeInteger(adjustment)) throw new RangeError("Caster-level adjustment must be a safe integer.");

  return Math.max(0, Math.floor((input.classLevels * numerator) / denominator) + advancedLevels + adjustment);
}

export function validatePreparedSpell(state: PreparedSpellState): PreparedSpellState {
  if (!state.id.trim() || !state.spellId.trim()) throw new RangeError("Prepared spell ids cannot be empty.");
  assertSpellLevelRuntime(state.slotLevel);
  assertNonNegativeInteger(state.preparedCount, "Prepared spell count");
  assertNonNegativeInteger(state.expendedCount, "Expended spell count");
  if (state.preparedCount < 1) throw new RangeError("A preparation row must prepare at least one spell.");
  if (state.expendedCount > state.preparedCount) throw new RangeError("Expended preparations cannot exceed prepared count.");
  return state;
}

export function expendPreparedSpell(state: PreparedSpellState): EngineResult<PreparedSpellState> {
  validatePreparedSpell(state);
  if (state.expendedCount >= state.preparedCount) {
    return engineFailure("SPELL_NOT_PREPARED", `No unexpended preparations remain for ${state.spellId}.`);
  }
  return engineSuccess({ ...state, expendedCount: state.expendedCount + 1 });
}

export function restorePreparedSpell(state: PreparedSpellState, amount = 1): PreparedSpellState {
  validatePreparedSpell(state);
  assertNonNegativeInteger(amount, "Prepared spell restore amount");
  return { ...state, expendedCount: Math.max(0, state.expendedCount - amount) };
}

export function validateSpontaneousSlots(state: SpontaneousSlotState): SpontaneousSlotState {
  assertSpellLevelRuntime(state.spellLevel);
  assertNonNegativeInteger(state.maximum, "Spontaneous slot maximum");
  assertNonNegativeInteger(state.expended, "Spontaneous slots expended");
  if (state.expended > state.maximum) throw new RangeError("Expended spontaneous slots cannot exceed the maximum.");
  return state;
}

export function expendSpontaneousSlot(state: SpontaneousSlotState): EngineResult<SpontaneousSlotState> {
  validateSpontaneousSlots(state);
  if (state.expended >= state.maximum) {
    return engineFailure("SPELL_SLOTS_EXHAUSTED", `No level ${state.spellLevel} spell slots remain.`);
  }
  return engineSuccess({ ...state, expended: state.expended + 1 });
}

export function restoreSpontaneousSlots(state: SpontaneousSlotState): SpontaneousSlotState {
  validateSpontaneousSlots(state);
  return { ...state, expended: 0 };
}

/** Spell resistance uses d20 + caster level against the creature's SR. */
export function resolveSpellResistanceCheck(input: {
  casterLevel: number;
  spellResistance: number;
  roll?: number;
}): CheckResult {
  assertNonNegativeInteger(input.casterLevel, "Caster level");
  assertNonNegativeInteger(input.spellResistance, "Spell resistance");
  return resolveCheck({
    bonus: input.casterLevel,
    target: input.spellResistance,
    ...(input.roll === undefined ? {} : { roll: input.roll }),
  });
}

export type ConcentrationSituation =
  | { kind: "cast_defensively" }
  | { kind: "injury"; damage: number }
  | { kind: "continuous_damage"; previousDamage: number }
  | { kind: "vigorous_motion" }
  | { kind: "violent_motion" };

export function concentrationDc(spellLevel: number, situation: ConcentrationSituation): number {
  assertSpellLevelRuntime(spellLevel);
  switch (situation.kind) {
    case "cast_defensively":
      return 15 + spellLevel;
    case "injury":
      assertNonNegativeInteger(situation.damage, "Concentration injury damage");
      return 10 + situation.damage + spellLevel;
    case "continuous_damage":
      assertNonNegativeInteger(situation.previousDamage, "Continuous damage");
      return 10 + Math.floor(situation.previousDamage / 2) + spellLevel;
    case "vigorous_motion":
      return 10 + spellLevel;
    case "violent_motion":
      return 15 + spellLevel;
  }
}

export function resolveConcentrationCheck(input: {
  modifier: number;
  dc: number;
  roll?: number;
}): CheckResult {
  if (!Number.isFinite(input.modifier)) throw new RangeError("Concentration modifier must be finite.");
  assertNonNegativeInteger(input.dc, "Concentration DC");
  return resolveCheck({
    bonus: input.modifier,
    target: input.dc,
    ...(input.roll === undefined ? {} : { roll: input.roll }),
  });
}

/** Arcane spell failure succeeds when the d100 result is above the failure percentage. */
export function resolveArcaneSpellFailure(failurePercent: number, roll: number): {
  roll: number;
  failurePercent: number;
  failed: boolean;
} {
  if (!Number.isSafeInteger(failurePercent) || failurePercent < 0 || failurePercent > 100) {
    throw new RangeError("Arcane spell failure percentage must be an integer from 0 through 100.");
  }
  if (!Number.isSafeInteger(roll) || roll < 1 || roll > 100) {
    throw new RangeError("Arcane spell failure roll must be an integer from 1 through 100.");
  }
  return { roll, failurePercent, failed: roll <= failurePercent };
}
