/// <reference types="@cloudflare/workers-types" />

import { and, eq } from "drizzle-orm";
import { createDatabase } from "@/infrastructure/database/client";
import {
  bugReports,
  type BugReportSeverity,
  type BugReportStatus,
} from "@/infrastructure/database/schema/feedback/bugReport";
import {
  featureRequests,
  type FeatureRequestCategory,
  type FeatureRequestImpact,
  type FeatureRequestStatus,
} from "@/infrastructure/database/schema/feedback/featureRequest";
import {
  githubFeedbackLinks,
  type GitHubFeedbackType,
} from "@/infrastructure/database/schema/feedback/githubFeedbackLink";
import { githubWebhookDeliveries } from "@/infrastructure/database/schema/feedback/githubWebhookDelivery";
import {
  createGitHubIssue,
  ensureGitHubLabel,
  getGitHubIssue,
  updateGitHubIssue,
} from "./client";
import type {
  FeedbackSyncJob,
  GitHubFeedbackEnv,
  GitHubIssueSnapshot,
  GitHubSyncJob,
} from "./types";

const SOURCE_LABEL = "source:feedback";
const BUG_LABEL = "type:bug";
const FEATURE_LABEL = "type:feature";
const MANAGED_LABEL_PREFIXES = ["status:", "severity:", "impact:", "category:"] as const;
const knownLabels = new Set<string>();

const BUG_OPEN = new Set<BugReportStatus>(["open", "triaged", "in_progress"]);
const BUG_CLOSED = new Set<BugReportStatus>(["resolved", "closed", "duplicate", "wont_fix"]);
const FEATURE_OPEN = new Set<FeatureRequestStatus>([
  "submitted",
  "under_review",
  "planned",
  "in_progress",
]);
const FEATURE_CLOSED = new Set<FeatureRequestStatus>(["completed", "declined", "duplicate"]);
const FEATURE_CATEGORIES = new Set<FeatureRequestCategory>([
  "gameplay",
  "ai",
  "rules",
  "maps",
  "multiplayer",
  "characters",
  "worlds",
  "campaigns",
  "content",
  "ui",
  "mobile",
  "desktop",
  "billing",
  "account",
  "performance",
  "accessibility",
  "other",
]);

interface FeedbackMarker {
  type: GitHubFeedbackType;
  id: string;
}

function requireDatabase(env: GitHubFeedbackEnv): D1Database {
  if (!env.DB) throw new Error("GitHub feedback sync requires the D1 binding.");
  return env.DB;
}

function requireRepository(env: GitHubFeedbackEnv): string {
  const repository = env.GITHUB_REPOSITORY?.trim();
  if (!repository || !/^[^/]+\/[^/]+$/.test(repository)) {
    throw new Error("GITHUB_REPOSITORY must be configured as owner/repository.");
  }
  return repository;
}

function issueLabels(issue: GitHubIssueSnapshot): string[] {
  return issue.labels
    .map((label) => (typeof label === "string" ? label : label.name))
    .filter((label): label is string => Boolean(label));
}

function normalizedStatusLabel(status: string): string {
  return `status:${status.replaceAll("_", "-")}`;
}

function isManagedLabel(label: string): boolean {
  return (
    label === SOURCE_LABEL ||
    label === BUG_LABEL ||
    label === FEATURE_LABEL ||
    MANAGED_LABEL_PREFIXES.some((prefix) => label.startsWith(prefix))
  );
}

function isCoreSyncLabel(label: string): boolean {
  return (
    label === SOURCE_LABEL ||
    label === BUG_LABEL ||
    label === FEATURE_LABEL ||
    label.startsWith("status:")
  );
}

function sameLabelSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const expected = new Set(right);
  return left.every((value) => expected.has(value));
}

