import { detailedMetrics } from "./metrics";
import {
  bugReports,
  bugReportStatuses,
} from "@/infrastructure/database/schema/feedback/bugReport";
import {
  featureRequests,
  featureRequestStatuses,
} from "@/infrastructure/database/schema/feedback/featureRequest";
import { githubFeedbackLinks } from "@/infrastructure/database/schema/feedback/githubFeedbackLink";
import { Hono } from "hono";
import { and, count, desc, eq, gt, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import { campaigns } from "@/infrastructure/database/schema/campaign";
import { users, sessions } from "@/infrastructure/database/schema/auth";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireAdmin } from "@/modules/auth/server/requireAuth";
import { enqueueFeedbackSync } from "@/modules/feedback/github/sync";
import type { GitHubFeedbackEnv } from "@/modules/feedback/github/types";
import { BadRequestError, NotFoundError } from "@/server/middleware/errors";

const listQuery = z.object({
  search: z.string().trim().max(100).default(""),
  role: z.enum(["all", "user", "admin"]).default("all"),
  status: z.enum(["all", "active", "suspended"]).default("all"),
  page: z.coerce.number().int().min(0).max(100000).default(0),
});
const bugStatusSchema = z.enum(bugReportStatuses);
const featureStatusSchema = z.enum(featureRequestStatuses);
const feedbackTypeSchema = z.enum(["bug", "feature"]);
const isSuspended = (now: Date) =>
  sql<boolean>`coalesce(${users.banned}, 0) = 1 AND (${users.banExpires} IS NULL OR ${users.banExpires} > ${now.getTime()})`;

type AdminBindings = AuthEnv & GitHubFeedbackEnv;

async function feedbackExists(
  database: ReturnType<typeof createDatabase>,
  type: "bug" | "feature",
  id: string,
): Promise<boolean> {
  if (type === "bug") {
    return Boolean(
      await database.select({ id: bugReports.id }).from(bugReports).where(eq(bugReports.id, id)).get(),
    );
  }
  return Boolean(
    await database
      .select({ id: featureRequests.id })
      .from(featureRequests)
      .where(eq(featureRequests.id, id))
      .get(),
  );
}

export const adminRoutes = new Hono<{ Bindings: AdminBindings }>()
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
        type: feedbackTypeSchema.default("bug"),
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
              githubIssueNumber: githubFeedbackLinks.githubIssueNumber,
              githubIssueUrl: githubFeedbackLinks.githubIssueUrl,
              githubSyncStatus: githubFeedbackLinks.syncStatus,
              githubLastError: githubFeedbackLinks.lastError,
              githubLastSyncedAt: githubFeedbackLinks.lastSyncedAt,
            })
            .from(bugReports)
            .leftJoin(users, eq(users.id, bugReports.reporterUserId))
            .leftJoin(
              githubFeedbackLinks,
              and(
                eq(githubFeedbackLinks.feedbackType, "bug"),
                eq(githubFeedbackLinks.feedbackId, bugReports.id),
              ),
            )
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
              githubIssueNumber: githubFeedbackLinks.githubIssueNumber,
              githubIssueUrl: githubFeedbackLinks.githubIssueUrl,
              githubSyncStatus: githubFeedbackLinks.syncStatus,
              githubLastError: githubFeedbackLinks.lastError,
              githubLastSyncedAt: githubFeedbackLinks.lastSyncedAt,
            })
            .from(featureRequests)
            .leftJoin(users, eq(users.id, featureRequests.requesterUserId))
            .leftJoin(
              githubFeedbackLinks,
              and(
                eq(githubFeedbackLinks.feedbackType, "feature"),
                eq(githubFeedbackLinks.feedbackId, featureRequests.id),
              ),
            )
            .orderBy(desc(featureRequests.createdAt), featureRequests.id)
            .limit(20)
            .offset(page * 20)
            .all(),
      db.select({ value: count() }).from(table).get(),
    ]);
    return c.json({ items, total: total?.value ?? 0, page, pageSize: 20 });
  })
  .patch("/api/admin/feedback/:type/:id", async (c) => {
    const typeResult = feedbackTypeSchema.safeParse(c.req.param("type"));
    if (!typeResult.success) throw new BadRequestError("Invalid feedback type.");
    const type = typeResult.data;
    const id = c.req.param("id");
    const body = (await c.req.json().catch(() => null)) as { status?: unknown } | null;
    const statusResult =
      type === "bug"
        ? bugStatusSchema.safeParse(body?.status)
        : featureStatusSchema.safeParse(body?.status);
    if (!statusResult.success) throw new BadRequestError("Invalid feedback status.");

    const db = createDatabase(c.env.DB!);
    if (!(await feedbackExists(db, type, id))) throw new NotFoundError("Feedback was not found.");
    const now = new Date();
    if (type === "bug") {
      const status = bugStatusSchema.parse(statusResult.data);
      await db
        .update(bugReports)
        .set({
          status,
          updatedAt: now,
          ...(status === "resolved" || status === "closed" ? { resolvedAt: now } : {}),
        })
        .where(eq(bugReports.id, id))
        .run();
    } else {
      const status = featureStatusSchema.parse(statusResult.data);
      await db
        .update(featureRequests)
        .set({
          status,
          updatedAt: now,
          ...(status === "completed" ? { completedAt: now } : {}),
        })
        .where(eq(featureRequests.id, id))
        .run();
    }

    let githubSyncQueued = false;
    try {
      githubSyncQueued = await enqueueFeedbackSync(c.env.GITHUB_SYNC_QUEUE, {
        feedbackType: type,
        feedbackId: id,
        reason: "status_changed",
      });
    } catch (error) {
      console.error("Unable to queue feedback status sync", { type, id, error });
    }
    return c.json({ id, type, status: statusResult.data, githubSyncQueued });
  })
  .post("/api/admin/feedback/:type/:id/sync", async (c) => {
    const typeResult = feedbackTypeSchema.safeParse(c.req.param("type"));
    if (!typeResult.success) throw new BadRequestError("Invalid feedback type.");
    const type = typeResult.data;
    const id = c.req.param("id");
    const db = createDatabase(c.env.DB!);
    if (!(await feedbackExists(db, type, id))) throw new NotFoundError("Feedback was not found.");

    let queued = false;
    try {
      queued = await enqueueFeedbackSync(c.env.GITHUB_SYNC_QUEUE, {
        feedbackType: type,
        feedbackId: id,
        reason: "status_changed",
      });
    } catch (error) {
      console.error("Unable to manually queue GitHub feedback sync", { type, id, error });
    }
    return c.json({ id, type, queued }, queued ? 202 : 503);
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
