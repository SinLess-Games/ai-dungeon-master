import { index, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { contentColumns, contentChecks } from "./contentReference";
import { spells } from "./spell";

export const spellDescriptors = sqliteTable(
  "dnd35_spell_descriptors",
  {
    ...contentColumns(),
  },
  (t) => [...contentChecks("dnd35_spell_descriptors", t)],
);
export type SpellDescriptor = typeof spellDescriptors.$inferSelect;
export type NewSpellDescriptor = typeof spellDescriptors.$inferInsert;
export const spellDescriptorAssignments = sqliteTable(
  "dnd35_spell_descriptor_assignments",
  {
    spellId: text("spell_id")
      .notNull()
      .references(() => spells.id, { onDelete: "cascade" }),
    descriptorId: text("descriptor_id")
      .notNull()
      .references(() => spellDescriptors.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.spellId, t.descriptorId] }),
    index("dnd35_spell_descriptors_reverse_idx").on(t.descriptorId),
  ],
);
export type SpellDescriptorAssignment = typeof spellDescriptorAssignments.$inferSelect;
export type NewSpellDescriptorAssignment = typeof spellDescriptorAssignments.$inferInsert;
