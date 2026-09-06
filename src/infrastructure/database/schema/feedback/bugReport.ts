import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

/**
 * Lifecycle states for a bug report.
 */
export const bugReportStatuses = [
  "open",
  "triaged",
  "in_progress",
  "resolved",
  "closed",
  "duplicate",
  "wont_fix",
] as const;

export type BugReportStatus = (typeof bugReportStatuses)[number];

/**
 * Severity represents the impact of the bug, not its development priority.
 */
export const bugReportSeverities = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type BugReportSeverity = (typeof bugReportSeverities)[number];

/**
 * Client/platform from which the report originated.
 */
export const bugReportPlatforms = [
  "web",
  "android",
  "windows",
  "api",
  "unknown",
] as const;

export type BugReportPlatform = (typeof bugReportPlatforms)[number];

/**
 * Additional contextual information captured when a bug is reported.
 *
 * Keep this deliberately flexible so the feedback system does not need
 * schema changes every time Endless Codex gains another subsystem.
 */
export interface BugReportContext {
  route?: string;

  appVersion?: string;
  buildId?: string;

  worldId?: string;
  campaignId?: string;
  characterId?: string;
  sessionId?: string;

  userAgent?: string;

  viewport?: {
    width: number;
    height: number;
  };

  additional?: Record<string, unknown>;
}

/**
 * User-submitted or automatically captured bug reports.
 *
 * Large attachments such as screenshots, logs, and exported save data
 * should live in R2. A separate attachment table can reference those R2
 * object keys rather than storing binary data in D1.
 */
export const bugReports = sqliteTable(
  "bug_reports",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    /**
     * Better Auth user ID.
     *
     * This intentionally does not declare a foreign key here so the feedback
     * schema is not coupled to the authentication schema module. Repository
     * and service logic should validate the reporter when appropriate.
     *
     * Null allows anonymous/pre-authentication error reports.
     */
    reporterUserId: text("reporter_user_id"),

    title: text("title").notNull(),

    description: text("description").notNull(),

    stepsToReproduce: text("steps_to_reproduce"),

    expectedBehavior: text("expected_behavior"),

    actualBehavior: text("actual_behavior"),

    severity: text("severity")
      .$type<BugReportSeverity>()
      .notNull()
      .default("medium"),

    status: text("status")
      .$type<BugReportStatus>()
      .notNull()
      .default("open"),

    platform: text("platform")
      .$type<BugReportPlatform>()
      .notNull()
      .default("unknown"),

    /**
     * Flexible diagnostic context captured at report time.
     */
    context: text("context", {
      mode: "json",
    }).$type<BugReportContext>(),

    /**
     * Internal administrator/developer notes.
     *
     * Do not expose this field through public bug-report responses.
     */
    internalNotes: text("internal_notes"),

    /**
     * Human-readable resolution supplied when the report is resolved,
     * closed, marked duplicate, or rejected.
     */
    resolution: text("resolution"),

    createdAt: integer("created_at", {
      mode: "timestamp",
    })
      .notNull()
      .default(sql`(unixepoch())`),

    updatedAt: integer("updated_at", {
      mode: "timestamp",
    })
      .notNull()
      .default(sql`(unixepoch())`),

    resolvedAt: integer("resolved_at", {
      mode: "timestamp",
    }),
  },
  (table) => [
    index("bug_reports_reporter_user_id_idx").on(table.reporterUserId),

    index("bug_reports_status_idx").on(table.status),

    index("bug_reports_severity_idx").on(table.severity),

    index("bug_reports_created_at_idx").on(table.createdAt),

    index("bug_reports_status_created_at_idx").on(
      table.status,
      table.createdAt,
    ),

    check(
      "bug_reports_title_not_empty",
      sql`length(trim(${table.title})) > 0`,
    ),

    check(
      "bug_reports_description_not_empty",
      sql`length(trim(${table.description})) > 0`,
    ),

    check(
      "bug_reports_severity_valid",
      sql`${table.severity} IN ('low', 'medium', 'high', 'critical')`,
    ),

    check(
      "bug_reports_status_valid",
      sql`${table.status} IN (
        'open',
        'triaged',
        'in_progress',
        'resolved',
        'closed',
        'duplicate',
        'wont_fix'
      )`,
    ),

    check(
      "bug_reports_platform_valid",
      sql`${table.platform} IN (
        'web',
        'android',
        'windows',
        'api',
        'unknown'
      )`,
    ),
  ],
);

export type BugReport = typeof bugReports.$inferSelect;

export type NewBugReport = typeof bugReports.$inferInsert;