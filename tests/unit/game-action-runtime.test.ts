import { describe, expect, it } from "vitest";
import {
  resolveAuthoritativeAttack,
  resolveAuthoritativeSavingThrow,
  resolveAuthoritativeSkillCheck,
} from "@/modules/game/domain/dnd35ActionRuntime";

describe("authoritative D&D game actions", () => {
  it("derives skill results from persisted snapshot values instead of caller bonuses", () => {
    const result = resolveAuthoritativeSkillCheck({
      snapshot: {
        actorId: "hero",
        skillId: "climb",
        ranks: 4,
        abilityModifier: 3,
        armorCheckPenalty: -2,
        trainedOnly: false,
      },
      dc: 15,
      roll: 10,
    });

    expect(result.allowed).toBe(true);
    if (!result.allowed) return;
    expect(result.modifier).toBe(5);
    expect(result.check.total).toBe(15);
    expect(result.check.success).toBe(true);
  });

  it("rejects trained-only skill use without ranks", () => {
    const result = resolveAuthoritativeSkillCheck({
      snapshot: {
        actorId: "hero",
        skillId: "disable-device",
        ranks: 0,
        abilityModifier: 4,
        armorCheckPenalty: 0,
        trainedOnly: true,
      },
      dc: 10,
      roll: 20,
    });

    expect(result).toMatchObject({
      allowed: false,
      code: "DND35_SKILL_TRAINING_REQUIRED",
    });
  });

  it("applies D&D natural-1 and natural-20 save semantics", () => {
    const fail = resolveAuthoritativeSavingThrow({
      snapshot: { actorId: "hero", baseSaveBonus: 12, abilityModifier: 5 },
      save: "fort",
      dc: 5,
      roll: 1,
    });
    const pass = resolveAuthoritativeSavingThrow({
      snapshot: { actorId: "hero", baseSaveBonus: 0, abilityModifier: -3 },
      save: "will",
      dc: 40,
      roll: 20,
    });

    expect(fail.result.passed).toBe(false);
    expect(fail.result.automaticFailure).toBe(true);
    expect(pass.result.passed).toBe(true);
    expect(pass.result.automaticSuccess).toBe(true);
  });

  it("resolves an attack against target AC derived from authoritative defenses", () => {
    const result = resolveAuthoritativeAttack({
      snapshot: {
        attackerId: "fighter",
        targetId: "guard",
        baseAttackBonus: 5,
        attackAbilityModifier: 4,
        attackerSize: "medium",
        targetDexterityModifier: 2,
        targetSize: "medium",
        targetNaturalArmor: 1,
        targetArmorBonus: 4,
        targetShieldBonus: 2,
        targetMaximumDexterityBonus: 3,
        threatMinimum: 19,
      },
      kind: "melee",
      roll: 10,
    });

    expect(result.attackBonus).toBe(9);
    expect(result.armorClass).toBe(19);
    expect(result.attackRoll.total).toBe(19);
    expect(result.attackRoll.hit).toBe(true);
    expect(result.critical.threatened).toBe(false);
  });

  it("confirms a threatened critical using a second attack roll", () => {
    const result = resolveAuthoritativeAttack({
      snapshot: {
        attackerId: "fighter",
        targetId: "guard",
        baseAttackBonus: 6,
        attackAbilityModifier: 4,
        attackerSize: "medium",
        targetDexterityModifier: 0,
        targetSize: "medium",
        targetNaturalArmor: 0,
        targetArmorBonus: 0,
        targetShieldBonus: 0,
        targetMaximumDexterityBonus: null,
        threatMinimum: 19,
      },
      kind: "melee",
      roll: 19,
      confirmationRoll: 12,
    });

    expect(result.attackRoll.criticalThreat).toBe(true);
    expect(result.critical.confirmed).toBe(true);
    expect(result.critical.confirmation?.naturalRoll).toBe(12);
  });
});
