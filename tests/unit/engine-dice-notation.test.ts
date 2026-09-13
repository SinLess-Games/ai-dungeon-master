import { describe, expect, it, vi } from "vitest";
import { createSeededRandom } from "@/engine/random";
import { parseDiceNotation, rollDiceNotation } from "@/engine/diceNotation";

describe("dice notation", () => {
  it("applies chained bonuses and penalties and preserves their breakdown", () => {
    const result = rollDiceNotation("1d20+4-8", { next: () => 0.5 });
    expect(result.total).toBe(7);
    expect(result.terms.map((term) => term.subtotal)).toEqual([11, 4, -8]);
    expect(result.terms[0]?.rolls).toEqual([11]);
    expect(parseDiceNotation("1d20+4-8")).toMatchObject({ minimum: -3, maximum: 16, diceCount: 1 });
  });

  it("rolls multiple signed dice groups left to right", () => {
    const random = {
      next: vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(0.99).mockReturnValueOnce(0.5),
    };
    const result = rollDiceNotation("2d6-1d4+3", random);
    expect(result.terms.map((term) => term.rolls)).toEqual([[1, 6], [3], []]);
    expect(result.total).toBe(7);
    expect(random.next).toHaveBeenCalledTimes(3);
  });

  it("accepts every integer die size from 2 through 1000, with inclusive endpoints", () => {
    for (let sides = 2; sides <= 1000; sides++) {
      expect(rollDiceNotation(`1d${sides}`, { next: () => 0 }).total).toBe(1);
      expect(rollDiceNotation(`1d${sides}`, { next: () => 1 - Number.EPSILON }).total).toBe(sides);
    }
  });

  it("normalizes whitespace, uppercase dice, omitted counts, and percentile dice", () => {
    expect(parseDiceNotation(" + D20 + 04 - 8 ").notation).toBe("1d20+4-8");
    expect(parseDiceNotation("d%").notation).toBe("1d100");
    expect(parseDiceNotation("-d6+2")).toMatchObject({ minimum: -4, maximum: 1 });
    expect(rollDiceNotation("4-d20", { next: () => 0.99 }).total).toBe(-16);
  });

  it("bounds the total number of dice across groups and supports large valid rolls", () => {
    const result = rollDiceNotation("500d1000+500d1000", { next: () => 0.999999 });
    expect(result.total).toBe(1_000_000);
    expect(result.terms.flatMap((term) => term.rolls)).toHaveLength(1000);
    expect(() => parseDiceNotation("500d6+501d6")).toThrow(/at most 1000 dice/i);
  });

  it.each([
    "",
    "0d20",
    "d1",
    "d1001",
    "1001d6",
    "1d20+",
    "1d20+-4",
    "1d20--4",
    "1.5d6",
    "1d20+1.2",
    "2 0d6",
    "1d20 4",
    "1d20*2",
    "(1d20)",
    "1d20/2",
    "1d20;alert(1)",
    "Infinity",
    "3+4",
    "1d20+1000000001",
    "1d20+9007199254740992",
    "1d20e3",
  ])("rejects invalid or excessive notation %j without rolling", (input) => {
    const next = vi.fn(() => 0.5);
    expect(() => rollDiceNotation(input, { next })).toThrow();
    expect(next).not.toHaveBeenCalled();
  });

  it("enforces expression length and term limits before consuming randomness", () => {
    expect(() => parseDiceNotation("d20" + " ".repeat(256))).toThrow(/characters/);
    expect(() => parseDiceNotation("d2" + "+1".repeat(50))).toThrow(/50 terms/);
  });

  it("replays seeded rolls deterministically", () => {
    expect(rollDiceNotation("8d20+3-2d6", createSeededRandom("dice"))).toEqual(
      rollDiceNotation("8d20+3-2d6", createSeededRandom("dice")),
    );
    expect(() => rollDiceNotation("d20", { next: () => 1 })).toThrow(/RandomSource/);
  });
});
