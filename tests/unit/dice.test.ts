import { describe, expect, it, vi } from "vitest";

import { parseDiceFormula, rollDiceFormula, type DiceFormula, type RandomSource } from "@/engine";

function sequenceRandom(values: readonly number[]): RandomSource {
  let index = 0;
  return {
    next() {
      const value = values[index++];
      if (value === undefined) throw new Error("Random test sequence exhausted.");
      return value;
    },
  };
}

describe("compound dice formulas", () => {
  it("normalizes multiple dice groups and flat modifiers", () => {
    const formula = parseDiceFormula(" 2d6 + d4 - 1d8 + 7 - 2 ");

    expect(formula.notation).toBe("2d6+1d4-1d8+5");
    expect(formula.modifier).toBe(5);
    expect(formula.terms.map((term) => [term.sign, term.expression.notation])).toEqual([
      [1, "2d6"],
      [1, "1d4"],
      [-1, "1d8"],
    ]);
  });

  it("rolls compound formulas through one deterministic random source", () => {
    const result = rollDiceFormula("2d6+d4+3", {
      random: sequenceRandom([0, 0.999999, 0.5]),
    });

    expect(result.terms[0]?.rolls).toEqual([1, 6]);
    expect(result.terms[1]?.rolls).toEqual([3]);
    expect(result.subtotal).toBe(10);
    expect(result.modifier).toBe(3);
    expect(result.total).toBe(13);
  });

  it("supports percentile dice and subtraction", () => {
    const result = rollDiceFormula("d%-d10+2", {
      random: sequenceRandom([0.999999, 0]),
    });

    expect(result.formula.notation).toBe("1d100-1d10+2");
    expect(result.total).toBe(101);
  });

  it("bounds total dice across groups and rejects malformed formulas", () => {
    expect(() => parseDiceFormula("6000d6+5000d8")).toThrow("Total dice count");
    expect(() => parseDiceFormula("2d6++4")).toThrow(SyntaxError);
    expect(() => parseDiceFormula("12")).toThrow("must include at least one dice term");
  });

  it("rejects invalid structured formulas before consuming randomness", () => {
    const valid = parseDiceFormula("d6");
    const random = { next: vi.fn(() => 0) };
    const invalid = [
      { ...valid, terms: [] },
      { ...valid, terms: [{ ...valid.terms[0], sign: 0 }] },
      {
        ...valid,
        terms: [{ ...valid.terms[0], expression: { ...valid.terms[0]!.expression, modifier: 2 } }],
      },
    ];
    for (const formula of invalid) {
      expect(() => rollDiceFormula(formula as DiceFormula, { random })).toThrow();
    }
    expect(random.next).not.toHaveBeenCalled();
  });
});
