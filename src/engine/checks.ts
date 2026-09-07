import { rollDie } from "./dice";
import { mathRandomSource, type RandomSource } from "./random";

export interface CheckRequest {
  bonus: number;
  target: number;
  dieSides?: number;
  roll?: number;
  random?: RandomSource;
  tiesSucceed?: boolean;
}

export interface CheckResult {
  naturalRoll: number;
  bonus: number;
  total: number;
  target: number;
  margin: number;
  success: boolean;
}

export type ContestTieRule = "tie" | "left" | "right";

export interface Contestant {
  id: string;
  bonus: number;
  roll?: number;
}

export interface ContestResult {
  left: CheckResult;
  right: CheckResult;
  winnerId: string | null;
  tied: boolean;
  margin: number;
}

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite.`);
}

function resolveNaturalRoll(sides: number, explicit: number | undefined, random: RandomSource): number {
  if (!Number.isSafeInteger(sides) || sides < 2) throw new RangeError("Check die sides must be at least 2.");
  if (explicit === undefined) return rollDie(sides, random);
  if (!Number.isSafeInteger(explicit) || explicit < 1 || explicit > sides) {
    throw new RangeError(`Explicit check roll must be between 1 and ${sides}.`);
  }
  return explicit;
}

export function resolveCheck(request: CheckRequest): CheckResult {
  assertFinite(request.bonus, "Check bonus");
  assertFinite(request.target, "Check target");
  const dieSides = request.dieSides ?? 20;
  const naturalRoll = resolveNaturalRoll(dieSides, request.roll, request.random ?? mathRandomSource);
  const total = naturalRoll + request.bonus;
  const margin = total - request.target;
  const success = request.tiesSucceed === false ? margin > 0 : margin >= 0;
  return { naturalRoll, bonus: request.bonus, total, target: request.target, margin, success };
}

export function resolveContest(
  left: Contestant,
  right: Contestant,
  options: {
    dieSides?: number;
    random?: RandomSource;
    tieRule?: ContestTieRule;
  } = {},
): ContestResult {
  if (!left.id || !right.id) throw new RangeError("Contestant ids cannot be empty.");
  if (left.id === right.id) throw new RangeError("Contestants must have different ids.");
  assertFinite(left.bonus, "Left contest bonus");
  assertFinite(right.bonus, "Right contest bonus");

  const dieSides = options.dieSides ?? 20;
  const random = options.random ?? mathRandomSource;
  const leftRoll = resolveNaturalRoll(dieSides, left.roll, random);
  const rightRoll = resolveNaturalRoll(dieSides, right.roll, random);
  const leftTotal = leftRoll + left.bonus;
  const rightTotal = rightRoll + right.bonus;
  const difference = leftTotal - rightTotal;
  const tied = difference === 0;
  const tieRule = options.tieRule ?? "tie";
  const winnerId = !tied ? (difference > 0 ? left.id : right.id) : tieRule === "left" ? left.id : tieRule === "right" ? right.id : null;

  return {
    left: {
      naturalRoll: leftRoll,
      bonus: left.bonus,
      total: leftTotal,
      target: rightTotal,
      margin: difference,
      success: difference > 0 || (tied && tieRule === "left"),
    },
    right: {
      naturalRoll: rightRoll,
      bonus: right.bonus,
      total: rightTotal,
      target: leftTotal,
      margin: -difference,
      success: difference < 0 || (tied && tieRule === "right"),
    },
    winnerId,
    tied,
    margin: Math.abs(difference),
  };
}
