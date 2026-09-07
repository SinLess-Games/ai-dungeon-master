import {
  calculateAttackBonus,
  calculateArmorClass,
  calculateSkillModifier,
  resolveAttackRoll,
  resolveCriticalConfirmation,
  resolveSavingThrow,
  resolveSkillCheck,
  type Dnd35Size,
} from "@/rulesets/dnd35";

export type Dnd35SaveKind = "fort" | "ref" | "will";
export type Dnd35AttackKind = "melee" | "ranged";

export interface Dnd35SkillActionSnapshot {
  actorId: string;
  skillId: string;
  ranks: number;
  abilityModifier: number;
  armorCheckPenalty: number;
  trainedOnly: boolean;
  miscModifier?: number;
}

export interface Dnd35SaveActionSnapshot {
  actorId: string;
  baseSaveBonus: number;
  abilityModifier: number;
  miscModifier?: number;
}

export interface Dnd35AttackActionSnapshot {
  attackerId: string;
  targetId: string;
  baseAttackBonus: number;
  attackAbilityModifier: number;
  attackerSize: Dnd35Size;
  targetDexterityModifier: number;
  targetSize: Dnd35Size;
  targetNaturalArmor: number;
  targetArmorBonus: number;
  targetShieldBonus: number;
  targetMaximumDexterityBonus: number | null;
  attackMiscModifier?: number;
  targetMiscArmorClassModifier?: number;
  threatMinimum?: number;
}

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite.`);
}

export function resolveAuthoritativeSkillCheck(input: {
  snapshot: Dnd35SkillActionSnapshot;
  dc: number;
  roll?: number;
}) {
  assertFinite(input.dc, "Skill DC");
  if (input.snapshot.trainedOnly && input.snapshot.ranks <= 0) {
    return {
      allowed: false as const,
      code: "DND35_SKILL_TRAINING_REQUIRED",
      message: `Skill ${input.snapshot.skillId} cannot be used untrained.`,
    };
  }

  const modifier = calculateSkillModifier({
    ranks: input.snapshot.ranks,
    abilityModifier: input.snapshot.abilityModifier,
    armorCheckPenalty: input.snapshot.armorCheckPenalty,
    ...(input.snapshot.miscModifier === undefined
      ? {}
      : {
          modifiers: [
            {
              id: "game:skill:misc",
              source: "Game context",
              kind: "untyped",
              value: input.snapshot.miscModifier,
            },
          ],
        }),
  });
  const check = resolveSkillCheck({
    bonus: modifier.total,
    dc: input.dc,
    ...(input.roll === undefined ? {} : { roll: input.roll }),
  });

  return {
    allowed: true as const,
    actorId: input.snapshot.actorId,
    skillId: input.snapshot.skillId,
    modifier: modifier.total,
    check,
  };
}

export function resolveAuthoritativeSavingThrow(input: {
  snapshot: Dnd35SaveActionSnapshot;
  save: Dnd35SaveKind;
  dc: number;
  roll?: number;
}) {
  assertFinite(input.dc, "Save DC");
  const bonus =
    input.snapshot.baseSaveBonus +
    input.snapshot.abilityModifier +
    (input.snapshot.miscModifier ?? 0);
  const result = resolveSavingThrow({
    saveBonus: bonus,
    dc: input.dc,
    ...(input.roll === undefined ? {} : { roll: input.roll }),
  });

  return {
    actorId: input.snapshot.actorId,
    save: input.save,
    bonus,
    result,
  };
}

export function resolveAuthoritativeAttack(input: {
  snapshot: Dnd35AttackActionSnapshot;
  kind: Dnd35AttackKind;
  roll?: number;
  confirmationRoll?: number;
}) {
  const attack = calculateAttackBonus({
    baseAttackBonus: input.snapshot.baseAttackBonus,
    abilityModifier: input.snapshot.attackAbilityModifier,
    size: input.snapshot.attackerSize,
    ...(input.snapshot.attackMiscModifier === undefined
      ? {}
      : {
          modifiers: [
            {
              id: "game:attack:misc",
              source: "Game context",
              kind: "untyped",
              value: input.snapshot.attackMiscModifier,
            },
          ],
        }),
  });

  const armorClassModifiers = [
    ...(input.snapshot.targetArmorBonus === 0
      ? []
      : [
          {
            id: "game:target:armor",
            source: "Equipped armor",
            kind: "armor" as const,
            value: input.snapshot.targetArmorBonus,
          },
        ]),
    ...(input.snapshot.targetShieldBonus === 0
      ? []
      : [
          {
            id: "game:target:shield",
            source: "Equipped shield",
            kind: "shield" as const,
            value: input.snapshot.targetShieldBonus,
          },
        ]),
    ...(input.snapshot.targetNaturalArmor === 0
      ? []
      : [
          {
            id: "game:target:natural-armor",
            source: "Natural armor",
            kind: "natural-armor" as const,
            value: input.snapshot.targetNaturalArmor,
          },
        ]),
    ...(input.snapshot.targetMiscArmorClassModifier === undefined
      ? []
      : [
          {
            id: "game:target:misc-ac",
            source: "Game context",
            kind: "untyped" as const,
            value: input.snapshot.targetMiscArmorClassModifier,
          },
        ]),
  ];

  const armorClass = calculateArmorClass({
    dexterityModifier: input.snapshot.targetDexterityModifier,
    size: input.snapshot.targetSize,
    modifiers: armorClassModifiers,
    maxDexterityBonus: input.snapshot.targetMaximumDexterityBonus,
  });

  const attackRoll = resolveAttackRoll({
    attackBonus: attack.total,
    armorClass: armorClass.normal,
    threatMinimum: input.snapshot.threatMinimum ?? 20,
    ...(input.roll === undefined ? {} : { roll: input.roll }),
  });
  const critical = resolveCriticalConfirmation({
    threat: attackRoll,
    attackBonus: attack.total,
    armorClass: armorClass.normal,
    ...(input.confirmationRoll === undefined ? {} : { confirmationRoll: input.confirmationRoll }),
  });

  return {
    attackerId: input.snapshot.attackerId,
    targetId: input.snapshot.targetId,
    kind: input.kind,
    attackBonus: attack.total,
    armorClass: armorClass.normal,
    attackRoll,
    critical,
  };
}
