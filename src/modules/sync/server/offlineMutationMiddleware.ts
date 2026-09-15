import { createMiddleware } from "hono/factory";

/**
 * Diagnostic pass-through used to isolate the Cloudflare build regression to
 * this middleware. The full offline replay guard is restored immediately once
 * the compiler boundary is identified.
 */
export const offlineMutationMiddleware = createMiddleware(async (_c, next) => {
  await next();
});
