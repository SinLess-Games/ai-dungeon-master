import { Hono } from "hono";
import { createAuth, type AuthEnv } from "./auth";
import { requireAdmin, requireUser } from "./requireAuth";
export const authRoutes = new Hono<{ Bindings: AuthEnv }>()
  .get("/api/auth/providers", (c) =>
    c.json({
      google: Boolean(c.env.GOOGLE_CLIENT_ID && c.env.GOOGLE_CLIENT_SECRET),
      discord: Boolean(c.env.DISCORD_CLIENT_ID && c.env.DISCORD_CLIENT_SECRET),
    }),
  )
  .get("/api/me", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    c.header("Cache-Control", "no-store");
    return c.json({ user: session.user });
  })
  .get("/api/admin/access", async (c) => {
    await requireAdmin(createAuth(c.env), c.req.raw.headers);
    c.header("Cache-Control", "no-store");
    return c.json({ authorized: true });
  });
// Better Auth owns the response, including all Set-Cookie headers.
export const authHandler = new Hono<{ Bindings: AuthEnv }>().on(
  ["GET", "POST"],
  "/api/auth/*",
  (c) => createAuth(c.env).handler(c.req.raw),
);
