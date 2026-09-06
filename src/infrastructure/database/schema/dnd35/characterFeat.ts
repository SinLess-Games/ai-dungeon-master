import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { uuid, timestamps, enumCheck, positive, jsonCheck } from "./schemaUtils";
import { dnd35Characters } from "./character";
import { feats } from "./feat";
import { classFeatures } from "./classFeature";
import { raceTraits } from "./raceTrait";
import type { RuleChoice } from "./primitives";

export const characterFeats = sqliteTable(
  "dnd35_character_feats",
  {
    id: uuid(),
    characterId: text("character_id")
      .notNull()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    featId: text("feat_id")
      .notNull()
      .references(() => feats.id, { onDelete: "restrict" }),
    /** Repeats are allowed here; feat-specific repeatability is evaluated by the engine. */
    occurrence: integer("occurrence").notNull().default(1),
    gainedAtLevel: integer("gained_at_level"),
    grantKind: text("grant_kind", {
      enum: ["level", "class", "race", "item", "dm", "other"],
    }).notNull(),
    classFeatureId: text("class_feature_id").references(() => classFeatures.id, {
      onDelete: "restrict",
    }),
    raceTraitId: text("race_trait_id").references(() => raceTraits.id, { onDelete: "restrict" }),
    grantNote: text("grant_note"),
    choices: text("choices", { mode: "json" }).$type<RuleChoice[]>(),
    ...timestamps(),
  },
  (t) => [
    check(
      "dnd35_character_feats_occurrence_integer",
      sql`${t.occurrence} is null or typeof(${t.occurrence}) = 'integer'`,
    ),
    check(
      "dnd35_character_feats_gained_at_level_integer",
      sql`${t.gainedAtLevel} is null or typeof(${t.gainedAtLevel}) = 'integer'`,
    ),
    uniqueIndex("dnd35_character_feats_occurrence_uq").on(t.characterId, t.featId, t.occurrence),
    index("dnd35_character_feats_feat_idx").on(t.featId),
    positive("dnd35_character_feats_occurrence_valid", t.occurrence),
    positive("dnd35_character_feats_level_valid", t.gainedAtLevel),
    enumCheck("dnd35_character_feats_grant_valid", t.grantKind, [
      "level",
      "class",
      "race",
      "item",
      "dm",
      "other",
    ]),
    jsonCheck("dnd35_character_feats_choices_json", t.choices, "array"),
  ],
);
export type CharacterFeat = typeof characterFeats.$inferSelect;
export type NewCharacterFeat = typeof characterFeats.$inferInsert;
