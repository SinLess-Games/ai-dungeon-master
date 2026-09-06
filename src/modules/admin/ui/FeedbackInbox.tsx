import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { feedbackQuery, AdminAccessError } from "../client/queries";

export function FeedbackInbox({ userId }: { userId: string }) {
  const [type, setType] = useState<"bug" | "feature">("bug");
  const [page, setPage] = useState(0);
  const query = useQuery(feedbackQuery(userId, type, page));
  const pages = Math.max(1, Math.ceil((query.data?.total ?? 0) / 20));
  return (
    <section
      className="admin-accounts admin-feedback"
      id="admin-feedback"
      aria-labelledby="feedback-inbox-title"
    >
      <div className="admin-section-heading">
        <div>
          <h2 id="feedback-inbox-title">Feedback inbox</h2>
          <p>Bug reports and ideas from your adventurers.</p>
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
                    {item.reporter || "Unknown account"} ·{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </small>
                </span>
                <span className="admin-feedback-status">{item.status.replaceAll("_", " ")}</span>
              </summary>
              <div className="admin-feedback-body">
                <h3>{type === "bug" ? "What went wrong" : "Idea"}</h3>
                <p>{item.description}</p>
                {item.details && (
                  <>
                    <h3>{type === "bug" ? "Steps to reproduce" : "Problem to solve"}</h3>
                    <p>{item.details}</p>
                  </>
                )}
                <small>Reference: {item.id}</small>
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
