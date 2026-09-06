import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { uuid, timestamps, nonEmpty, booleanCheck } from "./schemaUtils";

export const sources = sqliteTable(
  "dnd35_sources",
  {
    id: uuid(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    abbreviation: text("abbreviation"),
    publisher: text("publisher"),
    system: text("system").notNull().default("dnd"),
    edition: text("edition").notNull().default("3.5"),
    description: text("description"),
    url: text("url"),
    isOfficial: integer("is_official", { mode: "boolean" }).notNull().default(false),
    isHomebrew: integer("is_homebrew", { mode: "boolean" }).notNull().default(false),
    /** Auth ownership is validated by services until an auth schema exists. */
    ownerUserId: text("owner_user_id"),
    ...timestamps(),
  },
  (t) => [
    check(
      "dnd35_sources_is_official_integer",
      sql`${t.isOfficial} is null or typeof(${t.isOfficial}) = 'integer'`,
    ),
    check(
      "dnd35_sources_is_homebrew_integer",
      sql`${t.isHomebrew} is null or typeof(${t.isHomebrew}) = 'integer'`,
    ),
    uniqueIndex("dnd35_sources_slug_owner_uq").on(t.slug, t.ownerUserId),
    uniqueIndex("dnd35_sources_slug_shared_uq")
      .on(t.slug)
      .where(sql`${t.ownerUserId} is null`),
    index("dnd35_sources_owner_idx").on(t.ownerUserId),
    nonEmpty("dnd35_sources_slug_nonempty", t.slug),
    nonEmpty("dnd35_sources_name_nonempty", t.name),
    nonEmpty("dnd35_sources_owner_nonempty", t.ownerUserId),
    booleanCheck("dnd35_sources_official_bool", t.isOfficial),
    booleanCheck("dnd35_sources_homebrew_bool", t.isHomebrew),
    check("dnd35_sources_origin_valid", sql`not (${t.isOfficial} = 1 and ${t.isHomebrew} = 1)`),
  ],
);
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
