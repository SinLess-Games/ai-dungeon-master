import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiWriterStatusQuery, api, checked } from "../client/queries";
import { BlogError } from "./BlogShared";

export function DevBlogAI({
  userId,
  editPost,
}: {
  userId: string;
  editPost: (id: string) => void;
}) {
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();
  const status = useQuery(aiWriterStatusQuery(userId));
  const generate = useMutation({
    mutationFn: async () =>
      checked(
        await api.api.admin.devblog.ai.generate.$post({
          json: notes.trim() ? { notes: notes.trim() } : {},
        }),
      ),
    onSuccess: async () => {
      setNotes("");
      await queryClient.invalidateQueries({
        queryKey: ["admin", userId, "devblog"],
      });
    },
  });

  if (status.isPending) return <p role="status">Loading AI writer…</p>;
  if (status.isError)
    return <BlogError error={status.error} retry={() => void status.refetch()} />;

  const data = status.data;

  return (
    <section aria-labelledby="devblog-ai-heading">
      <div className="blog-heading">
        <span>WEEKLY SCRIBE</span>
        <h2 id="devblog-ai-heading">AI devblog writer</h2>
        <p>
          Once a week the Codex reads recent repository activity and prepares a development
          journal from evidence it can verify.
        </p>
      </div>

      <div className="blog-admin-list">
        <article>
          <div>
            <h3>Weekly generation</h3>
            <p className="blog-meta">
              {data.enabled ? "Enabled" : "Disabled"} · {data.schedule}
            </p>
            <p>
              Result:{" "}
              <strong>{data.autoPublish ? "Published automatically" : "Draft for review"}</strong>
            </p>
          </div>
        </article>

        <article>
          <div>
            <h3>AI provider</h3>
            <p className="blog-meta">{data.provider}</p>
            <p>
              Model: <strong>{data.model}</strong>
            </p>
            <p>
              AI: <strong>{data.aiConfigured ? "ready" : "missing"}</strong> · GitHub:{" "}
              <strong>{data.githubConfigured ? "ready" : "missing"}</strong>
            </p>
            {data.freeWorkersAI && (
              <p className="blog-success">Using the Cloudflare Workers AI free allocation.</p>
            )}
          </div>
        </article>

        <article>
          <div>
            <h3>Sources</h3>
            <p className="blog-meta">{data.repository}</p>
            <p>Commits, pull requests, issues, the roadmap, and recent published posts.</p>
          </div>
        </article>

        <article>
          <div>
            <h3>This week</h3>
            <p className="blog-meta">Week of {data.weekKey}</p>
            {data.current ? (
              <>
                <p>
                  {data.current.title} · {data.current.status}
                </p>
                <button type="button" onClick={() => editPost(data.current!.id)}>
                  Edit generated post
                </button>
              </>
            ) : (
              <p>No AI post has been generated for this week yet.</p>
            )}
          </div>
        </article>
      </div>

      <div className="blog-actions">
        <label htmlFor="devblog-ai-notes">Weekly notes</label>
        <textarea
          id="devblog-ai-notes"
          rows={7}
          maxLength={5000}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional context the commit history may not explain: decisions, goals, or what you want readers to understand."
        />
        <button
          type="button"
          disabled={!data.enabled || !data.configured || generate.isPending || Boolean(data.current)}
          onClick={() => generate.mutate()}
        >
          {generate.isPending ? "Writing this week's post…" : "Generate now"}
        </button>
      </div>

      {!data.aiConfigured && (
        <p role="status">
          The Workers AI binding is missing. Deploy the current Wrangler configuration to enable
          free AI generation.
        </p>
      )}
      {!data.githubConfigured && (
        <p role="status">
          Configure GITHUB_TOKEN on the Worker with read-only access to the private repository.
          GitHub does not charge for this token.
        </p>
      )}
      {generate.isError && <BlogError error={generate.error} retry={() => generate.mutate()} />}
      {generate.data?.skipped && (
        <p role="status">This week's post already exists, so no duplicate was created.</p>
      )}
      {generate.data?.created && (
        <p role="status">
          Draft created: <strong>{generate.data.title}</strong>
        </p>
      )}
    </section>
  );
}
