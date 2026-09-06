import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { users } from "./user";

/** Better Auth provider identities. Account/NewAccount are internal persistence
 * types, not API DTOs: tokens and password verifiers must not be serialized. */
export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    // Required in 1.7.2. Better Auth supplies the real or synthetic issuer;
    // credential accounts use local:credential. Do not derive it here.
    issuer: text("issuer").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    // Better Auth-managed credential password hash/verifier, never plaintext.
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Provider aliases do not make a second identity for the same issuer/subject.
    uniqueIndex("accounts_issuer_account_id_uq").on(table.issuer, table.accountId),
    index("accounts_user_id_idx").on(table.userId),
  ],
);

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
