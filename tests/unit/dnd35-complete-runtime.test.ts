import { describe, expect, it } from "vitest";
import {
  applyHealing,
  applyLethalDamage,
  applyNonlethalDamage,
  awardExperience,
  beginDnd35Turn,
  calculateDerivedCharacterStats,
  canCounterspellWithSameSpell,
  commitSpellCast,
  consciousnessState,
  effectiveCharacterLevel,
  featBenefitsToRuleEffects,
  gainPsionicFocus,
  mitigateDamage,
  resolveCharge,
  resolveCriticalConfirmation,
  resolveDispelCheck,
  resolveDyingStabilization,
  resolveFullAttack,
  resolveRaceMovement,
  spendImmediateAction,
  validateCharacterCreation,
  validateCharge,
  validateFeatSelection,
  type Dnd35PrerequisiteExpression,
} from "@/rulesets/dnd35";
import { createDnd35ActionEconomy } from "@/rulesets/dnd35/actionEconomy";
import { resolveAttackRoll } from "@/rulesets/dnd35/combat";

describe("race and derived character runtime", () => {
  const race = {
    id: "human-like",
    size: "medium" as const,
    baseSpeedFeet: 30,
    levelAdjustment: 0,
    racialHitDice: 0,
    naturalArmor: 1,
    bonusSkillPointsPerLevel: 1,
    bonusFeatsAtFirstLevel: 1,
  };

  it("resolves ECL and additional movement modes", () => {
    expect(effectiveCharacterLevel({ classLevels: 3, race })).toBe(3);
    expect(
      resolveRaceMovement(race, [
        { mode: "swim", baseSpeedMultiplier: 0.5 },
        { mode: "fly", feet: 60, maneuverability: "good" },
      ]),
    ).toEqual([
      { mode: "land", feet: 30 },
      { mode: "swim", feet: 15 },
      { mode: "fly", feet: 60, maneuverability: "good" },
    ]);
  });

  it("assembles a coherent character-sheet baseline", () => {
    const derived = calculateDerivedCharacterStats({
      abilities: {
        str: { baseScore: 16 },
        dex: { baseScore: 14 },
        con: { baseScore: 14 },
        int: { baseScore: 10 },
        wis: { baseScore: 10 },
        cha: { baseScore: 8 },
      },
      classLevels: [
        {
          classId: "fighter",
          level: 1,
          baseAttackBonus: 1,
          fort: 2,
          ref: 0,
          will: 0,
        },
      ],
      race,
      gainedHitPoints: [10],
    });

    expect(derived.abilities.str).toEqual({ score: 16, modifier: 3 });
    expect(derived.progression.baseAttackBonus).toBe(1);
    expect(derived.armorClass.normal).toBe(13);
    expect(derived.savingThrows.fort.total).toBe(4);
    expect(derived.savingThrows.ref.total).toBe(2);
    expect(derived.grapple.total).toBe(4);
    expect(derived.hitPoints.maximumHitPoints).toBe(12);
    expect(derived.effectiveCharacterLevel).toBe(1);
  });
});

describe("XP and advancement runtime", () => {
  it("reports every milestone crossed by a large XP award", () => {
    const result = awardExperience(1_000, 5_000);
    expect(result.beforeLevel).toBe(2);
    expect(result.afterLevel).toBe(4);
    expect(result.levelsGained).toBe(2);
    expect(result.featChoicesGained).toBe(1);
    expect(result.abilityIncreasesGained).toBe(1);
  });
});

