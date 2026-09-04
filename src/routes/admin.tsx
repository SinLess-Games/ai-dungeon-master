import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  Dices,
  Globe2,
  Map as MapIcon,
  ShieldCheck,
  Sparkles,
  Swords,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSession } from "@/hooks/useSession";
import { getAdminMetrics, type AdminMetrics } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — The Endless Codex" },
      {
        name: "description",
        content:
          "Site metrics for The Endless Codex: player signups, active accounts, heroes, campaigns, worlds, maps and dice activity.",
      },
      { property: "og:title", content: "Admin Dashboard — The Endless Codex" },
      {
        property: "og:description",
        content: "Player signups, active accounts and content growth across The Endless Codex.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

const GOLD = "hsl(var(--primary))";
const PIE_COLORS = ["hsl(var(--primary))", "#7c9cc4", "#8b7bd8", "#c48b6a"];

function fmtDay(d: string) {
  return `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <Card className="border-primary/25 bg-card/70">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-2.5 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="font-display text-2xl leading-none text-foreground">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground/80">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function ChartFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-primary/25 bg-card/70">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.5rem",
  fontSize: "0.75rem",
} as const;

function AdminPage() {
  const { user } = useSession();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const fetchMetrics = useServerFn(getAdminMetrics);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    fetchMetrics({})
      .then((m) => active && setMetrics(m))
      .catch(() => active && setError("Could not load the metrics right now."));
    return () => {
      active = false;
    };
  }, [isAdmin]);

  if (!user || (!isAdmin && !roleLoading)) {
    return (
      <AppShell>
        <PageTitle title="Admin" subtitle="Restricted area" />
        <Card className="max-w-lg border-primary/25 bg-card/70">
          <CardContent className="p-6 text-sm text-muted-foreground">
            {user ? (
              <>This page is for site administrators only.</>
            ) : (
              <>
                Please <Link to="/auth" className="text-primary underline">sign in</Link> to continue.
              </>
            )}
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageTitle
        title="Admin dashboard"
        subtitle="Live metrics across accounts, heroes, campaigns and play"
      />

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {!metrics ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Players" value={metrics.totals.users} />
            <StatCard
              icon={UserPlus}
              label="New (7 days)"
              value={metrics.newUsers7d}
              hint="Accounts created this week"
            />
            <StatCard
              icon={Activity}
              label="Active (30 days)"
              value={metrics.activeUsers30d}
              hint="Signed in recently"
            />
            <StatCard icon={Sparkles} label="Heroes" value={metrics.totals.characters} />
            <StatCard icon={Swords} label="Campaigns" value={metrics.totals.campaigns} />
            <StatCard icon={Globe2} label="Worlds" value={metrics.totals.worlds} />
            <StatCard icon={MapIcon} label="Maps" value={metrics.totals.maps} />
            <StatCard icon={Dices} label="Dice rolls" value={metrics.totals.rolls} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartFrame title="Signups — last 30 days">
              <AreaChart data={metrics.signupSeries}>
                <defs>
                  <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="date" tickFormatter={fmtDay} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} fontSize={11} stroke="hsl(var(--muted-foreground))" width={28} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={fmtDay} />
                <Area type="monotone" dataKey="users" stroke={GOLD} fill="url(#goldFill)" strokeWidth={2} />
              </AreaChart>
            </ChartFrame>

            <ChartFrame title="Content created — last 30 days">
              <BarChart data={metrics.contentSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="date" tickFormatter={fmtDay} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} fontSize={11} stroke="hsl(var(--muted-foreground))" width={28} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={fmtDay} />
                <Bar dataKey="characters" stackId="a" fill={PIE_COLORS[0]} />
                <Bar dataKey="campaigns" stackId="a" fill={PIE_COLORS[1]} />
                <Bar dataKey="worlds" stackId="a" fill={PIE_COLORS[2]} />
              </BarChart>
            </ChartFrame>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartFrame title="Library mix">
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} />
                <Pie
                  data={metrics.contentMix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {metrics.contentMix.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]!} />
                  ))}
                </Pie>
              </PieChart>
            </ChartFrame>

            <Card className="border-primary/25 bg-card/70 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base text-primary">Newest players</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="overflow-auto">
                  <table className="w-full min-w-[28rem] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                        <th className="py-2 pr-3 font-normal">Name</th>
                        <th className="py-2 pr-3 font-normal">Email</th>
                        <th className="py-2 font-normal">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.recentUsers.map((u) => (
                        <tr key={u.id} className="border-b border-border/30">
                          <td className="py-2 pr-3">
                            <span className="text-foreground">{u.displayName}</span>
                            {u.isAdmin ? (
                              <Badge variant="outline" className="ml-2 gap-1 text-[0.65rem] font-normal">
                                <ShieldCheck className="size-3" /> Admin
                              </Badge>
                            ) : null}
                          </td>
                          <td className="py-2 pr-3 text-muted-foreground">{u.email}</td>
                          <td className="py-2 text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
