import { Hono } from "hono";
import { z } from "zod";
import { createAuth } from "@/modules/auth/server/auth";
import { requireAdmin } from "@/modules/auth/server/requireAuth";
import { ServiceUnavailableError } from "@/server/middleware/errors";
import {
  generateWeeklyDevBlog,
  getWeeklyDevBlogStatus,
} from "@/modules/devblog/ai/automation";
import { type BlogEnv, parseBody, sameOrigin } from "./shared";

const generateSchema = z.object({
  notes: z.string().trim().max(5000).optional(),
});

function safeGenerationError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("GITHUB_TOKEN")) {
    return "GitHub source access is not configured. Add the read-only GITHUB_TOKEN Worker secret.";
  }
  if (message.includes("Workers AI binding") || message.includes("No AI provider")) {
    return "Cloudflare Workers AI is not attached to this deployment. Redeploy with the AI binding in wrangler.jsonc.";
  }
  if (message.includes("No GitHub activity")) {
    return "No repository activity was found for the last seven days, so no devblog was generated.";
  }
  if (message.includes("administrator account")) {
    return "The weekly writer could not resolve an administrator account to own the post.";
  }

  return "Weekly devblog generation failed. Check the Worker logs for the upstream AI or GitHub error.";
}

export const devblogAIRoutes = new Hono<BlogEnv>()
  .use("/api/admin/devblog/ai/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    const { user } = await requireAdmin(createAuth(c.env), c.req.raw.headers);
    c.set("adminId", user.id);
    if (c.req.method !== "GET") sameOrigin(c);
    await next();
  })
  .get("/api/admin/devblog/ai/status", async (c) => {
    return c.json(await getWeeklyDevBlogStatus(c.env));
  })
  .post("/api/admin/devblog/ai/generate", async (c) => {
    const input = await parseBody(c, generateSchema);
    try {
      const result = await generateWeeklyDevBlog(c.env, {
        trigger: "manual",
        authorUserId: c.get("adminId"),
        ...(input.notes ? { notes: input.notes } : {}),
      });
      return c.json(result, result.created ? 201 : 200);
    } catch (error) {
      console.error("Weekly devblog generation failed", { error });
      throw new ServiceUnavailableError(safeGenerationError(error));
    }
  });
