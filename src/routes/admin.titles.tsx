import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Award, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CRITERIA_KINDS,
  TITLE_RARITIES,
  deleteTitle,
  grantTitle,
  listTitleHolders,
  listTitles,
  saveTitle,
  type TitleHolder,
  type TitleRow,
} from "@/lib/titles.functions";

export const Route = createFileRoute("/admin/titles")({
  component: AdminTitles,
});

const BLANK = {
  name: "",
  description: "",
  rarity: "common",
  icon: "",
  isActive: true,
  criteriaKind: "manual",
  criteriaTarget: 0,
};

function AdminTitles() {
  const load = useServerFn(listTitles);
  const loadHolders = useServerFn(listTitleHolders);
  const save = useServerFn(saveTitle);
  const remove = useServerFn(deleteTitle);
  const grant = useServerFn(grantTitle);

  const [rows, setRows] = useState<TitleRow[] | null>(null);
  const [holders, setHolders] = useState<TitleHolder[]>([]);
  const [draft, setDraft] = useState<typeof BLANK & { id?: string }>({ ...BLANK });
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [grantTitleId, setGrantTitleId] = useState<string>("");

  async function refresh() {
    const [t, h] = await Promise.all([load({}), loadHolders({})]);
    setRows(t);
    setHolders(h);
    if (!grantTitleId && t[0]) setGrantTitleId(t[0].id);
  }

  useEffect(() => {
    refresh().catch(() => toast.error("Could not load titles right now."));
  }, []);

  const shownPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? holders.filter((h) => h.displayName.toLowerCase().includes(q))
      : holders.slice(0, 25);
    return list.slice(0, 50);
  }, [holders, search]);

  async function submit() {
    setBusy(true);
    try {
      await save(draft as never);
      setDraft({ ...BLANK });
      await refresh();
      toast.success("Title saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save that title.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageTitle title="Titles" subtitle="Create titles and set how players earn them" />

      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg text-primary">
          {draft.id ? "Edit title" : "New title"}
        </h2>
        <Card className="border-primary/25 bg-card/70">
          <CardContent className="grid gap-4 p-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title-name">Name</Label>
              <Input
                id="title-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Dragonslayer"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title-icon">Icon name (optional)</Label>
              <Input
                id="title-icon"
                value={draft.icon}
                onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                placeholder="crown"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="title-desc">Description</Label>
              <Textarea
                id="title-desc"
                rows={2}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Awarded for felling a dragon."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rarity</Label>
              <Select
                value={draft.rarity}
                onValueChange={(v) => setDraft({ ...draft, rarity: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TITLE_RARITIES.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>How it is earned</Label>
              <Select
                value={draft.criteriaKind}
                onValueChange={(v) => setDraft({ ...draft, criteriaKind: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRITERIA_KINDS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {draft.criteriaKind !== "manual" && (
              <div className="space-y-1.5">
                <Label htmlFor="title-target">Amount needed</Label>
                <Input
                  id="title-target"
                  type="number"
                  min={0}
                  value={draft.criteriaTarget}
                  onChange={(e) =>
                    setDraft({ ...draft, criteriaTarget: Number(e.target.value) || 0 })
                  }
                />
              </div>
            )}
            <div className="flex items-center gap-3 pt-6">
              <Switch
                id="title-live"
                checked={draft.isActive}
                onCheckedChange={(v) => setDraft({ ...draft, isActive: v })}
              />
              <Label htmlFor="title-live">Available to players</Label>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button onClick={() => void submit()} disabled={busy || !draft.name.trim()}>
                <Plus className="size-4" /> {draft.id ? "Save changes" : "Create title"}
              </Button>
              {draft.id && (
                <Button variant="outline" onClick={() => setDraft({ ...BLANK })}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg text-primary">All titles</h2>
        {!rows ? (
          <Skeleton className="h-48 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No titles yet.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((t) => (
              <Card key={t.id} className="border-primary/20 bg-card/60">
                <CardContent className="flex flex-wrap items-center gap-3 p-4">
                  <Award className="size-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base text-foreground">
                      {t.name}{" "}
                      <Badge variant="outline" className="ml-1 capitalize">
                        {t.rarity}
                      </Badge>
                      {!t.isActive && (
                        <Badge variant="secondary" className="ml-1">
                          hidden
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.description || "No description"} ·{" "}
                      {CRITERIA_KINDS.find((c) => c.value === t.criteriaKind)?.label ?? t.criteriaKind}
                      {t.criteriaKind !== "manual" ? ` ≥ ${t.criteriaTarget}` : ""} · {t.holders}{" "}
                      holder{t.holders === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setDraft({
                        id: t.id,
                        name: t.name,
                        description: t.description,
                        rarity: t.rarity,
                        icon: t.icon ?? "",
                        isActive: t.isActive,
                        criteriaKind: t.criteriaKind,
                        criteriaTarget: t.criteriaTarget,
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await remove({ data: { id: t.id } } as never);
                      await refresh();
                      toast.success("Title removed.");
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg text-primary">Grant a title by hand</h2>
        <Card className="border-primary/25 bg-card/70">
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap gap-3">
              <Select value={grantTitleId} onValueChange={setGrantTitleId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Pick a title" />
                </SelectTrigger>
                <SelectContent>
                  {(rows ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search players"
                className="w-56"
              />
            </div>
            <ul className="divide-y divide-border/50">
              {shownPlayers.map((p) => {
                const has = grantTitleId ? p.titleIds.includes(grantTitleId) : false;
                return (
                  <li key={p.userId} className="flex items-center justify-between py-2">
                    <span className="text-sm text-foreground">{p.displayName}</span>
                    <Button
                      size="sm"
                      variant={has ? "secondary" : "outline"}
                      disabled={!grantTitleId}
                      onClick={async () => {
                        await grant({
                          data: { userId: p.userId, titleId: grantTitleId, grant: !has },
                        } as never);
                        await refresh();
                      }}
                    >
                      {has ? "Take back" : "Grant"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
