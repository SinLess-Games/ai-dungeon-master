import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { campaigns } from "./campaign";
import { characters } from "./character";
import { worlds } from "./world";

export const gameActorKinds = ["character", "monster", "npc"] as const;
export type GameActorKind = (typeof gameActorKinds)[number];
export const gameActorStatuses = ["active", "defeated", "removed", "archived"] as const;
export type GameActorStatus = (typeof gameActorStatuses)[number];

export interface GameActorMetadata {
  portraitObjectKey?: string;
  notes?: string;
  extensions?: Record<string, unknown>;
}

/**
 * Runtime identity shared by player characters, monsters, and NPCs.
 *
 * Character actors retain a link to the pre-world generic character record.
 * Monster/NPC actors are generated inside a persistent world and do not need
 * fake user ownership. Ruleset-specific mutable state lives in runtime
 * extension tables keyed by actor id.
 */
export const gameActors = sqliteTable(
  "game_actors",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    worldId: text("world_id")
      .notNull()
      .references(() => worlds.id, { onDelete: "cascade" }),
    kind: text("kind").$type<GameActorKind>().notNull(),
    characterId: text("character_id").references(() => characters.id, { onDelete: "restrict" }),
    controllerUserId: text("controller_user_id"),
    name: text("name").notNull(),
    status: text("status").$type<GameActorStatus>().notNull().default("active"),
    metadata: text("metadata", { mode: "json" })
      .$type<GameActorMetadata>()
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
    uniqueIndex("game_actors_character_uidx").on(table.characterId),
    index("game_actors_campaign_status_idx").on(table.campaignId, table.status),
    index("game_actors_world_kind_idx").on(table.worldId, table.kind),
    index("game_actors_controller_idx").on(table.controllerUserId),
    check("game_actors_name_not_empty", sql`length(trim(${table.name})) > 0`),
    check("game_actors_kind_valid", sql`${table.kind} IN ('character', 'monster', 'npc')`),
    check(
      "game_actors_status_valid",
      sql`${table.status} IN ('active', 'defeated', 'removed', 'archived')`,
    ),
    check(
      "game_actors_character_link_valid",
      sql`(${table.kind} = 'character' AND ${table.characterId} IS NOT NULL) OR (${table.kind} <> 'character' AND ${table.characterId} IS NULL)`,
    ),
  ],
);

export type GameActor = typeof gameActors.$inferSelect;
export type NewGameActor = typeof gameActors.$inferInsert;
