import { describe, it, expect } from "vitest";
import {
  roll,
  parseNotation,
  rollAbilityScores,
  pointBuyCost,
  POINT_BUY_BUDGETS,
  STANDARD_ARRAY,
} from "@/lib/dice";

describe("dice", () => {
  it("rolls within bounds and totals correctly", () => {
    const r = roll(10, 6, 3, "attack");
    expect(r.count).toBe(10);
    expect(r.sides).toBe(6);
    expect(r.label).toBe("attack");
    expect(r.rolls).toHaveLength(10);
    expect(r.rolls.every((v) => v >= 1 && v <= 6)).toBe(true);
    expect(r.total).toBe(r.rolls.reduce((a, b) => a + b, 0) + 3);
    expect(r.min).toBeGreaterThanOrEqual(1);
    expect(r.max).toBeLessThanOrEqual(6);
    expect(r.notation).toBe("10d6+3");
  });

  it("clamps silly inputs and samples huge rolls", () => {
    const tiny = roll(0, 1);
    expect(tiny.count).toBe(1);
    expect(tiny.sides).toBe(2);

    const huge = roll(2000, 6, -2);
    expect(huge.sampleOnly).toBe(true);
    expect(huge.rolls.length).toBe(300);
    expect(huge.notation).toBe("2000d6-2");
    expect(huge.average).toBeGreaterThan(1);
  });

  it("parses dice notation", () => {
    expect(parseNotation("d20")).toEqual({ count: 1, sides: 20, modifier: 0 });
    expect(parseNotation(" 4D6 ")).toEqual({ count: 4, sides: 6, modifier: 0 });
    expect(parseNotation("100d6+12")).toEqual({ count: 100, sides: 6, modifier: 12 });
    expect(parseNotation("2d8-1")).toEqual({ count: 2, sides: 8, modifier: -1 });
    expect(parseNotation("nonsense")).toBeNull();
    expect(parseNotation("d")).toBeNull();
  });

  it("rolls ability scores six at a time", () => {
    const dropped = rollAbilityScores();
    expect(dropped).toHaveLength(6);
    for (const s of dropped) {
      expect(s.dice).toHaveLength(4);
      expect(s.score).toBe(s.dice[0]! + s.dice[1]! + s.dice[2]!);
      expect(s.score).toBeGreaterThanOrEqual(3);
      expect(s.score).toBeLessThanOrEqual(18);
    }
    const kept = rollAbilityScores("4d6-drop-none");
    expect(kept[0]!.score).toBe(kept[0]!.dice.reduce((a, b) => a + b, 0));
  });

  it("prices point buy", () => {
    expect(pointBuyCost(8)).toBe(0);
    expect(pointBuyCost(14)).toBe(6);
    expect(pointBuyCost(18)).toBe(16);
    expect(pointBuyCost(7)).toBe(0);
    expect(POINT_BUY_BUDGETS.length).toBeGreaterThan(0);
    expect(STANDARD_ARRAY).toEqual([15, 14, 13, 12, 10, 8]);
  });
});
