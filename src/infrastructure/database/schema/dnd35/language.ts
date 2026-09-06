import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { booleanCheck } from "./schemaUtils";
import { contentColumns, contentChecks } from "./contentReference";

export const languages = sqliteTable(
  "dnd35_languages",
  {
    ...contentColumns(),
    script: text("script"),
    typicalSpeakers: text("typical_speakers"),
    isSecret: integer("is_secret", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [
    check(
      "dnd35_languages_is_secret_integer",
      sql`${t.isSecret} is null or typeof(${t.isSecret}) = 'integer'`,
    ),
    ...contentChecks("dnd35_languages", t),
    booleanCheck("dnd35_languages_secret_bool", t.isSecret),
  ],
);
export type Language = typeof languages.$inferSelect;
export type NewLanguage = typeof languages.$inferInsert;
