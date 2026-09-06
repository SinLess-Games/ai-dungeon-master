/**
 * Cloudflare Worker entrypoint.
 *
 * Hono exposes a Fetch handler directly, so the Worker can export
 * the application without adding another request-handling wrapper.
 *
 * Keep this file intentionally small. Application routing,
 * middleware, and domain behavior belong in server/app.ts and
 * feature modules.
 */
export { app as default } from "@/server/app";

