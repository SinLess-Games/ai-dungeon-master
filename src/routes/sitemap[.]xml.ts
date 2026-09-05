import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://endless-codex.sinlessindustries.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/wiki", changefreq: "weekly", priority: "0.9" },
  { path: "/dev-blog", changefreq: "weekly", priority: "0.8" },
  { path: "/characters", changefreq: "monthly", priority: "0.7" },
  { path: "/campaigns", changefreq: "monthly", priority: "0.7" },
  { path: "/worlds", changefreq: "monthly", priority: "0.7" },
  { path: "/dice", changefreq: "monthly", priority: "0.6" },
  { path: "/upgrade", changefreq: "monthly", priority: "0.6" },
  { path: "/auth", changefreq: "yearly", priority: "0.3" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [...STATIC_ENTRIES];

        try {
          const { createClient } = await import("@supabase/supabase-js");
          const key = process.env['SUPABASE_PUBLISHABLE_KEY'] ?? process.env['VITE_SUPABASE_PUBLISHABLE_KEY']!;
          const url = process.env['SUPABASE_URL'] ?? process.env['VITE_SUPABASE_URL']!;
          const supabase = createClient(url, key, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: {
              fetch: (input, init) => {
                const headers = new Headers(init?.headers);
                if (key.startsWith("sb_") && headers.get("Authorization") === "Bearer " + key) {
                  headers.delete("Authorization");
                }
                headers.set("apikey", key);
                return fetch(input, { ...init, headers });
              },
            },
          });

          const pageSize = 1000;
          for (let offset = 0; ; offset += pageSize) {
            const { data, error } = await supabase
              .from("dev_blog_posts")
              .select("slug, updated_at, published_at")
              .eq("status", "published")
              .order("published_at", { ascending: false })
              .range(offset, offset + pageSize - 1);
            if (error) throw error;
            const rows = data ?? [];
            entries.push(
              ...rows.map((post) => ({
                path: `/dev-blog/${encodeURIComponent(post.slug as string)}`,
                lastmod: (post.updated_at as string | null) ?? undefined,
                changefreq: "monthly" as const,
                priority: "0.7",
              })),
            );
            if (rows.length < pageSize) break;
          }
        } catch {
          // Blog entries are optional in the sitemap; static routes still ship.
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
