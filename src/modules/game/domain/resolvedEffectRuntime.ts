import { rollDice } from "@/engine";
import type {
  RuntimeDnd35ResolvedEffect,
  RuntimeDnd35ScaledAmount,
  RuntimeDnd35SaveEffect,
} from "@/infrastructure/database/schema";

export interface ResolvedEffectAmount {
  total: number;
  expressions: readonly string[];
  rolls: readonly number[];
}

function assertNonNegativeInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer.`);
  }
  return value;
}

function assertPositiveInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive safe integer.`);
  }
  return value;
}

/**
 * Resolve a content-authored amount from authoritative caster/manifester level.
 * Randomness can be injected in tests; production uses the generic engine dice
 * implementation. The client never submits the resolved amount.
 */
export function resolveScaledEffectAmount(
  amount: RuntimeDnd35ScaledAmount,
  level: number,
  rollExpression: (expression: string) => { total: number; rolls: readonly number[] } = (expression) =>
    rollDice(expression),
): ResolvedEffectAmount {
  assertNonNegativeInteger(level, "Caster/manifester level");
  const expressions: string[] = [];
  const rolls: number[] = [];
  let total = 0;

  if (amount.dice !== undefined) {
    const rolled = rollExpression(amount.dice);
    if (!Number.isSafeInteger(rolled.total)) throw new RangeError("Effect dice total must be an integer.");
    total += rolled.total;
    expressions.push(amount.dice);
    rolls.push(...rolled.rolls);
  }

  if (amount.scalingDice !== undefined) {
    const everyLevels = assertPositiveInteger(
      amount.scalingDice.everyLevels,
      "Effect scaling interval",
    );
    const cap =
      amount.scalingDice.maxApplications === undefined
        ? Number.MAX_SAFE_INTEGER
        : assertNonNegativeInteger(
            amount.scalingDice.maxApplications,
            "Effect scaling application cap",
          );
    const applications = Math.min(Math.floor(level / everyLevels), cap);
    for (let index = 0; index < applications; index += 1) {
      const rolled = rollExpression(amount.scalingDice.dice);
      if (!Number.isSafeInteger(rolled.total)) {
        throw new RangeError("Effect scaling dice total must be an integer.");
      }
      total += rolled.total;
      expressions.push(amount.scalingDice.dice);
      rolls.push(...rolled.rolls);
    }
  }

  if (amount.flat !== undefined) {
    if (!Number.isSafeInteger(amount.flat)) throw new RangeError("Effect flat amount must be an integer.");
    total += amount.flat;
  }

  return {
    total: Math.max(0, total),
    expressions,
    rolls,
  };
}

export function normalizeSaveEffect(
  effect: RuntimeDnd35ResolvedEffect,
): Exclude<RuntimeDnd35SaveEffect, "none"> | null {
  switch (effect.saveEffect ?? "none") {
    case "none":
      return null;
    case "negates":
    case "half":
    case "partial":
      return effect.saveEffect as "negates" | "half" | "partial";
  }
}

export function applyHalfEffect(amount: number, halfEffect: boolean): number {
  assertNonNegativeInteger(amount, "Resolved effect amount");
  return halfEffect ? Math.floor(amount / 2) : amount;
}
