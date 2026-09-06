import type { AbilityKey, Alignment, RuleExtension, SaveKey } from "./primitives";
/** An expression tree permits nested AND/OR/NOT without parsing prose. IDs inside
 * JSON are resolved by the ruleset boundary, not foreign keys or schema code. */
export type PrerequisiteCondition =
  | { kind: "all" | "any"; conditions: PrerequisiteCondition[] }
  | { kind: "not"; condition: PrerequisiteCondition }
  | { kind: "ability"; ability: AbilityKey; minimum: number }
  | {
      kind: "character_level" | "base_attack_bonus" | "caster_level" | "manifester_level";
      minimum: number;
      classId?: string;
    }
  | { kind: "class_level"; classId: string; minimum: number }
  | { kind: "save"; save: SaveKey; minimum: number }
  | { kind: "feat"; featId: string; choice?: string }
  | { kind: "skill_ranks"; skillId: string; minimum: number; specialization?: string }
  | {
      kind: "spell_level_access";
      minimum: number;
      tradition?: "arcane" | "divine" | "psionic" | "other";
      classId?: string;
    }
  | { kind: "race"; raceId: string }
  | { kind: "creature_type"; creatureTypeId: string }
  | { kind: "alignment"; allowed: Alignment[] }
  | { kind: "class_feature"; classFeatureId: string; minimumRank?: number }
  | { kind: "special_ability"; specialAbilityId: string }
  | { kind: "custom"; description: string; extension: RuleExtension };
export interface PrerequisiteExpression {
  version: 1;
  condition: PrerequisiteCondition;
}
