import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { campaigns } from "./campaign";

export const campaignMemberRoles = ["owner", "gm", "player", "observer"] as const;
export type CampaignMemberRole = (typeof campaignMemberRoles)[number];

export const campaignMemberStatuses = ["invited", "active", "left", "removed"] as const;
export type CampaignMemberStatus = (typeof campaignMemberStatuses)[number];

/** Campaign-scoped authorization. This is separate from Better Auth global roles. */
export const campaignMemberships = sqliteTable(
  "campaign_memberships",
  {
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    role: text("role").$type<CampaignMemberRole>().notNull().default("player"),
    status: text("status").$type<CampaignMemberStatus>().notNull().default("invited"),
    invitedAt: integer("invited_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    joinedAt: integer("joined_at", { mode: "timestamp" }),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    primaryKey({ columns: [table.campaignId, table.userId] }),
    index("campaign_memberships_user_idx").on(table.userId),
    index("campaign_memberships_campaign_status_idx").on(table.campaignId, table.status),
    check("campaign_memberships_user_not_empty", sql`length(trim(${table.userId})) > 0`),
    check(
      "campaign_memberships_role_valid",
      sql`${table.role} IN ('owner', 'gm', 'player', 'observer')`,
    ),
    check(
      "campaign_memberships_status_valid",
      sql`${table.status} IN ('invited', 'active', 'left', 'removed')`,
    ),
    check(
      "campaign_memberships_active_joined",
      sql`${table.status} <> 'active' OR ${table.joinedAt} IS NOT NULL`,
    ),
  ],
);

export type CampaignMembership = typeof campaignMemberships.$inferSelect;
export type NewCampaignMembership = typeof campaignMemberships.$inferInsert;
