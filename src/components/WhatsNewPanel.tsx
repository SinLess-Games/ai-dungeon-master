import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, type BlogPost } from "@/lib/dev-blog";
import { listPublicPosts } from "@/lib/dev-blog.functions";

/** Small in-app highlight of the latest chronicle entries flagged as updates. */
export function WhatsNewPanel({ limit = 4 }: { limit?: number }) {
  const load = useServerFn(listPublicPosts);
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    let cancelled = false;
    load({})
      .then((all) => {
        if (!cancelled) setPosts(all.filter((p) => p.featuredAsUpdate).slice(0, limit));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [load, limit]);

  if (!posts.length) return null;

  return (
    <Card className="border-primary/25 bg-card/70">
      <CardContent className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-sm uppercase tracking-[0.22em] text-primary">
          <Sparkles className="size-4" /> What's new
        </h2>
        <ul className="space-y-4">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                to="/dev-blog/$slug"
                params={{ slug: p.slug }}
                className="font-display text-base text-foreground transition-colors hover:text-primary"
              >
                {p.title}
              </Link>
              <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
                {formatDate(p.publishedAt ?? p.createdAt)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{p.excerpt}</p>
            </li>
          ))}
        </ul>
        <Link
          to="/dev-blog"
          className="mt-4 inline-block text-xs uppercase tracking-[0.18em] text-primary hover:text-primary/80"
        >
          Read the Developer Chronicle
        </Link>
      </CardContent>
    </Card>
  );
}
