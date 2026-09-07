import { describe, expect, it } from "vitest";
import {
  adaptPersistedCondition,
  calculateCasterLevel,
  conditionModifiers,
  conditionPolicyFromPersistence,
  concentrationDc,
  dailySpellSlots,
  evaluateDnd35Prerequisite,
  expendPreparedSpell,
  expendPsionicFocus,
  expendSpontaneousSlot,
  gainPsionicFocus,
  planPowerManifestation,
  resolveArcaneSpellFailure,
  resolveConcentrationCheck,
  resolvePowerResistanceCheck,
  resolveSpellResistanceCheck,
  spellProgressionAtLevel,
  spendPowerPoints,
  type Dnd35PrerequisiteExpression,
} from "@/rulesets/dnd35";

describe("D&D 3.5 condition runtime adapter", () => {
  it("adapts round durations and cumulative stacking", () => {
    const adapted = adaptPersistedCondition(
      {
        id: "condition-1",
        characterId: "character-1",
        conditionId: "poisoned",
        durationKind: "rounds",
        remainingRounds: 4,
        expiresAt: null,
      },
      { id: "poisoned", stacking: "cumulative" },
      { nowMs: 1_000, stacks: 2, maxStacks: 5 },
    );

    expect(adapted.instance.duration).toEqual({ kind: "rounds", remaining: 4 });
    expect(adapted.instance.stacks).toBe(2);
    expect(adapted.policy).toEqual({ stacking: "stack", refreshDurationOnStack: false });
  });

  it("turns an absolute expiry into elapsed runtime duration", () => {
    const adapted = adaptPersistedCondition(
      {
        id: "condition-2",
        characterId: "character-1",
        conditionId: "blessed",
        durationKind: "until_time",
        remainingRounds: null,
        expiresAt: 8_000,
      },
      { id: "blessed", stacking: "replace" },
      { nowMs: 3_000 },
    );

    expect(adapted.instance.duration).toEqual({ kind: "elapsed", remainingMs: 5_000 });
  });

  it("marks concentration durations without pretending they are timed", () => {
    const adapted = adaptPersistedCondition(
      {
        id: "condition-3",
        characterId: "character-1",
        conditionId: "concentration-effect",
        durationKind: "concentration",
        remainingRounds: null,
        expiresAt: null,
      },
      { id: "concentration-effect", stacking: "independent" },
      { nowMs: 1_000 },
    );

    expect(adapted.instance.duration).toEqual({ kind: "permanent" });
    expect(adapted.endsOnConcentrationLoss).toBe(true);
  });

  it("requires explicit handling for special stacking", () => {
    expect(() => conditionPolicyFromPersistence("special")).toThrow(/explicit ruleset policy/i);
  });

  it("extracts condition modifiers from persisted rule effects", () => {
    const modifiers = conditionModifiers({
      definition: {
        id: "bless",
        name: "Bless",
        stacking: "replace",
        effects: [
          {
            kind: "modifier",
            target: { kind: "stat", stat: "attack" },
            amount: 1,
            bonusType: "morale",
          },
        ],
      },
      target: { kind: "stat", stat: "attack" },
      sourceInstanceId: "condition-instance-1",
    });

    expect(modifiers).toHaveLength(1);
    expect(modifiers[0]).toMatchObject({ source: "Bless", kind: "morale", value: 1 });
  });
});

