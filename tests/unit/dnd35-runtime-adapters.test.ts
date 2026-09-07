import { describe, expect, it } from "vitest";
import {
  aggregateClassProgression,
  armorAdjustedSpeed,
  armorClassModifierFromArmor,
  beginDnd35Round,
  beginDnd35Turn,
  calculateArmorClass,
  createDnd35ActionEconomy,
  grantsFromRuleEffects,
  hitPointsFromGainedLevels,
  maneuverSizeModifier,
  modifiersFromRuleEffects,
  resolveDnd35Modifiers,
  resolveGrappleContest,
  resolveOpposedManeuver,
  skillPointsForGainedLevel,
  spendDnd35Action,
  weaponDamageComponent,
  weaponNonproficiencyPenalty,
  weaponRangePenalty,
  type Dnd35RuntimeRuleEffect,
} from "@/rulesets/dnd35";

describe("D&D 3.5 class-level adapters", () => {
  it("uses only the highest cumulative row from each class", () => {
    const result = aggregateClassProgression([
      { classId: "fighter", level: 1, baseAttackBonus: 1, fort: 2, ref: 0, will: 0 },
      { classId: "fighter", level: 2, baseAttackBonus: 2, fort: 3, ref: 0, will: 0 },
      { classId: "wizard", level: 1, baseAttackBonus: 0, fort: 0, ref: 0, will: 2 },
      { classId: "wizard", level: 2, baseAttackBonus: 1, fort: 0, ref: 0, will: 3 },
    ]);

    expect(result.characterLevel).toBe(4);
    expect(result.classLevels).toEqual({ fighter: 2, wizard: 2 });
    expect(result.baseAttackBonus).toBe(3);
    expect(result.fort).toBe(3);
    expect(result.ref).toBe(0);
    expect(result.will).toBe(3);
  });

  it("applies the skill-point minimum before racial/other per-level extras", () => {
    expect(
      skillPointsForGainedLevel({
        baseSkillPoints: 2,
        intelligenceModifier: -4,
        extraPerLevel: 1,
      }),
    ).toBe(2);
    expect(
      skillPointsForGainedLevel({
        baseSkillPoints: 2,
        intelligenceModifier: -4,
        extraPerLevel: 1,
        firstCharacterLevel: true,
      }),
    ).toBe(8);
  });

  it("recalculates HP from persisted per-level gains", () => {
    expect(
      hitPointsFromGainedLevels({ gainedHitPoints: [10, 5, 6], constitutionModifier: 2 })
        .maximumHitPoints,
    ).toBe(27);
  });
});

describe("D&D 3.5 equipment adapters", () => {
  const armor = {
    id: "mithral-shirt",
    name: "Mithral Shirt",
    acBonus: 4,
    maxDexBonus: 6,
    armorCheckPenalty: 0,
    arcaneSpellFailurePercent: 10,
    speedAt30Feet: 30,
    speedAt20Feet: 20,
    enhancementBonus: 2,
  } as const;

  it("combines armor definition and instance enhancement into one armor bonus", () => {
    const modifier = armorClassModifierFromArmor(armor);
    expect(modifier.value).toBe(6);
    expect(modifier.kind).toBe("armor");
  });

  it("applies stored armor speeds only to their matching base speed", () => {
    expect(armorAdjustedSpeed(30, armor)).toBe(30);
    expect(armorAdjustedSpeed(20, armor)).toBe(20);
    expect(armorAdjustedSpeed(40, armor)).toBe(40);
  });

  it("calculates weapon proficiency and range penalties", () => {
    expect(weaponNonproficiencyPenalty(true)).toBe(0);
    expect(weaponNonproficiencyPenalty(false)).toBe(-4);

    expect(weaponRangePenalty({ distanceFeet: 30, rangeIncrementFeet: 30 }).penalty).toBe(0);
    expect(weaponRangePenalty({ distanceFeet: 60, rangeIncrementFeet: 30 }).penalty).toBe(-2);
    expect(
      weaponRangePenalty({ distanceFeet: 160, rangeIncrementFeet: 30, maximumIncrements: 5 })
        .inRange,
    ).toBe(false);
  });

  it("builds weapon damage compatible with the damage resolver", () => {
    expect(
      weaponDamageComponent({
        weaponId: "greatsword",
        weaponName: "Greatsword",
        dice: "2d6",
        staticBonus: 6,
      }),
    ).toEqual({
      id: "weapon:greatsword",
      source: "Greatsword",
      dice: "2d6",
      flat: 6,
      criticalEligible: true,
    });
  });
});

