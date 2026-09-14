import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  feedbackQuery,
  AdminAccessError,
  retryFeedbackGitHubSync,
  updateFeedbackStatus,
} from "../client/queries";
import "./feedbackSync.css";

const bugStatuses = [
  "open",
  "triaged",
  "in_progress",
  "resolved",
  "closed",
  "duplicate",
  "wont_fix",
] as const;

const featureStatuses = [
  "submitted",
  "under_review",
  "planned",
  "in_progress",
  "completed",
  "declined",
  "duplicate",
] as const;

export function FeedbackInbox({ userId }: { userId: string }) {
  const [type, setType] = useState<"bug" | "feature">("bug");
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();
  const query = useQuery(feedbackQuery(userId, type, page));
  const pages = Math.max(1, Math.ceil((query.data?.total ?? 0) / 20));
  const statusOptions = type === "bug" ? bugStatuses : featureStatuses;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateFeedbackStatus(type, id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", userId, "feedback", type] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: (id: string) => retryFeedbackGitHubSync(type, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", userId, "feedback", type] });
    },
  });

  return (
    <section
      className="admin-accounts admin-feedback"
      id="admin-feedback"
      aria-labelledby="feedback-inbox-title"
    >
      <div className="admin-section-heading">
        <div>
          <h2 id="feedback-inbox-title">Feedback inbox</h2>
          <p>Bug reports and ideas from your adventurers, synchronized with GitHub Issues.</p>
        </div>
        <button type="button" disabled={query.isFetching} onClick={() => void query.refetch()}>
          Refresh feedback
        </button>
      </div>
      <div className="admin-feedback-tabs">
        <button
          type="button"
          aria-pressed={type === "bug"}
          onClick={() => {
            setType("bug");
            setPage(0);
          }}
        >
          Bug reports
        </button>
        <button
          type="button"
          aria-pressed={type === "feature"}
          onClick={() => {
            setType("feature");
            setPage(0);
          }}
        >
          Feature requests
        </button>
      </div>
      {query.isError ? (
        <p role="alert" className="admin-error">
          {query.error instanceof AdminAccessError
            ? "Administrator access is required."
            : "Unable to load feedback. Try refreshing."}
        </p>
      ) : query.isPending ? (
        <p role="status" className="admin-feedback-empty">
          Loading feedback…
        </p>
      ) : query.data.items.length === 0 ? (
        <p className="admin-feedback-empty">
          No {type === "bug" ? "bug reports" : "feature requests"} yet.
        </p>
      ) : (
        <div className="admin-feedback-list">
          {query.data.items.map((item) => (
            <details key={item.id}>
              <summary>
                <span>
                  {item.title}
                  <small>
                    {item.reporter || (item.githubIssueNumber ? "GitHub" : "Unknown account")} ·{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </small>
                </span>
                <span className="admin-feedback-status">{item.status.replaceAll("_", " ")}</span>
              </summary>
              <div className="admin-feedback-body">
                <div className="admin-feedback-controls">
                  <label>
                    <span>Status</span>
                    <select
                      value={item.status}
                      disabled={statusMutation.isPending}
                      onChange={(event) =>
                        statusMutation.mutate({ id: item.id, status: event.currentTarget.value })
                      }
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="admin-feedback-github">
                    {item.githubIssueUrl ? (
                      <a href={item.githubIssueUrl} target="_blank" rel="noreferrer">
                        GitHub #{item.githubIssueNumber}
                      </a>
                    ) : (
                      <span>Not linked to GitHub yet</span>
                    )}
                    <span className={`admin-feedback-sync admin-feedback-sync-${item.githubSyncStatus ?? "pending"}`}>
                      {item.githubSyncStatus ?? "pending"}
                    </span>
                    <button
                      type="button"
                      disabled={syncMutation.isPending}
                      onClick={() => syncMutation.mutate(item.id)}
                    >
                      Sync now
                    </button>
                  </div>
                </div>
                {(statusMutation.isError || syncMutation.isError) && (
                  <p className="admin-error" role="alert">
                    Unable to update GitHub synchronization. Try again.
                  </p>
                )}
                {item.githubLastError && (
                  <p className="admin-feedback-sync-error">Last sync error: {item.githubLastError}</p>
                )}
                <h3>{type === "bug" ? "What went wrong" : "Idea"}</h3>
                <p>{item.description}</p>
                {item.details && (
                  <>
                    <h3>{type === "bug" ? "Steps to reproduce" : "Problem to solve"}</h3>
                    <p>{item.details}</p>
                  </>
                )}
                <small>
                  Reference: {item.id}
                  {item.githubLastSyncedAt
                    ? ` · Last GitHub sync ${new Date(item.githubLastSyncedAt).toLocaleString()}`
                    : ""}
                </small>
              </div>
            </details>
          ))}
        </div>
      )}
      <div className="admin-pagination">
        <span>
          {query.data?.total ?? 0} submissions · Page {page + 1} of {pages}
        </span>
        <div>
          <button
            type="button"
            disabled={page === 0 || query.isFetching}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page + 1 >= pages || query.isFetching}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
