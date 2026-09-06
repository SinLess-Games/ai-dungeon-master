import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { enumCheck, nonNegative, booleanCheck } from "./schemaUtils";
import { contentColumns, contentChecks } from "./contentReference";
import { abilityKeys } from "./primitives";

export const skills = sqliteTable(
  "dnd35_skills",
  {
    ...contentColumns(),
    ability: text("ability", { enum: abilityKeys }),
    trainedOnly: integer("trained_only", { mode: "boolean" }).notNull().default(false),
    /** 0: none, 1: normal penalty, 2: e.g. Swim. */
    armorCheckMultiplier: integer("armor_check_multiplier").notNull().default(0),
    requiresSpecialization: integer("requires_specialization", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (t) => [
    check(
      "dnd35_skills_trained_only_integer",
      sql`${t.trainedOnly} is null or typeof(${t.trainedOnly}) = 'integer'`,
    ),
    check(
      "dnd35_skills_armor_check_multiplier_integer",
      sql`${t.armorCheckMultiplier} is null or typeof(${t.armorCheckMultiplier}) = 'integer'`,
    ),
    check(
      "dnd35_skills_requires_specialization_integer",
      sql`${t.requiresSpecialization} is null or typeof(${t.requiresSpecialization}) = 'integer'`,
    ),
    ...contentChecks("dnd35_skills", t),
    enumCheck("dnd35_skills_ability_valid", t.ability, abilityKeys),
    booleanCheck("dnd35_skills_trained_bool", t.trainedOnly),
    booleanCheck("dnd35_skills_specialization_bool", t.requiresSpecialization),
    nonNegative("dnd35_skills_armor_multiplier_valid", t.armorCheckMultiplier),
  ],
);
export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
