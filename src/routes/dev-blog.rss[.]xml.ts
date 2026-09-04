import { createFileRoute } from "@tanstack/react-router";
import { listPublicPosts } from "@/lib/dev-blog.functions";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const Route = createFileRoute("/dev-blog/rss/xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const host = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
        const origin = host ? `https://${host}` : url.origin;

        const posts = (await listPublicPosts()).slice(0, 25);
        const items = posts
          .map((p) => {
            const link = `${origin}/dev-blog/${p.slug}`;
            const date = new Date(p.publishedAt ?? p.createdAt).toUTCString();
            return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${date}</pubDate>
      <category>${escapeXml(p.category)}</category>
      <description>${escapeXml(p.excerpt)}</description>
    </item>`;
          })
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>The Endless Codex — Developer Chronicle</title>
    <link>${escapeXml(`${origin}/dev-blog`)}</link>
    <description>Development updates, feature previews and patch notes from The Endless Codex.</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=600",
          },
        });
      },
    },
  },
});
