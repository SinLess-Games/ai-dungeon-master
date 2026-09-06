/** Stable D&D 3.5 primitives. No lookup rows or rules evaluation are needed. */
export const abilityKeys = ["str", "dex", "con", "int", "wis", "cha"] as const;
export type AbilityKey = (typeof abilityKeys)[number];
export const saveKeys = ["fort", "ref", "will"] as const;
export type SaveKey = (typeof saveKeys)[number];
export const sizes = [
  "fine",
  "diminutive",
  "tiny",
  "small",
  "medium",
  "large",
  "huge",
  "gargantuan",
  "colossal",
] as const;
export type Size = (typeof sizes)[number];
export const alignments = ["LG", "NG", "CG", "LN", "N", "CN", "LE", "NE", "CE"] as const;
export type Alignment = (typeof alignments)[number];
export const actionTypes = [
  "standard",
  "move",
  "full_round",
  "free",
  "swift",
  "immediate",
  "none",
  "other",
] as const;
export type ActionType = (typeof actionTypes)[number];
export const damageTypes = [
  "bludgeoning",
  "piercing",
  "slashing",
  "acid",
  "cold",
  "electricity",
  "fire",
  "sonic",
  "force",
  "positive_energy",
  "negative_energy",
  "untyped",
] as const;
export type DamageType = (typeof damageTypes)[number];
export const movementModes = ["land", "climb", "swim", "fly", "burrow", "glide", "other"] as const;
export const maneuverabilities = ["clumsy", "poor", "average", "good", "perfect"] as const;
export const equipmentSlots = [
  "head",
  "face",
  "throat",
  "shoulders",
  "body",
  "torso",
  "waist",
  "arms",
  "hands",
  "feet",
  "ring_left",
  "ring_right",
  "main_hand",
  "off_hand",
  "both_hands",
  "shield",
  "slotless",
  "other",
] as const;
export type EquipmentSlot = (typeof equipmentSlots)[number];
export const abilityCategories = [
  "extraordinary",
  "supernatural",
  "spell_like",
  "psi_like",
  "natural",
  "other",
] as const;
export const bonusTypes = [
  "alchemical",
  "armor",
  "circumstance",
  "competence",
  "deflection",
  "dodge",
  "enhancement",
  "inherent",
  "insight",
  "luck",
  "morale",
  "natural_armor",
  "profane",
  "racial",
  "resistance",
  "sacred",
  "shield",
  "size",
  "untyped",
  "other",
] as const;
export type BonusType = (typeof bonusTypes)[number];
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
/** Namespaced, versioned escape hatch for rules that need plugin-specific interpretation. */
export interface RuleExtension {
  key: string;
  version: number;
  parameters: Record<string, JsonValue>;
}
export interface RuleChoice {
  key: string;
  contentId?: string;
  text?: string;
  value?: number;
}
export type ModifierTarget =
  | { kind: "ability"; ability: AbilityKey }
  | { kind: "save"; save: SaveKey }
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
export type RuleEffect =
  | {
      kind: "modifier";
      target: ModifierTarget;
      amount: number;
      bonusType: BonusType;
      when?: string;
    }
  | {
      kind: "grant";
      entity: "feat" | "special_ability" | "spell" | "power" | "language" | "class_skill";
      id: string;
      choices?: RuleChoice[];
    }
  | { kind: "resistance"; damageType: DamageType; amount: number }
  | { kind: "immunity"; subject: string }
  | { kind: "custom"; extension: RuleExtension };
/** Irregular scaling and choices are small payloads, never whole content records. */
export interface GrantParameters {
  rank?: number;
  dice?: string;
  uses?: number;
  period?: "round" | "encounter" | "day" | "week" | "at_will";
  choices?: RuleChoice[];
  extension?: RuleExtension;
}
