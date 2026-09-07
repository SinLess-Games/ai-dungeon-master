import { resolveCheck, type CheckResult } from "@engine/checks";

function assertNonNegativeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer.`);
  }
}

export interface DispelCheckResult extends CheckResult {
  casterLevelBonus: number;
  targetCasterLevel: number;
  maximumCasterLevelBonus: number | null;
}

/**
 * Resolve a D&D 3.5 dispel check: d20 + caster level (subject to the spell's cap)
 * against DC 11 + the effect's caster level. Natural 1/20 are not automatic.
 */
export function resolveDispelCheck(input: {
  casterLevel: number;
  targetCasterLevel: number;
  maximumCasterLevelBonus?: number | null;
  roll?: number;
}): DispelCheckResult {
  assertNonNegativeInteger(input.casterLevel, "Dispel caster level");
  assertNonNegativeInteger(input.targetCasterLevel, "Target caster level");
  const cap = input.maximumCasterLevelBonus === undefined ? 10 : input.maximumCasterLevelBonus;
  if (cap !== null) assertNonNegativeInteger(cap, "Maximum dispel caster-level bonus");
  const casterLevelBonus = cap === null ? input.casterLevel : Math.min(input.casterLevel, cap);
  const check = resolveCheck({
    bonus: casterLevelBonus,
    target: 11 + input.targetCasterLevel,
    ...(input.roll === undefined ? {} : { roll: input.roll }),
  });
  return {
    ...check,
    casterLevelBonus,
    targetCasterLevel: input.targetCasterLevel,
    maximumCasterLevelBonus: cap,
  };
}

export function canCounterspellWithSameSpell(input: {
  incomingSpellId: string;
  preparedOrKnownSpellIds: readonly string[];
}): boolean {
  if (!input.incomingSpellId.trim()) throw new RangeError("Incoming spell id cannot be empty.");
  return input.preparedOrKnownSpellIds.includes(input.incomingSpellId);
}
