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
      throw new ServiceUnavailableError(
        "Weekly devblog generation failed. Check the AI and GitHub configuration, then try again.",
      );
    }
  });
