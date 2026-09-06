import type { OpenAICompatibleEnv } from "@/infrastructure/ai/openaiCompatible";

export interface DevBlogAIEnv extends OpenAICompatibleEnv {
  DB?: D1Database;
  GITHUB_TOKEN?: string;
  GITHUB_REPOSITORY?: string;
  DEVBLOG_AI_ENABLED?: string;
  DEVBLOG_AI_AUTO_PUBLISH?: string;
  DEVBLOG_AI_AUTHOR_EMAIL?: string;
}

export type DevBlogAITrigger = "manual" | "scheduled";

export interface GitHubCommitSummary {
  sha: string;
  message: string;
  author: string;
  committedAt: string;
  url: string;
}

export interface GitHubPullRequestSummary {
  number: number;
  title: string;
  state: string;
  merged: boolean;
  updatedAt: string;
  url: string;
}

export interface GitHubIssueSummary {
  number: number;
  title: string;
  state: string;
  updatedAt: string;
  url: string;
}

export interface GitHubWeeklyActivity {
  repository: string;
  periodStart: string;
  periodEnd: string;
  commits: GitHubCommitSummary[];
  pullRequests: GitHubPullRequestSummary[];
  issues: GitHubIssueSummary[];
  roadmap: string;
}

export interface WeeklyDevBlogResult {
  created: boolean;
  skipped: boolean;
  weekKey: string;
  postId: string | null;
  slug: string;
  title: string | null;
  status: "draft" | "published" | null;
}
