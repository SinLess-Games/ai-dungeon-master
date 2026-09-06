import { useRef, useState, type FormEvent } from "react";
import { Bug, Lightbulb, X, CheckCircle2 } from "lucide-react";
import { Dialog } from "@/ui/primitives/Dialog";
import { authClient } from "@/modules/auth/client/authClient";
import { useAuthModal } from "@/shared/stores/authModal.store";
import { feedbackSchema } from "../domain/validation";
import "./feedback.css";

export function FeedbackModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const session = authClient.useSession();
  return (
    <Dialog open={open} onClose={onClose} titleId="feedback-title" className="feedback-modal">
      {open && (
        <FeedbackForm
          key={session.data?.user.id || "guest"}
          signedIn={!!session.data}
          pending={session.isPending}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
}

function FeedbackForm({
  signedIn,
  pending,
  onClose,
}: {
  signedIn: boolean;
  pending: boolean;
  onClose: () => void;
}) {
  const [type, setType] = useState<"bug" | "feature">("bug");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const lock = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const form = new FormData(event.currentTarget);
    const parsed = feedbackSchema.safeParse({
      type,
      title: form.get("title"),
      description: form.get("description"),
      details: form.get("details"),
    });
    if (!parsed.success) {
      setError("Use a title of 3–160 characters and a description of 10–5,000 characters.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok)
        throw new Error(
          response.status === 401
            ? "Your session expired. Sign in again to submit feedback."
            : "Unable to submit feedback. Please try again.",
        );
      await response.json();
      setSubmitted(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to submit feedback.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="feedback-content">
      <button
        className="feedback-close"
        type="button"
        aria-label="Close feedback"
        onClick={onClose}
      >
        <X />
      </button>
      <p className="feedback-brand">THE ENDLESS CODEX</p>
      <h2 id="feedback-title">{submitted ? "Thank you, adventurer" : "Help shape the Codex"}</h2>
      {submitted ? (
        <div className="feedback-thanks">
          <CheckCircle2 size={42} />
          <p>Your {type === "bug" ? "bug report" : "feature request"} has been submitted.</p>
          <button type="button" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <>
          <p>Found a problem or have an idea? We’d love to hear it.</p>
          <div className="feedback-types" aria-label="Feedback type">
            <button
              type="button"
              aria-pressed={type === "bug"}
              disabled={busy}
              onClick={() => {
                setType("bug");
                setError("");
              }}
            >
              <Bug size={22} />
              <span>
                Bug Report<small>Something isn’t working</small>
              </span>
            </button>
            <button
              type="button"
              aria-pressed={type === "feature"}
              disabled={busy}
              onClick={() => {
                setType("feature");
                setError("");
              }}
            >
              <Lightbulb size={22} />
              <span>
                Feature Request<small>Share an idea</small>
              </span>
            </button>
          </div>
          {pending ? (
            <p role="status">Checking your account…</p>
          ) : !signedIn ? (
            <div className="feedback-signin">
              <p>Sign in to submit a bug report or feature request.</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  useAuthModal.getState().openLogin();
                }}
              >
                Sign in to give feedback
              </button>
            </div>
          ) : (
            <form onSubmit={(event) => void submit(event)}>
              <fieldset disabled={busy}>
                <label htmlFor="feedback-summary">Title</label>
                <input
                  id="feedback-summary"
                  name="title"
                  required
                  minLength={3}
                  maxLength={160}
                  placeholder={
                    type === "bug"
                      ? "A short summary of the problem"
                      : "What would you like to see?"
                  }
                />
                <label htmlFor="feedback-description">
                  {type === "bug" ? "What went wrong?" : "Describe your idea"}
                </label>
                <textarea
                  id="feedback-description"
                  name="description"
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={4}
                  placeholder={
                    type === "bug"
                      ? "Tell us what happened and what you expected."
                      : "Explain the feature and how it would work."
                  }
                />
                <label htmlFor="feedback-details">
                  {type === "bug" ? "Steps to reproduce" : "What problem would this solve?"}{" "}
                  <span>(optional)</span>
                </label>
                <textarea id="feedback-details" name="details" maxLength={3000} rows={3} />
              </fieldset>
              <p className="feedback-help">
                Please don’t include passwords or other sensitive information.
              </p>
              {error && (
                <p className="feedback-error" role="alert">
                  {error}
                </p>
              )}
              <div className="feedback-actions">
                <button type="button" className="feedback-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" disabled={busy}>
                  {busy
                    ? "Submitting…"
                    : type === "bug"
                      ? "Submit bug report"
                      : "Submit feature request"}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