describe("D&D 3.5 spellcasting runtime", () => {
  it("combines base and ability bonus spell slots", () => {
    expect(dailySpellSlots({ spellLevel: 1, baseSlots: 2, castingAbilityScore: 18 })).toEqual({
      spellLevel: 1,
      base: 2,
      bonus: 1,
      total: 3,
      accessible: true,
    });
  });

  it("keeps null progression rows inaccessible", () => {
    expect(dailySpellSlots({ spellLevel: 3, baseSlots: null, castingAbilityScore: 20 })).toEqual({
      spellLevel: 3,
      base: 0,
      bonus: 0,
      total: 0,
      accessible: false,
    });
  });

  it("supports bonus-only slots when the progression stores zero", () => {
    expect(dailySpellSlots({ spellLevel: 2, baseSlots: 0, castingAbilityScore: 18 }).total).toBe(1);
  });

  it("selects and sorts one effective progression level", () => {
    const slots = spellProgressionAtLevel(
      [
        { classLevel: 3, spellLevel: 1, slotsPerDay: 2, spellsKnown: null },
        { classLevel: 3, spellLevel: 0, slotsPerDay: 4, spellsKnown: null },
        { classLevel: 2, spellLevel: 1, slotsPerDay: 1, spellsKnown: null },
      ],
      3,
      16,
    );

    expect(slots.map((slot) => slot.spellLevel)).toEqual([0, 1]);
    expect(slots[1]?.total).toBe(3);
  });

  it("calculates fractional caster-level progressions with advancement", () => {
    expect(
      calculateCasterLevel({
        classLevels: 7,
        numerator: 1,
        denominator: 2,
        advancedLevels: 2,
        adjustment: 1,
      }),
    ).toBe(6);
  });

  it("expends prepared spells until the preparation is exhausted", () => {
    const first = expendPreparedSpell({
      id: "prep-1",
      spellId: "magic-missile",
      slotLevel: 1,
      preparedCount: 2,
      expendedCount: 0,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = expendPreparedSpell(first.value);
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    const third = expendPreparedSpell(second.value);
    expect(third.ok).toBe(false);
    if (third.ok) return;
    expect(third.errors[0]?.code).toBe("SPELL_NOT_PREPARED");
  });

  it("expends spontaneous slots independently by level", () => {
    const result = expendSpontaneousSlot({ spellLevel: 2, maximum: 1, expended: 0 });
    expect(result).toEqual({ ok: true, value: { spellLevel: 2, maximum: 1, expended: 1 } });
  });

  it("resolves spell resistance as caster level plus d20", () => {
    const result = resolveSpellResistanceCheck({ casterLevel: 7, spellResistance: 18, roll: 11 });
    expect(result.success).toBe(true);
    expect(result.total).toBe(18);
  });

  it("calculates common concentration DCs", () => {
    expect(concentrationDc(3, { kind: "cast_defensively" })).toBe(18);
    expect(concentrationDc(2, { kind: "injury", damage: 9 })).toBe(21);
    expect(concentrationDc(2, { kind: "continuous_damage", previousDamage: 9 })).toBe(16);
    expect(concentrationDc(4, { kind: "vigorous_motion" })).toBe(14);
    expect(concentrationDc(4, { kind: "violent_motion" })).toBe(19);
  });

  it("does not apply automatic natural-one failure to concentration skill checks", () => {
    expect(resolveConcentrationCheck({ modifier: 20, dc: 15, roll: 1 }).success).toBe(true);
  });

  it("resolves arcane spell failure percentile rolls", () => {
    expect(resolveArcaneSpellFailure(20, 20).failed).toBe(true);
    expect(resolveArcaneSpellFailure(20, 21).failed).toBe(false);
  });
});

describe("D&D 3.5 psionics runtime", () => {
  it("plans repeatable augmentation while enforcing manifester-level PP caps", () => {
    const result = planPowerManifestation({
      baseCost: 3,
      manifesterLevel: 7,
      currentPowerPoints: 12,
      augmentations: [
        { id: "extra-die", additionalPowerPoints: 1, repeatable: true, applications: 3 },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.totalCost).toBe(6);
    expect(result.value.remainingPowerPoints).toBe(6);
  });

  it("rejects nonrepeatable augmentation applied twice", () => {
    const result = planPowerManifestation({
      baseCost: 1,
      manifesterLevel: 5,
      currentPowerPoints: 10,
      augmentations: [
        { id: "one-time", additionalPowerPoints: 2, repeatable: false, applications: 2 },
      ],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.code).toBe("POWER_AUGMENT_NOT_REPEATABLE");
  });

  it("rejects a manifestation above the manifester-level PP cap", () => {
    const result = planPowerManifestation({
      baseCost: 5,
      manifesterLevel: 5,
      currentPowerPoints: 20,
      augmentations: [{ id: "boost", additionalPowerPoints: 1, repeatable: true }],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.code).toBe("MANIFESTER_LEVEL_POWER_POINT_CAP");
  });

  it("uses the generic bounded-resource engine to spend power points", () => {
    const result = spendPowerPoints({ current: 8, maximum: 12, amount: 5 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.after.current).toBe(3);
  });

  it("tracks psionic focus as an expendable state", () => {
    const focused = gainPsionicFocus();
    const spent = expendPsionicFocus(focused);
    expect(spent).toEqual({ ok: true, value: { focused: false } });
    expect(expendPsionicFocus({ focused: false }).ok).toBe(false);
  });

  it("resolves power resistance as manifester level plus d20", () => {
    const result = resolvePowerResistanceCheck({ manifesterLevel: 8, powerResistance: 20, roll: 12 });
    expect(result.success).toBe(true);
    expect(result.total).toBe(20);
  });
});

describe("D&D 3.5 prerequisite adapter", () => {
  const expression: Dnd35PrerequisiteExpression = {
    version: 1,
    condition: {
      kind: "all",
      conditions: [
        { kind: "ability", ability: "str", minimum: 13 },
        { kind: "base_attack_bonus", minimum: 1 },
        { kind: "feat", featId: "power-attack" },
        { kind: "skill_ranks", skillId: "tumble", minimum: 5 },
        { kind: "alignment", allowed: ["CG", "CN", "N"] },
      ],
    },
  };

  it("evaluates persisted-style prerequisite trees through the generic engine", () => {
    const result = evaluateDnd35Prerequisite(expression, {
      abilities: { str: 14 },
      characterLevel: 6,
      baseAttackBonus: 4,
      casterLevel: 0,
      manifesterLevel: 0,
      feats: [{ featId: "power-attack" }],
      skillRanks: { tumble: 5 },
      alignment: "CG",
    });

    expect(result.passed).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it("returns useful failures when prerequisites are not satisfied", () => {
    const result = evaluateDnd35Prerequisite(expression, {
      abilities: { str: 10 },
      characterLevel: 1,
      baseAttackBonus: 0,
      casterLevel: 0,
      manifesterLevel: 0,
      feats: [],
      skillRanks: { tumble: 0 },
      alignment: "LG",
    });

    expect(result.passed).toBe(false);
    expect(result.failures.length).toBe(5);
  });

  it("supports spell-access and custom prerequisite leaves", () => {
    const result = evaluateDnd35Prerequisite(
      {
        version: 1,
        condition: {
          kind: "all",
          conditions: [
            { kind: "spell_level_access", minimum: 3, tradition: "arcane" },
            {
              kind: "custom",
              description: "Must possess the campaign sigil.",
              extension: { key: "endless-codex.campaign-sigil", version: 1, parameters: {} },
            },
          ],
        },
      },
      {
        abilities: {},
        characterLevel: 7,
        baseAttackBonus: 3,
        casterLevel: 7,
        manifesterLevel: 0,
        spellLevelAccess: [{ level: 4, tradition: "arcane", classId: "wizard" }],
        evaluateCustom: (extension) => extension.key === "endless-codex.campaign-sigil",
      },
    );

    expect(result.passed).toBe(true);
  });
});
