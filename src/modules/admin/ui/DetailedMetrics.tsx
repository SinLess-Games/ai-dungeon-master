import { MetricCharts } from "./MetricCharts";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { metricsQuery } from "../client/queries";
function comparison(current: number, previous: number) {
  if (!previous)
    return current
      ? `+${current} from 0 in the previous period`
      : "No change from the previous period";
  const percent = Math.round(((current - previous) / previous) * 100);
  return `${percent > 0 ? "+" : ""}${percent}% vs previous period (${previous.toLocaleString()})`;
}
export function DetailedMetrics({ userId }: { userId: string }) {
  const query = useQuery(metricsQuery(userId));
  const [series, setSeries] = useState<"signups" | "campaigns">("signups");
  const data = query.data;
  return (
    <section className="admin-detail-metrics" aria-labelledby="detailed-metrics-title">
      <div className="admin-section-heading">
        <div>
          <h2 id="detailed-metrics-title">Platform insights</h2>
          <p>Growth, publishing, and the work waiting for your attention.</p>
        </div>
        <button type="button" disabled={query.isFetching} onClick={() => void query.refetch()}>
          Refresh metrics
        </button>
      </div>
      {query.isError ? (
        <p role="alert" className="admin-error">
          Unable to load detailed metrics. Refresh to try again.
        </p>
      ) : !data ? (
        <p role="status">Loading platform insights…</p>
      ) : (
        <>
          <div className="admin-growth-grid">
            {[
              { title: "New accounts", metric: data.accounts },
              { title: "Campaigns created", metric: data.campaigns },
            ].map(({ title, metric }) => (
              <article key={title}>
                <h3>{title}</h3>
                <dl>
                  <div>
                    <dt>Last 7 days</dt>
                    <dd>{metric.last7.toLocaleString()}</dd>
                    <small>{comparison(metric.last7, metric.previous7)}</small>
                  </div>
                  <div>
                    <dt>Last 30 days</dt>
                    <dd>{metric.last30.toLocaleString()}</dd>
                    <small>{comparison(metric.last30, metric.previous30)}</small>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <div className="admin-trend">
            <div className="admin-trend-heading">
              <div>
                <h3>Daily growth</h3>
                <p>Last 30 calendar days · UTC · today is partial</p>
              </div>
              <label>
                Show{" "}
                <select
                  value={series}
                  onChange={(event) => setSeries(event.target.value as typeof series)}
                >
                  <option value="signups">Account signups</option>
                  <option value="campaigns">Campaigns created</option>
                </select>
              </label>
            </div>
            <div
              className="admin-bars"
              role="img"
              aria-label={`Daily ${series} over the last 30 UTC days; exact values are in the table below.`}
            >
              {data.daily.map((day) => (
                <div key={day.day} title={`${day.day}: ${day[series]}`}>
                  <span
                    style={{
                      height: `${(day[series] / Math.max(1, ...data.daily.map((item) => item[series]))) * 100}%`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="admin-trend-dates">
              <span>{data.daily[0]?.day}</span>
              <span>{data.daily[29]?.day}</span>
            </div>
            <details>
              <summary>View daily counts</summary>
              <div className="admin-table-scroll">
                <table>
                  <caption>Daily signups and campaigns (UTC)</caption>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Signups</th>
                      <th>Campaigns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.daily.map((day) => (
                      <tr key={day.day}>
                        <td>{day.day}</td>
                        <td>{day.signups}</td>
                        <td>{day.campaigns}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
          <MetricCharts data={data} />
          <div className="admin-health-grid">
            <MetricGroup
              title="Accounts"
              rows={[
                ["Verified emails", data.accounts.verified],
                ["Unverified emails", data.accounts.total - data.accounts.verified],
                ["Users with unexpired sessions", data.accounts.signedIn],
              ]}
            />
            <MetricGroup
              title="Devblog"
              rows={[
                ["Published posts", data.posts.published],
                ["Draft posts", data.posts.drafts],
                ["Archived posts", data.posts.archived],
                ["Uploaded images", data.media.total],
                ["Image storage", `${(data.media.bytes / 1048576).toFixed(2)} MB`],
              ]}
            />
            <MetricGroup
              title="Comments"
              rows={[
                ["Awaiting moderation", data.comments.pending],
                ["Approved", data.comments.approved],
                ["Rejected", data.comments.rejected],
                ["Anonymous / deleted-account", data.comments.anonymous],
                ["Total comments", data.comments.total],
              ]}
            />
            <MetricGroup
              title="Feedback"
              rows={[
                ["Open bugs", data.bugs.open],
                ["High / critical open bugs", data.bugs.urgent],
                ["Resolved bugs", data.bugs.resolved],
                ["Total bug reports", data.bugs.total],
                ["New feature requests", data.features.submitted],
                ["Features under review / planned / in progress", data.features.underway],
                ["Completed features", data.features.completed],
                ["Total feature requests", data.features.total],
              ]}
            />
          </div>
          <div className="admin-insight-links">
            <Link to="/devblog/admin">Manage posts and moderate comments →</Link>
            <a href="#admin-feedback">Review feedback →</a>
          </div>
          <p className="admin-footnote">
            Updated {new Date(data.asOf).toLocaleTimeString()}. Growth uses rolling periods; deleted
            records are excluded. Unexpired sessions do not mean users are currently online. AI
            messages, page views, and play time are not tracked yet.
          </p>
        </>
      )}
    </section>
  );
}
function MetricGroup({ title, rows }: { title: string; rows: [string, number | string][] }) {
  return (
    <article>
      <h3>{title}</h3>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{typeof value === "number" ? value.toLocaleString() : value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
