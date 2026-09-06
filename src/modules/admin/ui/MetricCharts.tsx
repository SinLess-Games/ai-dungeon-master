import { useState } from "react";
import type { InferResponseType } from "hono/client";
import { api } from "@/infrastructure/api/client";

type Metrics = InferResponseType<typeof api.api.admin.metrics.$get>;
type Segment = { label: string; value: number; color: string };
const gold = "#e0b96d",
  blue = "#79b6d5",
  green = "#8cc5a2",
  red = "#d98a86",
  muted = "#8994a7";

function Donut({ title, segments }: { title: string; segments: Segment[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const total = segments.reduce((sum, item) => sum + item.value, 0);
  const active = selected === null ? undefined : segments[selected];
  let offset = 0;
  return (
    <article className="admin-chart-card">
      <h3>{title}</h3>
      <div className="admin-donut-layout">
        <div className="admin-donut">
          <svg viewBox="0 0 160 160" aria-hidden="true">
            <circle cx="80" cy="80" r="62" fill="none" stroke="#27323f" strokeWidth="16" />
            {segments.map((item, index) => {
              const length = total ? (item.value / total) * 100 : 0;
              const start = offset;
              offset += length;
              return (
                <circle
                  key={item.label}
                  cx="80"
                  cy="80"
                  r="62"
                  pathLength="100"
                  fill="none"
                  stroke={item.color}
                  strokeWidth={selected === index ? 20 : 16}
                  strokeDasharray={`${length} ${100 - length}`}
                  strokeDashoffset={-start}
                  transform="rotate(-90 80 80)"
                  opacity={selected === null || selected === index ? 1 : 0.3}
                />
              );
            })}
          </svg>
          <div className="admin-donut-value">
            <strong>{(active?.value ?? total).toLocaleString()}</strong>
            <span>
              {active
                ? `${total ? Math.round((active.value / total) * 100) : 0}% of total`
                : "Total"}
            </span>
          </div>
        </div>
        <ul className="admin-chart-legend">
          {segments.map((item, index) => (
            <li key={item.label}>
              <button
                type="button"
                aria-pressed={selected === index}
                onClick={() => setSelected(selected === index ? null : index)}
              >
                <span className="admin-chart-swatch" style={{ background: item.color }} />
                <span>{item.label}</span>
                <strong>{item.value.toLocaleString()}</strong>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {!total && <p className="admin-chart-note">No data yet.</p>}
    </article>
  );
}
function Bars({ title, segments }: { title: string; segments: Segment[] }) {
  const maximum = Math.max(1, ...segments.map((item) => item.value));
  return (
    <article className="admin-chart-card">
      <h3>{title}</h3>
      <ul className="admin-horizontal-bars">
        {segments.map((item) => (
          <li key={item.label}>
            <div>
              <span>{item.label}</span>
              <strong>{item.value.toLocaleString()}</strong>
            </div>
            <div className="admin-horizontal-track" aria-hidden="true">
              <span style={{ width: `${(item.value / maximum) * 100}%`, background: item.color }} />
            </div>
          </li>
        ))}
      </ul>
      {segments.every((item) => !item.value) && <p className="admin-chart-note">No data yet.</p>}
    </article>
  );
}
export function MetricCharts({ data }: { data: Metrics }) {
  const [period, setPeriod] = useState<7 | 30>(7);
  const current = period === 7 ? "last7" : "last30";
  const previous = period === 7 ? "previous7" : "previous30";
  return (
    <section className="admin-chart-section" aria-labelledby="chart-gallery-title">
      <div className="admin-trend-heading">
        <div>
          <h3 id="chart-gallery-title">At a glance</h3>
          <p>Live distributions and comparisons. Select a legend to inspect a share.</p>
        </div>
      </div>
      <div className="admin-chart-grid">
        <Donut
          title="Email verification"
          segments={[
            { label: "Verified", value: data.accounts.verified, color: green },
            {
              label: "Unverified",
              value: data.accounts.total - data.accounts.verified,
              color: gold,
            },
          ]}
        />
        <Donut
          title="Publishing pipeline"
          segments={[
            { label: "Published", value: data.posts.published, color: green },
            { label: "Drafts", value: data.posts.drafts, color: gold },
            { label: "Archived", value: data.posts.archived, color: muted },
          ]}
        />
        <Donut
          title="Comment moderation"
          segments={[
            { label: "Pending", value: data.comments.pending, color: gold },
            { label: "Approved", value: data.comments.approved, color: green },
            { label: "Rejected", value: data.comments.rejected, color: red },
          ]}
        />
        <Bars
          title="Bug report status"
          segments={[
            { label: "Open / being worked on", value: data.bugs.open, color: gold },
            { label: "Resolved", value: data.bugs.resolved, color: green },
            {
              label: "Other closed outcomes",
              value: Math.max(0, data.bugs.total - data.bugs.open - data.bugs.resolved),
              color: muted,
            },
          ]}
        />
        <Bars
          title="Feature request progress"
          segments={[
            { label: "New requests", value: data.features.submitted, color: gold },
            {
              label: "Under review / planned / in progress",
              value: data.features.underway,
              color: blue,
            },
            { label: "Completed", value: data.features.completed, color: green },
            {
              label: "Declined / duplicate",
              value: Math.max(
                0,
                data.features.total -
                  data.features.submitted -
                  data.features.underway -
                  data.features.completed,
              ),
              color: muted,
            },
          ]}
        />
        <article className="admin-chart-card admin-comparison-chart">
          <h3>Growth comparison</h3>
          <label>
            Compare periods{" "}
            <select
              value={period}
              onChange={(event) => setPeriod(Number(event.target.value) as 7 | 30)}
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
            </select>
          </label>
          <p className="admin-chart-note">
            Current rolling period against the immediately preceding period. Each group has its own
            scale.
          </p>
          <Bars
            title="Account signups"
            segments={[
              { label: "Current period", value: data.accounts[current], color: gold },
              { label: "Previous period", value: data.accounts[previous], color: blue },
            ]}
          />
          <Bars
            title="Campaign creation"
            segments={[
              { label: "Current period", value: data.campaigns[current], color: gold },
              { label: "Previous period", value: data.campaigns[previous], color: blue },
            ]}
          />
        </article>
      </div>
    </section>
  );
}
