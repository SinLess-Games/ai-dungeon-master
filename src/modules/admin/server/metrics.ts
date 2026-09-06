const DAY = 86_400_000;
// Campaign timestamps are Unix seconds in the current schema and ISO text in legacy saves.
const campaignTime =
  "CASE WHEN typeof(created_at) = 'text' THEN unixepoch(created_at) * 1000 ELSE created_at * 1000 END";
export async function detailedMetrics(db: D1Database, now = Date.now()) {
  const windows = (time: string) => `
    count(*) AS total,
    coalesce(sum(${time} >= ? AND ${time} <= ?), 0) AS last7,
    coalesce(sum(${time} >= ? AND ${time} < ?), 0) AS previous7,
    coalesce(sum(${time} >= ? AND ${time} <= ?), 0) AS last30,
    coalesce(sum(${time} >= ? AND ${time} < ?), 0) AS previous30`;
  const bounds = [
    now - 7 * DAY,
    now,
    now - 14 * DAY,
    now - 7 * DAY,
    now - 30 * DAY,
    now,
    now - 60 * DAY,
    now - 30 * DAY,
  ];
  const startDay = new Date(now).toISOString().slice(0, 10);
  const start = Date.parse(startDay) - 29 * DAY;
  const [aggregates, trend] = await Promise.all([
    db.batch<Record<string, number>>([
      db
        .prepare(
          `SELECT ${windows("created_at")}, coalesce(sum(email_verified=1),0) AS verified FROM users`,
        )
        .bind(...bounds),
      db.prepare(`SELECT ${windows(campaignTime)} FROM campaigns`).bind(...bounds),
      db
        .prepare("SELECT count(DISTINCT user_id) AS signedIn FROM sessions WHERE expires_at > ?")
        .bind(now),
      db.prepare(
        "SELECT count(*) AS total, coalesce(sum(status='published'),0) AS published, coalesce(sum(status='draft'),0) AS drafts, coalesce(sum(status='archived'),0) AS archived FROM devblog_posts",
      ),
      db.prepare(
        "SELECT count(*) AS total, coalesce(sum(status='pending'),0) AS pending, coalesce(sum(status='approved'),0) AS approved, coalesce(sum(status='rejected'),0) AS rejected, coalesce(sum(user_id IS NULL),0) AS anonymous FROM devblog_comments",
      ),
      db.prepare(
        "SELECT count(*) AS total, coalesce(sum(status IN ('open','triaged','in_progress')),0) AS open, coalesce(sum(status='resolved'),0) AS resolved, coalesce(sum(severity IN ('high','critical') AND status IN ('open','triaged','in_progress')),0) AS urgent FROM bug_reports",
      ),
      db.prepare(
        "SELECT count(*) AS total, coalesce(sum(status='submitted'),0) AS submitted, coalesce(sum(status IN ('under_review','planned','in_progress')),0) AS underway, coalesce(sum(status='completed'),0) AS completed FROM feature_requests",
      ),
      db.prepare("SELECT count(*) AS total, coalesce(sum(size),0) AS bytes FROM devblog_media"),
    ]),
    db
      .prepare(
        `SELECT day, sum(signups) AS signups, sum(campaigns) AS campaigns FROM (
      SELECT strftime('%Y-%m-%d',created_at / 1000.0,'unixepoch') AS day, count(*) AS signups, 0 AS campaigns
      FROM users WHERE created_at >= ? AND created_at <= ? GROUP BY day
      UNION ALL
      SELECT strftime('%Y-%m-%d',(${campaignTime}) / 1000.0,'unixepoch') AS day, 0 AS signups, count(*) AS campaigns
      FROM campaigns WHERE (${campaignTime}) >= ? AND (${campaignTime}) <= ? GROUP BY day
    ) GROUP BY day ORDER BY day`,
      )
      .bind(start, now, start, now)
      .all<{ day: string; signups: number; campaigns: number }>(),
  ]);
  const row = (index: number) => aggregates[index]?.results[0] || {};
  const growth = (index: number) => {
    const r = row(index);
    return {
      total: r["total"] || 0,
      last7: r["last7"] || 0,
      previous7: r["previous7"] || 0,
      last30: r["last30"] || 0,
      previous30: r["previous30"] || 0,
    };
  };
  const days = new Map(trend.results.map((day) => [day.day, day]));
  return {
    asOf: now,
    accounts: {
      ...growth(0),
      verified: row(0)["verified"] || 0,
      signedIn: row(2)["signedIn"] || 0,
    },
    campaigns: growth(1),
    posts: {
      total: row(3)["total"] || 0,
      published: row(3)["published"] || 0,
      drafts: row(3)["drafts"] || 0,
      archived: row(3)["archived"] || 0,
    },
    comments: {
      total: row(4)["total"] || 0,
      pending: row(4)["pending"] || 0,
      approved: row(4)["approved"] || 0,
      rejected: row(4)["rejected"] || 0,
      anonymous: row(4)["anonymous"] || 0,
    },
    bugs: {
      total: row(5)["total"] || 0,
      open: row(5)["open"] || 0,
      resolved: row(5)["resolved"] || 0,
      urgent: row(5)["urgent"] || 0,
    },
    features: {
      total: row(6)["total"] || 0,
      submitted: row(6)["submitted"] || 0,
      underway: row(6)["underway"] || 0,
      completed: row(6)["completed"] || 0,
    },
    media: { total: row(7)["total"] || 0, bytes: row(7)["bytes"] || 0 },
    daily: Array.from({ length: 30 }, (_, i) => {
      const day = new Date(start + i * DAY).toISOString().slice(0, 10);
      return days.get(day) || { day, signups: 0, campaigns: 0 };
    }),
  };
}
