import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { createDatabase } from "@/infrastructure/database/client";
import { bugReports } from "@/infrastructure/database/schema/feedback/bugReport";
import { featureRequests } from "@/infrastructure/database/schema/feedback/featureRequest";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import { feedbackSchema } from "../domain/validation";
import { BadRequestError, ForbiddenError } from "@/server/middleware/errors";

export const feedbackRoutes = new Hono<{ Bindings: AuthEnv }>().post(
  "/api/feedback",
  bodyLimit({ maxSize: 40000 }),
  async (c) => {
    if (c.req.header("Origin") !== c.env.BETTER_AUTH_URL)
      throw new ForbiddenError("Submit feedback from the Codex website.");
    const { user } = await requireUser(createAuth(c.env), c.req.raw.headers);
    const parsed = feedbackSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) throw new BadRequestError("Check your feedback title and description.");
    const { type, title, description, details } = parsed.data;
    const db = createDatabase(c.env.DB!);
    const id = crypto.randomUUID();
    if (type === "bug") {
      await db.insert(bugReports).values({
        id,
        reporterUserId: user.id,
        title,
        description,
        stepsToReproduce: details || null,
        platform: "web",
      });
    } else {
      await db.insert(featureRequests).values({
        id,
        requesterUserId: user.id,
        title,
        description,
        problem: details || null,
        platform: "web",
      });
    }
    c.header("Cache-Control", "no-store");
    return c.json({ id, type }, 201);
  },
);
