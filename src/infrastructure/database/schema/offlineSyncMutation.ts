import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export type OfflineSyncRequestMethod = "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Idempotency receipts for queued browser mutations replayed after reconnect.
 *
 * The browser generates the mutation id. The server stores the first successful
 * response so a lost response/retry cannot create duplicate campaign or
 * character state.
 */
export const offlineSyncMutations = sqliteTable(
  "offline_sync_mutations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    requestMethod: text("request_method").$type<OfflineSyncRequestMethod>().notNull(),
    requestPath: text("request_path").notNull(),
    responseStatus: integer("response_status").notNull(),
    responseHeaders: text("response_headers", { mode: "json" })
      .$type<Record<string, string>>()
      .notNull()
      .$defaultFn(() => ({})),
    responseBody: text("response_body"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("offline_sync_mutations_user_created_idx").on(table.userId, table.createdAt),
    check(
      "offline_sync_mutations_method_valid",
      sql`${table.requestMethod} IN ('POST', 'PUT', 'PATCH', 'DELETE')`,
    ),
    check("offline_sync_mutations_user_not_empty", sql`length(trim(${table.userId})) > 0`),
    check(
      "offline_sync_mutations_path_not_empty",
      sql`length(trim(${table.requestPath})) > 0`,
    ),
  ],
);

export type OfflineSyncMutationReceipt = typeof offlineSyncMutations.$inferSelect;
