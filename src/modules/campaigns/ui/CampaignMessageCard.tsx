import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Check, Pencil, Trash2, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import {
  deleteCampaignPlayMessage,
  editCampaignPlayMessage,
} from "../client/campaignMessageApi";
import type { CampaignPlayMessage } from "../client/campaignPlayApi";

function epochMilliseconds(value: number) {
  return value < 10_000_000_000 ? value * 1000 : value;
}

function messageTime(value: number) {
  const date = new Date(epochMilliseconds(value));
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The message could not be changed.";
}

export function CampaignMessageCard({
  campaignId,
  message,
  canManage,
}: {
  campaignId: string;
  message: CampaignPlayMessage;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const dm = message.authorKind === "dm";
  const system = message.authorKind === "system";

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["campaigns", "play", campaignId, "messages", message.channel],
    });

  const edit = useMutation({
    mutationFn: (content: string) => editCampaignPlayMessage(campaignId, message.id, content),
    onSuccess: async () => {
      setEditing(false);
      toast.success("Message updated.");
      await invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: () => deleteCampaignPlayMessage(campaignId, message.id),
    onSuccess: async () => {
      toast.success("Message deleted.");
      await invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const busy = edit.isPending || remove.isPending;

  function beginEdit() {
    setDraft(message.content);
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(message.content);
    setEditing(false);
  }

  function saveEdit() {
    const content = draft.trim();
    if (!content || content === message.content || edit.isPending) {
      if (content === message.content) setEditing(false);
      return;
    }
    edit.mutate(content);
  }

  function confirmDelete() {
    if (busy) return;
    const confirmed = window.confirm(
      "Delete this message? This removes it from future Dungeon Master conversation context. Authoritative game events are not rolled back.",
    );
    if (confirmed) remove.mutate();
  }

  return (
    <article
      className={`group rounded-xl border p-4 ${
        dm
          ? "border-gold/30 bg-gold/5"
          : system
            ? "border-border bg-muted/20"
            : "border-border bg-card/75"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
            dm ? "text-gold" : "text-foreground"
          }`}
        >
          {dm ? <Bot className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}
          {message.authorName}
          {dm ? (
            <span className="rounded bg-gold/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
              DM
            </span>
          ) : null}
        </span>

        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-[11px] text-muted-foreground">
            {messageTime(message.createdAt)}
          </span>
          {canManage && !editing ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={beginEdit}
                aria-label={`Edit message from ${message.authorName}`}
                title="Edit message"
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={confirmDelete}
                aria-label={`Delete message from ${message.authorName}`}
                title="Delete message"
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          ) : null}
        </div>
      </div>

      {editing ? (
        <div className="mt-3 space-y-2">
          <textarea
            autoFocus
            aria-label="Edit campaign message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={4000}
            rows={Math.min(10, Math.max(3, draft.split("\n").length + 1))}
            className="w-full resize-y rounded-lg border border-border bg-background/70 px-3 py-2 text-sm leading-6 outline-none focus:border-gold/50"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={cancelEdit}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-40"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button
              type="button"
              disabled={busy || !draft.trim()}
              onClick={saveEdit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" /> {edit.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
          {message.content}
        </p>
      )}
    </article>
  );
}
