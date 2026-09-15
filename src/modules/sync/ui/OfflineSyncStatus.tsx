import { AlertTriangle, Check, Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useOfflineSync } from "@/infrastructure/offline";

function statusText(input: {
  online: boolean;
  syncing: boolean;
  pending: number;
  conflicts: number;
  errors: number;
}) {
  if (!input.online) return input.pending ? `Offline · ${input.pending} saved locally` : "Offline · saved locally";
  if (input.syncing) return "Syncing saves…";
  if (input.conflicts) return `${input.conflicts} save conflict${input.conflicts === 1 ? "" : "s"}`;
  if (input.errors) return `${input.errors} save${input.errors === 1 ? "" : "s"} need attention`;
  if (input.pending) return `${input.pending} save${input.pending === 1 ? "" : "s"} waiting to sync`;
  return "Cloud saves synced";
}

export function OfflineSyncStatus() {
  const sync = useOfflineSync();
  const text = statusText(sync);
  const problemRows = sync.mutations.filter(
    (mutation) => mutation.state === "conflict" || mutation.state === "error",
  );

  return (
    <details className="relative">
      <summary
        className="codex-icon-button cursor-pointer list-none"
        aria-label={text}
        title={text}
      >
        {!sync.online ? (
          <CloudOff aria-hidden="true" />
        ) : sync.syncing || sync.pending ? (
          <RefreshCw className={sync.syncing ? "animate-spin" : ""} aria-hidden="true" />
        ) : sync.conflicts || sync.errors ? (
          <AlertTriangle aria-hidden="true" />
        ) : (
          <Cloud aria-hidden="true" />
        )}
      </summary>
      <section className="absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-4 text-left shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Offline saves</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
          </div>
          {sync.online && !sync.syncing ? (
            <button
              type="button"
              onClick={() => void sync.syncNow()}
              className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:border-gold/50"
            >
              Sync now
            </button>
          ) : null}
        </div>

        {sync.lastSyncedAt ? (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-gold" />
            Last cloud sync {new Date(sync.lastSyncedAt).toLocaleString()}
          </p>
        ) : null}

        {problemRows.length ? (
          <div className="mt-4 space-y-3 border-t border-border pt-3">
            {problemRows.map((mutation) => (
              <div key={mutation.id} className="rounded-lg border border-border bg-background/50 p-3">
                <p className="text-xs font-semibold text-foreground">
                  {mutation.state === "conflict" ? "Cloud save conflict" : "Save rejected"}
                </p>
                <p className="mt-1 break-words text-xs text-muted-foreground">
                  {mutation.lastError ?? mutation.url}
                </p>
                {mutation.state === "conflict" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void sync.resolveConflict(mutation.id, "keep-local")}
                      className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground"
                    >
                      Keep this device
                    </button>
                    <button
                      type="button"
                      onClick={() => void sync.resolveConflict(mutation.id, "use-cloud")}
                      className="rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold"
                    >
                      Use cloud copy
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void sync.retryMutation(mutation.id)}
                    className="mt-3 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold"
                  >
                    Retry
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
            Campaign and character draft saves are cached on this device. JSON save changes made
            offline are replayed in order when you reconnect; conflicts require an explicit choice.
          </p>
        )}
      </section>
    </details>
  );
}
