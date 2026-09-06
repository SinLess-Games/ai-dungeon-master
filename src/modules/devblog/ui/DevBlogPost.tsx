import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { blogPostQuery } from "../client/queries";
import { mediaUrl } from "../domain/schemas";
import { MarkdownPreview } from "./MarkdownPreview";
import { Comments } from "./Comments";
import { BlogError } from "./BlogShared";
import "./devblog.css";
export function DevBlogPost({ slug }: { slug: string }) {
  const query = useQuery(blogPostQuery(slug));
  const post = query.data;
  return (
    <main className="blog-page">
      <div className="blog-article">
        <Link to="/devblog">← All updates</Link>
        {query.isError ? (
          <BlogError error={query.error} retry={() => void query.refetch()} />
        ) : !post ? (
          <p role="status">Loading update…</p>
        ) : (
          <>
            <title>{post.title} | The Endless Codex</title>
            <meta name="description" content={post.excerpt} />
            <meta property="og:title" content={post.title} />
            <meta property="og:description" content={post.excerpt} />
            <article>
              <header className="blog-heading">
                <span>DEVELOPMENT UPDATE</span>
                <h1>{post.title}</h1>
                <p>{post.excerpt}</p>
                <p className="blog-meta">
                  By {post.author || "Codex team"} ·{" "}
                  {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ""}
                  <br />
                  Updated {new Date(post.updatedAt).toLocaleDateString()}
                </p>
              </header>
              {post.coverImageId && (
                <img
                  className="blog-post-cover"
                  src={mediaUrl(post.coverImageId)}
                  alt={post.coverAlt || ""}
                />
              )}
              <MarkdownPreview markdown={post.markdown} />
            </article>
            <Comments key={post.id} postId={post.id} />
          </>
        )}
      </div>
    </main>
  );
}
