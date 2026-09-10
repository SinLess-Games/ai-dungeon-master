import { describe, expect, it } from "vitest";
import {
  pointBuyCost,
  pointBuyTotal,
  rollAbilityScore,
  rollAbilitySet,
} from "@/modules/characters/domain/abilityGeneration";

describe("character ability generation", () => {
  it("uses the D&D 3.5 point-buy cost curve", () => {
    expect(pointBuyCost(8)).toBe(0);
    expect(pointBuyCost(14)).toBe(6);
    expect(pointBuyCost(15)).toBe(8);
    expect(pointBuyCost(18)).toBe(16);
    expect(pointBuyTotal([15, 14, 13, 12, 10, 8])).toBe(25);
    expect(() => pointBuyCost(19)).toThrow(RangeError);
  });

  it("rolls 4d6 and drops the lowest die", () => {
    const values = [6, 4, 3, 1];
    let index = 0;
    const result = rollAbilityScore("roll-4d6-drop-lowest", () => values[index++]!);
    expect(result.rolls).toEqual(values);
    expect(result.score).toBe(13);
  });

  it("rerolls 1s and 2s, then drops the lowest die", () => {
    const values = [1, 2, 5, 2, 6, 3, 4];
    let index = 0;
    const result = rollAbilityScore("roll-4d6-reroll-1-2", () => values[index++]!);
    expect(result.rolls).toEqual([5, 6, 3, 4]);
    expect(result.score).toBe(15);
  });

  it("creates six rolled scores", () => {
    const result = rollAbilitySet("roll-4d6-drop-lowest", () => 4);
    expect(result.scores).toEqual([12, 12, 12, 12, 12, 12]);
    expect(result.rolls).toHaveLength(6);
  });
});
