/// <reference types="@cloudflare/workers-types" />

import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { verifyGitHubWebhookSignature } from "./client";
import type { GitHubFeedbackEnv, GitHubIssueSnapshot, GitHubSyncJob } from "./types";

interface GitHubWebhookPayload {
  action?: string;
  repository?: {
    full_name?: string;
  };
  issue?: GitHubIssueSnapshot;
}

function parseWebhookPayload(rawBody: string, contentType: string): GitHubWebhookPayload {
  const serialized = contentType.includes("application/x-www-form-urlencoded")
    ? new URLSearchParams(rawBody).get("payload")
    : rawBody;
  if (!serialized) throw new Error("GitHub webhook payload is empty.");
  return JSON.parse(serialized) as GitHubWebhookPayload;
}

async function recordDelivery(
  database: D1Database,
  input: {
    deliveryId: string;
    event: string;
    action: string;
    repositoryFullName: string;
    githubIssueNumber: number;
  },
): Promise<"processed" | "pending"> {
  const existing = await database
    .prepare("SELECT status FROM github_webhook_deliveries WHERE id = ?")
    .bind(input.deliveryId)
    .first<{ status: string }>();
  if (existing?.status === "processed") return "processed";

  await database
    .prepare(
      `INSERT INTO github_webhook_deliveries (
         id, event, action, repository_full_name, github_issue_number,
         status, last_error, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, 'received', NULL, unixepoch(), unixepoch())
       ON CONFLICT(id) DO UPDATE SET
         event = excluded.event,
         action = excluded.action,
         repository_full_name = excluded.repository_full_name,
         github_issue_number = excluded.github_issue_number,
         status = 'received',
         last_error = NULL,
         updated_at = unixepoch()` ,
    )
    .bind(
      input.deliveryId,
      input.event,
      input.action,
      input.repositoryFullName,
      input.githubIssueNumber,
    )
    .run();
  return "pending";
}

async function markDeliveryFailed(
  database: D1Database,
  deliveryId: string,
  error: unknown,
): Promise<void> {
  const message = (error instanceof Error ? error.message : String(error)).slice(0, 2000);
  await database
    .prepare(
      `UPDATE github_webhook_deliveries
       SET status = 'failed', last_error = ?, updated_at = unixepoch()
       WHERE id = ?`,
    )
    .bind(message, deliveryId)
    .run();
}

export const githubFeedbackRoutes = new Hono<{ Bindings: GitHubFeedbackEnv }>().post(
  "/api/integrations/github/webhook",
  bodyLimit({ maxSize: 128_000 }),
  async (c) => {
    c.header("Cache-Control", "no-store");

    const secret = c.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      console.error("GitHub webhook secret is not configured.");
      return c.json({ ok: false, error: "Webhook integration is not configured." }, 503);
    }

    const rawBody = await c.req.text();
    const signature = c.req.header("X-Hub-Signature-256");
    if (!(await verifyGitHubWebhookSignature(secret, rawBody, signature))) {
      return c.json({ ok: false, error: "Invalid webhook signature." }, 401);
    }

    const event = c.req.header("X-GitHub-Event")?.trim();
    const deliveryId = c.req.header("X-GitHub-Delivery")?.trim();
    if (!event || !deliveryId) {
      return c.json({ ok: false, error: "Missing GitHub delivery headers." }, 400);
    }

    if (event === "ping") return c.json({ ok: true, event: "ping" }, 200);
    if (event !== "issues" && event !== "issue_comment") {
      return c.json({ ok: true, ignored: true, event }, 202);
    }

    let payload: GitHubWebhookPayload;
    try {
      payload = parseWebhookPayload(rawBody, c.req.header("Content-Type") ?? "");
    } catch (error) {
      console.warn("Unable to parse GitHub webhook payload", { deliveryId, event, error });
      return c.json({ ok: false, error: "Invalid webhook payload." }, 400);
    }

    const repositoryFullName = payload.repository?.full_name?.trim();
    const issue = payload.issue;
    const action = payload.action?.trim() || "unknown";
    if (!repositoryFullName || !issue || !Number.isSafeInteger(issue.number)) {
      return c.json({ ok: false, error: "Webhook does not contain an issue." }, 400);
    }
    if (issue.pull_request) return c.json({ ok: true, ignored: true, reason: "pull_request" }, 202);

    const configuredRepository = c.env.GITHUB_REPOSITORY?.trim();
    if (!configuredRepository || repositoryFullName !== configuredRepository) {
      return c.json({ ok: true, ignored: true, reason: "repository" }, 202);
    }
    if (!c.env.DB || !c.env.GITHUB_SYNC_QUEUE) {
      console.error("GitHub webhook dependencies are not configured.", {
        hasDatabase: Boolean(c.env.DB),
        hasQueue: Boolean(c.env.GITHUB_SYNC_QUEUE),
      });
      return c.json({ ok: false, error: "Webhook processing is unavailable." }, 503);
    }

    const state = await recordDelivery(c.env.DB, {
      deliveryId,
      event,
      action,
      repositoryFullName,
      githubIssueNumber: issue.number,
    });
    if (state === "processed") {
      return c.json({ ok: true, duplicate: true, deliveryId }, 202);
    }

    const job: GitHubSyncJob = {
      type: "github.issue.sync",
      deliveryId,
      event,
      action,
      repositoryFullName,
      githubIssueNumber: issue.number,
      enqueuedAt: new Date().toISOString(),
    };

    try {
      await c.env.GITHUB_SYNC_QUEUE.send(job);
    } catch (error) {
      await markDeliveryFailed(c.env.DB, deliveryId, error).catch(() => undefined);
      console.error("Failed to enqueue GitHub webhook delivery", { deliveryId, event, error });
      return c.json({ ok: false, error: "Unable to enqueue webhook." }, 503);
    }

    return c.json({ ok: true, queued: true, deliveryId }, 202);
  },
);
