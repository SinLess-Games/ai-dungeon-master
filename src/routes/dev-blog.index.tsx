import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { PostCard } from "@/components/blog/PostCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listPublicPosts } from "@/lib/dev-blog.functions";

const PAGE_SIZE = 6;

export const Route = createFileRoute("/dev-blog/")({
  loader: () => listPublicPosts(),
  head: () => ({
    meta: [
      { title: "Developer Chronicle — The Endless Codex" },
      {
        name: "description",
        content:
          "Development updates, feature previews, technical notes, worldbuilding entries and patch notes from the makers of The Endless Codex.",
      },
      { property: "og:title", content: "Developer Chronicle — The Endless Codex" },
      {
        property: "og:description",
        content:
          "Behind-the-scenes development log for The Endless Codex, the AI Dungeon Master for D&D 3.5.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://endless-codex.sinlessindustries.com/dev-blog" },
    ],
    links: [{ rel: "canonical", href: "https://endless-codex.sinlessindustries.com/dev-blog" }],
  }),
  component: DevBlogIndex,
});

function DevBlogIndex() {
  const posts = Route.useLoaderData();
  const [category, setCategory] = useState<string>("All");
  const [tag, setTag] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE_SIZE);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(posts.map((p) => p.category))).sort()],
    [posts],
  );
  const tags = useMemo(
    () => Array.from(new Set(posts.flatMap((p) => p.tags))).sort().slice(0, 24),
    [posts],
  );

  const filtered = useMemo(
    () =>
      posts.filter(
        (p) =>
          (category === "All" || p.category === category) && (!tag || p.tags.includes(tag)),
      ),
    [posts, category, tag],
  );

  const featured = filtered[0];
  const rest = filtered.slice(1, shown);

  return (
    <AppShell>
      <PageTitle
        title="The Endless Codex — Developer Chronicle"
        subtitle="Development updates, feature previews, technical notes, worldbuilding entries, patch notes and behind-the-scenes posts, recorded as they happen."
      />

      {posts.length === 0 ? (
        <Card className="border-primary/25 bg-card/70">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <ScrollText className="size-8 text-primary/70" />
            <h2 className="font-display text-xl text-foreground">The chronicle is blank</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              No entries have been published yet. Check back soon — the scriptorium is busy.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCategory(c);
                  setShown(PAGE_SIZE);
                }}
                className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.14em] transition-colors ${
                  category === c
                    ? "border-primary/70 bg-primary/15 text-primary"
                    : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {tags.length ? (
            <div className="mb-8 flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTag(tag === t ? null : t);
                    setShown(PAGE_SIZE);
                  }}
                  className={`text-[0.7rem] uppercase tracking-[0.16em] transition-colors ${
                    tag === t ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          ) : null}

          {featured ? (
            <section className="mb-10">
              <h2 className="mb-3 font-display text-sm uppercase tracking-[0.24em] text-primary">
                Latest chronicle
              </h2>
              <PostCard post={featured} featured />
            </section>
          ) : null}

          <section>
            <h2 className="mb-4 font-display text-sm uppercase tracking-[0.24em] text-primary">
              Development log
            </h2>
            {rest.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No further entries match this filter.
              </p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {rest.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            )}
            {filtered.length > shown ? (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  className="border-primary/50 text-primary"
                  onClick={() => setShown((n) => n + PAGE_SIZE)}
                >
                  Load more entries
                </Button>
              </div>
            ) : null}
          </section>
        </>
      )}
    </AppShell>
  );
}
