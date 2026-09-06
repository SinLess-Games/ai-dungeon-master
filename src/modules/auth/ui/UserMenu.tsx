import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UserRound, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "../client/authClient";
import { refreshIdentity } from "../client/queries";
import { useAuthModal } from "@/shared/stores/authModal.store";
export function UserMenu() {
  const { data, isPending, error, refetch } = authClient.useSession();
  const [busy, setBusy] = useState(false);
  const menu = useRef<HTMLDetailsElement>(null);
  const queryClient = useQueryClient();
  if (isPending)
    return (
      <span className="auth-session-loading" role="status">
        Loading account…
      </span>
    );
  if (error)
    return (
      <button type="button" className="auth-header-login" onClick={() => void refetch()}>
        Retry account
      </button>
    );
  if (!data)
    return (
      <div className="auth-header-actions">
        <button
          className="auth-header-login"
          type="button"
          onClick={useAuthModal.getState().openLogin}
        >
          Sign In
        </button>
        <button
          className="auth-header-signup"
          type="button"
          onClick={useAuthModal.getState().openSignup}
        >
          Create Account
        </button>
      </div>
    );
  const name = data.user.displayUsername || data.user.username || data.user.name;
  async function signOut() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await authClient.signOut();
      if (result.error) throw Error();
      menu.current?.removeAttribute("open");
      await refreshIdentity(queryClient);
    } catch {
      toast.error("Unable to sign out. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <details
      className="auth-user-menu"
      ref={menu}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          event.currentTarget.removeAttribute("open");
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          menu.current?.removeAttribute("open");
          menu.current?.querySelector("summary")?.focus();
        }
      }}
    >
      <summary className="codex-account">
        <span className="codex-avatar">
          {data.user.image ? (
            <img src={data.user.image} alt="" referrerPolicy="no-referrer" />
          ) : (
            <UserRound />
          )}
        </span>
        <span className="codex-account-copy">
          <span>{name}</span>
          <small>{data.user.role === "admin" ? "Administrator" : "Adventurer"}</small>
        </span>
        <ChevronDown size={16} />
      </summary>
      <div className="auth-user-options">
        <strong>{name}</strong>
        <span>{data.user.email}</span>
        <p>Account / Profile — coming soon</p>
        {data.user.role === "admin" && (
          <p className="auth-admin-label">Admin · administration tools coming soon</p>
        )}
        <button type="button" onClick={() => void signOut()} disabled={busy}>
          {busy ? "Signing out…" : "Sign Out"}
        </button>
      </div>
    </details>
  );
}
