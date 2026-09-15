/// <reference types="@cloudflare/workers-types" />

import {
  processBackgroundJobBatch,
  type BackgroundJob,
} from "@/infrastructure/cloudflare/backgroundJobs";
import type { AuthEnv } from "@/modules/auth/server/auth";
import {
  generateWeeklyDevBlog,
  isWeeklyDevBlogEnabled,
} from "@/modules/devblog/ai/automation";
import type { DevBlogAIEnv } from "@/modules/devblog/ai/types";
import { processGitHubSyncBatch } from "@/modules/feedback/github/sync";
import type {
  GitHubFeedbackEnv,
  GitHubSyncJob,
} from "@/modules/feedback/github/types";
import { CampaignRoom } from "@/modules/game/live/CampaignRoom";
import { app } from "@/server/app";

type WorkerQueueJob = BackgroundJob | GitHubSyncJob;

interface WorkerEnv extends AuthEnv, DevBlogAIEnv, GitHubFeedbackEnv {
  DB?: D1Database;
  R2_BUCKET?: R2Bucket;
  CAMPAIGN_ROOM?: DurableObjectNamespace<CampaignRoom>;
  BACKGROUND_QUEUE?: Queue<BackgroundJob>;
  GITHUB_SYNC_QUEUE?: Queue<GitHubSyncJob>;
  RUNTIME_CACHE?: KVNamespace;
  WORLD_VECTOR_INDEX?: VectorizeIndex;
  APP_VERSION?: string;
  BUILD_ID?: string;
  ENVIRONMENT?: string;
  GIT_COMMIT_SHA?: string;
}

export { CampaignRoom };

/**
 * Cloudflare Worker entrypoint.
 *
 * HTTP traffic is handled by the single Hono application. Scheduled work runs
 * the weekly devblog writer. Queue deliveries are split by queue name so game
 * post-processing/world-atlas work and GitHub feedback synchronization fail and
 * retry independently. CampaignRoom is exported as the campaign-scoped Durable
 * Object used for hibernating WebSocket coordination.
 */
export default {
  fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  },

  scheduled(controller, env, ctx) {
    if (!isWeeklyDevBlogEnabled(env)) return;

    ctx.waitUntil(
      generateWeeklyDevBlog(env, {
        trigger: "scheduled",
        now: new Date(controller.scheduledTime),
      })
        .then((result) => {
          console.log("Weekly devblog scheduler completed", {
            weekKey: result.weekKey,
            created: result.created,
            skipped: result.skipped,
            postId: result.postId,
            status: result.status,
          });
        })
        .catch((error) => {
          console.error("Weekly devblog scheduler failed", { error });
        }),
    );
  },

  queue(batch, env, ctx) {
    if (batch.queue === "endless-codex-github-sync") {
      ctx.waitUntil(processGitHubSyncBatch(batch as MessageBatch<GitHubSyncJob>, env));
      return;
    }
    ctx.waitUntil(processBackgroundJobBatch(batch as MessageBatch<BackgroundJob>, env));
  },
} satisfies ExportedHandler<WorkerEnv, WorkerQueueJob>;
