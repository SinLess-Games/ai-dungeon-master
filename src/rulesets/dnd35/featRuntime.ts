import { engineFailure, engineSuccess, type EngineResult } from "@engine/result";
import type { Dnd35Ability, Dnd35Save } from "./types";
import type { Dnd35RuntimeRuleEffect } from "./ruleEffects";

export type FeatChoiceKind = "none" | "skill" | "weapon" | "school" | "spell" | "other";

export interface RuntimeFeatDefinition {
  id: string;
  repeatable: boolean;
  choiceKind: FeatChoiceKind;
}

export interface RuntimeFeatSelection {
  featId: string;
  choice?: string;
}

export type RuntimeFeatBenefit =
  | {
      kind: "ability_bonus";
      ability: Dnd35Ability;
      amount: number;
      bonusType: string;
      whenText?: string | null;
    }
  | {
      kind: "save_bonus";
      save: Dnd35Save;
      amount: number;
      bonusType: string;
      whenText?: string | null;
    }
  | {
      kind: "skill_bonus";
      skillId: string;
      amount: number;
      bonusType: string;
      whenText?: string | null;
    }
  | {
      kind: "stat_bonus";
      stat: string;
      amount: number;
      bonusType: string;
      whenText?: string | null;
    }
  | {
      kind: "effect";
      effect: Dnd35RuntimeRuleEffect;
    };

const KNOWN_STATS = new Set([
  "attack",
  "damage",
  "armor_class",
  "initiative",
  "hit_points",
  "speed",
  "caster_level",
  "manifester_level",
  "skill_points",
  "power_points",
]);

export function validateFeatSelection(input: {
  feat: RuntimeFeatDefinition;
  selection: RuntimeFeatSelection;
  existingSelections?: readonly RuntimeFeatSelection[];
}): EngineResult<RuntimeFeatSelection> {
  if (!input.feat.id.trim()) throw new RangeError("Feat id cannot be empty.");
  if (input.selection.featId !== input.feat.id) {
    return engineFailure("DND35_FEAT_ID_MISMATCH", "Feat selection does not match the feat definition.");
  }

  const choice = input.selection.choice?.trim();
  if (input.feat.choiceKind === "none" && choice) {
    return engineFailure("DND35_FEAT_CHOICE_UNEXPECTED", `${input.feat.id} does not accept a choice.`);
  }
  if (input.feat.choiceKind !== "none" && !choice) {
    return engineFailure(
      "DND35_FEAT_CHOICE_REQUIRED",
      `${input.feat.id} requires a ${input.feat.choiceKind} choice.`,
    );
  }

  const existing = input.existingSelections ?? [];
  if (!input.feat.repeatable && existing.some((selection) => selection.featId === input.feat.id)) {
    return engineFailure("DND35_FEAT_NOT_REPEATABLE", `${input.feat.id} cannot be selected more than once.`);
  }

  return engineSuccess({
    featId: input.selection.featId,
    ...(choice ? { choice } : {}),
  });
}

/** Convert relational feat-benefit rows into the common runtime RuleEffect representation. */
export function featBenefitsToRuleEffects(
  benefits: readonly RuntimeFeatBenefit[],
): readonly Dnd35RuntimeRuleEffect[] {
  return benefits.map((benefit) => {
    if (benefit.kind === "effect") return benefit.effect;
    if (!Number.isFinite(benefit.amount)) throw new RangeError("Feat benefit amount must be finite.");
    if (!benefit.bonusType.trim()) throw new RangeError("Feat benefit bonus type cannot be empty.");
    const conditional = benefit.whenText?.trim();

    if (benefit.kind === "ability_bonus") {
      return {
        kind: "modifier",
        target: { kind: "ability", ability: benefit.ability },
        amount: benefit.amount,
        bonusType: benefit.bonusType,
        ...(conditional ? { when: conditional } : {}),
      };
    }
    if (benefit.kind === "save_bonus") {
      return {
        kind: "modifier",
        target: { kind: "save", save: benefit.save },
        amount: benefit.amount,
        bonusType: benefit.bonusType,
        ...(conditional ? { when: conditional } : {}),
      };
    }
    if (benefit.kind === "skill_bonus") {
      return {
        kind: "modifier",
        target: { kind: "skill", skillId: benefit.skillId },
        amount: benefit.amount,
        bonusType: benefit.bonusType,
        ...(conditional ? { when: conditional } : {}),
      };
    }

    const target = KNOWN_STATS.has(benefit.stat)
      ? {
          kind: "stat" as const,
          stat: benefit.stat as
            | "attack"
            | "damage"
            | "armor_class"
            | "initiative"
            | "hit_points"
            | "speed"
            | "caster_level"
            | "manifester_level"
            | "skill_points"
            | "power_points",
        }
      : { kind: "custom" as const, key: benefit.stat };
    return {
      kind: "modifier",
      target,
      amount: benefit.amount,
      bonusType: benefit.bonusType,
      ...(conditional ? { when: conditional } : {}),
    };
  });
}
