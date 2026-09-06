import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { and, eq, desc, count, sql } from "drizzle-orm";
import { createDatabase } from "@/infrastructure/database/client";
import {
  blogPosts as posts,
  blogComments as comments,
  blogMedia as media,
} from "@/infrastructure/database/schema/devblog";
import { users } from "@/infrastructure/database/schema/auth";
import { createAuth } from "@/modules/auth/server/auth";
import { requireAdmin } from "@/modules/auth/server/requireAuth";
import { BadRequestError, NotFoundError, RateLimitedError } from "@/server/middleware/errors";
import { commentSchema, pageSchema } from "../domain/schemas";
import { type BlogEnv, sameOrigin, parseBody } from "./shared";

const publicFields = {
  id: posts.id,
  title: posts.title,
  slug: posts.slug,
  excerpt: posts.excerpt,
  coverImageId: posts.coverImageId,
  coverAlt: media.alt,
  publishedAt: posts.publishedAt,
  updatedAt: posts.updatedAt,
  author: users.name,
};
export const devblogRoutes = new Hono<BlogEnv>()
  .use("/api/devblog/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/devblog/posts", async (c) => {
    const parsed = pageSchema.safeParse(c.req.query("page"));
    if (!parsed.success) throw new BadRequestError("Invalid page.");
    const db = createDatabase(c.env.DB!);
    const visible = eq(posts.status, "published");
    const [items, total] = await Promise.all([
      db
        .select(publicFields)
        .from(posts)
        .leftJoin(users, eq(users.id, posts.authorUserId))
        .leftJoin(media, eq(media.id, posts.coverImageId))
        .where(visible)
        .orderBy(desc(posts.publishedAt), posts.id)
        .limit(12)
        .offset(parsed.data * 12)
        .all(),
      db.select({ value: count() }).from(posts).where(visible).get(),
    ]);
    return c.json({ items, total: total?.value ?? 0, page: parsed.data, pageSize: 12 });
  })
  .get("/api/devblog/posts/:slug", async (c) => {
    const db = createDatabase(c.env.DB!);
    const post = await db
      .select({ ...publicFields, markdown: posts.markdown, createdAt: posts.createdAt })
      .from(posts)
      .leftJoin(users, eq(users.id, posts.authorUserId))
      .leftJoin(media, eq(media.id, posts.coverImageId))
      .where(and(eq(posts.slug, c.req.param("slug")), eq(posts.status, "published")))
      .get();
    if (!post) throw new NotFoundError("This post is unavailable.");
    return c.json(post);
  })
  .get(
    "/api/devblog/posts/:id/comments",
    zValidator("query", z.object({ page: pageSchema })),
    async (c) => {
      const db = createDatabase(c.env.DB!);
      const page = pageSchema.safeParse(c.req.query("page"));
      if (!page.success) throw new BadRequestError("Invalid page.");
      const post = await db
        .select({ id: posts.id })
        .from(posts)
        .where(and(eq(posts.id, c.req.param("id")), eq(posts.status, "published")))
        .get();
      if (!post) throw new NotFoundError();
      const visible = and(eq(comments.postId, post.id), eq(comments.status, "approved"));
      const [items, total] = await Promise.all([
        db
          .select({
            id: comments.id,
            authorName: comments.authorName,
            body: comments.body,
            createdAt: comments.createdAt,
          })
          .from(comments)
          .where(visible)
          .orderBy(desc(comments.createdAt), comments.id)
          .limit(20)
          .offset(page.data * 20)
          .all(),
        db.select({ value: count() }).from(comments).where(visible).get(),
      ]);
      return c.json({ items, total: total?.value ?? 0, page: page.data });
    },
  )
  .post(
    "/api/devblog/posts/:id/comments",
    bodyLimit({
      maxSize: 20000,
      onError: (c) => c.json({ error: { message: "Comment is too large." } }, 413),
    }),
    zValidator("json", commentSchema),
    async (c) => {
      sameOrigin(c);
      const input = await parseBody(c, commentSchema);
      if (input.website) throw new BadRequestError("Unable to submit comment.");
      const session = await createAuth(c.env).api.getSession({
        headers: c.req.raw.headers,
        query: { disableCookieCache: true },
      });
      const name = session?.user.name || input.authorName;
      if (!name.trim()) throw new BadRequestError("Enter your name.");
      const db = createDatabase(c.env.DB!);
      const postId = c.req.param("id");
      const post = await db
        .select({ id: posts.id })
        .from(posts)
        .where(and(eq(posts.id, postId), eq(posts.status, "published")))
        .get();
      if (!post) throw new NotFoundError();
      // HMAC avoids retaining raw IP addresses. Atomic INSERT protects the limit across isolates.
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(c.env.BETTER_AUTH_SECRET!),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const identity = session
        ? "user:" + session.user.id
        : "ip:" + (c.req.header("cf-connecting-ip") || "local");
      const rateKey = Array.from(
        new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(identity))),
      )
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("");
      const id = crypto.randomUUID();
      const now = Date.now();
      const result =
        await db.run(sql`INSERT INTO devblog_comments (id,post_id,user_id,author_name,body,status,rate_key,created_at)
      SELECT ${id},${postId},${session?.user.id ?? null},${name.slice(0, 60)},${input.body},'pending',${rateKey},${now}
      WHERE (SELECT count(*) FROM devblog_comments WHERE rate_key=${rateKey} AND created_at > ${now - 3600000}) < 5
      AND EXISTS (SELECT 1 FROM devblog_posts WHERE id=${postId} AND status='published')`);
      if (!result.meta.changes)
        throw new RateLimitedError("Please wait before submitting more comments.");
      return c.json({ id, status: "pending" as const }, 201);
    },
  )
  .get("/api/devblog/media/:id", async (c) => {
    const db = createDatabase(c.env.DB!);
    const item = await db
      .select({ media, status: posts.status })
      .from(media)
      .innerJoin(posts, eq(posts.id, media.postId))
      .where(eq(media.id, c.req.param("id")))
      .get();
    if (!item) throw new NotFoundError();
    if (item.status !== "published") await requireAdmin(createAuth(c.env), c.req.raw.headers);
    const object = await c.env.R2_BUCKET?.get(item.media.objectKey);
    if (!object) throw new NotFoundError();
    return new Response(object.body, {
      headers: {
        "Content-Type": item.media.mimeType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  });