describe("combat action runtime", () => {
  it("validates a legal charge and returns its standard modifiers", () => {
    const result = validateCharge({
      speedFeet: 30,
      distanceFeet: 50,
      straightLine: true,
      clearPath: true,
      targetReachable: true,
    });
    expect(result).toEqual({
      ok: true,
      value: {
        distanceFeet: 50,
        maximumDistanceFeet: 60,
        attackModifier: 2,
        armorClassModifier: -2,
      },
    });
  });

  it("resolves normal iterative attacks for a full attack", () => {
    const attacks = resolveFullAttack({
      baseAttackBonus: 11,
      fixedAttackModifier: 3,
      armorClass: 20,
      rolls: [10, 10, 10],
    });
    expect(attacks.map((attack) => attack.totalAttackBonus)).toEqual([14, 9, 4]);
    expect(attacks.map((attack) => attack.result.hit)).toEqual([true, false, false]);
  });

  it("confirms a critical threat with a second attack roll", () => {
    const threat = resolveAttackRoll({
      attackBonus: 5,
      armorClass: 20,
      threatMinimum: 19,
      roll: 19,
    });
    const confirmation = resolveCriticalConfirmation({
      threat,
      attackBonus: 5,
      armorClass: 20,
      confirmationRoll: 15,
    });
    expect(confirmation.threatened).toBe(true);
    expect(confirmation.confirmed).toBe(true);
  });

  it("models off-turn immediate actions as next-turn swift debt", () => {
    const start = createDnd35ActionEconomy();
    const immediate = spendImmediateAction(start, false);
    expect(immediate.ok).toBe(true);
    if (!immediate.ok) return;
    expect(immediate.value.swiftDebtNextTurn).toBe(true);
    const nextTurn = beginDnd35Turn(immediate.value);
    expect(nextTurn.swiftAvailable).toBe(false);
    expect(nextTurn.swiftDebtNextTurn).toBe(false);
  });
});

describe("feat runtime", () => {
  it("requires choices for choice-bearing feats and enforces nonrepeatability", () => {
    const feat = { id: "weapon-focus", repeatable: true, choiceKind: "weapon" as const };
    expect(validateFeatSelection({ feat, selection: { featId: "weapon-focus" } }).ok).toBe(false);
    expect(
      validateFeatSelection({
        feat,
        selection: { featId: "weapon-focus", choice: "longsword" },
      }),
    ).toEqual({ ok: true, value: { featId: "weapon-focus", choice: "longsword" } });

    const nonrepeatable = { id: "dodge", repeatable: false, choiceKind: "none" as const };
    expect(
      validateFeatSelection({
        feat: nonrepeatable,
        selection: { featId: "dodge" },
        existingSelections: [{ featId: "dodge" }],
      }).ok,
    ).toBe(false);
  });

  it("converts relational feat benefits into common RuleEffects", () => {
    expect(
      featBenefitsToRuleEffects([
        {
          kind: "save_bonus",
          save: "fort",
          amount: 2,
          bonusType: "resistance",
        },
      ]),
    ).toEqual([
      {
        kind: "modifier",
        target: { kind: "save", save: "fort" },
        amount: 2,
        bonusType: "resistance",
      },
    ]);
  });
});

