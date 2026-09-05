import { Link } from "@tanstack/react-router";
import { CalendarDays, Clock, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, type BlogPost } from "@/lib/dev-blog";

export function PostCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-xl border border-primary/25 bg-card/70 shadow-lg shadow-black/40 transition-colors hover:border-primary/60 ${
        featured ? "md:flex-row" : ""
      }`}
    >
      {post.coverImageUrl ? (
        <Link
          to="/dev-blog/$slug"
          params={{ slug: post.slug }}
          className={featured ? "md:w-1/2" : ""}
        >
          <img
            src={post.coverImageUrl}
            alt={post.coverImageAlt ?? ""}
            loading="lazy"
            className={`w-full object-cover ${featured ? "h-56 md:h-full" : "h-44"}`}
          />
        </Link>
      ) : null}

      <div className={`flex flex-1 flex-col gap-3 p-5 ${featured ? "md:p-7" : ""}`}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-primary/40 bg-primary/15 text-primary" variant="outline">
            {post.category}
          </Badge>
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>

        <h3
          className={`font-display leading-tight text-foreground ${
            featured ? "text-2xl sm:text-3xl" : "text-xl"
          }`}
        >
          <Link
            to="/dev-blog/$slug"
            params={{ slug: post.slug }}
            className="transition-colors hover:text-primary"
          >
            {post.title}
          </Link>
        </h3>

        {post.subtitle ? (
          <p className="font-serif italic text-muted-foreground">{post.subtitle}</p>
        ) : null}

        <p className="text-sm leading-relaxed text-foreground/80">{post.excerpt}</p>

        <div className="mt-auto flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <UserRound className="size-3.5" /> {post.authorName}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {formatDate(post.publishedAt ?? post.scheduledAt ?? post.createdAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" /> {post.readingMinutes} min read
          </span>
        </div>

        <div>
          <Button asChild variant="outline" size="sm" className="border-primary/50 text-primary">
            <Link to="/dev-blog/$slug" params={{ slug: post.slug }}>
              Read entire post
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
