import { createFileRoute } from "@tanstack/react-router";
import { Activity, Dices, Globe2, Map as MapIcon, MessagesSquare, Sparkles, Swords, UserPlus, Users, UsersRound } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageTitle } from "@/components/AppShell";
import {
  ChartFrame,
  GOLD,
  CHART_COLORS,
  StatCard,
  axisStyle,
  fmtDay,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "@/components/admin/AdminUi";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminMetrics } from "@/hooks/useAdminMetrics";
import { CampaignPlayersTable } from "@/components/admin/CampaignPlayersTable";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { metrics, error } = useAdminMetrics(true);

  return (
    <>
      <PageTitle
        title="Admin dashboard"
        subtitle="Live metrics across accounts, heroes, campaigns and play"
      />

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {!metrics ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            <StatCard
              icon={MessagesSquare}
              label="Messages"
              value={metrics.totals.messages}
              hint="Player and DM chat messages"
            />
            <StatCard
              icon={UsersRound}
              label="Players in campaigns"
              value={metrics.totals.players}
              hint={`${metrics.avgPlayersPerCampaign} active per campaign on average`}
            />
          </div>

          <CampaignPlayersTable />

          <div className="grid gap-4 2xl:grid-cols-2">
            <ChartFrame title="Signups — last 30 days">
              <AreaChart data={metrics.signupSeries} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a4257" />
                <XAxis dataKey="date" tickFormatter={fmtDay} minTickGap={18} {...axisStyle} />
                <YAxis allowDecimals={false} width={32} {...axisStyle} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  cursor={{ stroke: GOLD, strokeOpacity: 0.35 }}
                  labelFormatter={fmtDay}
                  formatter={(v: number) => [v, "New players"]}
                />
                <Area type="monotone" dataKey="users" stroke={GOLD} fill="url(#goldFill)" strokeWidth={2} />
              </AreaChart>
            </ChartFrame>

            <ChartFrame title="Content created — last 30 days">
              <BarChart data={metrics.contentSeries} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a4257" />
                <XAxis dataKey="date" tickFormatter={fmtDay} minTickGap={18} {...axisStyle} />
                <YAxis allowDecimals={false} width={32} {...axisStyle} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  cursor={{ fill: "rgba(226,185,95,0.08)" }}
                  labelFormatter={fmtDay}
                />
                <Legend wrapperStyle={{ fontSize: "0.8125rem", color: "#d6dcea" }} />
                <Bar name="Heroes" dataKey="characters" stackId="a" fill={CHART_COLORS[0]} />
                <Bar name="Campaigns" dataKey="campaigns" stackId="a" fill={CHART_COLORS[1]} />
                <Bar name="Worlds" dataKey="worlds" stackId="a" fill={CHART_COLORS[2]} />
              </BarChart>
            </ChartFrame>
          </div>
        </div>
      )}
    </>
  );
}
