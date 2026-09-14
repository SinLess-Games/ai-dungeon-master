import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { campaigns } from "./campaign";
import { campaignPlayMessages } from "./campaignPlayMessage";
import { characters } from "./character";
import { users } from "./auth";

export const campaignDmActionKinds = ["check.skill", "check.save"] as const;
export type CampaignDmActionKind = (typeof campaignDmActionKinds)[number];

export const campaignDmActionStatuses = [
  "pending",
  "resolving",
  "resolved",
  "failed",
  "cancelled",
] as const;
export type CampaignDmActionStatus = (typeof campaignDmActionStatuses)[number];

export type CampaignDmActionArguments =
  | {
      type: "check.skill";
      skillId: string;
      skillName?: string;
      specialization?: string;
      dc: number;
      reason: string;
    }
  | {
      type: "check.save";
      save: "fort" | "ref" | "will";
      dc: number;
      reason: string;
    };

/**
 * A mechanical action requested by the AI Dungeon Master but intentionally
 * waiting on the player before authoritative resolution.
 *
 * The model never writes game state directly. It can only create one of these
 * validated requests; the player supplies the roll and the deterministic game
 * command service commits the resulting event/state change.
 */
export const campaignDmActions = sqliteTable(
  "campaign_dm_actions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    requestedByMessageId: text("requested_by_message_id")
      .notNull()
      .references(() => campaignPlayMessages.id, { onDelete: "cascade" }),
    requestMessageId: text("request_message_id").references(() => campaignPlayMessages.id, {
      onDelete: "set null",
    }),
    resolutionMessageId: text("resolution_message_id").references(() => campaignPlayMessages.id, {
      onDelete: "set null",
    }),
    requestedUserId: text("requested_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    actorId: text("actor_id").notNull(),
    kind: text("kind", { enum: campaignDmActionKinds }).notNull(),
    arguments: text("arguments", { mode: "json" }).$type<CampaignDmActionArguments>().notNull(),
    status: text("status", { enum: campaignDmActionStatuses }).notNull().default("pending"),
    result: text("result", { mode: "json" }).$type<Record<string, unknown> | null>(),
    error: text("error"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  },
  (table) => [
    index("campaign_dm_actions_campaign_user_status_created_idx").on(
      table.campaignId,
      table.requestedUserId,
      table.status,
      table.createdAt,
    ),
    index("campaign_dm_actions_message_idx").on(table.requestedByMessageId),
    index("campaign_dm_actions_character_idx").on(table.characterId),
    check(
      "campaign_dm_actions_kind_valid",
      sql`${table.kind} IN ('check.skill', 'check.save')`,
    ),
    check(
      "campaign_dm_actions_status_valid",
      sql`${table.status} IN ('pending', 'resolving', 'resolved', 'failed', 'cancelled')`,
    ),
    check("campaign_dm_actions_arguments_json_valid", sql`json_valid(${table.arguments})`),
    check(
      "campaign_dm_actions_result_json_valid",
      sql`${table.result} IS NULL OR json_valid(${table.result})`,
    ),
  ],
);

export type CampaignDmAction = typeof campaignDmActions.$inferSelect;
export type NewCampaignDmAction = typeof campaignDmActions.$inferInsert;
