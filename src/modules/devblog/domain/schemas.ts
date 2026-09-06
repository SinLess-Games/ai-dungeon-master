import { z } from "zod";
export const slugify = (title: string) =>
  title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100)
    .replace(/-$/, "");
export const postSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .refine((value) => value !== "admin", "This slug is reserved."),
    excerpt: z.string().trim().max(500),
    markdown: z.string().max(100000),
    status: z.enum(["draft", "published", "archived"]),
    coverImageId: z.string().uuid().nullable(),
    updatedAt: z.number().int().optional(),
  })
  .refine(
    (p) => p.status !== "published" || (p.markdown.trim().length >= 10 && p.excerpt.length >= 10),
    {
      message: "Published posts need an excerpt and body of at least 10 characters.",
    },
  );
export const commentSchema = z.object({
  authorName: z.string().trim().max(60).default(""),
  body: z.string().trim().min(3).max(3000),
  website: z.string().max(200).default(""),
});
export const pageSchema = z.coerce.number().int().min(0).max(10000).default(0);
export const mediaUrl = (id: string) => "/api/devblog/media/" + id;
