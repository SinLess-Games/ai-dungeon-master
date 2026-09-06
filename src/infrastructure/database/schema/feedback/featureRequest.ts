import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

/**
 * Lifecycle state for a feature request.
 */
export const featureRequestStatuses = [
  "submitted",
  "under_review",
  "planned",
  "in_progress",
  "completed",
  "declined",
  "duplicate",
] as const;

export type FeatureRequestStatus =
  (typeof featureRequestStatuses)[number];

/**
 * Broad product area affected by the request.
 */
export const featureRequestCategories = [
  "gameplay",
  "ai",
  "rules",
  "maps",
  "multiplayer",
  "characters",
  "worlds",
  "campaigns",
  "content",
  "ui",
  "mobile",
  "desktop",
  "billing",
  "account",
  "performance",
  "accessibility",
  "other",
] as const;

export type FeatureRequestCategory =
  (typeof featureRequestCategories)[number];

/**
 * Product value classification.
 *
 * This is intentionally different from development priority.
 */
export const featureRequestImpacts = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type FeatureRequestImpact =
  (typeof featureRequestImpacts)[number];

/**
 * Platform from which the request originated or primarily applies.
 */
export const featureRequestPlatforms = [
  "web",
  "android",
  "windows",
  "cross_platform",
  "api",
  "unknown",
] as const;

export type FeatureRequestPlatform =
  (typeof featureRequestPlatforms)[number];

/**
 * Optional contextual metadata captured with the request.
 */
export interface FeatureRequestContext {
  route?: string;

  appVersion?: string;
  buildId?: string;

  worldId?: string;
  campaignId?: string;
  characterId?: string;

  useCase?: string;

  additional?: Record<string, unknown>;
}

export const featureRequests = sqliteTable(
  "feature_requests",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    /**
     * Better Auth user ID.
     *
     * Nullable so public or pre-auth feedback can still be accepted.
     */
    requesterUserId: text("requester_user_id"),

    title: text("title").notNull(),

    description: text("description").notNull(),

    /**
     * The problem the requester is trying to solve.
     *
     * Keeping this separate from the proposed solution makes requests
     * much more useful during product planning.
     */
    problem: text("problem"),

    /**
     * Optional user-proposed implementation or behavior.
     */
    proposedSolution: text("proposed_solution"),

    category: text("category")
      .$type<FeatureRequestCategory>()
      .notNull()
      .default("other"),

    impact: text("impact")
      .$type<FeatureRequestImpact>()
      .notNull()
      .default("medium"),

    status: text("status")
      .$type<FeatureRequestStatus>()
      .notNull()
      .default("submitted"),

    platform: text("platform")
      .$type<FeatureRequestPlatform>()
      .notNull()
      .default("unknown"),

    /**
     * Cached vote count.
     *
     * Individual votes should eventually live in a separate
     * feature_request_votes table so a user cannot vote repeatedly.
     */
    voteCount: integer("vote_count")
      .notNull()
      .default(0),

    context: text("context", {
      mode: "json",
    }).$type<FeatureRequestContext>(),

    /**
     * Internal product/developer notes.
     *
     * Never expose this field from public API responses.
     */
    internalNotes: text("internal_notes"),

    /**
     * Optional explanation when a request is completed, declined,
     * or marked as a duplicate.
     */
    resolution: text("resolution"),

    /**
     * If this request duplicates another request, reference the canonical
     * request ID here.
     */
    duplicateOfId: text("duplicate_of_id"),

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

    completedAt: integer("completed_at", {
      mode: "timestamp",
    }),
  },
  (table) => [
    index("feature_requests_requester_user_id_idx").on(
      table.requesterUserId,
    ),

    index("feature_requests_status_idx").on(table.status),

    index("feature_requests_category_idx").on(table.category),

    index("feature_requests_impact_idx").on(table.impact),

    index("feature_requests_created_at_idx").on(table.createdAt),

    index("feature_requests_status_created_at_idx").on(
      table.status,
      table.createdAt,
    ),

    index("feature_requests_category_status_idx").on(
      table.category,
      table.status,
    ),

    index("feature_requests_duplicate_of_id_idx").on(
      table.duplicateOfId,
    ),

    check(
      "feature_requests_title_not_empty",
      sql`length(trim(${table.title})) > 0`,
    ),

    check(
      "feature_requests_description_not_empty",
      sql`length(trim(${table.description})) > 0`,
    ),

    check(
      "feature_requests_vote_count_non_negative",
      sql`${table.voteCount} >= 0`,
    ),

    check(
      "feature_requests_category_valid",
      sql`${table.category} IN (
        'gameplay',
        'ai',
        'rules',
        'maps',
        'multiplayer',
        'characters',
        'worlds',
        'campaigns',
        'content',
        'ui',
        'mobile',
        'desktop',
        'billing',
        'account',
        'performance',
        'accessibility',
        'other'
      )`,
    ),

    check(
      "feature_requests_impact_valid",
      sql`${table.impact} IN (
        'low',
        'medium',
        'high',
        'critical'
      )`,
    ),

    check(
      "feature_requests_status_valid",
      sql`${table.status} IN (
        'submitted',
        'under_review',
        'planned',
        'in_progress',
        'completed',
        'declined',
        'duplicate'
      )`,
    ),

    check(
      "feature_requests_platform_valid",
      sql`${table.platform} IN (
        'web',
        'android',
        'windows',
        'cross_platform',
        'api',
        'unknown'
      )`,
    ),
  ],
);

export type FeatureRequest =
  typeof featureRequests.$inferSelect;

export type NewFeatureRequest =
  typeof featureRequests.$inferInsert;