import { resolveContest, type CheckResult, type ContestResult, type ContestTieRule } from "@/engine";
import { resolveSkillCheck } from "./skills";

export interface TakeCheckResult {
  naturalRoll: number;
  bonus: number;
  total: number;
  target: number;
  margin: number;
  success: boolean;
  method: "take_10" | "take_20";
  timeMultiplier: number;
}

export function take10(input: {
  bonus: number;
  dc: number;
  threatenedOrDistracted?: boolean;
  prohibited?: boolean;
}): TakeCheckResult {
  if (input.threatenedOrDistracted || input.prohibited) {
    throw new Error("Taking 10 is not allowed under the current circumstances.");
  }
  const result = resolveSkillCheck({ bonus: input.bonus, dc: input.dc, roll: 10 });
  return { ...result, method: "take_10", timeMultiplier: 1 };
}

export function take20(input: {
  bonus: number;
  dc: number;
  repeatable: boolean;
  failureHasConsequences: boolean;
  prohibited?: boolean;
}): TakeCheckResult {
  if (!input.repeatable || input.failureHasConsequences || input.prohibited) {
    throw new Error("Taking 20 is not allowed for this check.");
  }
  const result = resolveSkillCheck({ bonus: input.bonus, dc: input.dc, roll: 20 });
  return { ...result, method: "take_20", timeMultiplier: 20 };
}

/** Standard aid-another skill check: DC 10 grants +2 on success. */
export function resolveAidAnother(input: { helperBonus: number; roll?: number }): {
  check: CheckResult;
  aidBonus: number;
} {
  const check = resolveSkillCheck({
    bonus: input.helperBonus,
    dc: 10,
    ...(input.roll === undefined ? {} : { roll: input.roll }),
  });
  return { check, aidBonus: check.success ? 2 : 0 };
}

/** Skill synergy normally grants +2 once the source skill has at least 5 ranks. */
export function skillSynergyBonus(sourceSkillRanks: number, threshold = 5, bonus = 2): number {
  if (!Number.isFinite(sourceSkillRanks) || sourceSkillRanks < 0) {
    throw new RangeError("Source skill ranks must be non-negative and finite.");
  }
  if (!Number.isFinite(threshold) || threshold < 0) {
    throw new RangeError("Synergy threshold must be non-negative and finite.");
  }
  if (!Number.isFinite(bonus)) throw new RangeError("Synergy bonus must be finite.");
  return sourceSkillRanks >= threshold ? bonus : 0;
}

function opposedSkillTieRule(leftBonus: number, rightBonus: number): ContestTieRule {
  if (leftBonus > rightBonus) return "left";
  if (rightBonus > leftBonus) return "right";
  return "tie";
}

/**
 * Resolve an opposed skill check. D&D 3.5 breaks an equal total in favor of the
 * combatant with the higher skill modifier; if those modifiers also tie the
 * result remains tied and the caller can reroll both checks.
 */
export function resolveOpposedSkillCheck(input: {
  leftId: string;
  leftBonus: number;
  rightId: string;
  rightBonus: number;
  leftRoll?: number;
  rightRoll?: number;
}): ContestResult {
  return resolveContest(
    {
      id: input.leftId,
      bonus: input.leftBonus,
      ...(input.leftRoll === undefined ? {} : { roll: input.leftRoll }),
    },
    {
      id: input.rightId,
      bonus: input.rightBonus,
      ...(input.rightRoll === undefined ? {} : { roll: input.rightRoll }),
    },
    { tieRule: opposedSkillTieRule(input.leftBonus, input.rightBonus) },
  );
}
