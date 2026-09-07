import { describe, expect, it } from "vitest";

import {
  adjustResource,
  createResource,
  createSeededRandom,
  evaluatePrerequisite,
  parseDiceExpression,
  randomIntInclusive,
  resolveModifiers,
  restoreResource,
  rollDice,
  spendResource,
  type PrerequisiteContext,
  type RandomSource,
} from "@/engine";

function sequenceRandom(values: readonly number[]): RandomSource {
  let index = 0;

  return {
    next(): number {
      const value = values[index];
      index += 1;

      if (value === undefined) {
        throw new Error("Random test sequence exhausted.");
      }

      return value;
    },
  };
}

describe("random engine", () => {
  it("replays the same sequence from the same seed", () => {
    const first = createSeededRandom("campaign-seed");
    const second = createSeededRandom("campaign-seed");

    const firstSequence = Array.from({ length: 8 }, () => first.next());
    const secondSequence = Array.from({ length: 8 }, () => second.next());

    expect(firstSequence).toEqual(secondSequence);
  });

  it("rejects random sources outside the unit interval", () => {
    expect(() => randomIntInclusive(1, 20, { next: () => 1 })).toThrow(RangeError);
  });
});

describe("dice engine", () => {
  it("parses common tabletop notation", () => {
    expect(parseDiceExpression("d20")).toEqual({
      count: 1,
      sides: 20,
      modifier: 0,
      notation: "1d20",
    });

    expect(parseDiceExpression(" 2d6 + 3 ")).toEqual({
      count: 2,
      sides: 6,
      modifier: 3,
      notation: "2d6+3",
    });

    expect(parseDiceExpression("d%").notation).toBe("1d100");
  });

  it("rolls through an injected deterministic source", () => {
    const result = rollDice("2d6+3", {
      random: sequenceRandom([0, 0.999999]),
    });

    expect(result.rolls).toEqual([1, 6]);
    expect(result.subtotal).toBe(7);
    expect(result.total).toBe(10);
  });

  it("bounds abusive expressions", () => {
    expect(() => parseDiceExpression("10001d6")).toThrow(RangeError);
    expect(() => parseDiceExpression("not-dice")).toThrow(SyntaxError);
  });
});

describe("modifier engine", () => {
  it("lets a ruleset configure stacking behavior by modifier kind", () => {
    type Kind = "stacking" | "typed";

    const result = resolveModifiers<Kind>(
      [
        { id: "a", source: "A", kind: "typed", value: 2 },
        { id: "b", source: "B", kind: "typed", value: 5 },
        { id: "c", source: "C", kind: "stacking", value: 1 },
        { id: "d", source: "D", kind: "stacking", value: 3 },
        { id: "disabled", source: "E", kind: "stacking", value: 100, enabled: false },
      ],
      {
        base: 10,
        rules: {
          typed: "highest",
          stacking: "sum",
        },
      },
    );

    expect(result.modifierTotal).toBe(9);
    expect(result.total).toBe(19);
    expect(result.modifiers.find((modifier) => modifier.id === "a")?.selected).toBe(false);
    expect(result.modifiers.find((modifier) => modifier.id === "b")?.selected).toBe(true);
    expect(result.modifiers.find((modifier) => modifier.id === "disabled")?.selected).toBe(false);
  });

  it("rejects duplicate modifier identities", () => {
    expect(() =>
      resolveModifiers([
        { id: "same", source: "A", kind: "generic", value: 1 },
        { id: "same", source: "B", kind: "generic", value: 2 },
      ]),
    ).toThrow("Duplicate modifier id");
  });
});

describe("prerequisite engine", () => {
  const facts = new Map<string, unknown>([
    ["level", 6],
    ["alignment", "LG"],
    ["feats", ["power-attack", "cleave"]],
  ]);

  const context: PrerequisiteContext = {
    getFact: (key) => facts.get(key),
    evaluatePredicate: (id) => id === "campaign-allows-prestige",
  };

  it("evaluates nested data-driven requirements", () => {
    const result = evaluatePrerequisite(
      {
        kind: "all",
        requirements: [
          { kind: "fact", key: "level", operator: "greater-than-or-equal", value: 5 },
          { kind: "fact", key: "feats", operator: "includes", value: "power-attack" },
          {
            kind: "any",
            requirements: [
              { kind: "fact", key: "alignment", operator: "equals", value: "NG" },
              { kind: "fact", key: "alignment", operator: "equals", value: "LG" },
            ],
          },
          { kind: "predicate", id: "campaign-allows-prestige" },
        ],
      },
      context,
    );

    expect(result.passed).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it("returns useful failures instead of only a boolean", () => {
    const result = evaluatePrerequisite(
      {
        kind: "fact",
        key: "level",
        operator: "greater-than-or-equal",
        value: 10,
        message: "Requires level 10.",
      },
      context,
    );

    expect(result.passed).toBe(false);
    expect(result.failures[0]?.message).toBe("Requires level 10.");
  });
});

describe("resource engine", () => {
  it("supports bounded spending and restoration", () => {
    const hitPoints = createResource(12, -10, 20);
    const damaged = adjustResource(hitPoints, -17);
    const healed = restoreResource(damaged.after, 100);

    expect(damaged.after.current).toBe(-5);
    expect(healed.after.current).toBe(20);
    expect(healed.clamped).toBe(true);
  });

  it("rejects overspending by default", () => {
    const spellSlots = createResource(1, 0, 3);

    expect(() => spendResource(spellSlots, 2)).toThrow(RangeError);
  });
});
