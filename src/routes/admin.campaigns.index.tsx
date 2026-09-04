import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ScrollText } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getCampaignDashboard, type CampaignDashboardRow } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/campaigns/")({
  component: AdminCampaigns,
});

function AdminCampaigns() {
  const load = useServerFn(getCampaignDashboard);
  const [rows, setRows] = useState<CampaignDashboardRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let live = true;
    load({})
      .then((d) => live && setRows(d))
      .catch((e) => live && setError(e instanceof Error ? e.message : "Could not load campaigns"));
    return () => {
      live = false;
    };
  }, [load]);

  const term = q.trim().toLowerCase();
  const list = (rows ?? []).filter(
    (r) => !term || r.name.toLowerCase().includes(term) || r.owner.toLowerCase().includes(term),
  );

  return (
    <>
      <PageTitle title="Campaigns" subtitle="Every table, who is at it, and how far they have come" />

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      <div className="mb-4 max-w-sm">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by campaign or player"
          aria-label="Search campaigns"
        />
      </div>

      <h2 className="sr-only">Campaign list</h2>

      {!rows ? (
        <Skeleton className="h-64 w-full" />
      ) : !list.length ? (
        <Card className="border-primary/25 bg-card/70">
          <CardContent className="p-6 text-sm text-muted-foreground">No campaigns yet.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {list.map((c) => (
            <Card key={c.id} className="border-primary/25 bg-card/70">
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-wrap items-center gap-2 font-display text-lg text-primary">
                  <ScrollText className="size-4" />
                  {c.name}
                  {c.completed ? (
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      Complete
                    </Badge>
                  ) : null}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Run by {c.owner} · {c.players.length} at the table · {c.playerMessages} player messages ·{" "}
                  quests {c.questsDone}/{c.questsTotal} · last played{" "}
                  {new Date(c.updatedAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="overflow-auto">
                  <table className="w-full min-w-[36rem] text-left text-sm">
                    <thead>
                      <tr className="border-b border-primary/30 text-xs uppercase tracking-[0.12em] text-foreground/70">
                        <th className="py-2 pr-3 font-medium">Name</th>
                        <th className="py-2 pr-3 font-medium">Who runs them</th>
                        <th className="py-2 pr-3 font-medium">Level</th>
                        <th className="py-2 pr-3 font-medium">Messages</th>
                        <th className="py-2 pr-3 font-medium">Titles</th>
                        <th className="py-2 font-medium">Profile</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.players.map((p) => (
                        <tr key={p.key} className="border-b border-border/40 last:border-0">
                          <td className="py-2 pr-3 text-foreground">
                            {p.name}
                            {p.classLine ? (
                              <span className="ml-2 text-xs text-muted-foreground">{p.classLine}</span>
                            ) : null}
                          </td>
                          <td className="py-2 pr-3 text-foreground/80">
                            {p.kind === "hero" ? "Player" : "Dungeon Master"}
                          </td>
                          <td className="py-2 pr-3 text-foreground/80">{p.level}</td>
                          <td className="py-2 pr-3 text-foreground/80">{p.messages}</td>
                          <td className="py-2 pr-3 text-foreground/80">{p.titles.length}</td>
                          <td className="py-2">
                            <Link
                              to="/admin/campaigns/$id/players/$playerKey"
                              params={{ id: c.id, playerKey: p.key }}
                              className="text-primary underline"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
