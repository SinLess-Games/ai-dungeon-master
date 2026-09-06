import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { contentColumns, contentChecks } from "./contentReference";
import { specialAbilities } from "./specialAbility";

export const classFeatures = sqliteTable(
  "dnd35_class_features",
  {
    ...contentColumns(),
    specialAbilityId: text("special_ability_id").references(() => specialAbilities.id, {
      onDelete: "restrict",
    }),
    choiceKind: text("choice_kind"),
  },
  (t) => [
    ...contentChecks("dnd35_class_features", t),
    index("dnd35_class_features_ability_idx").on(t.specialAbilityId),
  ],
);
export type ClassFeature = typeof classFeatures.$inferSelect;
export type NewClassFeature = typeof classFeatures.$inferInsert;
