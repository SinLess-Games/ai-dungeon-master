import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { campaigns } from "./campaign";
import { characters } from "./character";
import { users } from "./auth";

export const campaignPlayChannels = ["campaign", "ooc_dm"] as const;
export type CampaignPlayChannel = (typeof campaignPlayChannels)[number];

export const campaignPlayAuthorKinds = ["player", "dm", "system"] as const;
export type CampaignPlayAuthorKind = (typeof campaignPlayAuthorKinds)[number];

/**
 * Persistent text exchanged at a campaign table.
 *
 * Campaign-channel rows are shared by every active campaign member. OOC DM
 * rows are scoped to exactly one user through privateUserId so another player
 * can never hydrate somebody else's private DM conversation.
 */
export const campaignPlayMessages = sqliteTable(
  "campaign_play_messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    channel: text("channel", { enum: campaignPlayChannels }).notNull(),
    authorKind: text("author_kind", { enum: campaignPlayAuthorKinds }).notNull(),
    authorUserId: text("author_user_id").references(() => users.id, { onDelete: "set null" }),
    privateUserId: text("private_user_id").references(() => users.id, { onDelete: "cascade" }),
    characterId: text("character_id").references(() => characters.id, { onDelete: "set null" }),
    content: text("content").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("campaign_play_messages_campaign_channel_created_idx").on(
      table.campaignId,
      table.channel,
      table.createdAt,
    ),
    index("campaign_play_messages_private_channel_created_idx").on(
      table.campaignId,
      table.privateUserId,
      table.channel,
      table.createdAt,
    ),
    index("campaign_play_messages_character_idx").on(table.characterId),
    check(
      "campaign_play_messages_channel_valid",
      sql`${table.channel} IN ('campaign', 'ooc_dm')`,
    ),
    check(
      "campaign_play_messages_author_kind_valid",
      sql`${table.authorKind} IN ('player', 'dm', 'system')`,
    ),
    check(
      "campaign_play_messages_content_valid",
      sql`length(trim(${table.content})) BETWEEN 1 AND 4000`,
    ),
    check(
      "campaign_play_messages_privacy_valid",
      sql`(${table.channel} = 'campaign' AND ${table.privateUserId} IS NULL) OR (${table.channel} = 'ooc_dm' AND ${table.privateUserId} IS NOT NULL)`,
    ),
  ],
);

export type CampaignPlayMessage = typeof campaignPlayMessages.$inferSelect;
export type NewCampaignPlayMessage = typeof campaignPlayMessages.$inferInsert;
