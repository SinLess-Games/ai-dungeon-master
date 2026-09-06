import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, checked, moderationQuery } from "../client/queries";
import { BlogError, Pagination } from "./BlogShared";
export function CommentModeration({ userId }: { userId: string }) {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const query = useQuery(moderationQuery(userId, status, page));
  const client = useQueryClient();
  async function moderate(id: string, next: typeof status) {
    setBusy(true);
    setError("");
    try {
      await checked(
        await api.api.admin.devblog.comments[":id"].$put({ param: { id }, json: { status: next } }),
      );
      await query.refetch();
      await client.invalidateQueries({ queryKey: ["devblog", "comments"] });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to moderate comment.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="blog-moderation">
      <h2>Comment moderation</h2>
      <label htmlFor="moderation-status">Comment status</label>
      <select
        id="moderation-status"
        value={status}
        onChange={(e) => {
          setStatus(e.target.value as typeof status);
          setPage(0);
        }}
      >
        <option value="pending">Pending review</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      {error && (
        <p role="alert" className="blog-error">
          {error}
        </p>
      )}
      {query.isError ? (
        <BlogError error={query.error} retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <p role="status">Loading comments…</p>
      ) : (
        <>
          {!query.data.items.length && <p>No comments in this queue.</p>}
          {query.data.items.map((item) => (
            <article className="blog-comment" key={item.id}>
              <strong>{item.authorName}</strong>
              <p className="blog-meta">
                On {item.postTitle} · {new Date(item.createdAt).toLocaleString()}
              </p>
              <p>{item.body}</p>
              <div className="blog-actions">
                <button
                  type="button"
                  disabled={busy || item.status === "approved"}
                  onClick={() => void moderate(item.id, "approved")}
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busy || item.status === "rejected"}
                  onClick={() => void moderate(item.id, "rejected")}
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={busy || item.status === "pending"}
                  onClick={() => void moderate(item.id, "pending")}
                >
                  Return to review
                </button>
              </div>
            </article>
          ))}
          <Pagination
            page={page}
            total={query.data.total}
            size={20}
            change={setPage}
            busy={query.isFetching}
          />
        </>
      )}
    </section>
  );
}
