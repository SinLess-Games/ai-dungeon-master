import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const githubFeedbackTypes = ["bug", "feature"] as const;
export type GitHubFeedbackType = (typeof githubFeedbackTypes)[number];

export const githubFeedbackSyncStatuses = ["pending", "synced", "error"] as const;
export type GitHubFeedbackSyncStatus = (typeof githubFeedbackSyncStatuses)[number];

/**
 * Stable mapping between an Endless Codex feedback row and its GitHub issue.
 *
 * The mapping lives outside bug_reports / feature_requests so the product
 * feedback model remains independent from GitHub and can be re-pointed later.
 */
export const githubFeedbackLinks = sqliteTable(
  "github_feedback_links",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    feedbackType: text("feedback_type").$type<GitHubFeedbackType>().notNull(),
    feedbackId: text("feedback_id").notNull(),

    repositoryFullName: text("repository_full_name").notNull(),
    githubIssueId: integer("github_issue_id").notNull(),
    githubIssueNodeId: text("github_issue_node_id").notNull(),
    githubIssueNumber: integer("github_issue_number").notNull(),
    githubIssueUrl: text("github_issue_url").notNull(),

    syncStatus: text("sync_status")
      .$type<GitHubFeedbackSyncStatus>()
      .notNull()
      .default("synced"),
    lastError: text("last_error"),

    githubUpdatedAt: integer("github_updated_at", { mode: "timestamp" }),
    lastSyncedAt: integer("last_synced_at", { mode: "timestamp" }),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("github_feedback_links_feedback_unique").on(
      table.feedbackType,
      table.feedbackId,
    ),
    uniqueIndex("github_feedback_links_issue_unique").on(
      table.repositoryFullName,
      table.githubIssueNumber,
    ),
    index("github_feedback_links_issue_id_idx").on(table.githubIssueId),
    index("github_feedback_links_sync_status_idx").on(table.syncStatus),
    check(
      "github_feedback_links_feedback_type_valid",
      sql`${table.feedbackType} IN ('bug', 'feature')`,
    ),
    check(
      "github_feedback_links_sync_status_valid",
      sql`${table.syncStatus} IN ('pending', 'synced', 'error')`,
    ),
  ],
);

export type GitHubFeedbackLink = typeof githubFeedbackLinks.$inferSelect;
export type NewGitHubFeedbackLink = typeof githubFeedbackLinks.$inferInsert;
