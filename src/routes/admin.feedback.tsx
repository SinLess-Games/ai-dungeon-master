import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bug, Lightbulb, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listFeedback,
  updateFeedback,
  deleteFeedback,
  FEEDBACK_STATUSES,
  type FeedbackItem,
} from "@/lib/feedback.functions";

export const Route = createFileRoute("/admin/feedback")({
  component: AdminFeedback,
});

const FILTERS = ["all", "bug", "feature"] as const;

function AdminFeedback() {
  const load = useServerFn(listFeedback);
  const save = useServerFn(updateFeedback);
  const remove = useServerFn(deleteFeedback);

  const [items, setItems] = useState<FeedbackItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  useEffect(() => {
    let active = true;
    load({})
      .then((rows) => active && setItems(rows))
      .catch(() => active && setError("Could not load the reports right now."));
    return () => {
      active = false;
    };
  }, []);

  function patch(id: string, next: Partial<FeedbackItem>) {
    setItems((cur) => (cur ? cur.map((i) => (i.id === id ? { ...i, ...next } : i)) : cur));
  }

  const shown = (items ?? []).filter((i) => filter === "all" || i.kind === filter);

  return (
    <>
      <PageTitle title="Feedback" subtitle="Bug reports and feature ideas from players" />

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f === "all" ? "All" : f === "bug" ? "Bugs" : "Ideas"}
          </Button>
        ))}
      </div>

      {!items ? (
        <Skeleton className="h-64 w-full" />
      ) : shown.length === 0 ? (
        <Card className="border-primary/25 bg-card/70">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Nothing here yet — reports players send will appear on this board.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {shown.map((item) => (
            <Card key={item.id} className="border-primary/25 bg-card/70">
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-display text-lg text-foreground">
                      {item.kind === "bug" ? (
                        <Bug className="size-4 text-destructive" />
                      ) : (
                        <Lightbulb className="size-4 text-primary" />
                      )}
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.reporter} · {new Date(item.createdAt).toLocaleString()}
                      {item.pageUrl ? ` · ${item.pageUrl}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-primary/50 text-primary capitalize">
                      {item.status}
                    </Badge>
                    <Select
                      value={item.status}
                      onValueChange={(status) => {
                        patch(item.id, { status });
                        void save({ data: { id: item.id, status } })
                          .then(() => toast.success("Status updated"))
                          .catch(() => toast.error("Could not update that."));
                      }}
                    >
                      <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FEEDBACK_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete report"
                      onClick={() => {
                        setItems((cur) => cur?.filter((i) => i.id !== item.id) ?? cur);
                        void remove({ data: { id: item.id } }).catch(() =>
                          toast.error("Could not delete that."),
                        );
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                {item.details ? (
                  <p className="whitespace-pre-wrap text-sm text-foreground/85">{item.details}</p>
                ) : null}

                <Textarea
                  rows={2}
                  placeholder="Internal note…"
                  value={item.adminNote ?? ""}
                  onChange={(e) => patch(item.id, { adminNote: e.target.value })}
                  onBlur={() => {
                    void save({ data: { id: item.id, adminNote: item.adminNote ?? "" } }).catch(() =>
                      toast.error("Could not save the note."),
                    );
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
