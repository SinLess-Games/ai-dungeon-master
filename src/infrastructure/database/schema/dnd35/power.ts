import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { enumCheck, nonEmpty, nonNegative, jsonCheck } from "./schemaUtils";
import { contentColumns, contentChecks } from "./contentReference";
import { powerDisciplines } from "./powerDiscipline";
import { actionTypes, saveKeys } from "./primitives";
import { spellDescriptors } from "./spellDescriptor";
import type { RuleEffect } from "./primitives";

export const powers = sqliteTable(
  "dnd35_powers",
  {
    ...contentColumns(),
    disciplineId: text("discipline_id")
      .notNull()
      .references(() => powerDisciplines.id, { onDelete: "restrict" }),
    subdiscipline: text("subdiscipline"),
    manifestingTime: text("manifesting_time").notNull(),
    actionType: text("action_type", { enum: actionTypes }),
    rangeText: text("range_text").notNull(),
    targetText: text("target_text"),
    areaText: text("area_text"),
    effectText: text("effect_text"),
    durationText: text("duration_text").notNull(),
    save: text("save", { enum: saveKeys }),
    savingThrowText: text("saving_throw_text"),
    powerResistance: text("power_resistance", { enum: ["yes", "no", "conditional"] }).notNull(),
    powerResistanceText: text("power_resistance_text"),
    powerPoints: integer("power_points").notNull(),
    augmentationText: text("augmentation_text"),
    augmentation: text("augmentation", { mode: "json" }).$type<PowerAugmentation[]>(),
  },
  (t) => [
    check(
      "dnd35_powers_power_points_integer",
      sql`${t.powerPoints} is null or typeof(${t.powerPoints}) = 'integer'`,
    ),
    ...contentChecks("dnd35_powers", t),
    index("dnd35_powers_discipline_idx").on(t.disciplineId),
    nonNegative("dnd35_powers_points_valid", t.powerPoints),
    enumCheck("dnd35_powers_action_valid", t.actionType, actionTypes),
    enumCheck("dnd35_powers_save_valid", t.save, saveKeys),
    enumCheck("dnd35_powers_resistance_valid", t.powerResistance, ["yes", "no", "conditional"]),
    nonEmpty("dnd35_powers_time_nonempty", t.manifestingTime),
    nonEmpty("dnd35_powers_range_nonempty", t.rangeText),
    nonEmpty("dnd35_powers_duration_nonempty", t.durationText),
    jsonCheck("dnd35_powers_augmentation_json", t.augmentation, "array"),
  ],
);
export type Power = typeof powers.$inferSelect;
export type NewPower = typeof powers.$inferInsert;

/** Augment options combine costs, repeatability, and effects in irregular ways. */
export interface PowerAugmentation {
  additionalPowerPoints: number;
  repeatable: boolean;
  description: string;
  effects?: RuleEffect[];
}
export const powerDisplays = ["auditory", "material", "mental", "olfactory", "visual"] as const;
export const powerDisplayAssignments = sqliteTable(
  "dnd35_power_display_assignments",
  {
    powerId: text("power_id")
      .notNull()
      .references(() => powers.id, { onDelete: "cascade" }),
    display: text("display", { enum: powerDisplays }).notNull(),
    description: text("description"),
  },
  (t) => [
    primaryKey({ columns: [t.powerId, t.display] }),
    enumCheck("dnd35_power_displays_valid", t.display, powerDisplays),
  ],
);
export type PowerDisplayAssignment = typeof powerDisplayAssignments.$inferSelect;
export type NewPowerDisplayAssignment = typeof powerDisplayAssignments.$inferInsert;
export const powerDescriptorAssignments = sqliteTable(
  "dnd35_power_descriptor_assignments",
  {
    powerId: text("power_id")
      .notNull()
      .references(() => powers.id, { onDelete: "cascade" }),
    descriptorId: text("descriptor_id")
      .notNull()
      .references(() => spellDescriptors.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.powerId, t.descriptorId] }),
    index("dnd35_power_descriptors_reverse_idx").on(t.descriptorId),
  ],
);
export type PowerDescriptorAssignment = typeof powerDescriptorAssignments.$inferSelect;
export type NewPowerDescriptorAssignment = typeof powerDescriptorAssignments.$inferInsert;
