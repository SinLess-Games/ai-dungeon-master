import type { Context } from "hono";
import { z } from "zod";
import type { AuthEnv } from "@/modules/auth/server/auth";
import type { DevBlogAIEnv } from "@/modules/devblog/ai/types";
import { BadRequestError, ForbiddenError } from "@/server/middleware/errors";

export type BlogEnv = {
  Bindings: AuthEnv & DevBlogAIEnv & { R2_BUCKET?: R2Bucket };
  Variables: { adminId: string };
};

export function sameOrigin(c: Context<BlogEnv>) {
  if (c.req.header("Origin") !== c.env.BETTER_AUTH_URL)
    throw new ForbiddenError("Use the Codex website to submit changes.");
}

export async function parseBody<T>(c: Context<BlogEnv>, schema: z.ZodType<T>) {
  const result = schema.safeParse(await c.req.json().catch(() => null));
  if (!result.success)
    throw new BadRequestError(result.error.issues[0]?.message || "Invalid input.");
  return result.data;
}
