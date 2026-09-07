import { describe, expect, it } from "vitest";
import {
  applyHalfEffect,
  normalizeSaveEffect,
  resolveScaledEffectAmount,
} from "@/modules/game/domain/resolvedEffectRuntime";

const fixedRoll = (expression: string) => {
  if (expression === "1d6") return { total: 4, rolls: [4] };
  if (expression === "2d4") return { total: 6, rolls: [3, 3] };
  throw new Error(`Unexpected expression ${expression}`);
};

describe("resolved casting effects", () => {
  it("resolves fixed and level-scaled dice from authoritative level", () => {
    const resolved = resolveScaledEffectAmount(
      {
        flat: 2,
        dice: "2d4",
        scalingDice: { dice: "1d6", everyLevels: 2, maxApplications: 3 },
      },
      8,
      fixedRoll,
    );

    expect(resolved.total).toBe(20);
    expect(resolved.expressions).toEqual(["2d4", "1d6", "1d6", "1d6"]);
    expect(resolved.rolls).toEqual([3, 3, 4, 4, 4]);
  });

  it("caps scaling applications and floors half effects", () => {
    expect(
      resolveScaledEffectAmount(
        { scalingDice: { dice: "1d6", everyLevels: 1, maxApplications: 2 } },
        10,
        fixedRoll,
      ).total,
    ).toBe(8);
    expect(applyHalfEffect(9, true)).toBe(4);
    expect(applyHalfEffect(9, false)).toBe(9);
  });

  it("normalizes save semantics without inventing a save", () => {
    expect(
      normalizeSaveEffect({
        kind: "damage",
        target: "targets",
        amount: { dice: "1d6" },
        saveEffect: "half",
      }),
    ).toBe("half");
    expect(
      normalizeSaveEffect({
        kind: "healing",
        target: "caster",
        amount: { flat: 5 },
      }),
    ).toBeNull();
  });

  it("rejects invalid scaling intervals", () => {
    expect(() =>
      resolveScaledEffectAmount(
        { scalingDice: { dice: "1d6", everyLevels: 0 } },
        3,
        fixedRoll,
      ),
    ).toThrow(/positive safe integer/i);
  });
});
