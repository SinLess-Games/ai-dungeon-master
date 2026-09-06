import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Gamepad2 } from "lucide-react";
import { authClient } from "../client/authClient";
export function OAuthButtons({
  busy,
  setBusy,
}: {
  busy: boolean;
  setBusy: (value: boolean) => void;
}) {
  const [error, setError] = useState("");
  const lock = useRef(false);
  const providers = useQuery({
    queryKey: ["auth-providers"],
    queryFn: async () => {
      const response = await fetch("/api/auth/providers");
      if (!response.ok) throw Error("Provider configuration unavailable");
      return (await response.json()) as { google: boolean; discord: boolean };
    },
  });
  async function signIn(provider: "google" | "discord") {
    if (busy || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: window.location.pathname + window.location.search + window.location.hash,
        errorCallbackURL: `${window.location.pathname}?authError=oauth`,
      });
      if (error) throw Error();
    } catch {
      setError(`Unable to complete ${provider === "google" ? "Google" : "Discord"} sign-in.`);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="auth-oauth">
      <p className="auth-divider">or continue with</p>
      {(["google", "discord"] as const).map((provider) => (
        <button
          key={provider}
          type="button"
          disabled={busy || !providers.data?.[provider]}
          onClick={() => void signIn(provider)}
        >
          <span className="auth-provider-icon" aria-hidden="true">
            {provider === "google" ? "G" : <Gamepad2 />}
          </span>
          {busy ? "Please wait…" : `Continue with ${provider === "google" ? "Google" : "Discord"}`}
          {!providers.isPending && !providers.data?.[provider] && <small>Not configured yet</small>}
        </button>
      ))}
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
    </div>
  );
}
