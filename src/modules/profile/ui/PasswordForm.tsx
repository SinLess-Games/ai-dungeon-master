import { useRef, useState, type FormEvent } from "react";
import { authClient } from "@/modules/auth/client/authClient";
import { passwordSchema } from "@/modules/auth/domain/validation";

export function PasswordForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const lock = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") || "");
    const newPassword = String(data.get("newPassword") || "");
    setError("");
    setSuccess(false);
    const validation = passwordSchema.safeParse(newPassword);
    if (!validation.success) {
      setError("Use 8–128 characters for your new password.");
      return;
    }
    if (newPassword !== data.get("confirmPassword")) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("Choose a different password from your current one.");
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) {
        setError(
          result.error.code === "INVALID_PASSWORD"
            ? "Your current password is incorrect."
            : result.error.code === "CREDENTIAL_ACCOUNT_NOT_FOUND"
              ? "This account uses a social sign-in provider. Manage your password with that provider."
              : "Unable to change your password. Check your current password and try again.",
        );
        return;
      }
      form.reset();
      setSuccess(true);
    } catch {
      setError("Unable to change your password. Check your connection and try again.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="profile-panel" aria-labelledby="password-title">
      <h2 id="password-title">Change password</h2>
      <p>
        Use your current password to set a new one. Other devices will be signed out. If you use
        Google or Discord without a password, manage it with your sign-in provider.
      </p>
      <form onSubmit={(event) => void submit(event)}>
        <fieldset disabled={busy}>
          <label htmlFor="current-password">Current password</label>
          <input
            id="current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
          />
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            aria-describedby="password-help"
          />
          <p id="password-help" className="profile-help">
            Use 8–128 characters.
          </p>
          <label htmlFor="confirm-password">Confirm new password</label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
          />
        </fieldset>
        {error && (
          <p role="alert" className="profile-error">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="profile-success">
            Password changed. Other devices have been signed out.
          </p>
        )}
        <div className="profile-actions">
          <button type="submit" disabled={busy}>
            {busy ? "Changing password…" : "Change password"}
          </button>
        </div>
      </form>
    </section>
  );
}
