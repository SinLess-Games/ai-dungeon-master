/// <reference types="@cloudflare/workers-types" />

import { app } from "@/server/app";
import type { AuthEnv } from "@/modules/auth/server/auth";
import type { DevBlogAIEnv } from "@/modules/devblog/ai/types";
import {
  generateWeeklyDevBlog,
  isWeeklyDevBlogEnabled,
} from "@/modules/devblog/ai/automation";

interface WorkerEnv extends AuthEnv, DevBlogAIEnv {
  DB?: D1Database;
  R2_BUCKET?: R2Bucket;
  APP_VERSION?: string;
  BUILD_ID?: string;
  ENVIRONMENT?: string;
  GIT_COMMIT_SHA?: string;
}

/**
 * Cloudflare Worker entrypoint.
 *
 * HTTP traffic is handled by the single Hono application. The scheduled
 * handler runs the same devblog writer once per configured cron window.
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
} satisfies ExportedHandler<WorkerEnv>;
