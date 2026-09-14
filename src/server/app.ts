/// <reference types="@cloudflare/workers-types" />

import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import type { OpenAICompatibleEnv } from "@/infrastructure/ai/openaiCompatible";
import { errorHandler, notFoundHandler } from "@/server/middleware/errors";

import { devblogRoutes } from "@/modules/devblog/server/routes";
import { devblogAdminRoutes } from "@/modules/devblog/server/adminRoutes";
import { devblogAIRoutes } from "@/modules/devblog/server/aiRoutes";
import { feedbackRoutes } from "@/modules/feedback/server/routes";
import { adminRoutes } from "@/modules/admin/server/routes";
import { authRoutes, authHandler } from "@/modules/auth/server/routes";
import type { AuthEnv } from "@/modules/auth/server/auth";
import { campaignDeleteRoutes } from "@/modules/campaigns/server/deleteRoutes";
import { campaignPlayCharacterRoutes } from "@/modules/campaigns/server/playCharacterRoutes";
import { campaignPlayMessageRoutes } from "@/modules/campaigns/server/playMessageRoutes";
import { campaignRoutes } from "@/modules/campaigns/server/routes";
import { characterRoutes } from "@/modules/characters/server/routes";
import { characterCreationRoutes } from "@/modules/characters/server/creationRoutes";
import type { CampaignRoom } from "@/modules/game/live/CampaignRoom";
import { actorRoutes } from "@/modules/game/server/actorRoutes";
import { castingRoutes } from "@/modules/game/server/castingRoutes";
import { encounterRoutes } from "@/modules/game/server/encounterRoutes";
import { gameCommandRoutes } from "@/modules/game/server/gameCommandRoutes";
import { gameReadModelRoutes } from "@/modules/game/server/gameReadModelRoutes";
import { healthRoutes } from "@/modules/game/server/healthRoutes";
import { gameLiveRoutes } from "@/modules/game/server/liveRoutes";
import { resolvedCastingRoutes } from "@/modules/game/server/resolvedCastingRoutes";
import { gameRoutes } from "@/modules/game/server/routes";

const isolateStartedAt = Date.now();

interface Bindings extends AuthEnv {
  DB?: D1Database;
  R2_BUCKET?: R2Bucket;
  CAMPAIGN_ROOM?: DurableObjectNamespace<CampaignRoom>;
  BACKGROUND_QUEUE?: Queue<unknown>;
  RUNTIME_CACHE?: KVNamespace;
  AI?: OpenAICompatibleEnv["AI"];
  AI_API_KEY?: string;
  AI_BASE_URL?: string;
  AI_DEVBLOG_MODEL?: string;
  AI_GAME_MODEL?: string;
  GITHUB_TOKEN?: string;
  GITHUB_REPOSITORY?: string;
  DEVBLOG_AI_ENABLED?: string;
  DEVBLOG_AI_AUTO_PUBLISH?: string;
  DEVBLOG_AI_AUTHOR_EMAIL?: string;

  /** Optional deployment metadata supplied through Wrangler/CI. */
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

function elapsedMilliseconds(start: number): number {
  return Number((performance.now() - start).toFixed(2));
}

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
    console.error("Database health check failed", { error });
    return {
      status: "unhealthy",
      required: true,
      latencyMs: elapsedMilliseconds(startedAt),
      message: "D1 database health check failed.",
    };
  }
}

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
    await bucket.list({ limit: 1 });
    return {
      status: "healthy",
      required: false,
      latencyMs: elapsedMilliseconds(startedAt),
      message: "R2 object storage is reachable.",
    };
  } catch (error) {
    console.error("Object storage health check failed", { error });
    return {
      status: "unhealthy",
      required: false,
      latencyMs: elapsedMilliseconds(startedAt),
      message: "R2 object storage health check failed.",
    };
  }
}

function determineHealthStatus(checks: DependencyHealth[]): HealthStatus {
  const requiredFailure = checks.some((check) => check.required && check.status !== "healthy");
  if (requiredFailure) return "unhealthy";
  const optionalFailure = checks.some((check) => !check.required && check.status !== "healthy");
  return optionalFailure ? "degraded" : "healthy";
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

app.route("/", authRoutes);
app.route("/", authHandler);

const routes = app
  .route("/", adminRoutes)
  .route("/", feedbackRoutes)
  .route("/", devblogRoutes)
  .route("/", devblogAdminRoutes)
  .route("/", devblogAIRoutes)
  .route("/", campaignRoutes)
  .route("/", campaignDeleteRoutes)
  .route("/", campaignPlayCharacterRoutes)
  .route("/", campaignPlayMessageRoutes)
  .route("/", characterCreationRoutes)
  .route("/", characterRoutes)
  .route("/", actorRoutes)
  .route("/", encounterRoutes)
  .route("/", gameRoutes)
  .route("/", gameCommandRoutes)
  .route("/", gameReadModelRoutes)
  .route("/", castingRoutes)
  .route("/", resolvedCastingRoutes)
  .route("/", healthRoutes)
  .route("/", gameLiveRoutes)
  .get("/api", (c) => {
    return c.json({
      name: "The Endless Codex API",
      status: "ok",
      version: c.env.APP_VERSION ?? "development",
      endpoints: {
        health: "/api/health",
        live: "/api/health/live",
        campaigns: "/api/campaigns",
        campaignPlayMessages: "/api/campaigns/:campaignId/play/messages",
        campaignPlayChecks: "/api/campaigns/:campaignId/play/characters/:characterId/checks",
        game: "/api/campaigns/:campaignId/game",
        gameState: "/api/campaigns/:campaignId/game/state",
        gameCommands: "/api/campaigns/:campaignId/game/commands",
        actors: "/api/campaigns/:campaignId/game/actors",
        casting: "/api/campaigns/:campaignId/game/casting/:characterId",
        resolvedCasting: "/api/campaigns/:campaignId/game/resolved-casting",
        characterHealth: "/api/campaigns/:campaignId/game/health/:characterId",
        campaignLive: "/api/campaigns/:campaignId/live",
      },
    });
  })
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
  .get("/api/health", async (c) => {
    const startedAt = performance.now();
    c.header("Cache-Control", "no-store");

    const [database, objectStorage] = await Promise.all([
      checkDatabase(c.env.DB),
      checkObjectStorage(c.env.R2_BUCKET),
    ]);
    const checks = { database, objectStorage };
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

    if (status === "unhealthy") return c.json(response, 503);
    return c.json(response, 200);
  });

app.notFound(notFoundHandler);
app.onError(errorHandler);

export { routes as app };
export type AppType = typeof routes;
