/// <reference types="@cloudflare/workers-types" />

import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import { errorHandler, notFoundHandler } from "@/server/middleware/errors";

import { devblogRoutes } from "@/modules/devblog/server/routes";
import { devblogAdminRoutes } from "@/modules/devblog/server/adminRoutes";
import { devblogAIRoutes } from "@/modules/devblog/server/aiRoutes";
import { feedbackRoutes } from "@/modules/feedback/server/routes";
import { adminRoutes } from "@/modules/admin/server/routes";
import { authRoutes, authHandler } from "@/modules/auth/server/routes";
import type { AuthEnv } from "@/modules/auth/server/auth";
import { campaignRoutes } from "@/modules/campaigns/server/routes";
import { characterRoutes } from "@/modules/characters/server/routes";
import { encounterRoutes } from "@/modules/game/server/encounterRoutes";
import { gameRoutes } from "@/modules/game/server/routes";

const isolateStartedAt = Date.now();

interface Bindings extends AuthEnv {
  DB?: D1Database;
  R2_BUCKET?: R2Bucket;
  AI_API_KEY?: string;
  AI_BASE_URL?: string;
  AI_DEVBLOG_MODEL?: string;
  GITHUB_TOKEN?: string;
  GITHUB_REPOSITORY?: string;
  DEVBLOG_AI_ENABLED?: string;
  DEVBLOG_AI_AUTO_PUBLISH?: string;
  DEVBLOG_AI_AUTHOR_EMAIL?: string;

  /**
   * Optional deployment metadata.
   *
   * These can later be supplied through Wrangler/CI.
   */
  APP_VERSION?: string;
  BUILD_ID?: string;
  ENVIRONMENT?: string;
  GIT_COMMIT_SHA?: string;
}

type AppEnv = {
  Bindings: Bindings;
};

type HealthStatus = "healthy" | "degraded" | "unhealthy";

type DependencyHealthStatus = "healthy" | "unhealthy" | "unavailable";

interface DependencyHealth {
  status: DependencyHealthStatus;
  required: boolean;
  latencyMs: number;
  message: string;
}

interface HealthResponse {
  status: HealthStatus;

  service: {
    name: string;
    version: string;
    environment: string;
    buildId: string;
    commit: string;
  };

  runtime: {
    platform: "cloudflare-workers";
    isolateUptimeMs: number;
    isolateStartedAt: string;
  };

  checks: {
    database: DependencyHealth;
    objectStorage: DependencyHealth;
  };

  timing: {
    totalMs: number;
  };

  timestamp: string;
}

/**
 * Convert a high-resolution timer measurement to a compact millisecond value.
 */
function elapsedMilliseconds(start: number): number {
  return Number((performance.now() - start).toFixed(2));
}

/**
 * Verify that the D1 binding exists and that the database can successfully
 * execute a minimal query.
 */
async function checkDatabase(database: D1Database | undefined): Promise<DependencyHealth> {
  const startedAt = performance.now();

  if (!database) {
    return {
      status: "unavailable",
      required: true,
      latencyMs: elapsedMilliseconds(startedAt),
      message: "D1 database binding is unavailable.",
    };
  }

  try {
    const result = await database.prepare("SELECT 1 AS healthy").first<{ healthy: number }>();

    if (result?.healthy !== 1) {
      return {
        status: "unhealthy",
        required: true,
        latencyMs: elapsedMilliseconds(startedAt),
        message: "D1 database returned an unexpected health-check result.",
      };
    }

    return {
      status: "healthy",
      required: true,
      latencyMs: elapsedMilliseconds(startedAt),
      message: "D1 database is reachable.",
    };
  } catch (error) {
    console.error("Database health check failed", {
      error,
    });

    return {
      status: "unhealthy",
      required: true,
      latencyMs: elapsedMilliseconds(startedAt),
      message: "D1 database health check failed.",
    };
  }
}

/**
 * Verify that the R2 binding exists and that the bucket can be queried.
 *
 * The list operation is intentionally limited to one object. No object
 * names or bucket contents are returned through the health endpoint.
 */
async function checkObjectStorage(bucket: R2Bucket | undefined): Promise<DependencyHealth> {
  const startedAt = performance.now();

  if (!bucket) {
    return {
      status: "unavailable",
      required: false,
      latencyMs: elapsedMilliseconds(startedAt),
      message: "R2 object storage binding is unavailable.",
    };
  }

  try {
    await bucket.list({
      limit: 1,
    });

    return {
      status: "healthy",
      required: false,
      latencyMs: elapsedMilliseconds(startedAt),
      message: "R2 object storage is reachable.",
    };
  } catch (error) {
    console.error("Object storage health check failed", {
      error,
    });

    return {
      status: "unhealthy",
      required: false,
      latencyMs: elapsedMilliseconds(startedAt),
      message: "R2 object storage health check failed.",
    };
  }
}

