import { sql } from "drizzle-orm";
import { index, integer, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { sources } from "./source";
import { booleanCheck, nonEmpty, timestamps, uuid } from "./schemaUtils";

/** Direct source FKs keep citations enforceable and queryable. Every definition
 * belongs to a source (including a user's homebrew catalog). Alternate printings
 * are separate source-scoped definitions. No untyped entityType/entityId registry.
 * Names may repeat; slugs are unique within source and owner, including NULL owner.
 * Repositories enforce source/content ownership authorization. */
export const contentColumns = () => ({
  id: uuid(),
  sourceId: text("source_id")
    .notNull()
    .references(() => sources.id, { onDelete: "restrict" }),
  sourcePage: text("source_page"),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  rulesText: text("rules_text").notNull().default(""),
  isHomebrew: integer("is_homebrew", { mode: "boolean" }).notNull().default(false),
  ownerUserId: text("owner_user_id"),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
  ...timestamps(),
});
interface ContentColumns {
  sourceId: AnySQLiteColumn;
  slug: AnySQLiteColumn;
  name: AnySQLiteColumn;
  ownerUserId: AnySQLiteColumn;
  isHomebrew: AnySQLiteColumn;
  isEnabled: AnySQLiteColumn;
}
export const contentChecks = (prefix: string, t: ContentColumns) => [
  uniqueIndex(`${prefix}_source_slug_owner_uq`).on(t.sourceId, t.slug, t.ownerUserId),
  // SQLite considers NULLs distinct: a partial index protects the shared catalog too.
  uniqueIndex(`${prefix}_source_slug_shared_uq`)
    .on(t.sourceId, t.slug)
    .where(sql`${t.ownerUserId} is null`),
  index(`${prefix}_slug_idx`).on(t.slug),
  index(`${prefix}_owner_idx`).on(t.ownerUserId),
  nonEmpty(`${prefix}_slug_nonempty`, t.slug),
  nonEmpty(`${prefix}_name_nonempty`, t.name),
  nonEmpty(`${prefix}_owner_nonempty`, t.ownerUserId),
  booleanCheck(`${prefix}_homebrew_bool`, t.isHomebrew),
  booleanCheck(`${prefix}_enabled_bool`, t.isEnabled),
];
/** Shared citation/ownership projection; concrete entity types are inferred per table. */
export interface ContentReference {
  sourceId: string;
  sourcePage: string | null;
  slug: string;
  ownerUserId: string | null;
  isHomebrew: boolean;
}
