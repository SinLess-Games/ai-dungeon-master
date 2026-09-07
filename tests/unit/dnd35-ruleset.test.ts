import { describe, expect, it } from "vitest";
import type { RandomSource } from "@/engine";
import {
  abilityModifier,
  abilityScoreIncreaseCount,
  armorClassSizeModifier,
  baseAttackBonusForClass,
  baseSaveBonusForClass,
  bonusPowerPoints,
  bonusSpellsPerDay,
  calculateArmorClass,
  calculateAttackBonus,
  calculateGrappleModifier,
  calculateInitiative,
  calculateMaximumHitPoints,
  calculatePowerSaveDc,
  calculateSavingThrowBonus,
  calculateSkillModifier,
  calculateSpellSaveDc,
  canCastSpellLevel,
  canManifestPowerLevel,
  canUseAbility,
  carryingCapacity,
  classifyLoad,
  effectiveAbilityScore,
  experienceForLevel,
  generalFeatSlotsAtLevel,
  grappleSizeModifier,
  healthStateForHitPoints,
  iterativeBaseAttackBonuses,
  levelForExperience,
  maximumSkillRanks,
  resolveAttackRoll,
  resolveDamage,
  resolveDnd35Modifiers,
  resolveSavingThrow,
  resolveSkillCheck,
  skillPointCostForRanks,
  totalBaseAttackBonus,
  totalBaseSaveBonus,
} from "@/rulesets/dnd35";

function sequenceRandom(values: readonly number[]): RandomSource {
  let index = 0;
  return {
    next(): number {
      const value = values[index++];
      if (value === undefined) throw new Error("Random test sequence exhausted.");
      return value;
    },
  };
}

describe("D&D 3.5 abilities", () => {
  it("calculates standard ability modifiers", () => {
    expect(abilityModifier(1)).toBe(-5);
    expect(abilityModifier(9)).toBe(-1);
    expect(abilityModifier(10)).toBe(0);
    expect(abilityModifier(18)).toBe(4);
  });

  it("resolves persisted ability components and nonabilities", () => {
    expect(
      effectiveAbilityScore({
        baseScore: 15,
        racialAdjustment: 2,
        inherentBonus: 1,
        levelAdjustment: 1,
        temporaryAdjustment: 2,
        abilityDamage: 3,
        abilityDrain: 1,
      }),
    ).toBe(17);
    expect(effectiveAbilityScore({ baseScore: null })).toBeNull();
    expect(canUseAbility(null)).toBe(false);
    expect(canUseAbility(0)).toBe(false);
    expect(canUseAbility(1)).toBe(true);
  });
});

describe("D&D 3.5 progression", () => {
  it("calculates the three standard BAB progressions", () => {
    expect(baseAttackBonusForClass(6, "full")).toBe(6);
    expect(baseAttackBonusForClass(6, "three_quarters")).toBe(4);
    expect(baseAttackBonusForClass(6, "half")).toBe(3);
    expect(baseAttackBonusForClass(4, "custom", 3)).toBe(3);
  });

  it("sums multiclass BAB after class-by-class rounding", () => {
    expect(
      totalBaseAttackBonus([
        { levels: 2, baseAttack: "full" },
        { levels: 3, baseAttack: "half" },
      ]),
    ).toBe(3);
  });

  it("builds normal iterative attacks", () => {
    expect(iterativeBaseAttackBonuses(0)).toEqual([0]);
    expect(iterativeBaseAttackBonuses(6)).toEqual([6, 1]);
    expect(iterativeBaseAttackBonuses(16)).toEqual([16, 11, 6, 1]);
    expect(iterativeBaseAttackBonuses(25)).toEqual([25, 20, 15, 10]);
  });

  it("calculates good, poor, custom, and multiclass saves", () => {
    expect(baseSaveBonusForClass(0, "good")).toBe(0);
    expect(baseSaveBonusForClass(1, "good")).toBe(2);
    expect(baseSaveBonusForClass(2, "good")).toBe(3);
    expect(baseSaveBonusForClass(3, "poor")).toBe(1);
    expect(baseSaveBonusForClass(4, "custom", 7)).toBe(7);
    expect(
      totalBaseSaveBonus([
        { levels: 2, progression: "good" },
        { levels: 3, progression: "poor" },
      ]),
    ).toBe(4);
  });

  it("calculates standard XP, feat slots, and ability increases", () => {
    expect(experienceForLevel(1)).toBe(0);
    expect(experienceForLevel(20)).toBe(190_000);
    expect(levelForExperience(0)).toBe(1);
    expect(levelForExperience(189_999)).toBe(19);
    expect(levelForExperience(190_000)).toBe(20);
    expect(generalFeatSlotsAtLevel(20)).toBe(7);
    expect(abilityScoreIncreaseCount(20)).toBe(5);
  });
});

