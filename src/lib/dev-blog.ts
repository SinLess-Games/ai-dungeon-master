/** Shared, client-safe helpers and types for the Developer Chronicle. */

export const BLOG_CATEGORIES = [
  "Development",
  "Devlog",
  "Features",
  "AI DM",
  "Worldbuilding",
  "Aeragorn",
  "D&D 3.5",
  "Rules Engine",
  "Patch Notes",
  "Infrastructure",
  "Community",
] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export const BLOG_STATUSES = ["draft", "scheduled", "published", "archived"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  authorId: string | null;
  authorName: string;
  status: BlogStatus;
  category: string;
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  featuredAsUpdate: boolean;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  readingMinutes: number;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

/** Rough reading time in minutes at ~220 words per minute. */
export function readingMinutes(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** A post is visible to the public when published, or scheduled and its time has passed. */
export function isLive(post: { status: string; scheduledAt?: string | null }) {
  if (post.status === "published") return true;
  return (
    post.status === "scheduled" &&
    !!post.scheduledAt &&
    new Date(post.scheduledAt).getTime() <= Date.now()
  );
}

export function formatDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function excerptFrom(content: string, fallbackLength = 180) {
  const plain = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > fallbackLength ? `${plain.slice(0, fallbackLength).trim()}…` : plain;
}

export function mapRow(row: any): BlogPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    subtitle: row.subtitle ?? null,
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    coverImageUrl: row.cover_image_url ?? null,
    coverImageAlt: row.cover_image_alt ?? null,
    authorId: row.author_id ?? null,
    authorName: row.author_name ?? "The Endless Codex",
    status: row.status,
    category: row.category ?? "Development",
    tags: row.tags ?? [],
    seoTitle: row.seo_title ?? null,
    seoDescription: row.seo_description ?? null,
    ogImageUrl: row.og_image_url ?? null,
    featuredAsUpdate: !!row.featured_as_update,
    publishedAt: row.published_at ?? null,
    scheduledAt: row.scheduled_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    readingMinutes: readingMinutes(row.content ?? ""),
  };
}
