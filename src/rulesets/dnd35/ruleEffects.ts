import type { Dnd35Ability, Dnd35Save } from "./types";
import type { Dnd35Modifier } from "./modifiers";

export type Dnd35ModifierTarget =
  | { kind: "ability"; ability: Dnd35Ability }
  | { kind: "save"; save: Dnd35Save }
  | { kind: "skill"; skillId: string; specialization?: string }
  | {
      kind: "stat";
      stat:
        | "attack"
        | "damage"
        | "armor_class"
        | "initiative"
        | "hit_points"
        | "speed"
        | "caster_level"
        | "manifester_level"
        | "skill_points"
        | "power_points";
    }
  | { kind: "custom"; key: string };

export type Dnd35RuntimeRuleEffect =
  | {
      kind: "modifier";
      target: Dnd35ModifierTarget;
      amount: number;
      bonusType: string;
      when?: string;
    }
  | {
      kind: "grant";
      entity: "feat" | "special_ability" | "spell" | "power" | "language" | "class_skill";
      id: string;
    }
  | { kind: "resistance"; damageType: string; amount: number }
  | { kind: "immunity"; subject: string }
  | { kind: "custom"; extension: { key: string; version: number; parameters: Record<string, unknown> } };

export interface RuleEffectSource {
  id: string;
  name?: string;
}

function targetKey(target: Dnd35ModifierTarget): string {
  switch (target.kind) {
    case "ability":
      return `ability:${target.ability}`;
    case "save":
      return `save:${target.save}`;
    case "skill":
      return `skill:${target.skillId}:${target.specialization ?? ""}`;
    case "stat":
      return `stat:${target.stat}`;
    case "custom":
      return `custom:${target.key}`;
  }
}

export function sameModifierTarget(left: Dnd35ModifierTarget, right: Dnd35ModifierTarget): boolean {
  return targetKey(left) === targetKey(right);
}

/**
 * Convert persisted/content modifier effects into runtime modifiers for one
 * requested target. Conditional effects are included only when the caller's
 * predicate says their `when` expression currently applies.
 */
export function modifiersFromRuleEffects(
  effects: readonly Dnd35RuntimeRuleEffect[],
  target: Dnd35ModifierTarget,
  source: RuleEffectSource,
  options: { evaluateWhen?: (expression: string) => boolean } = {},
): readonly Dnd35Modifier[] {
  if (!source.id.trim()) throw new RangeError("Rule effect source id cannot be empty.");

  const modifiers: Dnd35Modifier[] = [];
  effects.forEach((effect, index) => {
    if (effect.kind !== "modifier" || !sameModifierTarget(effect.target, target)) return;
    if (!Number.isFinite(effect.amount)) {
      throw new RangeError(`Rule effect modifier ${index} amount must be finite.`);
    }
    if (!effect.bonusType.trim()) {
      throw new RangeError(`Rule effect modifier ${index} bonus type cannot be empty.`);
    }
    if (effect.when !== undefined && !options.evaluateWhen?.(effect.when)) return;

    modifiers.push({
      id: `${source.id}:modifier:${index}:${targetKey(target)}`,
      source: source.name?.trim() || source.id,
      kind: effect.bonusType,
      value: effect.amount,
    });
  });

  return modifiers;
}

export function grantsFromRuleEffects(effects: readonly Dnd35RuntimeRuleEffect[]) {
  return effects.filter((effect): effect is Extract<Dnd35RuntimeRuleEffect, { kind: "grant" }> => effect.kind === "grant");
}

export function resistancesFromRuleEffects(effects: readonly Dnd35RuntimeRuleEffect[]) {
  return effects.filter(
    (effect): effect is Extract<Dnd35RuntimeRuleEffect, { kind: "resistance" }> =>
      effect.kind === "resistance",
  );
}

export function immunitiesFromRuleEffects(effects: readonly Dnd35RuntimeRuleEffect[]) {
  return effects.filter(
    (effect): effect is Extract<Dnd35RuntimeRuleEffect, { kind: "immunity" }> => effect.kind === "immunity",
  );
}
