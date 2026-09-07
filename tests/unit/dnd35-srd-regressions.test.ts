import { describe, expect, it } from "vitest";
import {
  commitSpellCast,
  createDnd35ActionEconomy,
  proneCombatModifiers,
  resolveBullRush,
  resolveDnd35Modifiers,
  resolveOpposedSkillCheck,
  skillPointCostForRanks,
  spendImmediateAction,
  standardConditionModifiers,
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

  it("purchases class skills in whole ranks and cross-class skills in half ranks", () => {
    expect(skillPointCostForRanks(2, true)).toBe(2);
    expect(skillPointCostForRanks(1.5, false)).toBe(3);
    expect(() => skillPointCostForRanks(1.5, true)).toThrow(/whole numbers/i);
  });

  it("blocks immediate actions while flat-footed without creating swift debt", () => {
    const start = createDnd35ActionEconomy();
    const result = spendImmediateAction(start, false, { flatFooted: true });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.code).toBe("DND35_IMMEDIATE_FLAT_FOOTED");
    expect(start.swiftDebtNextTurn).toBe(false);
  });

  it("blocks a flat-footed immediate spell before spending its prepared resource", () => {
    const result = commitSpellCast({
      actionEconomy: createDnd35ActionEconomy(),
      actionKind: "immediate",
      immediateOutsideOwnTurn: true,
      actorFlatFooted: true,
      resource: {
        kind: "prepared",
        state: {
          id: "prep-feather-fall",
          spellId: "feather-fall",
          slotLevel: 1,
          preparedCount: 1,
          expendedCount: 0,
        },
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.code).toBe("DND35_IMMEDIATE_FLAT_FOOTED");
  });

  it("keeps prone and pinned context-dependent modifiers out of global condition totals", () => {
    expect(standardConditionModifiers("prone")).toEqual([]);
    expect(standardConditionModifiers("pinned").some((modifier) => modifier.id.includes("armor-class"))).toBe(false);

    expect(proneCombatModifiers({ attackingWithRangedWeapon: false })).toEqual({
      attackModifier: -4,
      armorClassVsMelee: -4,
      armorClassVsRanged: 4,
    });
  });
});
