import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { campaigns } from "./campaign";

export const characterStatuses = ["draft", "ready", "active", "retired", "archived"] as const;
export type CharacterStatus = (typeof characterStatuses)[number];

export interface CharacterMetadata {
  portraitObjectKey?: string;
  pronouns?: string;
  playerNotes?: string;
  extensions?: Record<string, unknown>;
}

/**
 * Generic character identity and campaign ownership.
 *
 * Ruleset-specific state belongs in an extension table such as
 * `dnd35_characters`. Characters are created inside a campaign draft, before
 * that campaign has a generated world.
 */
export const characters = sqliteTable(
  "characters",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    campaignId: text("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }),
    ownerUserId: text("owner_user_id"),
    rulesetId: text("ruleset_id").notNull(),
    rulesetVersion: text("ruleset_version").notNull(),
    name: text("name").notNull(),
    status: text("status").$type<CharacterStatus>().notNull().default("draft"),
    metadata: text("metadata", { mode: "json" })
      .$type<CharacterMetadata>()
      .notNull()
      .$defaultFn(() => ({})),
    readyAt: integer("ready_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("characters_campaign_id_idx").on(table.campaignId),
    index("characters_owner_user_id_idx").on(table.ownerUserId),
    index("characters_campaign_status_idx").on(table.campaignId, table.status),
    index("characters_ruleset_idx").on(table.rulesetId, table.rulesetVersion),
    check("characters_name_not_empty", sql`length(trim(${table.name})) > 0`),
    check("characters_ruleset_id_not_empty", sql`length(trim(${table.rulesetId})) > 0`),
    check(
      "characters_ruleset_version_not_empty",
      sql`length(trim(${table.rulesetVersion})) > 0`,
    ),
    check(
      "characters_status_valid",
      sql`${table.status} IN ('draft', 'ready', 'active', 'retired', 'archived')`,
    ),
    check(
      "characters_ready_requires_campaign_owner",
      sql`${table.status} = 'draft' OR (${table.campaignId} IS NOT NULL AND ${table.ownerUserId} IS NOT NULL)`,
    ),
    check(
      "characters_ready_timestamp_valid",
      sql`${table.status} = 'draft' OR ${table.readyAt} IS NOT NULL OR ${table.status} IN ('retired', 'archived')`,
    ),
  ],
);

export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;
