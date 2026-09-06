import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { timestamps, enumCheck, positive } from "./schemaUtils";
import { characterCastingTracks } from "./characterSpell";
import { powers } from "./power";

export const characterPowers = sqliteTable(
  "dnd35_character_powers",
  {
    castingTrackId: text("casting_track_id")
      .notNull()
      .references(() => characterCastingTracks.id, { onDelete: "cascade" }),
    powerId: text("power_id")
      .notNull()
      .references(() => powers.id, { onDelete: "restrict" }),
    accessKind: text("access_kind", { enum: ["known", "granted", "temporary"] })
      .notNull()
      .default("known"),
    gainedAtLevel: integer("gained_at_level"),
    notes: text("notes"),
    ...timestamps(),
  },
  (t) => [
    check(
      "dnd35_character_powers_gained_at_level_integer",
      sql`${t.gainedAtLevel} is null or typeof(${t.gainedAtLevel}) = 'integer'`,
    ),
    primaryKey({ columns: [t.castingTrackId, t.powerId] }),
    enumCheck("dnd35_character_powers_access_valid", t.accessKind, [
      "known",
      "granted",
      "temporary",
    ]),
    positive("dnd35_character_powers_level_valid", t.gainedAtLevel),
  ],
);
export type CharacterPower = typeof characterPowers.$inferSelect;
export type NewCharacterPower = typeof characterPowers.$inferInsert;
