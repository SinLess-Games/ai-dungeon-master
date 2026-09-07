import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { monsters } from "./dnd35/monster";
import { gameActors } from "./gameActor";

export interface RuntimeDnd35MonsterMetadata {
  variantName?: string;
  extensions?: Record<string, unknown>;
}

/** Mutable per-instance state for a D&D 3.5 monster definition. */
export const runtimeDnd35MonsterInstances = sqliteTable(
  "runtime_dnd35_monster_instances",
  {
    actorId: text("actor_id")
      .primaryKey()
      .notNull()
      .references(() => gameActors.id, { onDelete: "cascade" }),
    monsterId: text("monster_id")
      .notNull()
      .references(() => monsters.id, { onDelete: "restrict" }),
    maximumHitPoints: integer("maximum_hit_points").notNull(),
    currentHitPoints: integer("current_hit_points").notNull(),
    temporaryHitPoints: integer("temporary_hit_points").notNull().default(0),
    nonlethalDamage: integer("nonlethal_damage").notNull().default(0),
    stable: integer("stable", { mode: "boolean" }).notNull().default(true),
    metadata: text("metadata", { mode: "json" })
      .$type<RuntimeDnd35MonsterMetadata>()
      .notNull()
      .$defaultFn(() => ({})),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("runtime_dnd35_monster_instances_definition_idx").on(table.monsterId),
    check(
      "runtime_dnd35_monster_instances_max_hp_valid",
      sql`typeof(${table.maximumHitPoints}) = 'integer' AND ${table.maximumHitPoints} > 0`,
    ),
    check(
      "runtime_dnd35_monster_instances_current_hp_valid",
      sql`typeof(${table.currentHitPoints}) = 'integer' AND ${table.currentHitPoints} <= ${table.maximumHitPoints}`,
    ),
    check(
      "runtime_dnd35_monster_instances_temp_hp_valid",
      sql`typeof(${table.temporaryHitPoints}) = 'integer' AND ${table.temporaryHitPoints} >= 0`,
    ),
    check(
      "runtime_dnd35_monster_instances_nonlethal_valid",
      sql`typeof(${table.nonlethalDamage}) = 'integer' AND ${table.nonlethalDamage} >= 0`,
    ),
    check(
      "runtime_dnd35_monster_instances_stable_bool",
      sql`${table.stable} IN (0, 1)`,
    ),
  ],
);

export type RuntimeDnd35MonsterInstance = typeof runtimeDnd35MonsterInstances.$inferSelect;
export type NewRuntimeDnd35MonsterInstance = typeof runtimeDnd35MonsterInstances.$inferInsert;
