/// <reference types="@cloudflare/workers-types" />

import type { GitHubFeedbackType } from "@/infrastructure/database/schema/feedback/githubFeedbackLink";

export interface GitHubFeedbackEnv {
  DB?: D1Database;
  GITHUB_SYNC_QUEUE?: Queue<GitHubSyncJob>;
  GITHUB_REPOSITORY?: string;
  GITHUB_APP_ID?: string;
  GITHUB_INSTALLATION_ID?: string;
  GITHUB_APP_PRIVATE_KEY?: string;
  GITHUB_WEBHOOK_SECRET?: string;
}

export interface FeedbackSyncJob {
  type: "feedback.sync";
  feedbackType: GitHubFeedbackType;
  feedbackId: string;
  reason: "created" | "status_changed";
  enqueuedAt: string;
}

export interface GitHubIssueSyncJob {
  type: "github.issue.sync";
  deliveryId: string;
  event: "issues" | "issue_comment";
  action: string;
  repositoryFullName: string;
  githubIssueNumber: number;
  enqueuedAt: string;
}

export type GitHubSyncJob = FeedbackSyncJob | GitHubIssueSyncJob;

export interface GitHubIssueLabel {
  name: string;
}

export interface GitHubIssueSnapshot {
  id: number;
  node_id: string;
  number: number;
  html_url: string;
  title: string;
  body: string | null;
  state: "open" | "closed";
  state_reason?: string | null;
  updated_at: string;
  labels: Array<GitHubIssueLabel | string>;
  pull_request?: unknown;
}
