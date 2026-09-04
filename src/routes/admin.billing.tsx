import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, CalendarClock, CircleSlash, CreditCard } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { StatCard } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminBilling, type AdminBilling } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/billing")({
  head: () => ({
    meta: [
      { title: "Subscriptions — The Endless Codex Admin" },
      {
        name: "description",
        content:
          "Paid Multiplayer Pass subscriptions, plan mix, recurring revenue and renewal dates for The Endless Codex.",
      },
      { property: "og:title", content: "Subscriptions — The Endless Codex Admin" },
      {
        property: "og:description",
        content: "Paid Multiplayer Pass subscriptions and recurring revenue.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminBillingPage,
});

const PLAN_LABEL: Record<string, string> = {
  multiplayer_monthly: "Multiplayer — monthly",
  multiplayer_yearly: "Multiplayer — yearly",
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function AdminBillingPage() {
  const fetchBilling = useServerFn(getAdminBilling);
  const [data, setData] = useState<AdminBilling | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchBilling({})
      .then((d) => active && setData(d))
      .catch(() => active && setError("Could not load subscriptions right now."));
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageTitle title="Subscriptions" subtitle="Paid Multiplayer Pass members and revenue" />

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {!data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="font-display text-xl text-primary">Revenue at a glance</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={BadgeCheck} label="Active passes" value={data.activeCount} />
            <StatCard
              icon={CreditCard}
              label="Monthly recurring"
              value={money(data.mrrCents)}
              hint="Yearly plans counted per month"
            />
            <StatCard icon={CalendarClock} label="Monthly plans" value={data.monthlyCount} />
            <StatCard icon={CircleSlash} label="Ended or lapsed" value={data.canceledCount} />
          </div>

          <h2 className="font-display text-xl text-primary">Subscribers</h2>
          <Card className="border-primary/25 bg-card/70">
            <CardContent className="p-0">
              {data.rows.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  No one has bought a Multiplayer Pass yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-primary/20 text-left text-xs uppercase tracking-wide text-primary/80">
                        <th className="px-4 py-3">Player</th>
                        <th className="px-4 py-3">Plan</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Renews</th>
                        <th className="px-4 py-3">Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((r) => (
                        <tr key={r.id} className="border-b border-primary/10 last:border-0">
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{r.displayName}</div>
                            <div className="text-xs text-muted-foreground">{r.email}</div>
                          </td>
                          <td className="px-4 py-3">{PLAN_LABEL[r.plan] ?? r.plan}</td>
                          <td className="px-4 py-3">
                            <Badge variant={r.status === "active" ? "default" : "secondary"}>
                              {r.cancelAtPeriodEnd ? `${r.status} (ending)` : r.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {r.currentPeriodEnd
                              ? new Date(r.currentPeriodEnd).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {r.environment === "live" ? "Live" : "Test"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