describe("D&D 3.5 modifier stacking", () => {
  it("overlaps same-type bonuses while stacking dodge, circumstance, untyped, and penalties", () => {
    const result = resolveDnd35Modifiers(
      [
        { id: "armor-1", source: "chain", kind: "armor", value: 4 },
        { id: "armor-2", source: "spell", kind: "armor", value: 6 },
        { id: "dodge-1", source: "feat", kind: "dodge", value: 1 },
        { id: "dodge-2", source: "haste", kind: "dodge", value: 1 },
        { id: "luck-1", source: "blessing-a", kind: "luck", value: 2 },
        { id: "luck-2", source: "blessing-b", kind: "luck", value: 1 },
        { id: "penalty-a", source: "curse-a", kind: "morale", value: -1 },
        { id: "penalty-b", source: "curse-b", kind: "morale", value: -2 },
        { id: "untyped", source: "story", kind: "untyped", value: 3 },
      ],
      10,
    );

    expect(result.modifierTotal).toBe(10);
    expect(result.total).toBe(20);
    expect(result.modifiers.find((entry) => entry.id === "armor-1")?.selected).toBe(false);
    expect(result.modifiers.find((entry) => entry.id === "armor-2")?.selected).toBe(true);
  });

  it("allows rules text to override stacking behavior", () => {
    expect(
      resolveDnd35Modifiers([
        { id: "a", source: "A", kind: "luck", value: 2, stacking: "stack" },
        { id: "b", source: "B", kind: "luck", value: 3, stacking: "stack" },
      ]).total,
    ).toBe(5);
  });
});

describe("D&D 3.5 combat math", () => {
  it("calculates normal, touch, and flat-footed AC", () => {
    const armorClass = calculateArmorClass({
      dexterityModifier: 3,
      modifiers: [
        { id: "armor", source: "chain shirt", kind: "armor", value: 4 },
        { id: "shield", source: "shield", kind: "shield", value: 2 },
        { id: "natural", source: "race", kind: "natural-armor", value: 1 },
        { id: "deflection", source: "ring", kind: "deflection", value: 1 },
        { id: "dodge", source: "feat", kind: "dodge", value: 1 },
      ],
    });

    expect(armorClass.normal).toBe(22);
    expect(armorClass.touch).toBe(15);
    expect(armorClass.flatFooted).toBe(18);
  });

  it("applies max Dex only to a positive Dexterity modifier", () => {
    expect(calculateArmorClass({ dexterityModifier: 5, maxDexterityBonus: 2 }).normal).toBe(12);
    expect(calculateArmorClass({ dexterityModifier: -2, maxDexterityBonus: 0 }).normal).toBe(8);
  });

  it("provides standard size modifiers", () => {
    expect(armorClassSizeModifier("small")).toBe(1);
    expect(armorClassSizeModifier("large")).toBe(-1);
    expect(grappleSizeModifier("small")).toBe(-4);
    expect(grappleSizeModifier("large")).toBe(4);
  });

  it("calculates attack, initiative, grapple, and saving throw totals", () => {
    expect(calculateAttackBonus({ baseAttackBonus: 5, abilityModifier: 4, size: "small" }).total).toBe(10);
    expect(
      calculateInitiative(3, [{ id: "improved", source: "Improved Initiative", kind: "untyped", value: 4 }]).total,
    ).toBe(7);
    expect(calculateGrappleModifier({ baseAttackBonus: 5, strengthModifier: 4, size: "large" }).total).toBe(13);
    expect(calculateSavingThrowBonus({ baseSaveBonus: 3, abilityModifier: 2 }).total).toBe(5);
  });

  it("enforces natural 1 and natural 20 for attack rolls", () => {
    expect(resolveAttackRoll({ attackBonus: 100, armorClass: 1, roll: 1 }).hit).toBe(false);
    expect(resolveAttackRoll({ attackBonus: -100, armorClass: 100, roll: 20 }).hit).toBe(true);
  });

  it("marks only successful threat-range attacks as critical threats", () => {
    expect(resolveAttackRoll({ attackBonus: 5, armorClass: 20, roll: 19, threatMinimum: 19 }).criticalThreat).toBe(true);
    expect(resolveAttackRoll({ attackBonus: -20, armorClass: 20, roll: 19, threatMinimum: 19 }).criticalThreat).toBe(false);
  });

  it("enforces natural 1 and natural 20 for saving throws", () => {
    expect(resolveSavingThrow({ saveBonus: 100, dc: 1, roll: 1 }).passed).toBe(false);
    expect(resolveSavingThrow({ saveBonus: -100, dc: 100, roll: 20 }).passed).toBe(true);
  });
});

