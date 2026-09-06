import { sqliteTable } from "drizzle-orm/sqlite-core";
import { contentColumns, contentChecks } from "./contentReference";

export const creatureSubtypes = sqliteTable(
  "dnd35_creature_subtypes",
  {
    ...contentColumns(),
  },
  (t) => [...contentChecks("dnd35_creature_subtypes", t)],
);
export type CreatureSubtype = typeof creatureSubtypes.$inferSelect;
export type NewCreatureSubtype = typeof creatureSubtypes.$inferInsert;
