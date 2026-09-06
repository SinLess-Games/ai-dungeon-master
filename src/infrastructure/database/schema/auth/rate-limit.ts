import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
/** Better Auth's shared rate-limit counters; lastRequest is milliseconds as a number. */
export const rateLimits = sqliteTable(
  "rate_limits",
  {
    id: text("id").primaryKey().notNull(),
    key: text("key").notNull(),
    count: integer("count").notNull(),
    lastRequest: integer("last_request").notNull(),
  },
  (table) => [uniqueIndex("rate_limits_key_uq").on(table.key)],
);
