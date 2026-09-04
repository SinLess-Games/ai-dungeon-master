export interface RollResult {
  id: string;
  notation: string;
  label?: string;
  rolls: number[];
  /** for very large rolls we keep a capped sample for display */
  sampleOnly: boolean;
  count: number;
  sides: number;
  modifier: number;
  total: number;
  min: number;
  max: number;
  average: number;
  at: string;
}

const MAX_DISPLAY_DICE = 300;

function randomInt(sides: number) {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0xffffffff / sides) * sides;
    let v = 0;
    do {
      crypto.getRandomValues(buf);
      v = buf[0]!;
    } while (v >= limit);
    return (v % sides) + 1;
  }
  return Math.floor(Math.random() * sides) + 1;
}

/** Roll count dN + modifier. Handles very large counts (100d6, 5000d6) fast. */
export function roll(count: number, sides: number, modifier = 0, label?: string): RollResult {
  const n = Math.max(1, Math.min(100000, Math.floor(count)));
  const s = Math.max(2, Math.floor(sides));
  const kept: number[] = [];
  let total = 0;
  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < n; i++) {
    const v = randomInt(s);
    total += v;
    if (v < min) min = v;
    if (v > max) max = v;
    if (kept.length < MAX_DISPLAY_DICE) kept.push(v);
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    notation: `${n}d${s}${modifier ? (modifier > 0 ? `+${modifier}` : modifier) : ""}`,
    ...(label ? { label } : {}),
    rolls: kept,
    sampleOnly: n > MAX_DISPLAY_DICE,
    count: n,
    sides: s,
    modifier,
    total: total + modifier,
    min,
    max,
    average: total / n,
    at: new Date().toISOString(),
  };
}

/** Parse notation like "100d6+12", "d20", "4d6". */
export function parseNotation(input: string): { count: number; sides: number; modifier: number } | null {
  const m = input.trim().toLowerCase().replace(/\s+/g, "").match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!m) return null;
  return {
    count: m[1] ? parseInt(m[1], 10) : 1,
    sides: parseInt(m[2]!, 10),
    modifier: m[3] ? parseInt(m[3], 10) : 0,
  };
}

/** 4d6 drop lowest, six times — the classic ability score roll. */
export type AbilityRollMethod = "4d6-drop-lowest" | "4d6-drop-none";

export function rollAbilityScores(
  method: AbilityRollMethod = "4d6-drop-lowest",
): { score: number; dice: number[] }[] {
  return Array.from({ length: 6 }, () => {
    const dice = [randomInt(6), randomInt(6), randomInt(6), randomInt(6)].sort((a, b) => b - a);
    const score =
      method === "4d6-drop-none"
        ? dice.reduce((n, d) => n + d, 0)
        : dice[0]! + dice[1]! + dice[2]!;
    return { score, dice };
  });
}

export const POINT_BUY_COST: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 6, 15: 8, 16: 10, 17: 13, 18: 16,
  // High-powered / epic continuation of the 3.5 buy table (+4 per point past 18)
  19: 20, 20: 24, 21: 28, 22: 32, 23: 36, 24: 40, 25: 44, 26: 48,
};

export const POINT_BUY_BUDGETS = [22, 25, 28, 32, 72] as const;

export function pointBuyCost(score: number) {
  return POINT_BUY_COST[score] ?? 0;
}

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
