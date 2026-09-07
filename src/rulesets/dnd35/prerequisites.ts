import {
  evaluatePrerequisite,
  type Prerequisite,
  type PrerequisiteContext,
  type PrerequisiteEvaluation,
} from "@engine/prerequisites";
import type { Dnd35Ability, Dnd35Save } from "./types";

export type Dnd35Alignment = "LG" | "NG" | "CG" | "LN" | "N" | "CN" | "LE" | "NE" | "CE";

export interface Dnd35RuleExtension {
  key: string;
  version: number;
  parameters: Record<string, unknown>;
}

export type Dnd35PrerequisiteCondition =
  | { kind: "all" | "any"; conditions: Dnd35PrerequisiteCondition[] }
  | { kind: "not"; condition: Dnd35PrerequisiteCondition }
  | { kind: "ability"; ability: Dnd35Ability; minimum: number }
  | {
      kind: "character_level" | "base_attack_bonus" | "caster_level" | "manifester_level";
      minimum: number;
      classId?: string;
    }
  | { kind: "class_level"; classId: string; minimum: number }
  | { kind: "save"; save: Dnd35Save; minimum: number }
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
  | { kind: "alignment"; allowed: Dnd35Alignment[] }
  | { kind: "class_feature"; classFeatureId: string; minimumRank?: number }
  | { kind: "special_ability"; specialAbilityId: string }
  | { kind: "custom"; description: string; extension: Dnd35RuleExtension };

export interface Dnd35PrerequisiteExpression {
  version: 1;
  condition: Dnd35PrerequisiteCondition;
}

export interface SpellLevelAccessFact {
  level: number;
  tradition?: "arcane" | "divine" | "psionic" | "other";
  classId?: string;
}

export interface Dnd35PrerequisiteFacts {
  abilities: Partial<Record<Dnd35Ability, number>>;
  characterLevel: number;
  baseAttackBonus: number;
  casterLevel: number;
  manifesterLevel: number;
  classLevels?: Readonly<Record<string, number>>;
  classBaseAttackBonuses?: Readonly<Record<string, number>>;
  classCasterLevels?: Readonly<Record<string, number>>;
  classManifesterLevels?: Readonly<Record<string, number>>;
  saves?: Partial<Record<Dnd35Save, number>>;
  feats?: readonly { featId: string; choice?: string }[];
  skillRanks?: Readonly<Record<string, number>>;
  spellLevelAccess?: readonly SpellLevelAccessFact[];
  raceId?: string;
  creatureTypeId?: string;
  alignment?: Dnd35Alignment;
  classFeatures?: Readonly<Record<string, number>>;
  specialAbilityIds?: readonly string[];
  evaluateCustom?: (extension: Dnd35RuleExtension, description: string) => boolean;
}

function minimumFact(key: string, minimum: number, message: string): Prerequisite {
  return {
    kind: "fact",
    key,
    operator: "greater-than-or-equal",
    value: minimum,
    message,
  };
}

function scopedKey(kind: string, classId: string | undefined): string {
  return classId ? `${kind}:class:${classId}` : kind;
}

function skillKey(skillId: string, specialization?: string): string {
  return specialization ? `skill:${skillId}:${specialization}` : `skill:${skillId}`;
}

export function toEnginePrerequisite(condition: Dnd35PrerequisiteCondition): Prerequisite {
  switch (condition.kind) {
    case "all":
      return { kind: "all", requirements: condition.conditions.map(toEnginePrerequisite) };
    case "any":
      return { kind: "any", requirements: condition.conditions.map(toEnginePrerequisite) };
    case "not":
      return { kind: "not", requirement: toEnginePrerequisite(condition.condition) };
    case "ability":
      return minimumFact(
        `ability:${condition.ability}`,
        condition.minimum,
        `${condition.ability.toUpperCase()} must be at least ${condition.minimum}.`,
      );
    case "character_level":
      return minimumFact(
        scopedKey("character_level", condition.classId),
        condition.minimum,
        `Character level must be at least ${condition.minimum}.`,
      );
    case "base_attack_bonus":
      return minimumFact(
        scopedKey("base_attack_bonus", condition.classId),
        condition.minimum,
        `Base attack bonus must be at least +${condition.minimum}.`,
      );
    case "caster_level":
      return minimumFact(
        scopedKey("caster_level", condition.classId),
        condition.minimum,
        `Caster level must be at least ${condition.minimum}.`,
      );
    case "manifester_level":
      return minimumFact(
        scopedKey("manifester_level", condition.classId),
        condition.minimum,
        `Manifester level must be at least ${condition.minimum}.`,
      );
    case "class_level":
      return minimumFact(
        `class_level:${condition.classId}`,
        condition.minimum,
        `Class ${condition.classId} must be at least level ${condition.minimum}.`,
      );
    case "save":
      return minimumFact(
        `save:${condition.save}`,
        condition.minimum,
        `${condition.save.toUpperCase()} save must be at least +${condition.minimum}.`,
      );
    case "feat":
      return {
        kind: "predicate",
        id: "dnd35.feat",
        args: {
          featId: condition.featId,
          ...(condition.choice === undefined ? {} : { choice: condition.choice }),
        },
        message: `Required feat is missing: ${condition.featId}.`,
      };
    case "skill_ranks":
      return minimumFact(
        skillKey(condition.skillId, condition.specialization),
        condition.minimum,
        `${condition.skillId} requires at least ${condition.minimum} ranks.`,
      );
    case "spell_level_access":
      return {
        kind: "predicate",
        id: "dnd35.spell_level_access",
        args: {
          minimum: condition.minimum,
          ...(condition.tradition === undefined ? {} : { tradition: condition.tradition }),
          ...(condition.classId === undefined ? {} : { classId: condition.classId }),
        },
        message: `Spell-level access of ${condition.minimum} or higher is required.`,
      };
    case "race":
      return {
        kind: "fact",
        key: "race",
        operator: "equals",
        value: condition.raceId,
        message: `Race ${condition.raceId} is required.`,
      };
    case "creature_type":
      return {
        kind: "fact",
        key: "creature_type",
        operator: "equals",
        value: condition.creatureTypeId,
        message: `Creature type ${condition.creatureTypeId} is required.`,
      };
    case "alignment":
      return {
        kind: "predicate",
        id: "dnd35.alignment",
        args: { allowed: condition.allowed },
        message: `Alignment must be one of: ${condition.allowed.join(", ")}.`,
      };
    case "class_feature":
      return minimumFact(
        `class_feature:${condition.classFeatureId}`,
        condition.minimumRank ?? 1,
        `Class feature ${condition.classFeatureId} is required.`,
      );
    case "special_ability":
      return {
        kind: "predicate",
        id: "dnd35.special_ability",
        args: { specialAbilityId: condition.specialAbilityId },
        message: `Special ability ${condition.specialAbilityId} is required.`,
      };
    case "custom":
      return {
        kind: "predicate",
        id: "dnd35.custom",
        args: {
          description: condition.description,
          extension: condition.extension,
        },
        message: condition.description,
      };
  }
}

