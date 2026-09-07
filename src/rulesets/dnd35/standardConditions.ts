import type { Dnd35ActionKind } from "./actionEconomy";
import type { Dnd35Modifier } from "./modifiers";

export type StandardDnd35Condition =
  | "blinded"
  | "cowering"
  | "dazed"
  | "dazzled"
  | "deafened"
  | "entangled"
  | "exhausted"
  | "fascinated"
  | "fatigued"
  | "flat_footed"
  | "frightened"
  | "helpless"
  | "invisible"
  | "nauseated"
  | "panicked"
  | "paralyzed"
  | "petrified"
  | "pinned"
  | "prone"
  | "shaken"
  | "sickened"
  | "staggered"
  | "stunned"
  | "unconscious";

export interface StandardConditionSemantics {
  id: StandardDnd35Condition;
  noActions?: boolean;
  allowedActions?: readonly Dnd35ActionKind[];
  cannotRunOrCharge?: boolean;
  loseDexterityToArmorClass?: boolean;
  helpless?: boolean;
  immobile?: boolean;
  movementMultiplier?: number;
  strengthAdjustment?: number;
  dexterityAdjustment?: number;
  attackModifier?: number;
  damageModifier?: number;
  armorClassModifier?: number;
  saveModifier?: number;
  skillModifier?: number;
  abilityCheckModifier?: number;
  initiativeModifier?: number;
  spellFailurePercentVerbal?: number;
  notes?: readonly string[];
}

const STANDARD_CONDITION_SEMANTICS: Readonly<Record<StandardDnd35Condition, StandardConditionSemantics>> = {
  blinded: {
    id: "blinded",
    loseDexterityToArmorClass: true,
    attackModifier: -2,
    armorClassModifier: -2,
    movementMultiplier: 0.5,
    notes: ["All opponents have total concealment from the blinded creature."],
  },
  cowering: {
    id: "cowering",
    noActions: true,
    loseDexterityToArmorClass: true,
    armorClassModifier: -2,
  },
  dazed: { id: "dazed", noActions: true },
  dazzled: {
    id: "dazzled",
    attackModifier: -1,
    notes: ["Search and Spot checks take a -1 penalty."],
  },
  deafened: {
    id: "deafened",
    initiativeModifier: -4,
    spellFailurePercentVerbal: 20,
    notes: ["Listen checks automatically fail."],
  },
  entangled: {
    id: "entangled",
    strengthAdjustment: -2,
    dexterityAdjustment: -4,
    attackModifier: -2,
    movementMultiplier: 0.5,
    cannotRunOrCharge: true,
    notes: ["Casting a spell while entangled requires a Concentration check."],
  },
  exhausted: {
    id: "exhausted",
    strengthAdjustment: -6,
    dexterityAdjustment: -6,
    movementMultiplier: 0.5,
    cannotRunOrCharge: true,
  },
  fascinated: {
    id: "fascinated",
    allowedActions: ["free"],
    notes: ["A fascinated creature takes -4 on reactive skill checks such as Spot and Listen."],
  },
  fatigued: {
    id: "fatigued",
    strengthAdjustment: -2,
    dexterityAdjustment: -2,
    cannotRunOrCharge: true,
  },
  flat_footed: { id: "flat_footed", loseDexterityToArmorClass: true },
  frightened: {
    id: "frightened",
    attackModifier: -2,
    saveModifier: -2,
    skillModifier: -2,
    abilityCheckModifier: -2,
    notes: ["The creature must flee from the source of fear if possible."],
  },
  helpless: {
    id: "helpless",
    helpless: true,
    loseDexterityToArmorClass: true,
    notes: ["Dexterity is treated as 0 for Armor Class; melee attacks receive the helpless-target bonus."],
  },
  invisible: {
    id: "invisible",
    notes: ["Attack bonuses, denied Dexterity, and concealment depend on whether the opposing creature can perceive the invisible creature."],
  },
  nauseated: {
    id: "nauseated",
    allowedActions: ["move", "free"],
    notes: ["The creature cannot attack, cast spells, concentrate, or perform other actions requiring attention."],
  },
  panicked: {
    id: "panicked",
    attackModifier: -2,
    saveModifier: -2,
    skillModifier: -2,
    abilityCheckModifier: -2,
    notes: ["The creature must flee at top speed and may drop held items."],
  },
  paralyzed: {
    id: "paralyzed",
    noActions: true,
    helpless: true,
    immobile: true,
    loseDexterityToArmorClass: true,
    notes: ["Strength and Dexterity are effectively 0 while paralyzed."],
  },
  petrified: {
    id: "petrified",
    noActions: true,
    immobile: true,
    notes: ["The creature is transformed to an inert solid state; detailed object damage is handled by the effect that petrified it."],
  },
  pinned: {
    id: "pinned",
    immobile: true,
    loseDexterityToArmorClass: true,
    notes: [
      "Pinned actions are further limited by the grapple rules.",
      "The -4 AC penalty applies against opponents other than the creature doing the pinning and must be resolved contextually.",
    ],
  },
  prone: {
    id: "prone",
    notes: [
      "Use proneCombatModifiers because the attack and Armor Class adjustments depend on melee-versus-ranged context.",
    ],
  },
  shaken: {
    id: "shaken",
    attackModifier: -2,
    saveModifier: -2,
    skillModifier: -2,
    abilityCheckModifier: -2,
  },
  sickened: {
    id: "sickened",
    attackModifier: -2,
    damageModifier: -2,
    saveModifier: -2,
    skillModifier: -2,
    abilityCheckModifier: -2,
  },
  staggered: {
    id: "staggered",
    allowedActions: ["standard", "move", "free", "swift", "immediate"],
    notes: ["A staggered creature may take a single move or standard action each round, not both."],
  },
  stunned: {
    id: "stunned",
    noActions: true,
    loseDexterityToArmorClass: true,
    armorClassModifier: -2,
    notes: ["A stunned creature drops held items."],
  },
  unconscious: {
    id: "unconscious",
    noActions: true,
    helpless: true,
    immobile: true,
    loseDexterityToArmorClass: true,
  },
};

export function standardConditionSemantics(
  condition: StandardDnd35Condition,
): StandardConditionSemantics {
  return STANDARD_CONDITION_SEMANTICS[condition];
}

export function standardConditionModifiers(
  condition: StandardDnd35Condition,
): readonly Dnd35Modifier[] {
  const semantics = standardConditionSemantics(condition);
  const modifiers: Dnd35Modifier[] = [];
  const push = (suffix: string, kind: string, value: number | undefined) => {
    if (value === undefined || value === 0) return;
    modifiers.push({
      id: `condition:${condition}:${suffix}`,
      source: condition,
      kind,
      value,
      stacking: "stack",
    });
  };
  push("attack", "condition", semantics.attackModifier);
  push("damage", "condition", semantics.damageModifier);
  push("armor-class", "condition", semantics.armorClassModifier);
  push("save", "condition", semantics.saveModifier);
  push("skill", "condition", semantics.skillModifier);
  push("ability-check", "condition", semantics.abilityCheckModifier);
  push("initiative", "condition", semantics.initiativeModifier);
  return modifiers;
}

export function conditionAllowsAction(
  condition: StandardDnd35Condition,
  action: Dnd35ActionKind,
): boolean {
  const semantics = standardConditionSemantics(condition);
  if (semantics.noActions) return false;
  if (!semantics.allowedActions) return true;
  return semantics.allowedActions.includes(action);
}
