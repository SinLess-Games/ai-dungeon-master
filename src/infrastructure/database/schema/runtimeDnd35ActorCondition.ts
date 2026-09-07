import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { conditions } from "./dnd35/condition";
import type { RuleEffect, RuleExtension } from "./dnd35/primitives";
import { gameActors } from "./gameActor";
import { gameEncounters } from "./gameEncounter";

export interface RuntimeDnd35ActorConditionState {
  effects?: RuleEffect[];
  extension?: RuleExtension;
  data?: Record<string, unknown>;
}

export const runtimeDnd35ActorConditions = sqliteTable(
  "runtime_dnd35_actor_conditions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    actorId: text("actor_id")
      .notNull()
      .references(() => gameActors.id, { onDelete: "cascade" }),
    conditionId: text("condition_id")
      .notNull()
      .references(() => conditions.id, { onDelete: "restrict" }),
    sourceActorId: text("source_actor_id").references(() => gameActors.id, { onDelete: "set null" }),
    sourceDescription: text("source_description"),
    durationKind: text("duration_kind").notNull(),
    remainingRounds: integer("remaining_rounds"),
    encounterId: text("encounter_id").references(() => gameEncounters.id, { onDelete: "set null" }),
    expiresEncounterRound: integer("expires_encounter_round"),
    expiresTurnOrder: integer("expires_turn_order"),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    state: text("state", { mode: "json" }).$type<RuntimeDnd35ActorConditionState>(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("runtime_dnd35_actor_conditions_actor_idx").on(table.actorId),
    index("runtime_dnd35_actor_conditions_condition_idx").on(table.conditionId),
    index("runtime_dnd35_actor_conditions_expiry_idx").on(
      table.encounterId,
      table.expiresEncounterRound,
      table.expiresTurnOrder,
    ),
    check(
      "runtime_dnd35_actor_conditions_duration_valid",
      sql`${table.durationKind} IN ('rounds', 'until_time', 'permanent', 'concentration', 'special')`,
    ),
    check(
      "runtime_dnd35_actor_conditions_round_fields_valid",
      sql`(${table.durationKind} = 'rounds' AND ${table.remainingRounds} IS NOT NULL AND ${table.remainingRounds} >= 1) OR (${table.durationKind} <> 'rounds' AND ${table.remainingRounds} IS NULL)`,
    ),
    check(
      "runtime_dnd35_actor_conditions_time_fields_valid",
      sql`(${table.durationKind} = 'until_time' AND ${table.expiresAt} IS NOT NULL) OR (${table.durationKind} <> 'until_time' AND ${table.expiresAt} IS NULL)`,
    ),
  ],
);

export type RuntimeDnd35ActorCondition = typeof runtimeDnd35ActorConditions.$inferSelect;
export type NewRuntimeDnd35ActorCondition = typeof runtimeDnd35ActorConditions.$inferInsert;
