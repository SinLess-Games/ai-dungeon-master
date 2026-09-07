import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { authClient } from "@/modules/auth/client/authClient";
import { useAuthModal } from "@/shared/stores/authModal.store";
import { adminBlogQuery } from "../client/queries";
import { BlogError, Pagination } from "./BlogShared";
import { DevBlogEditor } from "./DevBlogEditor";
import { CommentModeration } from "./CommentModeration";
import { DevBlogAI } from "./DevBlogAI";
import "./devblog.css";

export function DevBlogAdmin() {
  const session = authClient.useSession();
  return (
    <main className="blog-page">
      <div className="blog-container">
        <Link to="/user/admin">← Admin console</Link>
        <header className="blog-heading">
          <span>CODEX CONTROL</span>
          <h1>Devblog studio</h1>
          <p>Write the next chapter. Share the work behind the worlds.</p>
        </header>
        {session.isPending ? (
          <p role="status">Checking access…</p>
        ) : session.error ? (
          <BlogError error={session.error} retry={() => void session.refetch()} />
        ) : !session.data ? (
          <button type="button" onClick={useAuthModal.getState().openLogin}>
            Sign in to manage posts
          </button>
        ) : session.data.user.role !== "admin" ? (
          <p>Administrator access is required.</p>
        ) : (
          <Studio key={session.data.user.id} userId={session.data.user.id} />
        )}
      </div>
    </main>
  );
}

function Studio({ userId }: { userId: string }) {
  const [id, setId] = useState<string | null>(null);
  const [tab, setTab] = useState<"posts" | "comments" | "ai">("posts");
  const [status, setStatus] = useState<"all" | "draft" | "published" | "archived">("all");
  const [page, setPage] = useState(0);
  const query = useQuery(adminBlogQuery(userId, status, page));

  if (id)
    return (
      <DevBlogEditor
        userId={userId}
        id={id}
        created={setId}
        close={() => {
          setId(null);
          void query.refetch();
        }}
      />
    );

  return (
    <>
      <div className="blog-tabs">
        <button type="button" aria-pressed={tab === "posts"} onClick={() => setTab("posts")}>
          Posts
        </button>
        <button type="button" aria-pressed={tab === "comments"} onClick={() => setTab("comments")}>
          Comments
        </button>
        <button type="button" aria-pressed={tab === "ai"} onClick={() => setTab("ai")}>
          AI Writer
        </button>
        <Link to="/devblog">View public blog ↗</Link>
      </div>

      {tab === "comments" ? (
        <CommentModeration userId={userId} />
      ) : tab === "ai" ? (
        <DevBlogAI userId={userId} editPost={setId} />
      ) : (
        <>
          <div className="blog-actions">
            <button type="button" onClick={() => setId("new")}>
              New post
            </button>
            <label htmlFor="blog-status-filter">Status</label>
            <select
              id="blog-status-filter"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as typeof status);
                setPage(0);
              }}
            >
              <option value="all">All posts</option>
              <option value="draft">Drafts</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          {query.isError ? (
            <BlogError error={query.error} retry={() => void query.refetch()} />
          ) : query.isPending ? (
            <p role="status">Loading posts…</p>
          ) : (
            <>
              {!query.data.items.length && (
                <div className="blog-empty">
                  <h2>No posts yet</h2>
                  <p>Create a draft to start writing.</p>
                </div>
              )}
              <div className="blog-admin-list">
                {query.data.items.map((post) => (
                  <article key={post.id}>
                    <div>
                      <h2>{post.title}</h2>
                      <p className="blog-meta">
                        {post.status} · Updated {new Date(post.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <button type="button" onClick={() => setId(post.id)}>
                      Edit post
                    </button>
                  </article>
                ))}
              </div>
              <Pagination page={page} total={query.data.total} size={20} change={setPage} />
            </>
          )}
        </>
      )}
    </>
  );
}
