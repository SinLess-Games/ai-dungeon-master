import { createFileRoute } from "@tanstack/react-router";
import { Cell, Legend, Pie, PieChart, Tooltip } from "recharts";
import { PageTitle } from "@/components/AppShell";
import {
  ChartFrame,
  CHART_COLORS,
  StatCard,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "@/components/admin/AdminUi";
import { Dices, Globe2, Map as MapIcon, Sparkles, Swords } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminMetrics } from "@/hooks/useAdminMetrics";

export const Route = createFileRoute("/admin/content")({
  component: AdminContent,
});

function AdminContent() {
  const { metrics, error } = useAdminMetrics(true);

  return (
    <>
      <PageTitle title="Content" subtitle="What players have created across the codex" />

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {!metrics ? (
        <Skeleton className="h-72 w-full" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard icon={Sparkles} label="Heroes" value={metrics.totals.characters} />
            <StatCard icon={Swords} label="Campaigns" value={metrics.totals.campaigns} />
            <StatCard icon={Globe2} label="Worlds" value={metrics.totals.worlds} />
            <StatCard icon={MapIcon} label="Maps" value={metrics.totals.maps} />
            <StatCard icon={Dices} label="Dice rolls" value={metrics.totals.rolls} />
          </div>

          <div className="max-w-xl">
            <ChartFrame title="Library mix">
              <PieChart>
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                />
                <Legend wrapperStyle={{ fontSize: "0.8125rem", color: "#d6dcea" }} />
                <Pie
                  data={metrics.contentMix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {metrics.contentMix.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]!} />
                  ))}
                </Pie>
              </PieChart>
            </ChartFrame>
          </div>
        </div>
      )}
    </>
  );
}