function labelDefinition(name: string): { name: string; color: string; description: string } {
  if (name === SOURCE_LABEL) {
    return { name, color: "5319e7", description: "Synced with The Endless Codex feedback inbox" };
  }
  if (name === BUG_LABEL) {
    return { name, color: "d73a4a", description: "Endless Codex bug report" };
  }
  if (name === FEATURE_LABEL) {
    return { name, color: "a2eeef", description: "Endless Codex feature request" };
  }
  if (name.startsWith("severity:")) {
    return { name, color: "b60205", description: "Bug severity mirrored from Endless Codex" };
  }
  if (name.startsWith("impact:")) {
    return { name, color: "fbca04", description: "Feature impact mirrored from Endless Codex" };
  }
  if (name.startsWith("category:")) {
    return { name, color: "0e8a16", description: "Feature category mirrored from Endless Codex" };
  }
  return { name, color: "6f42c1", description: "Feedback workflow state mirrored from Endless Codex" };
}

async function ensureManagedLabels(env: GitHubFeedbackEnv, labels: string[]): Promise<void> {
  await Promise.all(
    labels.map(async (label) => {
      if (knownLabels.has(label)) return;
      await ensureGitHubLabel(env, labelDefinition(label));
      knownLabels.add(label);
    }),
  );
}

function feedbackMarker(type: GitHubFeedbackType, id: string): string {
  return `<!-- endless-codex-feedback type="${type}" id="${id}" -->`;
}

function parseFeedbackMarker(body: string | null): FeedbackMarker | null {
  if (!body) return null;
  const match = body.match(
    /<!--\s*endless-codex-feedback\s+type="(bug|feature)"\s+id="([^"]+)"\s*-->/i,
  );
  const type = match?.[1];
  const id = match?.[2];
  if ((type !== "bug" && type !== "feature") || !id) return null;
  return { type, id };
}

function extractSection(body: string, heading: string): string | undefined {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const headingPattern = new RegExp(`^#{2,3}\\s+${escapedHeading}\\s*$`, "im");
  const headingMatch = headingPattern.exec(body);
  if (!headingMatch) return undefined;
  const contentStart = headingMatch.index + headingMatch[0].length;
  const remaining = body.slice(contentStart).replace(/^\s+/, "");
  const boundary = remaining.search(
    /\n#{2,3}\s+|\n---(?:\n|$)|\n<!--\s*endless-codex-feedback/,
  );
  const value = (boundary >= 0 ? remaining.slice(0, boundary) : remaining).trim();
  return value || undefined;
}

function stripFeedbackMarker(body: string): string {
  return body
    .replace(/<!--\s*endless-codex-feedback\s+type="(?:bug|feature)"\s+id="[^"]+"\s*-->/gi, "")
    .replace(/\n---\s*\nSubmitted from The Endless Codex in-app feedback\.\s*$/i, "")
    .trim();
}

function feedbackTypeFromIssue(issue: GitHubIssueSnapshot): GitHubFeedbackType | null {
  const labels = new Set(issueLabels(issue));
  if (labels.has(BUG_LABEL)) return "bug";
  if (labels.has(FEATURE_LABEL)) return "feature";
  if (!labels.has(SOURCE_LABEL)) {
    if (/^\s*\[bug\]/i.test(issue.title)) return "bug";
    if (/^\s*\[(feature|enhancement)\]/i.test(issue.title)) return "feature";
    return null;
  }
  if (labels.has("bug")) return "bug";
  if (labels.has("enhancement") || labels.has("feature")) return "feature";
  return null;
}

function cleanImportedTitle(title: string): string {
  return title.replace(/^\s*\[(?:bug|feature|enhancement)\]\s*/i, "").trim() || title.trim();
}

function statusLabel(issue: GitHubIssueSnapshot): string | undefined {
  return issueLabels(issue)
    .find((label) => label.startsWith("status:"))
    ?.slice("status:".length)
    .replaceAll("-", "_");
}

function bugStatusFromIssue(issue: GitHubIssueSnapshot): BugReportStatus {
  const mapped = statusLabel(issue) as BugReportStatus | undefined;
  if (issue.state === "closed") return mapped && BUG_CLOSED.has(mapped) ? mapped : "closed";
  return mapped && BUG_OPEN.has(mapped) ? mapped : "open";
}

function featureStatusFromIssue(issue: GitHubIssueSnapshot): FeatureRequestStatus {
  const mapped = statusLabel(issue) as FeatureRequestStatus | undefined;
  if (issue.state === "closed") {
    return mapped && FEATURE_CLOSED.has(mapped) ? mapped : "completed";
  }
  return mapped && FEATURE_OPEN.has(mapped) ? mapped : "submitted";
}

