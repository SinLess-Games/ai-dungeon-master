import { hc } from "hono/client";
import type { AppType } from "@/server/app";

/** One origin in development and production. Only Hono's client code is bundled;
 * the server import is type-only, keeping bindings and credentials on the Worker. */
export const api = hc<AppType>("/", {
  init: { credentials: "same-origin" },
});
