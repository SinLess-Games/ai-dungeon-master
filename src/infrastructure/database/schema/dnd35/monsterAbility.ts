import { index, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { enumCheck, jsonCheck } from "./schemaUtils";
import { monsters } from "./monster";
import { specialAbilities } from "./specialAbility";
import type { GrantParameters } from "./primitives";

export const monsterAbilities = sqliteTable(
  "dnd35_monster_abilities",
  {
    monsterId: text("monster_id")
      .notNull()
      .references(() => monsters.id, { onDelete: "cascade" }),
    specialAbilityId: text("special_ability_id")
      .notNull()
      .references(() => specialAbilities.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["special_attack", "special_quality", "other"] }).notNull(),
    parameters: text("parameters", { mode: "json" }).$type<GrantParameters>(),
    rulesText: text("rules_text"),
  },
  (t) => [
    primaryKey({ columns: [t.monsterId, t.specialAbilityId] }),
    index("dnd35_monster_abilities_reverse_idx").on(t.specialAbilityId),
    enumCheck("dnd35_monster_abilities_role_valid", t.role, [
      "special_attack",
      "special_quality",
      "other",
    ]),
    jsonCheck("dnd35_monster_abilities_parameters_json", t.parameters),
  ],
);
export type MonsterAbility = typeof monsterAbilities.$inferSelect;
export type NewMonsterAbility = typeof monsterAbilities.$inferInsert;
