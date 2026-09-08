import { index, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { powers } from "./power";
import { powerDisciplines } from "./powerDiscipline";

/**
 * Complete discipline membership for a power.
 *
 * dnd35_powers.discipline_id remains the primary/compatibility discipline.
 * This table preserves every discipline for dual-discipline powers such as the
 * D&D 3.0 Psionics Handbook versions of Divert Teleport and Hypercognition.
 */
export const powerDisciplineAssignments = sqliteTable(
  "dnd35_power_discipline_assignments",
  {
    powerId: text("power_id")
      .notNull()
      .references(() => powers.id, { onDelete: "cascade" }),
    disciplineId: text("discipline_id")
      .notNull()
      .references(() => powerDisciplines.id, { onDelete: "restrict" }),
  },
  (t) => [
    primaryKey({ columns: [t.powerId, t.disciplineId] }),
    index("dnd35_power_discipline_assignments_discipline_idx").on(t.disciplineId),
  ],
);

export type PowerDisciplineAssignment = typeof powerDisciplineAssignments.$inferSelect;
export type NewPowerDisciplineAssignment = typeof powerDisciplineAssignments.$inferInsert;
