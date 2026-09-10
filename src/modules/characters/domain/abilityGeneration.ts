export const pointBuyBudgets = [22, 32, 52, 72] as const;
export type PointBuyBudget = (typeof pointBuyBudgets)[number];

export type AbilityGenerationMethod =
  | "standard-array"
  | `point-buy-${PointBuyBudget}`
  | "roll-4d6-drop-lowest"
  | "roll-4d6-reroll-1-2";

export const pointBuyScoreCosts: Readonly<Record<number, number>> = Object.freeze({
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 6,
  15: 8,
  16: 10,
  17: 13,
  18: 16,
});

export function pointBuyCost(score: number): number {
  const cost = pointBuyScoreCosts[score];
  if (cost === undefined) throw new RangeError("Point-buy scores must be between 8 and 18.");
  return cost;
}

export function pointBuyTotal(scores: readonly number[]): number {
  return scores.reduce((total, score) => total + pointBuyCost(score), 0);
}

function secureDie(sides = 6): number {
  if (!Number.isInteger(sides) || sides <= 0) throw new RangeError("Die sides must be a positive integer.");
  const limit = Math.floor(0x1_0000_0000 / sides) * sides;
  const values = new Uint32Array(1);
  do crypto.getRandomValues(values); while (values[0]! >= limit);
  return (values[0]! % sides) + 1;
}

export type DieRoller = (sides: number) => number;

function validatedRoll(rollDie: DieRoller): number {
  const value = rollDie(6);
  if (!Number.isInteger(value) || value < 1 || value > 6) {
    throw new RangeError("A d6 roller must return an integer from 1 through 6.");
  }
  return value;
}

export function rollAbilityScore(
  method: "roll-4d6-drop-lowest" | "roll-4d6-reroll-1-2",
  rollDie: DieRoller = secureDie,
): { score: number; rolls: number[] } {
  if (method === "roll-4d6-drop-lowest") {
    const rolls = Array.from({ length: 4 }, () => validatedRoll(rollDie));
    const score = rolls.reduce((sum, value) => sum + value, 0) - Math.min(...rolls);
    return { score, rolls };
  }

  const rolls: number[] = [];
  for (let die = 0; die < 4; die += 1) {
    let value = validatedRoll(rollDie);
    while (value <= 2) value = validatedRoll(rollDie);
    rolls.push(value);
  }
  const score = rolls.reduce((sum, value) => sum + value, 0) - Math.min(...rolls);
  return { score, rolls };
}

export function rollAbilitySet(
  method: "roll-4d6-drop-lowest" | "roll-4d6-reroll-1-2",
  rollDie: DieRoller = secureDie,
): { scores: number[]; rolls: number[][] } {
  const rows = Array.from({ length: 6 }, () => rollAbilityScore(method, rollDie));
  return { scores: rows.map(({ score }) => score), rolls: rows.map(({ rolls }) => rolls) };
}
