import type {
  DevBlogAIEnv,
  GitHubIssueSummary,
  GitHubPullRequestSummary,
  GitHubWeeklyActivity,
} from "./types";

const GITHUB_API_VERSION = "2022-11-28";
const DEFAULT_REPOSITORY = "SinLess-Games/ai-dungeon-master";

interface CommitResponse {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    } | null;
  };
}

interface PullResponse {
  number: number;
  title: string;
  state: string;
  merged_at: string | null;
  updated_at: string;
  html_url: string;
}

interface IssueResponse {
  number: number;
  title: string;
  state: string;
  updated_at: string;
  html_url: string;
  pull_request?: unknown;
}

interface ContentsResponse {
  type: string;
  content?: string;
  encoding?: string;
}

function repositoryName(env: DevBlogAIEnv): string {
  return env.GITHUB_REPOSITORY?.trim() || DEFAULT_REPOSITORY;
}

async function githubRequest<T>(env: DevBlogAIEnv, path: string): Promise<T> {
  if (!env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not configured for the weekly devblog writer.");
  }

  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "User-Agent": "the-endless-codex-devblog-writer",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed with HTTP ${response.status}.`);
  }

  return (await response.json()) as T;
}

function decodeBase64Utf8(value: string): string {
  const binary = atob(value.replace(/\s+/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function collectWeeklyGitHubActivity(
  env: DevBlogAIEnv,
  periodStart: Date,
  periodEnd: Date,
): Promise<GitHubWeeklyActivity> {
  const repository = repositoryName(env);
  const encodedRepository = repository
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const since = periodStart.toISOString();
  const until = periodEnd.toISOString();

  const [commitRows, pullRows, issueRows, roadmapResponse] = await Promise.all([
    githubRequest<CommitResponse[]>(
      env,
      `/repos/${encodedRepository}/commits?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&per_page=100`,
    ),
    githubRequest<PullResponse[]>(
      env,
      `/repos/${encodedRepository}/pulls?state=all&sort=updated&direction=desc&per_page=50`,
    ),
    githubRequest<IssueResponse[]>(
      env,
      `/repos/${encodedRepository}/issues?state=all&since=${encodeURIComponent(since)}&sort=updated&direction=desc&per_page=100`,
    ),
    githubRequest<ContentsResponse>(env, `/repos/${encodedRepository}/contents/roadmap.md?ref=main`).catch(
      () => null,
    ),
  ]);

  const startMs = periodStart.getTime();
  const endMs = periodEnd.getTime();
  const inWindow = (value: string) => {
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) && timestamp >= startMs && timestamp <= endMs;
  };

  const pullRequests: GitHubPullRequestSummary[] = pullRows
    .filter((pull) => inWindow(pull.updated_at))
    .map((pull) => ({
      number: pull.number,
      title: pull.title,
      state: pull.state,
      merged: pull.merged_at !== null,
      updatedAt: pull.updated_at,
      url: pull.html_url,
    }));

  const issues: GitHubIssueSummary[] = issueRows
    .filter((issue) => !issue.pull_request && inWindow(issue.updated_at))
    .map((issue) => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      updatedAt: issue.updated_at,
      url: issue.html_url,
    }));

  const roadmap =
    roadmapResponse?.type === "file" && roadmapResponse.encoding === "base64" && roadmapResponse.content
      ? decodeBase64Utf8(roadmapResponse.content).slice(0, 16000)
      : "";

  return {
    repository,
    periodStart: since,
    periodEnd: until,
    commits: commitRows.map((commit) => ({
      sha: commit.sha.slice(0, 12),
      message: commit.commit.message.split("\n")[0]?.trim() || "Untitled commit",
      author: commit.commit.author?.name || "Unknown",
      committedAt: commit.commit.author?.date || "",
      url: commit.html_url,
    })),
    pullRequests,
    issues,
    roadmap,
  };
}
