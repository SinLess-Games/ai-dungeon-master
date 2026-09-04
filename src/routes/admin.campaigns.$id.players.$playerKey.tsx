import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Award } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCampaignPlayerProfile, type CampaignPlayerProfile } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/campaigns/$id/players/$playerKey")({
  component: PlayerProfilePage,
});

function PlayerProfilePage() {
  const { id, playerKey } = Route.useParams();
  const load = useServerFn(getCampaignPlayerProfile);
  const [data, setData] = useState<CampaignPlayerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    load({ data: { campaignId: id, playerKey } })
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e instanceof Error ? e.message : "Could not load this player"));
    return () => {
      live = false;
    };
  }, [load, id, playerKey]);

  return (
    <>
      <Link
        to="/admin/campaigns"
        className="mb-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="size-4" /> All campaigns
      </Link>

      <PageTitle
        title={data ? data.player.name : "Player"}
        subtitle={data ? `${data.campaign.name} · run by ${data.campaign.owner}` : "Campaign profile"}
      />

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {!data ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-primary/25 bg-card/70">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg text-primary">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2 text-sm text-foreground/85">
              <p>Level {data.player.level}</p>
              {data.player.race || data.player.classLine ? (
                <p>
                  {data.player.race} {data.player.classLine}
                </p>
              ) : null}
              <p>
                Health {data.player.hp}/{data.player.maxHp || "—"}
              </p>
              <p>
                Quests finished {data.questsDone} of {data.questsTotal}
              </p>
              <p>Journal entries {data.journalEntries}</p>
              <p>Messages sent {data.player.messages}</p>
              <p>Story {data.campaign.completed ? "complete" : "in progress"}</p>
              <p className="text-muted-foreground">
                Last played {new Date(data.campaign.updatedAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/25 bg-card/70">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-display text-lg text-primary">
                <Award className="size-4" /> Titles earned
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {data.player.titles.length ? (
                <ul className="flex flex-wrap gap-2">
                  {data.player.titles.map((t) => (
                    <li key={`${t.name}-${t.awardedAt}`}>
                      <Badge variant="outline" className="border-primary/40 text-primary">
                        {t.name} · {t.rarity}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No titles earned yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/25 bg-card/70">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg text-primary">Gear and notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2 text-sm text-foreground/85">
              {data.gear.length ? (
                <ul className="space-y-1">
                  {data.gear.map((g, i) => (
                    <li key={`${g.slot}-${i}`}>
                      <span className="text-muted-foreground">{g.slot}:</span> {g.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Nothing carried yet.</p>
              )}
              {data.notes ? <p className="pt-2">{data.notes}</p> : null}
            </CardContent>
          </Card>

          <Card className="border-primary/25 bg-card/70">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg text-primary">Recent messages</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {data.recentMessages.length ? (
                <ul className="space-y-2 text-sm text-foreground/85">
                  {data.recentMessages.map((m) => (
                    <li key={m.id} className="rounded-lg border border-border/50 p-2">
                      {m.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No messages from this seat.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