/**
 * Determine the application's overall health from its dependency checks.
 *
 * Required dependency failure:
 *   unhealthy
 *
 * Optional dependency failure:
 *   degraded
 *
 * Everything operational:
 *   healthy
 */
function determineHealthStatus(checks: DependencyHealth[]): HealthStatus {
  const requiredFailure = checks.some((check) => check.required && check.status !== "healthy");

  if (requiredFailure) {
    return "unhealthy";
  }

  const optionalFailure = checks.some((check) => !check.required && check.status !== "healthy");

  if (optionalFailure) {
    return "degraded";
  }

  return "healthy";
}

const app = new Hono<AppEnv>();

const requestLogger = logger();
app.use("*", (c, next) =>
  c.req.path.startsWith("/api/auth/") || c.req.path.startsWith("/api/admin/")
    ? next()
    : requestLogger(c, next),
);

app.use(
  "*",
  secureHeaders({
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    referrerPolicy: "strict-origin-when-cross-origin",
  }),
);

/**
 * API discovery/root endpoint.
 */
app.route("/", authRoutes);
app.route("/", authHandler);

const routes = app
  .route("/", adminRoutes)
  .route("/", feedbackRoutes)
  .route("/", devblogRoutes)
  .route("/", devblogAdminRoutes)
  .route("/", devblogAIRoutes)
  .route("/", campaignRoutes)
  .route("/", characterRoutes)
  .route("/", encounterRoutes)
  .route("/", gameRoutes)
  .get("/api", (c) => {
    return c.json({
      name: "The Endless Codex API",
      status: "ok",
      version: c.env.APP_VERSION ?? "development",
      endpoints: {
        health: "/api/health",
        live: "/api/health/live",
        campaigns: "/api/campaigns",
        game: "/api/campaigns/:campaignId/game",
      },
    });
  })

  /**
   * Lightweight liveness endpoint.
   *
   * This intentionally does not contact external dependencies.
   *
   * Use this when the question is simply:
   *
   * "Is the Worker alive and capable of handling requests?"
   */
  .get("/api/health/live", (c) => {
    c.header("Cache-Control", "no-store");

    return c.json({
      status: "healthy",
      service: "the-endless-codex",
      runtime: "cloudflare-workers",
      isolateUptimeMs: Date.now() - isolateStartedAt,
      timestamp: new Date().toISOString(),
    });
  })

  /**
   * Detailed readiness/health endpoint.
   *
   * This performs real dependency checks against infrastructure required by
   * Endless Codex.
   *
   * It intentionally does NOT expose:
   *
   * - database IDs
   * - database names
   * - bucket names
   * - account IDs
   * - environment secrets
   * - object names
   * - connection credentials
   */
  .get("/api/health", async (c) => {
    const startedAt = performance.now();

    c.header("Cache-Control", "no-store");

    const [database, objectStorage] = await Promise.all([
      checkDatabase(c.env.DB),
      checkObjectStorage(c.env.R2_BUCKET),
    ]);

    const checks = {
      database,
      objectStorage,
    };

    const status = determineHealthStatus([checks.database, checks.objectStorage]);

    const response: HealthResponse = {
      status,

      service: {
        name: "the-endless-codex",
        version: c.env.APP_VERSION ?? "development",
        environment: c.env.ENVIRONMENT ?? "unknown",
        buildId: c.env.BUILD_ID ?? "unknown",
        commit: c.env.GIT_COMMIT_SHA ?? "unknown",
      },

      runtime: {
        platform: "cloudflare-workers",
        isolateUptimeMs: Date.now() - isolateStartedAt,
        isolateStartedAt: new Date(isolateStartedAt).toISOString(),
      },

      checks,

      timing: {
        totalMs: elapsedMilliseconds(startedAt),
      },

      timestamp: new Date().toISOString(),
    };

    /**
     * A failed required dependency means the application is not ready to
     * reliably serve game requests.
     *
     * Degraded health remains HTTP 200 because only an optional subsystem
     * has failed.
     */
    if (status === "unhealthy") {
      return c.json(response, 503);
    }

    return c.json(response, 200);
  });

app.notFound(notFoundHandler);

app.onError(errorHandler);

export { routes as app };

export type AppType = typeof routes;
