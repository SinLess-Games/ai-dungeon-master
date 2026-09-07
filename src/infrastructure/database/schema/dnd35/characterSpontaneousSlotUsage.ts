import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { characterCastingTracks } from "./characterSpell";
import { nonNegative, timestamps } from "./schemaUtils";

/**
 * Persistent daily expenditure for spontaneous spellcasting tracks.
 *
 * Maximum slots remain derived from class progression and casting ability; only
 * the mutable expended count is stored so derived totals cannot drift from the
 * authoritative ruleset data.
 */
export const characterSpontaneousSlotUsage = sqliteTable(
  "dnd35_character_spontaneous_slot_usage",
  {
    castingTrackId: text("casting_track_id")
      .notNull()
      .references(() => characterCastingTracks.id, { onDelete: "cascade" }),
    spellLevel: integer("spell_level").notNull(),
    expendedCount: integer("expended_count").notNull().default(0),
    ...timestamps(),
  },
  (t) => [
    primaryKey({ columns: [t.castingTrackId, t.spellLevel] }),
    index("dnd35_character_spontaneous_slot_usage_track_idx").on(t.castingTrackId),
    check(
      "dnd35_character_spontaneous_slot_usage_spell_level_integer",
      sql`typeof(${t.spellLevel}) = 'integer'`,
    ),
    check(
      "dnd35_character_spontaneous_slot_usage_spell_level_valid",
      sql`${t.spellLevel} between 0 and 9`,
    ),
    check(
      "dnd35_character_spontaneous_slot_usage_expended_integer",
      sql`typeof(${t.expendedCount}) = 'integer'`,
    ),
    nonNegative("dnd35_character_spontaneous_slot_usage_expended_valid", t.expendedCount),
  ],
);

export type CharacterSpontaneousSlotUsage = typeof characterSpontaneousSlotUsage.$inferSelect;
export type NewCharacterSpontaneousSlotUsage = typeof characterSpontaneousSlotUsage.$inferInsert;
