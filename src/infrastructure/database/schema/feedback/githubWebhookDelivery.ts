import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const githubWebhookDeliveryStatuses = ["received", "processed", "failed"] as const;
export type GitHubWebhookDeliveryStatus = (typeof githubWebhookDeliveryStatuses)[number];

/**
 * Durable webhook idempotency ledger keyed by GitHub's X-GitHub-Delivery UUID.
 *
 * GitHub can retry deliveries and Cloudflare Queues provide at-least-once
 * delivery, so processing must be safe to repeat.
 */
export const githubWebhookDeliveries = sqliteTable(
  "github_webhook_deliveries",
  {
    id: text("id").primaryKey(),
    event: text("event").notNull(),
    action: text("action"),
    repositoryFullName: text("repository_full_name"),
    githubIssueNumber: integer("github_issue_number"),

    status: text("status")
      .$type<GitHubWebhookDeliveryStatus>()
      .notNull()
      .default("received"),
    lastError: text("last_error"),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    processedAt: integer("processed_at", { mode: "timestamp" }),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("github_webhook_deliveries_status_idx").on(table.status),
    index("github_webhook_deliveries_issue_idx").on(
      table.repositoryFullName,
      table.githubIssueNumber,
    ),
    check(
      "github_webhook_deliveries_status_valid",
      sql`${table.status} IN ('received', 'processed', 'failed')`,
    ),
  ],
);

export type GitHubWebhookDelivery = typeof githubWebhookDeliveries.$inferSelect;
export type NewGitHubWebhookDelivery = typeof githubWebhookDeliveries.$inferInsert;
