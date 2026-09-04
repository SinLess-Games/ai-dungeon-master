import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Inbox, Mail, MailOpen, Search } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAdminInbox, setMessageRead, type InboxMessage } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/inbox")({
  component: AdminInboxPage,
});

function AdminInboxPage() {
  const load = useServerFn(getAdminInbox);
  const mark = useServerFn(setMessageRead);
  const [messages, setMessages] = useState<InboxMessage[] | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "player" | "dm">("all");

  useEffect(() => {
    let live = true;
    load({})
      .then((d) => live && setMessages(d.messages))
      .catch((e: any) => {
        if (live) toast.error(e?.message ?? "Could not load the inbox.");
        if (live) setMessages([]);
      });
    return () => {
      live = false;
    };
  }, [load]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (messages ?? []).filter((m) => {
      if (filter === "unread" && m.read) return false;
      if (filter === "read" && !m.read) return false;
      if (filter === "player" && m.senderKind !== "player") return false;
      if (filter === "dm" && m.senderKind !== "dm") return false;
      if (!q) return true;
      return (
        m.text.toLowerCase().includes(q) ||
        m.sender.toLowerCase().includes(q) ||
        m.campaignName.toLowerCase().includes(q)
      );
    });
  }, [messages, query, filter]);

  const unread = (messages ?? []).filter((m) => !m.read).length;

  async function toggle(m: InboxMessage) {
    const next = !m.read;
    setMessages((list) =>
      (list ?? []).map((x) => (x.key === m.key ? { ...x, read: next } : x)),
    );
    try {
      await mark({ data: { campaignId: m.campaignId, messageId: m.messageId, read: next } });
    } catch (e: any) {
      setMessages((list) =>
        (list ?? []).map((x) => (x.key === m.key ? { ...x, read: !next } : x)),
      );
      toast.error(e?.message ?? "Could not update that message.");
    }
  }

  return (
    <div>
      <PageTitle
        title="Message inbox"
        subtitle="Every message sent at every table, newest first."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Messages" value={messages?.length ?? 0} icon={Inbox} />
        <StatCard label="Unread" value={unread} icon={Mail} />
        <StatCard label="Read" value={(messages?.length ?? 0) - unread} icon={MailOpen} />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search text, sender or campaign…"
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All messages</SelectItem>
            <SelectItem value="unread">Unread only</SelectItem>
            <SelectItem value="read">Read only</SelectItem>
            <SelectItem value="player">From players</SelectItem>
            <SelectItem value="dm">From the DM</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {messages === null ? (
        <Skeleton className="h-96 w-full" />
      ) : rows.length === 0 ? (
        <Card className="border-primary/25 bg-card/70">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No messages match that view yet.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((m) => (
            <li key={m.key}>
              <Card
                className={
                  m.read
                    ? "border-border/60 bg-card/50"
                    : "border-primary/40 bg-card/80 shadow-[0_0_20px_-12px_rgba(217,169,77,0.8)]"
                }
              >
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm text-foreground">{m.sender}</span>
                      <Badge
                        variant="outline"
                        className={
                          m.senderKind === "dm"
                            ? "border-primary/40 bg-primary/15 text-primary"
                            : "border-sky-500/40 bg-sky-500/10 text-sky-300"
                        }
                      >
                        {m.senderKind === "dm" ? "Dungeon Master" : "Player"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{m.campaignName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {m.text.length > 600 ? `${m.text.slice(0, 600)}…` : m.text}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={m.read ? "ghost" : "outline"}
                    onClick={() => toggle(m)}
                    className="shrink-0"
                  >
                    {m.read ? (
                      <>
                        <MailOpen className="mr-2 size-4" /> Read
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 size-4" /> Mark read
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Inbox;
}) {
  return (
    <Card className="border-primary/25 bg-card/70">
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="size-5 text-primary" />
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="font-display text-2xl text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
