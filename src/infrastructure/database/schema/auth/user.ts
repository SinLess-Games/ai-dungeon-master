import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const userRoles = ["user", "admin"] as const;
export type UserRole = (typeof userRoles)[number];

/** Better Auth 1.7.2 user plus Admin plugin fields. Authentication identity only. */
export const users = sqliteTable(
  "users",
  {
    // Better Auth supplies IDs; its default IDs need not be UUIDs.
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    username: text("username"),
    displayUsername: text("display_username"),
    email: text("email").notNull(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
    image: text("image"),
    // Auth dates use milliseconds, unlike the game's Unix-second timestamps.
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date()),
    // Single application role. Campaign permissions and billing live elsewhere.
    role: text("role", { enum: userRoles }).notNull().default("user"),
    // Preserve the Admin plugin's nullable ban fields and its default false value.
    banned: integer("banned", { mode: "boolean" }).default(false),
    banReason: text("ban_reason"),
    banExpires: integer("ban_expires", { mode: "timestamp_ms" }),
  },
  (table) => [
    uniqueIndex("users_username_uq").on(table.username),
    check(
      "users_username_normalized",
      sql`${table.username} IS NULL OR (${table.username} = lower(trim(${table.username})) AND length(${table.username}) BETWEEN 3 AND 32 AND ${table.username} NOT GLOB '*[^a-z0-9_-]*')`,
    ),
    uniqueIndex("users_email_uq").on(table.email),
    check("users_role_valid", sql`${table.role} IN ('user', 'admin')`),
    check("users_email_verified_boolean", sql`${table.emailVerified} IN (0, 1)`),
    check("users_banned_boolean", sql`${table.banned} IN (0, 1)`),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
