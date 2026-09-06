import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { uuid, positive, booleanCheck, jsonCheck } from "./schemaUtils";
import { monsters } from "./monster";
import { feats } from "./feat";
import type { RuleChoice } from "./primitives";

export const monsterFeats = sqliteTable(
  "dnd35_monster_feats",
  {
    id: uuid(),
    monsterId: text("monster_id")
      .notNull()
      .references(() => monsters.id, { onDelete: "cascade" }),
    featId: text("feat_id")
      .notNull()
      .references(() => feats.id, { onDelete: "restrict" }),
    /** Repeated feats are separate occurrences, including repeats of the same choice. */
    occurrence: integer("occurrence").notNull().default(1),
    isBonus: integer("is_bonus", { mode: "boolean" }).notNull().default(false),
    choices: text("choices", { mode: "json" }).$type<RuleChoice[]>(),
  },
  (t) => [
    check(
      "dnd35_monster_feats_occurrence_integer",
      sql`${t.occurrence} is null or typeof(${t.occurrence}) = 'integer'`,
    ),
    check(
      "dnd35_monster_feats_is_bonus_integer",
      sql`${t.isBonus} is null or typeof(${t.isBonus}) = 'integer'`,
    ),
    uniqueIndex("dnd35_monster_feats_occurrence_uq").on(t.monsterId, t.featId, t.occurrence),
    index("dnd35_monster_feats_feat_idx").on(t.featId),
    positive("dnd35_monster_feats_occurrence_valid", t.occurrence),
    booleanCheck("dnd35_monster_feats_bonus_bool", t.isBonus),
    jsonCheck("dnd35_monster_feats_choices_json", t.choices, "array"),
  ],
);
export type MonsterFeat = typeof monsterFeats.$inferSelect;
export type NewMonsterFeat = typeof monsterFeats.$inferInsert;
