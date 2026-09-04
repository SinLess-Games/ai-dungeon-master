import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCampaignPlayers, type CampaignPlayers } from "@/lib/admin.functions";

/** Per-campaign roster sizes so admins can see where the tables are busiest. */
export function CampaignPlayersTable({ limit = 12 }: { limit?: number }) {
  const load = useServerFn(getCampaignPlayers);
  const [rows, setRows] = useState<CampaignPlayers[] | null>(null);

  useEffect(() => {
    let live = true;
    load({})
      .then((d) => live && setRows(d))
      .catch(() => live && setRows([]));
    return () => {
      live = false;
    };
  }, [load]);

  if (rows === null) return <Skeleton className="h-64 w-full" />;
  if (!rows.length) return null;

  const top = [...rows].sort((a, b) => b.players - a.players || b.messages - a.messages).slice(0, limit);

  return (
    <Card className="border-primary/25 bg-card/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-display text-base text-foreground">
          <UsersRound className="size-4 text-primary" /> Players per campaign
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <th className="px-5 py-3">Campaign</th>
                <th className="px-5 py-3">Run by</th>
                <th className="px-5 py-3">Active players</th>
                <th className="px-5 py-3">Messages</th>
                <th className="px-5 py-3">Last played</th>
              </tr>
            </thead>
            <tbody>
              {top.map((r) => (
                <tr key={r.id} className="border-b border-border/40 last:border-0">
                  <td className="px-5 py-3 text-foreground">{r.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.owner}</td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className="border-primary/40 bg-primary/15 text-primary">
                      {r.players}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{r.messages}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(r.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
