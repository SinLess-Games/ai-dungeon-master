import { sql } from "drizzle-orm";
import {
  check,
  integer,
  real,
  sqliteTable,
  text,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { enumCheck, nonNegative, jsonCheck } from "./schemaUtils";
import { contentColumns, contentChecks } from "./contentReference";
import { creatureTypes } from "./creatureType";
import { creatureSubtypes } from "./creatureSubtype";
import { specialAbilities } from "./specialAbility";
import { monsters } from "./monster";
import { abilityKeys } from "./primitives";
import type { Size, RuleEffect, RuleExtension, GrantParameters } from "./primitives";
import type { PrerequisiteExpression } from "./prerequisite";

export const templates = sqliteTable(
  "dnd35_templates",
  {
    ...contentColumns(),
    resultCreatureTypeId: text("result_creature_type_id").references(() => creatureTypes.id, {
      onDelete: "restrict",
    }),
    kind: text("kind", { enum: ["inherited", "acquired", "either"] }).notNull(),
    challengeRatingAdjustment: real("challenge_rating_adjustment"),
    levelAdjustment: integer("level_adjustment"),
    naturalArmorAdjustment: integer("natural_armor_adjustment").notNull().default(0),
    /** Conditional CR/HD/type changes remain ordered typed transformations. */
    transformations: text("transformations", { mode: "json" }).$type<TemplateTransformation[]>(),
    applicability: text("applicability", { mode: "json" }).$type<PrerequisiteExpression>(),
  },
  (t) => [
    check(
      "dnd35_templates_level_adjustment_integer",
      sql`${t.levelAdjustment} is null or typeof(${t.levelAdjustment}) = 'integer'`,
    ),
    check(
      "dnd35_templates_natural_armor_adjustment_integer",
      sql`${t.naturalArmorAdjustment} is null or typeof(${t.naturalArmorAdjustment}) = 'integer'`,
    ),
    ...contentChecks("dnd35_templates", t),
    enumCheck("dnd35_templates_kind_valid", t.kind, ["inherited", "acquired", "either"]),
    nonNegative("dnd35_templates_la_valid", t.levelAdjustment),
    jsonCheck("dnd35_templates_transformations_json", t.transformations, "array"),
    jsonCheck("dnd35_templates_applicability_json", t.applicability),
  ],
);
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type TemplateTransformation =
  | { kind: "effect"; effect: RuleEffect }
  | { kind: "size"; size: Size }
  | { kind: "hit_die"; sides: number }
  | { kind: "conditional"; when: PrerequisiteExpression; changes: TemplateTransformation[] }
  | { kind: "custom"; extension: RuleExtension };
export const templateAbilityModifiers = sqliteTable(
  "dnd35_template_ability_modifiers",
  {
    templateId: text("template_id")
      .notNull()
      .references(() => templates.id, { onDelete: "cascade" }),
    ability: text("ability", { enum: abilityKeys }).notNull(),
    modifier: integer("modifier").notNull(),
  },
  (t) => [
    check(
      "dnd35_template_ability_modifiers_modifier_integer",
      sql`${t.modifier} is null or typeof(${t.modifier}) = 'integer'`,
    ),
    primaryKey({ columns: [t.templateId, t.ability] }),
    enumCheck("dnd35_template_abilities_key_valid", t.ability, abilityKeys),
  ],
);
export type TemplateAbilityModifier = typeof templateAbilityModifiers.$inferSelect;
export type NewTemplateAbilityModifier = typeof templateAbilityModifiers.$inferInsert;
export const templateAbilities = sqliteTable(
  "dnd35_template_abilities",
  {
    templateId: text("template_id")
      .notNull()
      .references(() => templates.id, { onDelete: "cascade" }),
    specialAbilityId: text("special_ability_id")
      .notNull()
      .references(() => specialAbilities.id, { onDelete: "restrict" }),
    parameters: text("parameters", { mode: "json" }).$type<GrantParameters>(),
  },
  (t) => [
    primaryKey({ columns: [t.templateId, t.specialAbilityId] }),
    jsonCheck("dnd35_template_abilities_parameters_json", t.parameters),
  ],
);
export type TemplateAbility = typeof templateAbilities.$inferSelect;
export type NewTemplateAbility = typeof templateAbilities.$inferInsert;
export const templateSubtypes = sqliteTable(
  "dnd35_template_subtypes",
  {
    templateId: text("template_id")
      .notNull()
      .references(() => templates.id, { onDelete: "cascade" }),
    subtypeId: text("subtype_id")
      .notNull()
      .references(() => creatureSubtypes.id, { onDelete: "restrict" }),
    operation: text("operation", { enum: ["add", "remove"] })
      .notNull()
      .default("add"),
  },
  (t) => [
    primaryKey({ columns: [t.templateId, t.subtypeId] }),
    enumCheck("dnd35_template_subtypes_operation_valid", t.operation, ["add", "remove"]),
  ],
);
export type TemplateSubtype = typeof templateSubtypes.$inferSelect;
export type NewTemplateSubtype = typeof templateSubtypes.$inferInsert;
export const monsterTemplates = sqliteTable(
  "dnd35_monster_templates",
  {
    monsterId: text("monster_id")
      .notNull()
      .references(() => monsters.id, { onDelete: "cascade" }),
    templateId: text("template_id")
      .notNull()
      .references(() => templates.id, { onDelete: "restrict" }),
    applicationOrder: integer("application_order").notNull(),
  },
  (t) => [
    check(
      "dnd35_monster_templates_application_order_integer",
      sql`${t.applicationOrder} is null or typeof(${t.applicationOrder}) = 'integer'`,
    ),
    primaryKey({ columns: [t.monsterId, t.templateId] }),
    uniqueIndex("dnd35_monster_templates_order_uq").on(t.monsterId, t.applicationOrder),
    nonNegative("dnd35_monster_templates_order_valid", t.applicationOrder),
  ],
);
export type MonsterTemplate = typeof monsterTemplates.$inferSelect;
export type NewMonsterTemplate = typeof monsterTemplates.$inferInsert;
