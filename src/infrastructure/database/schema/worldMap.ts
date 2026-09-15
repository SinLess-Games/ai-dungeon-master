import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { worlds } from "./world";

export const worldMapKinds = ["world", "region", "location", "tactical"] as const;
export type WorldMapKind = (typeof worldMapKinds)[number];

export interface WorldMapData {
  version?: number;
  viewport?: Record<string, unknown>;
  layers?: unknown[];
  markers?: unknown[];
  paths?: unknown[];
  metadata?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
}

/**
 * Generic map document storage shared by browser, desktop, and mobile clients.
 * Rich map editing/rendering belongs to the world/map feature; this table is the
 * cloud save target used by the offline sync layer.
 */
export const worldMaps = sqliteTable(
  "world_maps",
  {
    id: text("id").primaryKey(),
    worldId: text("world_id")
      .notNull()
      .references(() => worlds.id, { onDelete: "cascade" }),
    ownerUserId: text("owner_user_id").notNull(),
    name: text("name").notNull(),
    kind: text("kind").$type<WorldMapKind>().notNull().default("world"),
    data: text("data", { mode: "json" })
      .$type<WorldMapData>()
      .notNull()
      .$defaultFn(() => ({})),
    revision: integer("revision").notNull().default(1),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("world_maps_world_id_idx").on(table.worldId),
    index("world_maps_owner_user_id_idx").on(table.ownerUserId),
    index("world_maps_world_updated_idx").on(table.worldId, table.updatedAt),
    check("world_maps_name_not_empty", sql`length(trim(${table.name})) > 0`),
    check("world_maps_owner_not_empty", sql`length(trim(${table.ownerUserId})) > 0`),
    check(
      "world_maps_kind_valid",
      sql`${table.kind} IN ('world', 'region', 'location', 'tactical')`,
    ),
    check("world_maps_revision_positive", sql`${table.revision} > 0`),
  ],
);

export type WorldMap = typeof worldMaps.$inferSelect;
export type NewWorldMap = typeof worldMaps.$inferInsert;