function bugSeverityFromIssue(issue: GitHubIssueSnapshot): BugReportSeverity {
  const value = issueLabels(issue)
    .find((label) => label.startsWith("severity:"))
    ?.slice("severity:".length);
  return value === "low" || value === "high" || value === "critical" ? value : "medium";
}

function featureImpactFromIssue(issue: GitHubIssueSnapshot): FeatureRequestImpact {
  const value = issueLabels(issue)
    .find((label) => label.startsWith("impact:"))
    ?.slice("impact:".length);
  return value === "low" || value === "high" || value === "critical" ? value : "medium";
}

function featureCategoryFromIssue(issue: GitHubIssueSnapshot): FeatureRequestCategory {
  const value = issueLabels(issue)
    .find((label) => label.startsWith("category:"))
    ?.slice("category:".length);
  return value && FEATURE_CATEGORIES.has(value as FeatureRequestCategory)
    ? (value as FeatureRequestCategory)
    : "other";
}

function bodyForBug(input: {
  id: string;
  description: string;
  stepsToReproduce: string | null;
}): string {
  return [
    "## Description",
    input.description,
    input.stepsToReproduce ? `## Steps to reproduce\n${input.stepsToReproduce}` : "",
    "---",
    "Submitted from The Endless Codex in-app feedback.",
    feedbackMarker("bug", input.id),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function bodyForFeature(input: { id: string; description: string; problem: string | null }): string {
  return [
    "## Description",
    input.description,
    input.problem ? `## Problem to solve\n${input.problem}` : "",
    "---",
    "Submitted from The Endless Codex in-app feedback.",
    feedbackMarker("feature", input.id),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function labelsForBug(input: { status: BugReportStatus; severity: string }): string[] {
  return [SOURCE_LABEL, BUG_LABEL, normalizedStatusLabel(input.status), `severity:${input.severity}`];
}

function labelsForFeature(input: {
  status: FeatureRequestStatus;
  impact: string;
  category: string;
}): string[] {
  return [
    SOURCE_LABEL,
    FEATURE_LABEL,
    normalizedStatusLabel(input.status),
    `impact:${input.impact}`,
    `category:${input.category}`,
  ];
}

async function saveIssueLink(
  env: GitHubFeedbackEnv,
  feedbackType: GitHubFeedbackType,
  feedbackId: string,
  repositoryFullName: string,
  issue: GitHubIssueSnapshot,
): Promise<void> {
  const db = createDatabase(requireDatabase(env));
  const now = new Date();
  const values = {
    feedbackType,
    feedbackId,
    repositoryFullName,
    githubIssueId: issue.id,
    githubIssueNodeId: issue.node_id,
    githubIssueNumber: issue.number,
    githubIssueUrl: issue.html_url,
    syncStatus: "synced" as const,
    lastError: null,
    githubUpdatedAt: new Date(issue.updated_at),
    lastSyncedAt: now,
    updatedAt: now,
  };
  await db
    .insert(githubFeedbackLinks)
    .values({ id: crypto.randomUUID(), ...values })
    .onConflictDoUpdate({
      target: [githubFeedbackLinks.feedbackType, githubFeedbackLinks.feedbackId],
      set: values,
    })
    .run();
}

async function markFeedbackSyncError(
  env: GitHubFeedbackEnv,
  feedbackType: GitHubFeedbackType,
  feedbackId: string,
  error: unknown,
): Promise<void> {
  if (!env.DB) return;
  const message = error instanceof Error ? error.message : String(error);
  await createDatabase(env.DB)
    .update(githubFeedbackLinks)
    .set({ syncStatus: "error", lastError: message.slice(0, 2000), updatedAt: new Date() })
    .where(
      and(
        eq(githubFeedbackLinks.feedbackType, feedbackType),
        eq(githubFeedbackLinks.feedbackId, feedbackId),
      ),
    )
    .run();
}

async function syncBugToGitHub(env: GitHubFeedbackEnv, job: FeedbackSyncJob): Promise<void> {
  const db = createDatabase(requireDatabase(env));
  const feedback = await db.select().from(bugReports).where(eq(bugReports.id, job.feedbackId)).get();
  if (!feedback) return;

  const link = await db
    .select()
    .from(githubFeedbackLinks)
    .where(
      and(
        eq(githubFeedbackLinks.feedbackType, "bug"),
        eq(githubFeedbackLinks.feedbackId, feedback.id),
      ),
    )
    .get();
  const managed = labelsForBug(feedback);
  await ensureManagedLabels(env, managed);

  if (!link) {
    const issue = await createGitHubIssue(env, {
      title: feedback.title,
      body: bodyForBug(feedback),
      labels: managed,
    });
    await saveIssueLink(env, "bug", feedback.id, requireRepository(env), issue);
    return;
  }

  const issue = await getGitHubIssue(env, link.repositoryFullName, link.githubIssueNumber);
  const preserved = issueLabels(issue).filter((label) => !isManagedLabel(label));
  const labels = [...preserved, ...managed];
  const state = BUG_CLOSED.has(feedback.status) ? "closed" : "open";
  const needsUpdate = issue.state !== state || !sameLabelSet(issueLabels(issue), labels);
  const updated = needsUpdate
    ? await updateGitHubIssue(env, link.repositoryFullName, link.githubIssueNumber, { state, labels })
    : issue;
  await saveIssueLink(env, "bug", feedback.id, link.repositoryFullName, updated);
}

async function syncFeatureToGitHub(env: GitHubFeedbackEnv, job: FeedbackSyncJob): Promise<void> {
  const db = createDatabase(requireDatabase(env));
  const feedback = await db
    .select()
    .from(featureRequests)
    .where(eq(featureRequests.id, job.feedbackId))
    .get();
  if (!feedback) return;

  const link = await db
    .select()
    .from(githubFeedbackLinks)
    .where(
      and(
        eq(githubFeedbackLinks.feedbackType, "feature"),
        eq(githubFeedbackLinks.feedbackId, feedback.id),
      ),
    )
    .get();
  const managed = labelsForFeature(feedback);
  await ensureManagedLabels(env, managed);

  if (!link) {
    const issue = await createGitHubIssue(env, {
      title: feedback.title,
      body: bodyForFeature(feedback),
      labels: managed,
    });
    await saveIssueLink(env, "feature", feedback.id, requireRepository(env), issue);
    return;
  }

  const issue = await getGitHubIssue(env, link.repositoryFullName, link.githubIssueNumber);
  const preserved = issueLabels(issue).filter((label) => !isManagedLabel(label));
  const labels = [...preserved, ...managed];
  const state = FEATURE_CLOSED.has(feedback.status) ? "closed" : "open";
  const needsUpdate = issue.state !== state || !sameLabelSet(issueLabels(issue), labels);
  const updated = needsUpdate
    ? await updateGitHubIssue(env, link.repositoryFullName, link.githubIssueNumber, { state, labels })
    : issue;
  await saveIssueLink(env, "feature", feedback.id, link.repositoryFullName, updated);
}

async function syncFeedbackToGitHub(env: GitHubFeedbackEnv, job: FeedbackSyncJob): Promise<void> {
  try {
    if (job.feedbackType === "bug") await syncBugToGitHub(env, job);
    else await syncFeatureToGitHub(env, job);
  } catch (error) {
    await markFeedbackSyncError(env, job.feedbackType, job.feedbackId, error).catch(() => undefined);
    throw error;
  }
}

async function existingFeedbackForMarker(
  env: GitHubFeedbackEnv,
  marker: FeedbackMarker,
): Promise<boolean> {
  const db = createDatabase(requireDatabase(env));
  if (marker.type === "bug") {
    return Boolean(
      await db.select({ id: bugReports.id }).from(bugReports).where(eq(bugReports.id, marker.id)).get(),
    );
  }
  return Boolean(
    await db
      .select({ id: featureRequests.id })
      .from(featureRequests)
      .where(eq(featureRequests.id, marker.id))
      .get(),
  );
}

async function importGitHubIssue(
  env: GitHubFeedbackEnv,
  issue: GitHubIssueSnapshot,
  feedbackType: GitHubFeedbackType,
): Promise<string> {
  const db = createDatabase(requireDatabase(env));
  const id = crypto.randomUUID();
  const body = issue.body?.trim() || `Imported from GitHub issue #${issue.number}.`;
  const description =
    extractSection(body, "Description") ??
    extractSection(body, "Problem to solve") ??
    stripFeedbackMarker(body) ||
    `Imported from GitHub issue #${issue.number}.`;
  if (feedbackType === "bug") {
    await db.insert(bugReports).values({
      id,
      reporterUserId: null,
      title: cleanImportedTitle(issue.title),
      description,
      stepsToReproduce: extractSection(body, "Steps to reproduce") ?? null,
      status: bugStatusFromIssue(issue),
      severity: bugSeverityFromIssue(issue),
      platform: "unknown",
    });
  } else {
    await db.insert(featureRequests).values({
      id,
      requesterUserId: null,
      title: cleanImportedTitle(issue.title),
      description,
      problem: extractSection(body, "Problem to solve") ?? null,
      proposedSolution: extractSection(body, "Proposed solution") ?? null,
      status: featureStatusFromIssue(issue),
      impact: featureImpactFromIssue(issue),
      category: featureCategoryFromIssue(issue),
      platform: "unknown",
    });
  }
  return id;
}

async function updateFeedbackFromIssue(
  env: GitHubFeedbackEnv,
  feedbackType: GitHubFeedbackType,
  feedbackId: string,
  issue: GitHubIssueSnapshot,
): Promise<void> {
  const db = createDatabase(requireDatabase(env));
  const body = issue.body ?? "";
  const description =
    extractSection(body, "Description") ??
    (feedbackType === "feature" ? extractSection(body, "Proposed solution") : undefined) ??
    stripFeedbackMarker(body);
  const now = new Date();

  if (feedbackType === "bug") {
    const steps = extractSection(body, "Steps to reproduce");
    const status = bugStatusFromIssue(issue);
    await db
      .update(bugReports)
      .set({
        title: cleanImportedTitle(issue.title),
        ...(description ? { description } : {}),
        ...(steps !== undefined ? { stepsToReproduce: steps } : {}),
        status,
        severity: bugSeverityFromIssue(issue),
        updatedAt: now,
        resolvedAt: BUG_CLOSED.has(status) ? now : null,
      })
      .where(eq(bugReports.id, feedbackId))
      .run();
  } else {
    const problem = extractSection(body, "Problem to solve");
    const proposedSolution = extractSection(body, "Proposed solution");
    const status = featureStatusFromIssue(issue);
    await db
      .update(featureRequests)
      .set({
        title: cleanImportedTitle(issue.title),
        ...(description ? { description } : {}),
        ...(problem !== undefined ? { problem } : {}),
        ...(proposedSolution !== undefined ? { proposedSolution } : {}),
        status,
        impact: featureImpactFromIssue(issue),
        category: featureCategoryFromIssue(issue),
        updatedAt: now,
        completedAt: status === "completed" ? now : null,
      })
      .where(eq(featureRequests.id, feedbackId))
      .run();
  }
}

async function normalizeInboundIssueLabels(
  env: GitHubFeedbackEnv,
  feedbackType: GitHubFeedbackType,
  issue: GitHubIssueSnapshot,
): Promise<GitHubIssueSnapshot> {
  const current = issueLabels(issue);
  const required = [
    SOURCE_LABEL,
    feedbackType === "bug" ? BUG_LABEL : FEATURE_LABEL,
    normalizedStatusLabel(
      feedbackType === "bug" ? bugStatusFromIssue(issue) : featureStatusFromIssue(issue),
    ),
  ];
  await ensureManagedLabels(env, required);
  // Preserve severity/impact/category labels supplied in GitHub. Only the
  // identity and status labels are normalized by the inbound path.
  const preserved = current.filter((label) => !isCoreSyncLabel(label));
  const labels = [...preserved, ...required];
  if (sameLabelSet(current, labels)) return issue;
  return updateGitHubIssue(env, requireRepository(env), issue.number, { labels });
}

async function syncGitHubIssueToFeedback(env: GitHubFeedbackEnv, job: GitHubSyncJob): Promise<void> {
  if (job.type !== "github.issue.sync") return;
  const configuredRepository = requireRepository(env);
  if (job.repositoryFullName !== configuredRepository) return;

  let issue = await getGitHubIssue(env, job.repositoryFullName, job.githubIssueNumber);
  if (issue.pull_request) return;

  const db = createDatabase(requireDatabase(env));
  let link = await db
    .select()
    .from(githubFeedbackLinks)
    .where(
      and(
        eq(githubFeedbackLinks.repositoryFullName, job.repositoryFullName),
        eq(githubFeedbackLinks.githubIssueNumber, job.githubIssueNumber),
      ),
    )
    .get();

  if (!link) {
    const marker = parseFeedbackMarker(issue.body);
    if (marker && (await existingFeedbackForMarker(env, marker))) {
      await saveIssueLink(env, marker.type, marker.id, job.repositoryFullName, issue);
      link = await db
        .select()
        .from(githubFeedbackLinks)
        .where(
          and(
            eq(githubFeedbackLinks.feedbackType, marker.type),
            eq(githubFeedbackLinks.feedbackId, marker.id),
          ),
        )
        .get();
    }
  }

  if (!link) {
    const feedbackType = feedbackTypeFromIssue(issue);
    if (!feedbackType) return;
    const feedbackId = await importGitHubIssue(env, issue, feedbackType);
    issue = await normalizeInboundIssueLabels(env, feedbackType, issue);
    await saveIssueLink(env, feedbackType, feedbackId, job.repositoryFullName, issue);
    link = await db
      .select()
      .from(githubFeedbackLinks)
      .where(
        and(
          eq(githubFeedbackLinks.feedbackType, feedbackType),
          eq(githubFeedbackLinks.feedbackId, feedbackId),
        ),
      )
      .get();
  }

  if (!link) return;
  await updateFeedbackFromIssue(env, link.feedbackType, link.feedbackId, issue);
  issue = await normalizeInboundIssueLabels(env, link.feedbackType, issue);
  await saveIssueLink(env, link.feedbackType, link.feedbackId, job.repositoryFullName, issue);
}

async function markDelivery(
  env: GitHubFeedbackEnv,
  deliveryId: string,
  status: "processed" | "failed",
  error?: unknown,
): Promise<void> {
  if (!env.DB) return;
  const now = new Date();
  await createDatabase(env.DB)
    .update(githubWebhookDeliveries)
    .set({
      status,
      lastError:
        status === "failed"
          ? (error instanceof Error ? error.message : String(error)).slice(0, 2000)
          : null,
      processedAt: status === "processed" ? now : null,
      updatedAt: now,
    })
    .where(eq(githubWebhookDeliveries.id, deliveryId))
    .run();
}

export async function enqueueFeedbackSync(
  queue: Queue<GitHubSyncJob> | undefined,
  input: Omit<FeedbackSyncJob, "type" | "enqueuedAt">,
): Promise<boolean> {
  if (!queue) return false;
  await queue.send({
    type: "feedback.sync",
    ...input,
    enqueuedAt: new Date().toISOString(),
  });
  return true;
}

export async function processGitHubSyncBatch(
  batch: MessageBatch<GitHubSyncJob>,
  env: GitHubFeedbackEnv,
): Promise<void> {
  await Promise.all(
    batch.messages.map(async (message) => {
      const job = message.body;
      try {
        if (job.type === "feedback.sync") {
          await syncFeedbackToGitHub(env, job);
        } else {
          await syncGitHubIssueToFeedback(env, job);
          await markDelivery(env, job.deliveryId, "processed");
        }
        message.ack();
      } catch (error) {
        if (job.type === "github.issue.sync") {
          await markDelivery(env, job.deliveryId, "failed", error).catch(() => undefined);
        }
        console.error("GitHub feedback sync job failed", {
          messageId: message.id,
          jobType: job.type,
          error,
        });
        message.retry();
      }
    }),
  );
}