describe("D&D 3.5 action economy", () => {
  it("allows a standard action to be exchanged for a second move action", () => {
    const start = createDnd35ActionEconomy();
    const first = spendDnd35Action(start, "move");
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = spendDnd35Action(first.value, "move");
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.moveAvailable).toBe(false);
    expect(second.value.standardAvailable).toBe(false);

    expect(spendDnd35Action(second.value, "move").ok).toBe(false);
  });

  it("requires both standard and move actions for a full-round action", () => {
    const state = createDnd35ActionEconomy();
    const fullRound = spendDnd35Action(state, "full_round");
    expect(fullRound.ok).toBe(true);
    if (!fullRound.ok) return;
    expect(fullRound.value.standardAvailable).toBe(false);
    expect(fullRound.value.moveAvailable).toBe(false);
  });

  it("tracks and resets attacks of opportunity separately from turn actions", () => {
    const start = createDnd35ActionEconomy(2);
    const first = spendDnd35Action(start, "attack_of_opportunity");
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = spendDnd35Action(first.value, "attack_of_opportunity");
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(spendDnd35Action(second.value, "attack_of_opportunity").ok).toBe(false);

    const newTurn = beginDnd35Turn(second.value);
    expect(newTurn.attacksOfOpportunityRemaining).toBe(0);
    expect(beginDnd35Round(newTurn).attacksOfOpportunityRemaining).toBe(2);
  });
});

describe("D&D 3.5 combat maneuvers", () => {
  it("uses +4 per relative size category", () => {
    expect(maneuverSizeModifier("large", "small")).toBe(8);
    expect(maneuverSizeModifier("small", "large")).toBe(-8);
    expect(maneuverSizeModifier("medium", "medium")).toBe(0);
  });

  it("gives opposed-maneuver ties to the defender", () => {
    const result = resolveOpposedManeuver({
      attackerBonus: 5,
      defenderBonus: 3,
      attackerRoll: 10,
      defenderRoll: 12,
    });
    expect(result.attackerTotal).toBe(15);
    expect(result.defenderTotal).toBe(15);
    expect(result.attackerSucceeded).toBe(false);
  });

  it("breaks grapple total ties by grapple modifier before requiring a reroll", () => {
    const resolved = resolveGrappleContest({
      leftId: "fighter",
      leftModifier: 5,
      rightId: "ogre",
      rightModifier: 3,
      leftRoll: 10,
      rightRoll: 12,
    });
    expect(resolved.winnerId).toBe("fighter");
    expect(resolved.rerollRequired).toBe(false);

    const reroll = resolveGrappleContest({
      leftId: "a",
      leftModifier: 4,
      rightId: "b",
      rightModifier: 4,
      leftRoll: 10,
      rightRoll: 10,
    });
    expect(reroll.winnerId).toBeNull();
    expect(reroll.rerollRequired).toBe(true);
  });
});

describe("D&D 3.5 data-driven rule effects", () => {
  const effects: readonly Dnd35RuntimeRuleEffect[] = [
    {
      kind: "modifier",
      target: { kind: "save", save: "fort" },
      amount: 2,
      bonusType: "resistance",
    },
    {
      kind: "modifier",
      target: { kind: "save", save: "fort" },
      amount: 4,
      bonusType: "racial",
      when: "vs-poison",
    },
    { kind: "grant", entity: "feat", id: "power-attack" },
    { kind: "resistance", damageType: "fire", amount: 10 },
  ];

  it("turns matching persisted modifier effects into sourced runtime modifiers", () => {
    expect(
      modifiersFromRuleEffects(effects, { kind: "save", save: "fort" }, { id: "dwarf", name: "Dwarf" }),
    ).toEqual([
      {
        id: "dwarf:modifier:0:save:fort",
        source: "Dwarf",
        kind: "resistance",
        value: 2,
      },
    ]);

    expect(
      modifiersFromRuleEffects(
        effects,
        { kind: "save", save: "fort" },
        { id: "dwarf" },
        { evaluateWhen: (expression) => expression === "vs-poison" },
      ),
    ).toHaveLength(2);
  });

  it("extracts non-modifier grants", () => {
    expect(grantsFromRuleEffects(effects).map((effect) => effect.id)).toEqual(["power-attack"]);
  });

  it("normalizes persisted snake_case bonus types for stacking and AC behavior", () => {
    const resolution = resolveDnd35Modifiers([
      { id: "a", source: "A", kind: "natural_armor", value: 2 },
      { id: "b", source: "B", kind: "natural-armor", value: 4 },
    ]);
    expect(resolution.total).toBe(4);

    const ac = calculateArmorClass({
      dexterityModifier: 2,
      modifiers: [{ id: "natural", source: "hide", kind: "natural_armor", value: 3 }],
    });
    expect(ac.normal).toBe(15);
    expect(ac.touch).toBe(12);
  });
});