function factValue(key: string, facts: Dnd35PrerequisiteFacts): unknown {
  if (key.startsWith("ability:")) return facts.abilities[key.slice("ability:".length) as Dnd35Ability];
  if (key === "character_level") return facts.characterLevel;
  if (key === "base_attack_bonus") return facts.baseAttackBonus;
  if (key === "caster_level") return facts.casterLevel;
  if (key === "manifester_level") return facts.manifesterLevel;
  if (key.startsWith("character_level:class:")) return facts.classLevels?.[key.slice("character_level:class:".length)];
  if (key.startsWith("base_attack_bonus:class:")) return facts.classBaseAttackBonuses?.[key.slice("base_attack_bonus:class:".length)];
  if (key.startsWith("caster_level:class:")) return facts.classCasterLevels?.[key.slice("caster_level:class:".length)];
  if (key.startsWith("manifester_level:class:")) return facts.classManifesterLevels?.[key.slice("manifester_level:class:".length)];
  if (key.startsWith("class_level:")) return facts.classLevels?.[key.slice("class_level:".length)];
  if (key.startsWith("save:")) return facts.saves?.[key.slice("save:".length) as Dnd35Save];
  if (key.startsWith("skill:")) return facts.skillRanks?.[key.slice("skill:".length)];
  if (key === "race") return facts.raceId;
  if (key === "creature_type") return facts.creatureTypeId;
  if (key.startsWith("class_feature:")) return facts.classFeatures?.[key.slice("class_feature:".length)];
  return undefined;
}

function evaluatePredicate(
  id: string,
  args: Readonly<Record<string, unknown>> | undefined,
  facts: Dnd35PrerequisiteFacts,
): boolean {
  if (id === "dnd35.feat") {
    const featId = args?.["featId"];
    const choice = args?.["choice"];
    if (typeof featId !== "string") return false;
    return (facts.feats ?? []).some(
      (feat) => feat.featId === featId && (choice === undefined || feat.choice === choice),
    );
  }

  if (id === "dnd35.spell_level_access") {
    const minimum = args?.["minimum"];
    const tradition = args?.["tradition"];
    const classId = args?.["classId"];
    if (typeof minimum !== "number") return false;
    return (facts.spellLevelAccess ?? []).some(
      (access) =>
        access.level >= minimum &&
        (tradition === undefined || access.tradition === tradition) &&
        (classId === undefined || access.classId === classId),
    );
  }

  if (id === "dnd35.alignment") {
    const allowed = args?.["allowed"];
    return Array.isArray(allowed) && facts.alignment !== undefined && allowed.includes(facts.alignment);
  }

  if (id === "dnd35.special_ability") {
    const specialAbilityId = args?.["specialAbilityId"];
    return typeof specialAbilityId === "string" && (facts.specialAbilityIds ?? []).includes(specialAbilityId);
  }

  if (id === "dnd35.custom") {
    const extension = args?.["extension"];
    const description = args?.["description"];
    if (!facts.evaluateCustom || typeof description !== "string" || typeof extension !== "object" || extension === null) {
      return false;
    }
    return facts.evaluateCustom(extension as unknown as Dnd35RuleExtension, description);
  }

  return false;
}

export function createDnd35PrerequisiteContext(facts: Dnd35PrerequisiteFacts): PrerequisiteContext {
  return {
    getFact: (key) => factValue(key, facts),
    evaluatePredicate: (id, args) => evaluatePredicate(id, args, facts),
  };
}

export function evaluateDnd35Prerequisite(
  expression: Dnd35PrerequisiteExpression,
  facts: Dnd35PrerequisiteFacts,
): PrerequisiteEvaluation {
  if (expression.version !== 1) throw new RangeError(`Unsupported D&D prerequisite version: ${expression.version}.`);
  return evaluatePrerequisite(toEnginePrerequisite(expression.condition), createDnd35PrerequisiteContext(facts));
}
