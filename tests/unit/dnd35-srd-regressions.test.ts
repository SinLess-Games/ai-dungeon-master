import { describe, expect, it } from "vitest";
import {
  resolveBullRush,
  resolveDnd35Modifiers,
  resolveOpposedSkillCheck,
  strengthDamageModifier,
  validateCharge,
} from "@/rulesets/dnd35";

describe("D&D 3.5 SRD regressions", () => {
  it("requires at least 10 feet of movement for a charge", () => {
    const result = validateCharge({
      speedFeet: 30,
      distanceFeet: 5,
      straightLine: true,
      clearPath: true,
      targetReachable: true,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.code).toBe("DND35_CHARGE_TOO_SHORT");
  });

  it("limits a restricted standard-action charge to normal speed", () => {
    const result = validateCharge({
      speedFeet: 30,
      distanceFeet: 40,
      straightLine: true,
      clearPath: true,
      targetReachable: true,
      restrictedToStandardAction: true,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.code).toBe("DND35_CHARGE_TOO_FAR");
  });

  it("adds another 5 feet of bull-rush movement for each full 5 points of margin", () => {
    const result = resolveBullRush({
      attackerStrengthModifier: 5,
      defenderStrengthModifier: 0,
      attackerSize: "medium",
      defenderSize: "medium",
      attackerRoll: 10,
      defenderRoll: 10,
    });

    expect(result.opposedCheck.margin).toBe(5);
    expect(result.minimumPushFeet).toBe(5);
    expect(result.additionalPushFeet).toBe(5);
    expect(result.totalPushFeet).toBe(10);
  });

  it("applies a negative Strength modifier in full to off-hand weapon damage", () => {
    expect(strengthDamageModifier({ strengthModifier: -3, handUse: "off_hand" })).toBe(-3);
    expect(strengthDamageModifier({ strengthModifier: 5, handUse: "off_hand" })).toBe(2);
  });

  it("keeps only the worst same-type penalty unless a rule explicitly stacks it", () => {
    const result = resolveDnd35Modifiers([
      { id: "fear-1", source: "effect-a", kind: "morale", value: -1 },
      { id: "fear-2", source: "effect-b", kind: "morale", value: -3 },
      { id: "forced", source: "special-rule", kind: "morale", value: -2, stacking: "stack" },
    ]);

    expect(result.total).toBe(-5);
    expect(result.modifiers.find((modifier) => modifier.id === "fear-1")?.selected).toBe(false);
    expect(result.modifiers.find((modifier) => modifier.id === "fear-2")?.selected).toBe(true);
    expect(result.modifiers.find((modifier) => modifier.id === "forced")?.selected).toBe(true);
  });

  it("breaks opposed-skill total ties with the higher skill modifier", () => {
    const result = resolveOpposedSkillCheck({
      leftId: "rogue",
      leftBonus: 8,
      rightId: "guard",
      rightBonus: 5,
      leftRoll: 7,
      rightRoll: 10,
    });

    expect(result.left.total).toBe(15);
    expect(result.right.total).toBe(15);
    expect(result.winnerId).toBe("rogue");
    expect(result.tied).toBe(true);
  });

  it("requires a reroll when opposed-skill totals and modifiers are both tied", () => {
    const result = resolveOpposedSkillCheck({
      leftId: "a",
      leftBonus: 5,
      rightId: "b",
      rightBonus: 5,
      leftRoll: 10,
      rightRoll: 10,
    });

    expect(result.winnerId).toBeNull();
    expect(result.tied).toBe(true);
  });
});
