export const DND35_RULESET_ID = "dnd35" as const;
export const DND35_RULESET_VERSION = "3.5" as const;

export type Dnd35Ability =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";

export type Dnd35Save = "fortitude" | "reflex" | "will";

export type Dnd35Size =
  | "fine"
  | "diminutive"
  | "tiny"
  | "small"
  | "medium"
  | "large"
  | "huge"
  | "gargantuan"
  | "colossal";

/** Matches dnd35_classes.bab_progression in the persistence schema. */
export type BaseAttackProgression = "full" | "three_quarters" | "half" | "custom";
/** Matches the three save-progression columns in dnd35_classes. */
export type SaveProgression = "good" | "poor" | "custom";
export type LoadCategory = "light" | "medium" | "heavy" | "overloaded";

export interface ClassLevelProgression {
  levels: number;
  baseAttack: BaseAttackProgression;
  customBaseAttackBonus?: number;
}

export interface ClassSaveProgression {
  levels: number;
  progression: SaveProgression;
  customBaseSaveBonus?: number;
}
