import type { ReactNode, ReactElement } from "react";
import type { LucideIcon } from "lucide-react";
import { ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Chart-only literals: recharts writes these straight into SVG fill/stroke
// attributes, which cannot resolve the oklch theme variables.
export const GOLD = "#e2b95f";
export const CHART_COLORS = [GOLD, "#93b4dd", "#a596ee", "#dda57c"];

export const tooltipStyle = {
  background: "oklch(0.19 0.03 265)",
  border: "1px solid rgba(226, 185, 95, 0.45)",
  borderRadius: "0.5rem",
  fontSize: "0.8125rem",
  color: "#f4ecdc",
  boxShadow: "0 12px 30px -12px rgba(0,0,0,0.8)",
} as const;

export const tooltipLabelStyle = {
  color: GOLD,
  fontWeight: 600,
  marginBottom: "0.25rem",
} as const;

export const tooltipItemStyle = { color: "#f4ecdc" } as const;

export const axisStyle = {
  fontSize: 12,
  stroke: "#b9c2d6",
  tick: { fill: "#b9c2d6" },
} as const;

export function fmtDay(d: string) {
  return `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
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
          <p className="font-display text-3xl leading-none text-foreground">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          <p className="mt-1.5 text-[0.8rem] font-medium uppercase tracking-[0.12em] text-foreground/75">
            {label}
          </p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function ChartFrame({
  title,
  children,
  height = "h-72",
}: {
  title: string;
  children: ReactNode;
  height?: string;
}) {
  return (
    <Card className="border-primary/25 bg-card/70">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className={`${height} pt-2`}>
        <ResponsiveContainer width="100%" height="100%">
          {children as ReactElement}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
