import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "@/ui/primitives/Dialog";
import { useAuthModal } from "@/shared/stores/authModal.store";
import { CredentialForm } from "./CredentialForm";
import { OAuthButtons } from "./OAuthButtons";
import "./auth.css";
export function AuthModal() {
  const { isOpen, mode, close, openLogin, openSignup } = useAuthModal();
  const [busy, setBusy] = useState(false);
  const [oauthError, setOauthError] = useState(false);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("authError")) {
      setOauthError(true);
      openLogin();
      url.searchParams.delete("authError");
      window.history.replaceState(null, "", url);
    }
  }, [openLogin]);
  return (
    <Dialog open={isOpen} onClose={close} titleId="auth-title" className="auth-modal">
      <div className="auth-modal-content">
        <button
          type="button"
          className="auth-close"
          onClick={close}
          aria-label="Close authentication"
        >
          <X />
        </button>
        <p className="auth-brand">Endless Codex</p>
        <h2 id="auth-title">
          {mode === "login" ? "Welcome back, adventurer" : "Begin your story"}
        </h2>
        <div className="auth-modes">
          <button type="button" aria-pressed={mode === "login"} disabled={busy} onClick={openLogin}>
            Sign In
          </button>
          <button
            type="button"
            aria-pressed={mode === "signup"}
            disabled={busy}
            onClick={openSignup}
          >
            Create Account
          </button>
        </div>
        {oauthError && (
          <p role="alert" className="auth-error">
            Social sign-in could not be completed. Please try again.
          </p>
        )}
        {isOpen && (
          <CredentialForm key={mode} signup={mode === "signup"} busy={busy} setBusy={setBusy} />
        )}
        <OAuthButtons busy={busy} setBusy={setBusy} />
        <p className="auth-switch">
          {mode === "login" ? "New to the Codex?" : "Already have an account?"}{" "}
          <button type="button" disabled={busy} onClick={mode === "login" ? openSignup : openLogin}>
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </Dialog>
  );
}
