import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import {
  DEFAULT_WORKERS_AI_DEVBLOG_MODEL,
  generateOpenAICompatibleText,
} from "@/infrastructure/ai/openaiCompatible";
import { users } from "@/infrastructure/database/schema/auth";
import { blogPosts as posts } from "@/infrastructure/database/schema/devblog";
import { collectWeeklyGitHubActivity } from "./github";
import { WEEKLY_DEVBLOG_SYSTEM_PROMPT } from "./prompt";
import type { DevBlogAIEnv, DevBlogAITrigger, WeeklyDevBlogResult } from "./types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const PROJECT_TIME_ZONE = "America/Denver";

const generatedPostSchema = z.object({
  title: z.string().trim().min(3).max(160),
  excerpt: z.string().trim().min(10).max(500),
  markdown: z.string().trim().min(100).max(100000),
});

function envBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value.trim() === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export function isWeeklyDevBlogEnabled(env: DevBlogAIEnv): boolean {
  return envBoolean(env.DEVBLOG_AI_ENABLED, true);
}

export function shouldAutoPublishWeeklyDevBlog(env: DevBlogAIEnv): boolean {
  return envBoolean(env.DEVBLOG_AI_AUTO_PUBLISH, false);
}

function localCalendarParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PROJECT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";

  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    weekday: read("weekday"),
  };
}

export function weeklyDevBlogKey(now: Date): string {
  const local = localCalendarParts(now);
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    local.weekday,
  );
  const calendarDate = new Date(Date.UTC(local.year, local.month - 1, local.day));
  calendarDate.setUTCDate(calendarDate.getUTCDate() - Math.max(weekdayIndex, 0));
  return calendarDate.toISOString().slice(0, 10);
}

function extractJsonObject(text: string): unknown {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first < 0 || last <= first) throw new Error("AI response did not contain a JSON object.");
  return JSON.parse(text.slice(first, last + 1));
}

async function resolveScheduledAuthor(env: DevBlogAIEnv): Promise<string> {
  if (!env.DB) throw new Error("D1 DB binding is required for the weekly devblog writer.");
  const db = createDatabase(env.DB);
  const configuredEmail = env.DEVBLOG_AI_AUTHOR_EMAIL?.trim().toLowerCase();

  const author = configuredEmail
    ? await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, configuredEmail), eq(users.role, "admin")))
        .get()
    : await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, "admin"))
        .orderBy(users.createdAt)
        .limit(1)
        .get();

  if (!author) {
    throw new Error(
      configuredEmail
        ? "DEVBLOG_AI_AUTHOR_EMAIL does not match an administrator account."
        : "No administrator account exists to own the scheduled devblog post.",
    );
  }

  return author.id;
}

export async function generateWeeklyDevBlog(
  env: DevBlogAIEnv,
  options: {
    trigger: DevBlogAITrigger;
    authorUserId?: string;
    notes?: string;
    now?: Date;
  },
): Promise<WeeklyDevBlogResult> {
  if (!isWeeklyDevBlogEnabled(env)) {
    throw new Error("Weekly AI devblog generation is disabled.");
  }
  if (!env.DB) throw new Error("D1 DB binding is required for the weekly devblog writer.");

  const now = options.now ?? new Date();
  const weekKey = weeklyDevBlogKey(now);
  const slug = `weekly-dev-update-${weekKey}`;
  const db = createDatabase(env.DB);

  const existing = await db
    .select({ id: posts.id, title: posts.title, status: posts.status })
    .from(posts)
    .where(eq(posts.slug, slug))
    .get();

  if (existing) {
    return {
      created: false,
      skipped: true,
      weekKey,
      postId: existing.id,
      slug,
      title: existing.title,
      status: existing.status === "published" ? "published" : "draft",
    };
  }

  const authorUserId = options.authorUserId || (await resolveScheduledAuthor(env));
  const periodEnd = now;
  const periodStart = new Date(now.getTime() - WEEK_MS);

  const [github, previousPosts] = await Promise.all([
    collectWeeklyGitHubActivity(env, periodStart, periodEnd),
    db
      .select({
        title: posts.title,
        excerpt: posts.excerpt,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt))
      .limit(5)
      .all(),
  ]);

  if (!github.commits.length && !github.pullRequests.length && !github.issues.length) {
    throw new Error("No GitHub activity was found for the last seven days; refusing to invent a post.");
  }

  const sourceMaterial = {
    generatedAt: now.toISOString(),
    weekKey,
    trigger: options.trigger,
    weeklyNotes: options.notes?.trim().slice(0, 5000) || "",
    github,
    previousPublishedPosts: previousPosts,
  };

  const raw = await generateOpenAICompatibleText(env, {
    system: WEEKLY_DEVBLOG_SYSTEM_PROMPT,
    prompt: `Use the following source material to write this week's Endless Codex development journal.\n\n${JSON.stringify(sourceMaterial, null, 2)}`,
  });
  const generated = generatedPostSchema.parse(extractJsonObject(raw));
  const autoPublish = shouldAutoPublishWeeklyDevBlog(env);
  const createdAt = now.getTime();
  const postId = crypto.randomUUID();

  await db.insert(posts).values({
    id: postId,
    authorUserId,
    title: generated.title,
    slug,
    excerpt: generated.excerpt,
    markdown: generated.markdown,
    status: autoPublish ? "published" : "draft",
    coverImageId: null,
    createdAt,
    updatedAt: createdAt,
    publishedAt: autoPublish ? createdAt : null,
    archivedAt: null,
  });

  return {
    created: true,
    skipped: false,
    weekKey,
    postId,
    slug,
    title: generated.title,
    status: autoPublish ? "published" : "draft",
  };
}

export async function getWeeklyDevBlogStatus(env: DevBlogAIEnv, now = new Date()) {
  if (!env.DB) throw new Error("D1 DB binding is required for the weekly devblog writer.");
  const db = createDatabase(env.DB);
  const weekKey = weeklyDevBlogKey(now);
  const slug = `weekly-dev-update-${weekKey}`;
  const current = await db
    .select({
      id: posts.id,
      title: posts.title,
      status: posts.status,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .where(eq(posts.slug, slug))
    .get();

  const workersAIConfigured = Boolean(env.AI);
  const fallbackAIConfigured = Boolean(env.AI_API_KEY);
  const githubConfigured = Boolean(env.GITHUB_TOKEN);
  const aiConfigured = workersAIConfigured || fallbackAIConfigured;

  return {
    enabled: isWeeklyDevBlogEnabled(env),
    autoPublish: shouldAutoPublishWeeklyDevBlog(env),
    configured: aiConfigured && githubConfigured,
    aiConfigured,
    githubConfigured,
    freeWorkersAI: workersAIConfigured,
    provider: workersAIConfigured
      ? "Cloudflare Workers AI"
      : fallbackAIConfigured
        ? "OpenAI-compatible API"
        : "Not configured",
    model:
      env.AI_DEVBLOG_MODEL?.trim() ||
      (workersAIConfigured ? DEFAULT_WORKERS_AI_DEVBLOG_MODEL : "gpt-5-mini"),
    repository: env.GITHUB_REPOSITORY?.trim() || "SinLess-Games/ai-dungeon-master",
    schedule: "Every Sunday evening (01:00 UTC Monday)",
    weekKey,
    current: current ?? null,
  };
}
