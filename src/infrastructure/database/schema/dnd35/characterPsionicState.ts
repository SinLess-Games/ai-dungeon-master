import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { dnd35Characters } from "./character";
import { booleanCheck, timestamps } from "./schemaUtils";

/**
 * Mutable character-level psionic runtime state.
 *
 * Runtime resource tables use a separate persistence namespace from the 93
 * content/character-model D&D tables. Power-point expenditure remains on the
 * D&D character extension because the pool is shared across manifesting classes.
 */
export const characterPsionicStates = sqliteTable(
  "runtime_dnd35_character_psionic_states",
  {
    characterId: text("character_id")
      .primaryKey()
      .notNull()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    focused: integer("focused", { mode: "boolean" }).notNull().default(false),
    ...timestamps(),
  },
  (t) => [booleanCheck("runtime_dnd35_character_psionic_states_focused_bool", t.focused)],
);

export type CharacterPsionicState = typeof characterPsionicStates.$inferSelect;
export type NewCharacterPsionicState = typeof characterPsionicStates.$inferInsert;
