import { useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useBlocker } from "@tanstack/react-router";
import type { z } from "zod";
import { api, checked, editorQuery } from "../client/queries";
import { mediaUrl, postSchema, slugify } from "../domain/schemas";
import { BlogError } from "./BlogShared";
import { MarkdownPreview } from "./MarkdownPreview";
import { ImageUploader } from "./ImageUploader";
type Draft = z.infer<typeof postSchema>;
const empty: Draft = {
  title: "",
  slug: "",
  excerpt: "",
  markdown: "",
  status: "draft",
  coverImageId: null,
};
export function DevBlogEditor({
  userId,
  id,
  close,
  created,
}: {
  userId: string;
  id: string;
  close: () => void;
  created: (id: string) => void;
}) {
  const query = useQuery({ ...editorQuery(userId, id), enabled: id !== "new" });
  if (id !== "new" && query.isError)
    return <BlogError error={query.error} retry={() => void query.refetch()} />;
  if (id !== "new" && !query.data) return <p role="status">Loading editor…</p>;
  return (
    <EditorForm
      key={id}
      id={id}
      initial={query.data?.post || empty}
      images={query.data?.images || []}
      close={close}
      created={created}
      refresh={() => void query.refetch()}
    />
  );
}
function EditorForm({
  id,
  initial,
  images,
  close,
  created,
  refresh,
}: {
  id: string;
  initial: Draft;
  images: { id: string; alt: string; width: number | null; height: number | null }[];
  close: () => void;
  created: (id: string) => void;
  refresh: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const lock = useRef(false);
  const queryClient = useQueryClient();
  useBlocker({
    shouldBlockFn: () => dirty && !window.confirm("Discard your unsaved post changes?"),
    enableBeforeUnload: dirty,
  });
  function edit(patch: Partial<Draft>) {
    setDraft((value) => ({ ...value, ...patch }));
    setDirty(true);
    setSaved(false);
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const parsed = postSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Check the post fields.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      if (id === "new") {
        const result = await checked(
          await api.api.admin.devblog.posts.$post({ json: parsed.data }),
        );
        setDirty(false);
        created(result.id);
      } else {
        await checked(
          await api.api.admin.devblog.posts[":id"].$put({ param: { id }, json: parsed.data }),
        );
        const latest = await checked(
          await api.api.admin.devblog.posts[":id"].$get({ param: { id } }),
        );
        setDraft(latest.post);
        setDirty(false);
        setSaved(true);
        refresh();
      }
      await queryClient.invalidateQueries({ queryKey: ["devblog"] });
      await queryClient.invalidateQueries({
        predicate: (q) => q.queryKey.includes("devblog") && q.queryKey[0] === "admin",
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save post.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="blog-editor">
      <button
        type="button"
        onClick={() => {
          if (!dirty || window.confirm("Discard your unsaved post changes?")) close();
        }}
      >
        ← Back to posts
      </button>
      <h2>{id === "new" ? "Write a new chapter" : "Edit update"}</h2>
      <form className="blog-form" onSubmit={(event) => void save(event)}>
        <fieldset disabled={busy}>
          <label htmlFor="post-title">Post title</label>
          <input
            id="post-title"
            value={draft.title}
            required
            minLength={3}
            maxLength={160}
            onChange={(e) =>
              edit({
                title: e.target.value,
                ...(id === "new" && (!draft.slug || draft.slug === slugify(draft.title))
                  ? { slug: slugify(e.target.value) }
                  : {}),
              })
            }
          />
          <label htmlFor="post-slug">URL slug</label>
          <input
            id="post-slug"
            value={draft.slug}
            required
            maxLength={100}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            onChange={(e) => edit({ slug: e.target.value })}
          />
          <p className="blog-help">
            /devblog/{draft.slug || "your-post"} · Changing a published URL breaks existing links.
          </p>
          <label htmlFor="post-excerpt">Excerpt</label>
          <textarea
            id="post-excerpt"
            value={draft.excerpt}
            maxLength={500}
            rows={2}
            onChange={(e) => edit({ excerpt: e.target.value })}
          />
          <div className="blog-tabs">
            <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>
              Write Markdown
            </button>
            <button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>
              Preview
            </button>
          </div>
          {preview ? (
            <div className="blog-preview">
              <MarkdownPreview markdown={draft.markdown} />
            </div>
          ) : (
            <>
              <label htmlFor="post-markdown">Markdown content</label>
              <textarea
                id="post-markdown"
                className="blog-source"
                rows={18}
                value={draft.markdown}
                maxLength={100000}
                onChange={(e) => edit({ markdown: e.target.value })}
              />
              <p className="blog-help">
                Headings, emphasis, lists, links, quotes, code, tables, and uploaded images are
                supported. Raw HTML is disabled.
              </p>
            </>
          )}
          <label htmlFor="post-status">Post status</label>
          <select
            id="post-status"
            value={draft.status}
            onChange={(e) => edit({ status: e.target.value as Draft["status"] })}
          >
            <option value="draft">Draft — admins only</option>
            <option value="published">Published — public</option>
            <option value="archived">Archived — removed from public view</option>
          </select>
          <label htmlFor="post-cover">Cover image</label>
          <select
            id="post-cover"
            value={draft.coverImageId || ""}
            onChange={(e) => edit({ coverImageId: e.target.value || null })}
          >
            <option value="">No cover</option>
            {images.map((image) => (
              <option key={image.id} value={image.id}>
                {image.alt}
              </option>
            ))}
          </select>
          {draft.coverImageId && (
            <img
              className="blog-cover-preview"
              src={mediaUrl(draft.coverImageId)}
              alt={images.find((image) => image.id === draft.coverImageId)?.alt || ""}
            />
          )}
          <div className="blog-actions">
            <button type="submit">
              {busy
                ? "Saving…"
                : draft.status === "published"
                  ? "Save and publish"
                  : draft.status === "archived"
                    ? "Save as archived"
                    : "Save draft"}
            </button>
            {id !== "new" && initial.status === "published" && (
              <Link to="/devblog/$slug" params={{ slug: initial.slug }}>
                View published post
              </Link>
            )}
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="blog-error">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="blog-success">
            Post saved.
          </p>
        )}
      </form>
      {id === "new" ? (
        <p className="blog-help">Save a draft to upload cover and Markdown images.</p>
      ) : (
        <>
          <ImageUploader postId={id} uploaded={refresh} />
          <div className="blog-media-library">
            {images.map((image) => (
              <div key={image.id}>
                <img src={mediaUrl(image.id)} alt={image.alt} />
                <p>{image.alt}</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    edit({
                      markdown:
                        draft.markdown +
                        "\n\n![" +
                        image.alt.replace(/[[\]\\\n\r]/g, "") +
                        "](" +
                        mediaUrl(image.id) +
                        ")\n",
                    });
                    setPreview(false);
                  }}
                >
                  Insert in Markdown
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
