import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  BLOG_STATUSES,
  type BlogPost,
  type BlogStatus,
  mapRow,
  slugify,
} from "@/lib/dev-blog";

const COLUMNS =
  "id, title, slug, subtitle, excerpt, content, cover_image_url, cover_image_alt, author_id, author_name, status, category, tags, seo_title, seo_description, og_image_url, featured_as_update, published_at, scheduled_at, created_at, updated_at";

function publicClient() {
  return createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

/** Rows readable by anyone: published, or scheduled with the time already passed. */
function liveFilter(query: any) {
  const now = new Date().toISOString();
  return query.or(`status.eq.published,and(status.eq.scheduled,scheduled_at.lte.${now})`);
}

function sortKey(p: BlogPost) {
  return new Date(p.publishedAt ?? p.scheduledAt ?? p.createdAt).getTime();
}

/* ------------------------------------------------------------------ public */

export const listPublicPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<BlogPost[]> => {
    const { data, error } = await liveFilter(
      publicClient().from("dev_blog_posts").select(COLUMNS),
    ).limit(300);
    if (error) throw new Error(error.message);
    return ((data ?? []) as any[]).map(mapRow).sort((a, b) => sortKey(b) - sortKey(a));
  },
);

export const getPublicPost = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => {
    if (!input?.slug) throw new Error("Missing slug");
    return input;
  })
  .handler(async ({ data }): Promise<{ post: BlogPost | null; siblings: BlogPost[] }> => {
    const all = await listPublicPosts();
    const post = all.find((p) => p.slug === data.slug) ?? null;
    return { post, siblings: all };
  });

/* ------------------------------------------------------------------- admin */

type Ctx = { supabase: any; userId: string };

async function assertAdmin(ctx: Ctx) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

async function actorName(ctx: Ctx) {
  const { data } = await ctx.supabase
    .from("profiles")
    .select("display_name")
    .eq("id", ctx.userId)
    .maybeSingle();
  return (data as any)?.display_name ?? "Admin";
}

async function audit(ctx: Ctx, action: string, postId: string | null, title: string) {
  await ctx.supabase.from("dev_blog_audit").insert({
    post_id: postId,
    post_title: title,
    action,
    actor_id: ctx.userId,
    actor_name: await actorName(ctx),
  });
}

export const listAllPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BlogPost[]> => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { data, error } = await ctx.supabase
      .from("dev_blog_posts")
      .select(COLUMNS)
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return ((data ?? []) as any[]).map(mapRow);
  });

export const getPostById = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("Missing id");
    return input;
  })
  .handler(async ({ data, context }): Promise<BlogPost | null> => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { data: row, error } = await ctx.supabase
      .from("dev_blog_posts")
      .select(COLUMNS)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? mapRow(row) : null;
  });

export interface SavePostInput {
  id?: string;
  title: string;
  slug?: string;
  subtitle?: string | null;
  excerpt?: string;
  content?: string;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  authorName?: string;
  status?: BlogStatus;
  category?: string;
  tags?: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
  featuredAsUpdate?: boolean;
  scheduledAt?: string | null;
}

