import { detailedMetrics } from "./metrics";
import { bugReports } from "@/infrastructure/database/schema/feedback/bugReport";
import { featureRequests } from "@/infrastructure/database/schema/feedback/featureRequest";
import { Hono } from "hono";
import { and, count, desc, eq, gt, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import { campaigns } from "@/infrastructure/database/schema/campaign";
import { users, sessions } from "@/infrastructure/database/schema/auth";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireAdmin } from "@/modules/auth/server/requireAuth";
import { BadRequestError } from "@/server/middleware/errors";

const listQuery = z.object({
  search: z.string().trim().max(100).default(""),
  role: z.enum(["all", "user", "admin"]).default("all"),
  status: z.enum(["all", "active", "suspended"]).default("all"),
  page: z.coerce.number().int().min(0).max(100000).default(0),
});
const isSuspended = (now: Date) =>
  sql<boolean>`coalesce(${users.banned}, 0) = 1 AND (${users.banExpires} IS NULL OR ${users.banExpires} > ${now.getTime()})`;

export const adminRoutes = new Hono<{ Bindings: AuthEnv }>()
  .use("/api/admin/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await requireAdmin(createAuth(c.env), c.req.raw.headers);
    await next();
  })
  .get("/api/admin/metrics", async (c) => c.json(await detailedMetrics(c.env.DB!)))
  .get("/api/admin/overview", async (c) => {
    const db = createDatabase(c.env.DB!);
    const now = new Date();
    const [
      total,
      administrators,
      suspended,
      activeSessions,
      newUsers7Days,
      newUsers30Days,
      campaignTotal,
    ] = await Promise.all([
      db.select({ value: count() }).from(users).get(),
      db.select({ value: count() }).from(users).where(eq(users.role, "admin")).get(),
      db.select({ value: count() }).from(users).where(isSuspended(now)).get(),
      db.select({ value: count() }).from(sessions).where(gt(sessions.expiresAt, now)).get(),
      ...[7, 30].map((days) =>
        db
          .select({ value: count() })
          .from(users)
          .where(
            and(
              gte(users.createdAt, new Date(now.getTime() - days * 86_400_000)),
              lte(users.createdAt, now),
            ),
          )
          .get(),
      ),
      db.select({ value: count() }).from(campaigns).get(),
    ]);
    return c.json({
      users: total?.value ?? 0,
      newUsers7Days: newUsers7Days?.value ?? 0,
      newUsers30Days: newUsers30Days?.value ?? 0,
      campaigns: campaignTotal?.value ?? 0,
      // No AI send pipeline or message store exists in the current app.
      aiMessages: null,

      administrators: administrators?.value ?? 0,
      suspended: suspended?.value ?? 0,
      activeSessions: activeSessions?.value ?? 0,
    });
  })
  .get("/api/admin/feedback", async (c) => {
    const parsed = z
      .object({
        type: z.enum(["bug", "feature"]).default("bug"),
        page: z.coerce.number().int().min(0).max(100000).default(0),
      })
      .safeParse(c.req.query());
    if (!parsed.success) throw new BadRequestError("Invalid feedback filters.");
    const { type, page } = parsed.data;
    const db = createDatabase(c.env.DB!);
    const table = type === "bug" ? bugReports : featureRequests;
    const [items, total] = await Promise.all([
      type === "bug"
        ? db
            .select({
              id: bugReports.id,
              title: bugReports.title,
              description: bugReports.description,
              details: bugReports.stepsToReproduce,
              status: bugReports.status,
              createdAt: bugReports.createdAt,
              reporter: users.email,
            })
            .from(bugReports)
            .leftJoin(users, eq(users.id, bugReports.reporterUserId))
            .orderBy(desc(bugReports.createdAt), bugReports.id)
            .limit(20)
            .offset(page * 20)
            .all()
        : db
            .select({
              id: featureRequests.id,
              title: featureRequests.title,
              description: featureRequests.description,
              details: featureRequests.problem,
              status: featureRequests.status,
              createdAt: featureRequests.createdAt,
              reporter: users.email,
            })
            .from(featureRequests)
            .leftJoin(users, eq(users.id, featureRequests.requesterUserId))
            .orderBy(desc(featureRequests.createdAt), featureRequests.id)
            .limit(20)
            .offset(page * 20)
            .all(),
      db.select({ value: count() }).from(table).get(),
    ]);
    return c.json({ items, total: total?.value ?? 0, page, pageSize: 20 });
  })
  .get("/api/admin/users", async (c) => {
    const parsed = listQuery.safeParse(c.req.query());
    if (!parsed.success) throw new BadRequestError("Invalid account filters.");
    const { search, role, status, page } = parsed.data;
    const db = createDatabase(c.env.DB!);
    const suspended = isSuspended(new Date());
    // Substring search treats %, _ and quotes literally; all values are bound parameters.
    const match = and(
      search
        ? sql`(instr(lower(${users.email}), ${search.toLowerCase()}) > 0 OR instr(lower(coalesce(${users.username}, ${users.name})), ${search.toLowerCase()}) > 0)`
        : undefined,
      role !== "all" ? eq(users.role, role) : undefined,
      status === "suspended"
        ? suspended
        : status === "active"
          ? sql`coalesce((${suspended}), 0) = 0`
          : undefined,
    );
    const [rows, total] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          displayUsername: users.displayUsername,
          email: users.email,
          emailVerified: users.emailVerified,
          role: users.role,
          suspended: suspended.mapWith(Boolean),
          createdAt: users.createdAt,
        })
        .from(users)
        .where(match)
        .orderBy(desc(users.createdAt), users.id)
        .limit(20)
        .offset(page * 20)
        .all(),
      db.select({ value: count() }).from(users).where(match).get(),
    ]);
    return c.json({ users: rows, total: total?.value ?? 0, page, pageSize: 20 });
  });
