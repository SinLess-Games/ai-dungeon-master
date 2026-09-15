import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { dnd35Characters } from "./dnd35/character";

/**
 * Running alignment-axis state used to make alignment drift gradual and auditable.
 * The public D&D alignment remains on dnd35_characters.alignment; this table keeps
 * the two hidden axis scores that determine when a threshold is crossed.
 */
export const runtimeDnd35AlignmentStates = sqliteTable(
  "runtime_dnd35_alignment_states",
  {
    characterId: text("character_id")
      .primaryKey()
      .notNull()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    lawChaosScore: integer("law_chaos_score").notNull(),
    goodEvilScore: integer("good_evil_score").notNull(),
    lastReason: text("last_reason"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    check(
      "runtime_dnd35_alignment_law_chaos_integer",
      sql`typeof(${table.lawChaosScore}) = 'integer'`,
    ),
    check(
      "runtime_dnd35_alignment_good_evil_integer",
      sql`typeof(${table.goodEvilScore}) = 'integer'`,
    ),
    check(
      "runtime_dnd35_alignment_law_chaos_range",
      sql`${table.lawChaosScore} BETWEEN -100 AND 100`,
    ),
    check(
      "runtime_dnd35_alignment_good_evil_range",
      sql`${table.goodEvilScore} BETWEEN -100 AND 100`,
    ),
  ],
);

export type RuntimeDnd35AlignmentState = typeof runtimeDnd35AlignmentStates.$inferSelect;
export type NewRuntimeDnd35AlignmentState = typeof runtimeDnd35AlignmentStates.$inferInsert;
