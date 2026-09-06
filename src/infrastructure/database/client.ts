/// <reference types="@cloudflare/workers-types" />

import { drizzle } from "drizzle-orm/d1";

import * as schema from "@/infrastructure/database/schema";

/**
 * Creates a Drizzle client for a Cloudflare D1 binding.
 *
 * D1 bindings are supplied by the Cloudflare Worker environment, so this
 * function should be called with the request's DB binding rather than
 * constructing a global database connection.
 */
export function createDatabase(binding: D1Database) {
  return drizzle(binding, {
    schema,
    logger: false,
  });
}

/**
 * Application-wide Drizzle database type.
 *
 * Repositories and services can depend on this type without importing
 * Cloudflare-specific D1 types themselves.
 */
export type Database = ReturnType<typeof createDatabase>;