async function uniqueSlug(ctx: Ctx, wanted: string, ignoreId?: string) {
  const base = slugify(wanted) || `entry-${Date.now()}`;
  let candidate = base;
  for (let n = 2; n < 60; n++) {
    let q = ctx.supabase.from("dev_blog_posts").select("id").eq("slug", candidate);
    if (ignoreId) q = q.neq("id", ignoreId);
    const { data } = await q.maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

export const savePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: SavePostInput) => {
    if (!input?.title?.trim()) throw new Error("A post needs a title");
    if (input.status && !BLOG_STATUSES.includes(input.status)) throw new Error("Unknown status");
    if (input.status === "scheduled" && !input.scheduledAt) {
      throw new Error("Pick a date and time for a scheduled post");
    }
    return input;
  })
  .handler(async ({ data, context }): Promise<{ id: string; slug: string }> => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);

    const status: BlogStatus = data.status ?? "draft";
    const slug = await uniqueSlug(ctx, data.slug?.trim() || data.title, data.id);

    const patch: Record<string, unknown> = {
      title: data.title.trim().slice(0, 200),
      slug,
      subtitle: data.subtitle?.trim() || null,
      excerpt: (data.excerpt ?? "").slice(0, 600),
      content: data.content ?? "",
      cover_image_url: data.coverImageUrl || null,
      cover_image_alt: data.coverImageAlt?.trim() || null,
      author_name: data.authorName?.trim() || (await actorName(ctx)),
      status,
      category: data.category || "Development",
      tags: (data.tags ?? []).map((t) => t.trim()).filter(Boolean).slice(0, 12),
      seo_title: data.seoTitle?.trim() || null,
      seo_description: data.seoDescription?.trim() || null,
      og_image_url: data.ogImageUrl || null,
      featured_as_update: !!data.featuredAsUpdate,
      scheduled_at: status === "scheduled" ? data.scheduledAt : null,
    };

    if (data.id) {
      const { data: before } = await ctx.supabase
        .from("dev_blog_posts")
        .select("status, published_at")
        .eq("id", data.id)
        .maybeSingle();
      const prev = before as any;
      if (status === "published") {
        patch["published_at"] = prev?.published_at ?? new Date().toISOString();
      } else if (status !== "scheduled") {
        patch["published_at"] = null;
      }
      const { error } = await ctx.supabase
        .from("dev_blog_posts")
        .update(patch)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      await audit(ctx, prev?.status !== status ? `status:${status}` : "updated", data.id, patch["title"] as string);
      return { id: data.id, slug };
    }

    if (status === "published") patch["published_at"] = new Date().toISOString();
    patch["author_id"] = ctx.userId;
    const { data: created, error } = await ctx.supabase
      .from("dev_blog_posts")
      .insert(patch)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await audit(ctx, "created", (created as any).id, patch["title"] as string);
    return { id: (created as any).id, slug };
  });

export const setPostStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: BlogStatus }) => {
    if (!input?.id) throw new Error("Missing id");
    if (!BLOG_STATUSES.includes(input.status)) throw new Error("Unknown status");
    return input;
  })
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { data: before } = await ctx.supabase
      .from("dev_blog_posts")
      .select("title, published_at")
      .eq("id", data.id)
      .maybeSingle();
    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === "published") {
      patch["published_at"] = (before as any)?.published_at ?? new Date().toISOString();
      patch["scheduled_at"] = null;
    }
    if (data.status === "draft") patch["published_at"] = null;
    const { error } = await ctx.supabase.from("dev_blog_posts").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit(ctx, `status:${data.status}`, data.id, (before as any)?.title ?? "");
    return { ok: true };
  });

export const duplicatePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("Missing id");
    return input;
  })
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { data: row, error } = await ctx.supabase
      .from("dev_blog_posts")
      .select(COLUMNS)
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) throw new Error(error?.message ?? "Post not found");
    const src = row as any;
    const title = `${src.title} (copy)`;
    const { data: created, error: insErr } = await ctx.supabase
      .from("dev_blog_posts")
      .insert({
        title,
        slug: await uniqueSlug(ctx, title),
        subtitle: src.subtitle,
        excerpt: src.excerpt,
        content: src.content,
        cover_image_url: src.cover_image_url,
        cover_image_alt: src.cover_image_alt,
        author_id: ctx.userId,
        author_name: src.author_name,
        status: "draft",
        category: src.category,
        tags: src.tags,
        seo_title: src.seo_title,
        seo_description: src.seo_description,
        og_image_url: src.og_image_url,
        featured_as_update: false,
      })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);
    await audit(ctx, "created", (created as any).id, title);
    return { id: (created as any).id };
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("Missing id");
    return input;
  })
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { data: before } = await ctx.supabase
      .from("dev_blog_posts")
      .select("title")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await ctx.supabase.from("dev_blog_posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit(ctx, "deleted", null, (before as any)?.title ?? "");
    return { ok: true };
  });

export interface AuditEntry {
  id: string;
  action: string;
  postTitle: string;
  actorName: string;
  createdAt: string;
}

export const listAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AuditEntry[]> => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { data, error } = await ctx.supabase
      .from("dev_blog_audit")
      .select("id, action, post_title, actor_name, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return ((data ?? []) as any[]).map((r) => ({
      id: r.id,
      action: r.action,
      postTitle: r.post_title,
      actorName: r.actor_name,
      createdAt: r.created_at,
    }));
  });
