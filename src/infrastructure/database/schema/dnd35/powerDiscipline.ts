import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { contentColumns, contentChecks } from "./contentReference";

export const powerDisciplines = sqliteTable(
  "dnd35_power_disciplines",
  {
    ...contentColumns(),
    specialistName: text("specialist_name"),
  },
  (t) => [...contentChecks("dnd35_power_disciplines", t)],
);
export type PowerDiscipline = typeof powerDisciplines.$inferSelect;
export type NewPowerDiscipline = typeof powerDisciplines.$inferInsert;
