import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { dnd35Characters } from "./character";
import { booleanCheck, timestamps } from "./schemaUtils";

/**
 * Mutable character-level psionic state.
 *
 * Power-point expenditure remains on dnd35_characters because the pool is
 * shared across manifesting classes. Focus is modeled separately so the
 * character extension does not accumulate unrelated runtime flags.
 */
export const characterPsionicStates = sqliteTable(
  "dnd35_character_psionic_states",
  {
    characterId: text("character_id")
      .primaryKey()
      .notNull()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    focused: integer("focused", { mode: "boolean" }).notNull().default(false),
    ...timestamps(),
  },
  (t) => [booleanCheck("dnd35_character_psionic_states_focused_bool", t.focused)],
);

export type CharacterPsionicState = typeof characterPsionicStates.$inferSelect;
export type NewCharacterPsionicState = typeof characterPsionicStates.$inferInsert;