describe("health and damage runtime", () => {
  it("absorbs lethal damage with temporary HP before real HP", () => {
    const result = applyLethalDamage(
      {
        maximumHitPoints: 10,
        currentHitPoints: 10,
        temporaryHitPoints: 5,
        nonlethalDamage: 0,
        stable: true,
      },
      8,
    );
    expect(result.absorbedByTemporaryHitPoints).toBe(5);
    expect(result.hitPointDamage).toBe(3);
    expect(result.after.currentHitPoints).toBe(7);
  });

  it("handles nonlethal staggered/unconscious thresholds and healing", () => {
    const base = {
      maximumHitPoints: 10,
      currentHitPoints: 7,
      temporaryHitPoints: 0,
      nonlethalDamage: 0,
      stable: true,
    };
    const staggered = applyNonlethalDamage(base, 7);
    expect(consciousnessState(staggered)).toBe("staggered");
    const unconscious = applyNonlethalDamage(staggered, 1);
    expect(consciousnessState(unconscious)).toBe("unconscious");
    const healed = applyHealing(unconscious, 3);
    expect(healed.currentHitPoints).toBe(10);
    expect(healed.nonlethalDamage).toBe(5);
    expect(consciousnessState(healed)).toBe("conscious");
  });

  it("resolves the core 10-percent dying stabilization check", () => {
    const dying = {
      maximumHitPoints: 12,
      currentHitPoints: -2,
      temporaryHitPoints: 0,
      nonlethalDamage: 0,
      stable: false,
    };
    const success = resolveDyingStabilization(dying, 10);
    expect(success).toEqual({ ok: true, value: { ...dying, stable: true } });
    const failure = resolveDyingStabilization(dying, 11);
    expect(failure.ok).toBe(true);
    if (!failure.ok) return;
    expect(failure.value.currentHitPoints).toBe(-3);
  });

  it("applies immunity, per-packet energy resistance, and one DR pool", () => {
    const result = mitigateDamage({
      damage: [
        { id: "blade", type: "slashing", amount: 8 },
        { id: "fire-a", type: "fire", amount: 2 },
        { id: "fire-b", type: "fire", amount: 4 },
        { id: "cold", type: "cold", amount: 7 },
      ],
      energyResistances: { fire: 3 },
      immunities: ["cold"],
      damageReduction: { amount: 5, bypassedBy: ["magic"] },
      attackQualities: [],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.totalIncoming).toBe(21);
    expect(result.value.totalApplied).toBe(6);
    expect(result.value.totalPrevented).toBe(15);
  });
});

describe("spellcasting actions and dispel runtime", () => {
  it("atomically spends a standard action and prepared casting resource", () => {
    const result = commitSpellCast({
      actionEconomy: createDnd35ActionEconomy(),
      actionKind: "standard",
      resource: {
        kind: "prepared",
        state: {
          id: "prep-1",
          spellId: "magic-missile",
          slotLevel: 1,
          preparedCount: 1,
          expendedCount: 0,
        },
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.actionEconomy.standardAvailable).toBe(false);
    expect(result.value.resource).toEqual({
      kind: "prepared",
      state: {
        id: "prep-1",
        spellId: "magic-missile",
        slotLevel: 1,
        preparedCount: 1,
        expendedCount: 1,
      },
    });
  });

  it("caps ordinary dispel magic at +10 caster level", () => {
    const result = resolveDispelCheck({
      casterLevel: 15,
      targetCasterLevel: 9,
      roll: 10,
    });
    expect(result.casterLevelBonus).toBe(10);
    expect(result.target).toBe(20);
    expect(result.success).toBe(true);
  });

  it("recognizes same-spell counterspell access", () => {
    expect(
      canCounterspellWithSameSpell({
        incomingSpellId: "fireball",
        preparedOrKnownSpellIds: ["magic-missile", "fireball"],
      }),
    ).toBe(true);
  });
});

describe("character creation finalization", () => {
  const featPrerequisite: Dnd35PrerequisiteExpression = {
    version: 1,
    condition: { kind: "ability", ability: "str", minimum: 13 },
  };

  it("accepts a complete level-one build", () => {
    const result = validateCharacterCreation({
      characterLevel: 1,
      raceId: "human",
      classIds: ["fighter"],
      abilityScores: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 8 },
      skillPointsAvailable: 8,
      skills: [
        { skillId: "climb", ranks: 4, classSkill: true },
        { skillId: "tumble", ranks: 2, classSkill: false },
      ],
      requiredFeatChoices: 1,
      feats: [{ featId: "power-attack", prerequisite: featPrerequisite }],
      prerequisiteFacts: {
        abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 8 },
        characterLevel: 1,
        baseAttackBonus: 1,
        casterLevel: 0,
        manifesterLevel: 0,
      },
    });
    expect(result).toEqual({
      ok: true,
      value: {
        skillPointsSpent: 8,
        skillPointsRemaining: 0,
        featChoicesSelected: 1,
        featChoicesRequired: 1,
      },
    });
  });

  it("rejects over-cap skills, overspending, missing feats, and failed prerequisites", () => {
    const result = validateCharacterCreation({
      characterLevel: 1,
      raceId: "human",
      classIds: ["fighter"],
      abilityScores: { str: 10, dex: 14, con: 14, int: 10, wis: 10, cha: 8 },
      skillPointsAvailable: 2,
      skills: [{ skillId: "climb", ranks: 5, classSkill: true }],
      requiredFeatChoices: 1,
      feats: [{ featId: "power-attack", prerequisite: featPrerequisite }],
      prerequisiteFacts: {
        abilities: { str: 10 },
        characterLevel: 1,
        baseAttackBonus: 1,
        casterLevel: 0,
        manifesterLevel: 0,
      },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "DND35_SKILL_RANK_CAP",
        "DND35_SKILL_POINTS_EXCEEDED",
        "DND35_PREREQUISITE_FAILED",
      ]),
    );
  });
});
