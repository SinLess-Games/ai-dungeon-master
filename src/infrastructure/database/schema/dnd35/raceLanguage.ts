import { index, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { enumCheck } from "./schemaUtils";
import { races } from "./race";
import { languages } from "./language";

export const raceLanguages = sqliteTable(
  "dnd35_race_languages",
  {
    raceId: text("race_id")
      .notNull()
      .references(() => races.id, { onDelete: "cascade" }),
    languageId: text("language_id")
      .notNull()
      .references(() => languages.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["automatic", "bonus"] }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.raceId, t.languageId] }),
    index("dnd35_race_languages_reverse_idx").on(t.languageId),
    enumCheck("dnd35_race_languages_kind_valid", t.kind, ["automatic", "bonus"]),
  ],
);
export type RaceLanguage = typeof raceLanguages.$inferSelect;
export type NewRaceLanguage = typeof raceLanguages.$inferInsert;
