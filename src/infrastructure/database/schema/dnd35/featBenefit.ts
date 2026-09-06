import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { uuid, enumCheck, nonEmpty, nonNegative, jsonCheck } from "./schemaUtils";
import { feats } from "./feat";
import { abilityKeys, saveKeys, bonusTypes } from "./primitives";
import { skills } from "./skill";
import type { RuleEffect } from "./primitives";

export const featBenefits = sqliteTable(
  "dnd35_feat_benefits",
  {
    id: uuid(),
    featId: text("feat_id")
      .notNull()
      .references(() => feats.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    kind: text("kind", {
      enum: ["ability_bonus", "save_bonus", "skill_bonus", "stat_bonus", "effect"],
    }).notNull(),
    ability: text("ability", { enum: abilityKeys }),
    save: text("save", { enum: saveKeys }),
    skillId: text("skill_id").references(() => skills.id, { onDelete: "restrict" }),
    stat: text("stat"),
    amount: integer("amount"),
    bonusType: text("bonus_type", { enum: bonusTypes }),
    whenText: text("when_text"),
    description: text("description").notNull(),
    effect: text("effect", { mode: "json" }).$type<RuleEffect>(),
  },
  (t) => [
    check(
      "dnd35_feat_benefits_position_integer",
      sql`${t.position} is null or typeof(${t.position}) = 'integer'`,
    ),
    check(
      "dnd35_feat_benefits_amount_integer",
      sql`${t.amount} is null or typeof(${t.amount}) = 'integer'`,
    ),
    index("dnd35_feat_benefits_feat_idx").on(t.featId, t.position),
    nonNegative("dnd35_feat_benefits_position_valid", t.position),
    nonEmpty("dnd35_feat_benefits_description_nonempty", t.description),
    enumCheck("dnd35_feat_benefits_kind_valid", t.kind, [
      "ability_bonus",
      "save_bonus",
      "skill_bonus",
      "stat_bonus",
      "effect",
    ]),
    enumCheck("dnd35_feat_benefits_ability_valid", t.ability, abilityKeys),
    enumCheck("dnd35_feat_benefits_save_valid", t.save, saveKeys),
    enumCheck("dnd35_feat_benefits_bonus_valid", t.bonusType, bonusTypes),
    jsonCheck("dnd35_feat_benefits_effect_json", t.effect),
    check(
      "dnd35_feat_benefits_payload_valid",
      sql`
 (${t.kind} = 'effect' and ${t.effect} is not null and ${t.amount} is null and ${t.bonusType} is null and ${t.ability} is null and ${t.save} is null and ${t.skillId} is null and ${t.stat} is null)
 or (${t.kind} != 'effect' and ${t.effect} is null and ${t.amount} is not null and ${t.bonusType} is not null and (
 (${t.kind} = 'ability_bonus' and ${t.ability} is not null and ${t.save} is null and ${t.skillId} is null and ${t.stat} is null) or
 (${t.kind} = 'save_bonus' and ${t.save} is not null and ${t.ability} is null and ${t.skillId} is null and ${t.stat} is null) or
 (${t.kind} = 'skill_bonus' and ${t.skillId} is not null and ${t.ability} is null and ${t.save} is null and ${t.stat} is null) or
 (${t.kind} = 'stat_bonus' and ${t.stat} is not null and length(trim(${t.stat})) > 0 and ${t.ability} is null and ${t.save} is null and ${t.skillId} is null)))`,
    ),
  ],
);
export type FeatBenefit = typeof featBenefits.$inferSelect;
export type NewFeatBenefit = typeof featBenefits.$inferInsert;