describe("D&D 3.5 damage", () => {
  it("rerolls critical-eligible damage and leaves extra dice unmultiplied", () => {
    const result = resolveDamage({
      criticalMultiplier: 2,
      random: sequenceRandom([0, 0.999999, 0.5]),
      components: [
        { id: "weapon", source: "longsword", dice: "1d6", flat: 2 },
        { id: "sneak", source: "sneak attack", dice: "1d6", criticalEligible: false },
      ],
    });

    expect(result.components[0]?.rolls.map((roll) => roll.total)).toEqual([1, 6]);
    expect(result.components[0]?.total).toBe(11);
    expect(result.components[1]?.total).toBe(4);
    expect(result.total).toBe(15);
  });
});

describe("D&D 3.5 skills", () => {
  it("calculates class and cross-class rank caps and costs", () => {
    expect(maximumSkillRanks(1, true)).toBe(4);
    expect(maximumSkillRanks(1, false)).toBe(2);
    expect(skillPointCostForRanks(1.5, false)).toBe(3);
  });

  it("combines ranks, ability, armor check penalty, and modifiers", () => {
    expect(
      calculateSkillModifier({
        ranks: 5,
        abilityModifier: 3,
        armorCheckPenalty: -2,
        modifiers: [{ id: "item", source: "tool", kind: "circumstance", value: 2 }],
      }).total,
    ).toBe(8);
  });

  it("does not make natural 20 an automatic skill success", () => {
    const result = resolveSkillCheck({ bonus: 0, dc: 25, roll: 20 });
    expect(result.success).toBe(false);
    expect(result.total).toBe(20);
  });
});

describe("D&D 3.5 encumbrance", () => {
  it("uses the standard Strength carrying table", () => {
    const capacity = carryingCapacity(10);
    expect(capacity.lightMaximum).toBe(33);
    expect(capacity.mediumMaximum).toBe(66);
    expect(capacity.heavyMaximum).toBe(100);
    expect(capacity.liftOffGround).toBe(200);
    expect(capacity.pushOrDrag).toBe(500);
  });

  it("scales capacity by size, quadruped status, and Strength above 29", () => {
    expect(carryingCapacity(10, { size: "large" }).heavyMaximum).toBe(200);
    expect(carryingCapacity(10, { quadruped: true }).heavyMaximum).toBe(150);
    expect(carryingCapacity(30).heavyMaximum).toBe(1600);
  });

  it("classifies carried load", () => {
    const capacity = carryingCapacity(10);
    expect(classifyLoad(33, capacity)).toBe("light");
    expect(classifyLoad(34, capacity)).toBe("medium");
    expect(classifyLoad(67, capacity)).toBe("heavy");
    expect(classifyLoad(101, capacity)).toBe("overloaded");
  });
});

describe("D&D 3.5 health", () => {
  it("applies Constitution to every Hit Die with a one-HP minimum", () => {
    expect(
      calculateMaximumHitPoints({ hitDieResults: [10, 5], constitutionModifier: 2 }).maximumHitPoints,
    ).toBe(19);
    expect(
      calculateMaximumHitPoints({ hitDieResults: [1, 1], constitutionModifier: -4 }).maximumHitPoints,
    ).toBe(2);
  });

  it("classifies the core disabled, dying, and dead thresholds", () => {
    expect(healthStateForHitPoints(1)).toBe("conscious");
    expect(healthStateForHitPoints(0)).toBe("disabled");
    expect(healthStateForHitPoints(-9)).toBe("dying");
    expect(healthStateForHitPoints(-10)).toBe("dead");
  });
});

describe("D&D 3.5 magic and psionics", () => {
  it("checks spell ability requirements and bonus spells", () => {
    expect(canCastSpellLevel(14, 4)).toBe(true);
    expect(canCastSpellLevel(14, 5)).toBe(false);
    expect(bonusSpellsPerDay(18, 4)).toBe(1);
    expect(bonusSpellsPerDay(20, 1)).toBe(2);
    expect(bonusSpellsPerDay(20, 0)).toBe(0);
  });

  it("calculates spell save DC", () => {
    expect(
      calculateSpellSaveDc({
        spellLevel: 3,
        castingAbilityModifier: 4,
        modifiers: [{ id: "focus", source: "Spell Focus", kind: "untyped", value: 1 }],
      }).total,
    ).toBe(18);
  });

  it("checks power ability requirements, save DC, and bonus power points", () => {
    expect(canManifestPowerLevel(14, 4)).toBe(true);
    expect(canManifestPowerLevel(14, 5)).toBe(false);
    expect(calculatePowerSaveDc({ powerLevel: 3, manifestingAbilityModifier: 4 }).total).toBe(17);
    expect(bonusPowerPoints(18, 5)).toBe(10);
  });
});
