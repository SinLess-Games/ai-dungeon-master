import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";
import { and, eq, desc, count } from "drizzle-orm";
import { createDatabase } from "@/infrastructure/database/client";
import {
  blogPosts as posts,
  blogMedia as media,
  blogComments as comments,
} from "@/infrastructure/database/schema/devblog";
import { createAuth } from "@/modules/auth/server/auth";
import { requireAdmin } from "@/modules/auth/server/requireAuth";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ServiceUnavailableError,
} from "@/server/middleware/errors";
import { postSchema, pageSchema } from "../domain/schemas";
import { type BlogEnv, sameOrigin, parseBody } from "./shared";

export const devblogAdminRoutes = new Hono<BlogEnv>()
  .use("/api/admin/devblog/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    const { user } = await requireAdmin(createAuth(c.env), c.req.raw.headers);
    c.set("adminId", user.id);
    if (c.req.method !== "GET") sameOrigin(c);
    await next();
  })
  .use(
    "/api/admin/devblog/*",
    bodyLimit({
      maxSize: 6 * 1024 * 1024,
      onError: (c) => c.json({ error: { message: "Upload is too large." } }, 413),
    }),
  )
  .get("/api/admin/devblog/posts", async (c) => {
    const parsed = z
      .object({
        page: pageSchema,
        status: z.enum(["all", "draft", "published", "archived"]).default("all"),
      })
      .safeParse(c.req.query());
    if (!parsed.success) throw new BadRequestError("Invalid filters.");
    const db = createDatabase(c.env.DB!);
    const filter = parsed.data.status === "all" ? undefined : eq(posts.status, parsed.data.status);
    const [items, total] = await Promise.all([
      db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          status: posts.status,
          updatedAt: posts.updatedAt,
        })
        .from(posts)
        .where(filter)
        .orderBy(desc(posts.updatedAt), posts.id)
        .limit(20)
        .offset(parsed.data.page * 20)
        .all(),
      db.select({ value: count() }).from(posts).where(filter).get(),
    ]);
    return c.json({ items, total: total?.value ?? 0 });
  })
  .post("/api/admin/devblog/posts", zValidator("json", postSchema), async (c) => {
    const input = await parseBody(c, postSchema);
    if (input.coverImageId) throw new BadRequestError("Create the post before adding media.");
    const db = createDatabase(c.env.DB!);
    const id = crypto.randomUUID();
    const now = Date.now();
    const inserted = await db
      .insert(posts)
      .values({
        ...input,
        id,
        authorUserId: c.get("adminId"),
        createdAt: now,
        updatedAt: now,
        publishedAt: input.status === "published" ? now : null,
        archivedAt: input.status === "archived" ? now : null,
      })
      .onConflictDoNothing({ target: posts.slug })
      .returning({ id: posts.id })
      .get();
    if (!inserted) throw new ConflictError("This slug is already in use.");
    return c.json({ id }, 201);
  })
  .get("/api/admin/devblog/posts/:id", async (c) => {
    const db = createDatabase(c.env.DB!);
    const post = await db
      .select()
      .from(posts)
      .where(eq(posts.id, c.req.param("id")))
      .get();
    if (!post) throw new NotFoundError();
    const images = await db
      .select({ id: media.id, alt: media.alt, width: media.width, height: media.height })
      .from(media)
      .where(eq(media.postId, post.id))
      .all();
    return c.json({ post, images });
  })
  .put("/api/admin/devblog/posts/:id", zValidator("json", postSchema), async (c) => {
    const input = await parseBody(c, postSchema);
    const db = createDatabase(c.env.DB!);
    const id = c.req.param("id");
    const existing = await db.select().from(posts).where(eq(posts.id, id)).get();
    if (!existing) throw new NotFoundError();
    if (input.updatedAt !== existing.updatedAt)
      throw new ConflictError("This post changed in another window. Reload before saving.");
    if (
      input.coverImageId &&
      !(await db
        .select({ id: media.id })
        .from(media)
        .where(and(eq(media.id, input.coverImageId), eq(media.postId, id)))
        .get())
    )
      throw new BadRequestError("Choose a cover uploaded to this post.");
    if (
      input.slug !== existing.slug &&
      (await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, input.slug)).get())
    )
      throw new ConflictError("This slug is already in use.");
    try {
      const updated = await db
        .update(posts)
        .set({
          ...input,
          updatedAt: Math.max(Date.now(), existing.updatedAt + 1),
          publishedAt:
            input.status === "published"
              ? existing.publishedAt || Date.now()
              : existing.publishedAt,
          archivedAt: input.status === "archived" ? existing.archivedAt || Date.now() : null,
        })
        .where(and(eq(posts.id, id), eq(posts.updatedAt, existing.updatedAt)))
        .returning({ id: posts.id })
        .get();
      if (!updated)
        throw new ConflictError("This post changed in another window. Reload before saving.");
    } catch (error) {
      if (String(error).includes("UNIQUE")) throw new ConflictError("This slug is already in use.");
      throw error;
    }
    return c.json({ id });
  })
  .post(
    "/api/admin/devblog/posts/:id/media",
    zValidator(
      "form",
      z.object({ file: z.custom<File>(), alt: z.string(), width: z.string(), height: z.string() }),
    ),
    async (c) => {
      if (!c.env.R2_BUCKET) throw new ServiceUnavailableError("Image storage is unavailable.");
      const db = createDatabase(c.env.DB!);
      const postId = c.req.param("id");
      if (!(await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).get()))
        throw new NotFoundError();
      const form = await c.req.formData();
      const file = form.get("file");
      const alt = z.string().trim().min(1).max(300).safeParse(form.get("alt"));
      if (!(file instanceof File) || !alt.success || file.size === 0 || file.size > 5 * 1024 * 1024)
        throw new BadRequestError("Choose an image up to 5 MB and provide alt text.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const mime =
        bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
          ? "image/png"
          : bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
            ? "image/jpeg"
            : new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
                new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
              ? "image/webp"
              : null;
      if (!mime || mime !== file.type)
        throw new BadRequestError("Only PNG, JPEG, and WebP images are supported.");
      const dimension = z.coerce.number().int().min(1).max(20000);
      const width = dimension.safeParse(form.get("width"));
      const height = dimension.safeParse(form.get("height"));
      const id = crypto.randomUUID();
      const objectKey = "devblog/" + postId + "/" + id;
      await c.env.R2_BUCKET.put(objectKey, bytes, { httpMetadata: { contentType: mime } });
      try {
        await db.insert(media).values({
          id,
          postId,
          ownerUserId: c.get("adminId"),
          objectKey,
          alt: alt.data,
          mimeType: mime,
          size: file.size,
          width: width.success ? width.data : null,
          height: height.success ? height.data : null,
          createdAt: Date.now(),
        });
      } catch (error) {
        await c.env.R2_BUCKET.delete(objectKey);
        throw error;
      }
      return c.json({ id, alt: alt.data }, 201);
    },
  )
  .get("/api/admin/devblog/comments", async (c) => {
    const parsed = z
      .object({
        page: pageSchema,
        status: z.enum(["pending", "approved", "rejected"]).default("pending"),
      })
      .safeParse(c.req.query());
    if (!parsed.success) throw new BadRequestError("Invalid filters.");
    const db = createDatabase(c.env.DB!);
    const filter = eq(comments.status, parsed.data.status);
    const [items, total] = await Promise.all([
      db
        .select({
          id: comments.id,
          authorName: comments.authorName,
          body: comments.body,
          status: comments.status,
          createdAt: comments.createdAt,
          postTitle: posts.title,
          postId: posts.id,
        })
        .from(comments)
        .innerJoin(posts, eq(posts.id, comments.postId))
        .where(filter)
        .orderBy(desc(comments.createdAt), comments.id)
        .limit(20)
        .offset(parsed.data.page * 20)
        .all(),
      db.select({ value: count() }).from(comments).where(filter).get(),
    ]);
    return c.json({ items, total: total?.value ?? 0 });
  })
  .put(
    "/api/admin/devblog/comments/:id",
    zValidator("json", z.object({ status: z.enum(["pending", "approved", "rejected"]) })),
    async (c) => {
      const input = await parseBody(
        c,
        z.object({ status: z.enum(["pending", "approved", "rejected"]) }),
      );
      const item = await createDatabase(c.env.DB!)
        .update(comments)
        .set({ status: input.status, moderatedBy: c.get("adminId"), moderatedAt: Date.now() })
        .where(eq(comments.id, c.req.param("id")))
        .returning({ id: comments.id })
        .get();
      if (!item) throw new NotFoundError();
      return c.json(item);
    },
  );
