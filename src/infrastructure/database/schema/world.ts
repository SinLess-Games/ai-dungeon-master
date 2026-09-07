import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const worldStatuses = ["generating", "ready", "failed", "archived"] as const;
export type WorldStatus = (typeof worldStatuses)[number];

export interface WorldSettings {
  generation?: {
    templateId?: string;
    styleIds?: string[];
    pace?: string;
    multiPlanar?: boolean;
    epic?: boolean;
  };
  extensions?: Record<string, unknown>;
}

/**
 * Runtime world generated for a campaign start.
 *
 * Worlds are not independently created by users. A campaign start operation
 * allocates the row in `generating` state, then activates the campaign only
 * after the world reaches `ready`.
 */
export const worlds = sqliteTable(
  "worlds",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    status: text("status").$type<WorldStatus>().notNull().default("generating"),
    name: text("name"),
    generationSeed: text("generation_seed").notNull(),
    generatorVersion: text("generator_version"),
    settings: text("settings", { mode: "json" })
      .$type<WorldSettings>()
      .notNull()
      .$defaultFn(() => ({})),
    generatedAt: integer("generated_at", { mode: "timestamp" }),
    failedAt: integer("failed_at", { mode: "timestamp" }),
    failureReason: text("failure_reason"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("worlds_status_idx").on(table.status),
    index("worlds_generated_at_idx").on(table.generatedAt),
    check("worlds_seed_not_empty", sql`length(trim(${table.generationSeed})) > 0`),
    check(
      "worlds_status_valid",
      sql`${table.status} IN ('generating', 'ready', 'failed', 'archived')`,
    ),
    check(
      "worlds_ready_has_generated_at",
      sql`${table.status} <> 'ready' OR ${table.generatedAt} IS NOT NULL`,
    ),
    check(
      "worlds_failed_has_failed_at",
      sql`${table.status} <> 'failed' OR ${table.failedAt} IS NOT NULL`,
    ),
  ],
);

export type World = typeof worlds.$inferSelect;
export type NewWorld = typeof worlds.$inferInsert;
