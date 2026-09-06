import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index, uniqueIndex, check } from "drizzle-orm/sqlite-core";
import { users } from "../auth";
export const blogPosts = sqliteTable(
  "devblog_posts",
  {
    id: text("id").primaryKey(),
    authorUserId: text("author_user_id").references(() => users.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    markdown: text("markdown").notNull().default(""),
    status: text("status", { enum: ["draft", "published", "archived"] })
      .notNull()
      .default("draft"),
    coverImageId: text("cover_image_id"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    publishedAt: integer("published_at"),
    archivedAt: integer("archived_at"),
  },
  (t) => [
    uniqueIndex("devblog_slug_unique").on(t.slug),
    index("devblog_publication_idx").on(t.status, t.publishedAt),
    check("devblog_status_valid", sql`${t.status} IN ('draft','published','archived')`),
  ],
);
export const blogMedia = sqliteTable(
  "devblog_media",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    ownerUserId: text("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    objectKey: text("object_key").notNull().unique(),
    alt: text("alt").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    width: integer("width"),
    height: integer("height"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("devblog_media_post_idx").on(t.postId)],
);
export const blogComments = sqliteTable(
  "devblog_comments",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    status: text("status", { enum: ["pending", "approved", "rejected"] })
      .notNull()
      .default("pending"),
    rateKey: text("rate_key").notNull(),
    createdAt: integer("created_at").notNull(),
    moderatedAt: integer("moderated_at"),
    moderatedBy: text("moderated_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [
    index("devblog_comment_public_idx").on(t.postId, t.status, t.createdAt),
    index("devblog_comment_moderation_idx").on(t.status, t.createdAt),
    index("devblog_comment_rate_idx").on(t.rateKey, t.createdAt),
    check("devblog_comment_status_valid", sql`${t.status} IN ('pending','approved','rejected')`),
  ],
);
