import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog } from "@/ui/primitives/Dialog";
import { authClient } from "@/modules/auth/client/authClient";
import type { AdminAccount } from "../client/queries";
export function AccountAction({
  account,
  viewerId,
  onClose,
}: {
  account: AdminAccount;
  viewerId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const queryClient = useQueryClient();
  async function confirm() {
    if (lock.current || account.id === viewerId) return;
    if (!account.suspended && !reason.trim()) {
      setError("Enter a reason for the suspension.");
      return;
    }
    lock.current = true;
    setPending(true);
    setError("");
    try {
      const result = account.suspended
        ? await authClient.admin.unbanUser({ userId: account.id })
        : await authClient.admin.banUser({ userId: account.id, banReason: reason.trim() });
      if (result.error) {
        setError(
          result.error.status === 403
            ? "Your account no longer has permission to do this."
            : "The account could not be updated. Refresh and try again.",
        );
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["admin", viewerId] });
      toast.success(account.suspended ? "Account restored." : "Account suspended.");
      onClose();
    } catch {
      setError("Unable to reach the service. Please try again.");
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return (
    <Dialog open onClose={onClose} titleId="account-action-title" className="admin-confirm">
      <h2 id="account-action-title">
        {account.suspended ? "Restore account?" : "Suspend account?"}
      </h2>
      <p>
        <strong>{account.displayUsername || account.name}</strong>
        <br />
        {account.email}
      </p>
      <p>
        {account.suspended
          ? "This person will be able to sign in again."
          : "This person will be signed out and prevented from signing in until an administrator restores access."}
      </p>
      {!account.suspended && (
        <label>
          Reason
          <textarea
            autoFocus
            value={reason}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            disabled={pending}
            rows={3}
          />
        </label>
      )}
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
      <div className="admin-confirm-actions">
        <button type="button" disabled={pending} onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="admin-primary"
          disabled={pending}
          onClick={() => void confirm()}
        >
          {pending ? "Updating…" : account.suspended ? "Restore access" : "Suspend account"}
        </button>
      </div>
    </Dialog>
  );
}
