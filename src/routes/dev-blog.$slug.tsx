import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ArticleBody } from "@/components/blog/ArticleBody";
import { PostCard } from "@/components/blog/PostCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dev-blog";
import { getPublicPost } from "@/lib/dev-blog.functions";
import { getRequestOrigin } from "@/lib/origin.functions";

export const Route = createFileRoute("/dev-blog/$slug")({
  loader: async ({ params }) => {
    const [{ post, siblings }, origin] = await Promise.all([
      getPublicPost({ data: { slug: params.slug } }),
      getRequestOrigin(),
    ]);
    if (!post) throw notFound();

    const index = siblings.findIndex((p) => p.id === post.id);
    const related = siblings
      .filter(
        (p) =>
          p.id !== post.id &&
          (p.category === post.category || p.tags.some((t) => post.tags.includes(t))),
      )
      .slice(0, 3);

    return {
      post,
      origin,
      previous: siblings[index + 1] ?? null,
      next: index > 0 ? siblings[index - 1]! : null,
      related,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Entry unavailable — The Endless Codex" }, { name: "robots", content: "noindex" }],
      };
    }
    const { post, origin } = loaderData;
    const title = post.seoTitle || `${post.title} — Developer Chronicle`;
    const description = post.seoDescription || post.excerpt;
    const image = post.ogImageUrl || post.coverImageUrl;
    const absolute = image ? (image.startsWith("http") ? image : `${origin}${image}`) : null;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(absolute
          ? [
              { property: "og:image", content: absolute },
              { name: "twitter:image", content: absolute },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: `${origin}/dev-blog/${post.slug}` }],
    };
  },
  notFoundComponent: () => (
    <AppShell>
      <div className="mx-auto max-w-2xl py-20 text-center">
        <h1 className="font-display text-3xl text-primary">Entry not found</h1>
        <p className="mt-3 text-muted-foreground">
          That chronicle entry does not exist, or it has not been published yet.
        </p>
        <Button asChild className="mt-6">
          <Link to="/dev-blog">Back to the Developer Chronicle</Link>
        </Button>
      </div>
    </AppShell>
  ),
  component: PostPage,
});

function PostPage() {
  const { post, previous, next, related } = Route.useLoaderData();

  return (
    <AppShell>
      <article className="mx-auto max-w-3xl">
        <Link
          to="/dev-blog"
          className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary hover:text-primary/80"
        >
          <ArrowLeft className="size-3.5" /> Developer Chronicle
        </Link>

        {post.coverImageUrl ? (
          <img
            src={post.coverImageUrl}
            alt={post.coverImageAlt ?? ""}
            className="mb-8 w-full rounded-xl border border-primary/30 object-cover shadow-xl shadow-black/50"
          />
        ) : null}

        <Badge className="border-primary/40 bg-primary/15 text-primary" variant="outline">
          {post.category}
        </Badge>

        <h1 className="mt-4 font-display text-3xl leading-tight text-foreground sm:text-4xl">
          {post.title}
        </h1>
        {post.subtitle ? (
          <p className="mt-3 font-serif text-lg italic text-muted-foreground">{post.subtitle}</p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <UserRound className="size-3.5" /> {post.authorName}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {formatDate(post.publishedAt ?? post.scheduledAt ?? post.createdAt)}
          </span>
          {post.updatedAt && post.publishedAt && post.updatedAt > post.publishedAt ? (
            <span>Updated {formatDate(post.updatedAt)}</span>
          ) : null}
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" /> {post.readingMinutes} min read
          </span>
        </div>

        {post.tags.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span key={t} className="text-[0.7rem] uppercase tracking-[0.16em] text-primary/80">
                #{t}
              </span>
            ))}
          </div>
        ) : null}

        <div className="rune-rule my-8" />

        <ArticleBody text={post.content} />

        <div className="rune-rule my-10" />

        <nav className="grid gap-4 sm:grid-cols-2">
          {previous ? (
            <Link
              to="/dev-blog/$slug"
              params={{ slug: previous.slug }}
              className="rounded-lg border border-primary/25 bg-card/60 p-4 transition-colors hover:border-primary/60"
            >
              <span className="flex items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
                <ArrowLeft className="size-3" /> Previous
              </span>
              <span className="mt-1 block font-display text-foreground">{previous.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to="/dev-blog/$slug"
              params={{ slug: next.slug }}
              className="rounded-lg border border-primary/25 bg-card/60 p-4 text-right transition-colors hover:border-primary/60"
            >
              <span className="flex items-center justify-end gap-1.5 text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
                Next <ArrowRight className="size-3" />
              </span>
              <span className="mt-1 block font-display text-foreground">{next.title}</span>
            </Link>
          ) : null}
        </nav>
      </article>

      {related.length ? (
        <section className="mx-auto mt-14 max-w-5xl">
          <h2 className="mb-4 font-display text-sm uppercase tracking-[0.24em] text-primary">
            Related entries
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
