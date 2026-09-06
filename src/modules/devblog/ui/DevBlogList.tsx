import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { blogListQuery } from "../client/queries";
import { mediaUrl } from "../domain/schemas";
import { BlogError, Pagination } from "./BlogShared";
import "./devblog.css";
export function DevBlogList() {
  const [page, setPage] = useState(0);
  const query = useQuery(blogListQuery(page));
  return (
    <main className="blog-page">
      <title>Devblog | The Endless Codex</title>
      <meta
        name="description"
        content="Development updates, new features, and stories from the making of The Endless Codex."
      />
      <div className="blog-container">
        <header className="blog-heading">
          <span>BEHIND THE ADVENTURE</span>
          <h1>The Codex Chronicles</h1>
          <p>Development notes, new discoveries, and the road ahead.</p>
        </header>
        {query.isError ? (
          <BlogError error={query.error} retry={() => void query.refetch()} />
        ) : query.isPending ? (
          <p role="status">Opening the chronicles…</p>
        ) : (
          <>
            {!query.data.items.length ? (
              <div className="blog-empty">
                <BookOpen size={42} />
                <h2>A new chapter is coming</h2>
                <p>Check back for the first development update.</p>
              </div>
            ) : (
              <div className="blog-cards">
                {query.data.items.map((post) => (
                  <article className="blog-card" key={post.id}>
                    <Link
                      to="/devblog/$slug"
                      params={{ slug: post.slug }}
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      {post.coverImageId ? (
                        <img src={mediaUrl(post.coverImageId)} alt="" loading="lazy" />
                      ) : (
                        <div className="blog-cover-placeholder">
                          <BookOpen size={45} />
                        </div>
                      )}
                    </Link>
                    <div>
                      <p className="blog-meta">
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ""} ·{" "}
                        {post.author || "Codex team"}
                      </p>
                      <h2>
                        <Link to="/devblog/$slug" params={{ slug: post.slug }}>
                          {post.title}
                        </Link>
                      </h2>
                      <p>{post.excerpt}</p>
                      <Link className="blog-read" to="/devblog/$slug" params={{ slug: post.slug }}>
                        Read the update →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <Pagination
              page={page}
              total={query.data.total}
              size={12}
              change={setPage}
              busy={query.isFetching}
            />
          </>
        )}
      </div>
    </main>
  );
}
