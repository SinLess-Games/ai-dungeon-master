import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CalendarDays, Clock, UserRound } from "lucide-react";
import { ArticleBody } from "@/components/blog/ArticleBody";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, type BlogPost } from "@/lib/dev-blog";
import { getPostById } from "@/lib/dev-blog.functions";

export const Route = createFileRoute("/admin/dev-blog/$id/preview")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: PreviewPost,
});

function PreviewPost() {
  const { id } = Route.useParams();
  const load = useServerFn(getPostById);
  const [post, setPost] = useState<BlogPost | null | "missing">(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    load({ data: { id } })
      .then((p) => !cancelled && setPost(p ?? "missing"))
      .catch((e: any) => !cancelled && setError(e?.message ?? "Could not load the post"));
    return () => {
      cancelled = true;
    };
  }, [id, load]);

  if (error) {
    return (
      <Card className="border-destructive/40 bg-card/70">
        <CardContent className="p-6 text-sm text-muted-foreground">{error}</CardContent>
      </Card>
    );
  }
  if (post === null) return <Skeleton className="h-96 w-full" />;
  if (post === "missing") {
    return (
      <Card className="border-primary/25 bg-card/70">
        <CardContent className="p-6 text-sm text-muted-foreground">That post no longer exists.</CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/dev-blog">
            <ArrowLeft className="mr-2 size-4" /> Back to list
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/dev-blog/$id/edit" params={{ id }}>Edit</Link>
        </Button>
        <Badge variant="outline" className="border-primary/40 bg-primary/15 text-primary">
          Private preview — {post.status}
        </Badge>
      </div>

      <article className="mx-auto max-w-3xl rounded-xl border border-primary/25 bg-card/60 p-6 sm:p-10">
        {post.coverImageUrl ? (
          <img
            src={post.coverImageUrl}
            alt={post.coverImageAlt ?? ""}
            className="mb-8 w-full rounded-lg border border-primary/30"
          />
        ) : null}
        <Badge variant="outline" className="border-primary/40 bg-primary/15 text-primary">
          {post.category}
        </Badge>
        <h1 className="mt-4 font-display text-3xl leading-tight text-foreground sm:text-4xl">
          {post.title}
        </h1>
        {post.subtitle ? (
          <p className="mt-3 font-serif text-lg italic text-muted-foreground">{post.subtitle}</p>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><UserRound className="size-3.5" /> {post.authorName}</span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {formatDate(post.publishedAt ?? post.scheduledAt ?? post.createdAt)}
          </span>
          <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> {post.readingMinutes} min read</span>
        </div>
        <div className="rune-rule my-8" />
        <ArticleBody text={post.content} />
      </article>
    </div>
  );
}
