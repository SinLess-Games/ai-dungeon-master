import { useState, useRef, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/modules/auth/client/authClient";
import { api, checked, commentListQuery } from "../client/queries";
import { BlogError, Pagination } from "./BlogShared";
export function Comments({ postId }: { postId: string }) {
  const [page, setPage] = useState(0);
  const query = useQuery(commentListQuery(postId, page));
  const session = authClient.useSession();
  return (
    <section className="blog-comments" aria-labelledby="comments-title">
      <h2 id="comments-title">Join the conversation</h2>
      <p>Share your thoughts. All comments are reviewed before appearing here.</p>
      <CommentForm
        key={session.data?.user.id || "anonymous"}
        postId={postId}
        name={session.data?.user.name}
      />
      {query.isError ? (
        <BlogError error={query.error} retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <p role="status">Loading comments…</p>
      ) : (
        <>
          {query.data.items.length === 0 && <p>No comments yet. Start the conversation.</p>}
          {query.data.items.map((item) => (
            <article className="blog-comment" key={item.id}>
              <strong>{item.authorName}</strong>
              <time>{new Date(item.createdAt).toLocaleDateString()}</time>
              <p>{item.body}</p>
            </article>
          ))}
          <Pagination page={page} total={query.data.total} size={20} change={setPage} />
        </>
      )}
    </section>
  );
}
function CommentForm({ postId, name }: { postId: string; name: string | undefined }) {
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    lock.current = true;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await checked(
        await api.api.devblog.posts[":id"].comments.$post({
          param: { id: postId },
          json: {
            body: String(data.get("body")),
            authorName: name || String(data.get("authorName") || ""),
            website: String(data.get("website") || ""),
          },
        }),
      );
      form.reset();
      setSaved(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to submit comment.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <form className="blog-form" onSubmit={(event) => void submit(event)}>
      <fieldset disabled={busy}>
        {name ? (
          <p>
            Commenting as <strong>{name}</strong>
          </p>
        ) : (
          <>
            <label htmlFor="comment-name">Name</label>
            <input
              id="comment-name"
              name="authorName"
              required
              maxLength={60}
              placeholder="Your name (no account required)"
            />
          </>
        )}
        <div hidden>
          <label htmlFor="comment-website">Leave this blank</label>
          <input id="comment-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <label htmlFor="comment-body">Your comment</label>
        <textarea id="comment-body" name="body" rows={4} required minLength={3} maxLength={3000} />
        <button type="submit">{busy ? "Submitting…" : "Submit comment"}</button>
      </fieldset>
      {error && (
        <p role="alert" className="blog-error">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="blog-success">
          Thanks! Your comment is awaiting review.
        </p>
      )}
    </form>
  );
}
