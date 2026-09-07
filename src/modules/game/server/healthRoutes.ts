/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import {
  enqueueGameEventPostprocess,
  publishCommittedGameEvent,
  type BackgroundJob,
} from "@/infrastructure/cloudflare/backgroundJobs";
import { createDatabase } from "@/infrastructure/database/client";
import { campaignMemberships, campaigns, characters } from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import type { CampaignRoom } from "@/modules/game/live/CampaignRoom";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from "@/server/middleware/errors";
import {
  applyPersistentHealing,
  applyPersistentLethalDamage,
  applyPersistentNonlethalDamage,
  attemptPersistentStabilization,
  getAuthoritativeHealthState,
  grantPersistentTemporaryHitPoints,
} from "./healthLifecycleService";

interface HealthBindings extends AuthEnv {
  DB?: D1Database;
  BACKGROUND_QUEUE?: Queue<BackgroundJob>;
  CAMPAIGN_ROOM?: DurableObjectNamespace<CampaignRoom>;
}

type HealthEnv = { Bindings: HealthBindings };
type CampaignRole = "owner" | "gm" | "player" | "observer";

const amountSchema = z.object({
  actorId: z.string().trim().min(1).optional(),
  targetId: z.string().trim().min(1),
  amount: z.number().int().min(0).max(1000000),
  sourceId: z.string().trim().min(1).max(200).optional(),
  reason: z.string().trim().min(1).max(500).optional(),
});

function requireDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("Game storage is unavailable.");
  return binding;
}

async function campaignRole(input: {
  db: ReturnType<typeof createDatabase>;
  campaignId: string;
  userId: string;
}): Promise<CampaignRole> {
  const campaign = await input.db
    .select({ ownerUserId: campaigns.ownerUserId })
    .from(campaigns)
    .where(eq(campaigns.id, input.campaignId))
    .get();
  if (!campaign) throw new NotFoundError("Campaign not found.");
  if (campaign.ownerUserId === input.userId) return "owner";

  const membership = await input.db
    .select({ role: campaignMemberships.role, status: campaignMemberships.status })
    .from(campaignMemberships)
    .where(
      and(
        eq(campaignMemberships.campaignId, input.campaignId),
        eq(campaignMemberships.userId, input.userId),
      ),
    )
    .get();
  if (!membership || membership.status !== "active") {
    throw new ForbiddenError("You do not have access to this campaign.");
  }
  return membership.role;
}

function requireGameMaster(role: CampaignRole): void {
  if (role !== "owner" && role !== "gm") {
    throw new ForbiddenError("Only the campaign owner or Game Master can apply direct health changes.");
  }
}

async function requireCharacterControl(input: {
  db: ReturnType<typeof createDatabase>;
  campaignId: string;
  userId: string;
  role: CampaignRole;
  characterId: string;
}): Promise<void> {
  if (input.role === "owner" || input.role === "gm") return;
  if (input.role === "observer") throw new ForbiddenError("Observers cannot perform game actions.");
  const character = await input.db
    .select({ ownerUserId: characters.ownerUserId })
    .from(characters)
    .where(
      and(eq(characters.id, input.characterId), eq(characters.campaignId, input.campaignId)),
    )
    .get();
  if (!character || character.ownerUserId !== input.userId) {
    throw new ForbiddenError("You can only act as your own character.");
  }
}

function translate(error: unknown): never {
  if (error instanceof RangeError) throw new ValidationError(error.message);
  if (!(error instanceof Error)) throw error;
  if (error.message === "CAMPAIGN_GAME_NOT_ACTIVE") {
    throw new ConflictError("This campaign does not currently have an active game session.");
  }
  if (error.message === "CAMPAIGN_RULESET_UNSUPPORTED") {
    throw new ValidationError("The active campaign ruleset is not supported by this health runtime.");
  }
  if (error.message === "GAME_TARGET_HEALTH_UNAVAILABLE") {
    throw new NotFoundError("The target does not have active D&D 3.5 health state.");
  }
  if (error.message === "GAME_STATE_CONFLICT") {
    throw new ConflictError("Health state changed while the command was resolving. Reload and try again.");
  }
  throw error;
}

function schedulePostprocess(
  c: { env: HealthBindings; executionCtx: { waitUntil(promise: Promise<unknown>): void } },
  input: { campaignId: string; sessionId: string; eventId: string },
): void {
  c.executionCtx.waitUntil(
    Promise.all([
      publishCommittedGameEvent(c.env, input).catch((error) => {
        console.error("Unable to publish committed health event", { ...input, error });
      }),
      enqueueGameEventPostprocess(c.env.BACKGROUND_QUEUE, input).catch((error) => {
        console.error("Unable to enqueue health-event postprocessing", { ...input, error });
      }),
    ]).then(() => undefined),
  );
}

export const healthRoutes = new Hono<HealthEnv>()
  .use("/api/campaigns/:campaignId/game/health/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/campaigns/:campaignId/game/health/:characterId", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const campaignId = c.req.param("campaignId");
    await campaignRole({ db, campaignId, userId: session.user.id });
    try {
      return c.json(
        await getAuthoritativeHealthState(
          { db, binding },
          { campaignId, characterId: c.req.param("characterId") },
        ),
      );
    } catch (error) {
      translate(error);
    }
  })
  .post(
    "/api/campaigns/:campaignId/game/health/damage",
    zValidator("json", amountSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const role = await campaignRole({ db, campaignId, userId: session.user.id });
      requireGameMaster(role);
      const input = c.req.valid("json");
      try {
        const result = await applyPersistentLethalDamage(
          { db, binding },
          {
            campaignId,
            targetId: input.targetId,
            amount: input.amount,
            ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
            ...(input.sourceId === undefined ? {} : { sourceId: input.sourceId }),
            ...(input.reason === undefined ? {} : { reason: input.reason }),
          },
        );
        schedulePostprocess(c, { campaignId, sessionId: result.sessionId, eventId: result.eventId });
        return c.json(result);
      } catch (error) {
        translate(error);
      }
    },
  )
  .post(
    "/api/campaigns/:campaignId/game/health/healing",
    zValidator("json", amountSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const role = await campaignRole({ db, campaignId, userId: session.user.id });
      requireGameMaster(role);
      const input = c.req.valid("json");
      try {
        const result = await applyPersistentHealing(
          { db, binding },
          {
            campaignId,
            targetId: input.targetId,
            amount: input.amount,
            ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
            ...(input.sourceId === undefined ? {} : { sourceId: input.sourceId }),
            ...(input.reason === undefined ? {} : { reason: input.reason }),
          },
        );
        schedulePostprocess(c, { campaignId, sessionId: result.sessionId, eventId: result.eventId });
        return c.json(result);
      } catch (error) {
        translate(error);
      }
    },
  )
  .post(
    "/api/campaigns/:campaignId/game/health/nonlethal",
    zValidator("json", amountSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const role = await campaignRole({ db, campaignId, userId: session.user.id });
      requireGameMaster(role);
      const input = c.req.valid("json");
      try {
        const result = await applyPersistentNonlethalDamage(
          { db, binding },
          {
            campaignId,
            targetId: input.targetId,
            amount: input.amount,
            ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
            ...(input.sourceId === undefined ? {} : { sourceId: input.sourceId }),
            ...(input.reason === undefined ? {} : { reason: input.reason }),
          },
        );
        schedulePostprocess(c, { campaignId, sessionId: result.sessionId, eventId: result.eventId });
        return c.json(result);
      } catch (error) {
        translate(error);
      }
    },
  )
  .post(
    "/api/campaigns/:campaignId/game/health/temporary-hit-points",
    zValidator("json", amountSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const role = await campaignRole({ db, campaignId, userId: session.user.id });
      requireGameMaster(role);
      const input = c.req.valid("json");
      try {
        const result = await grantPersistentTemporaryHitPoints(
          { db, binding },
          {
            campaignId,
            targetId: input.targetId,
            amount: input.amount,
            ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
            ...(input.sourceId === undefined ? {} : { sourceId: input.sourceId }),
            ...(input.reason === undefined ? {} : { reason: input.reason }),
          },
        );
        schedulePostprocess(c, { campaignId, sessionId: result.sessionId, eventId: result.eventId });
        return c.json(result);
      } catch (error) {
        translate(error);
      }
    },
  )
  .post("/api/campaigns/:campaignId/game/health/:characterId/stabilize", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const campaignId = c.req.param("campaignId");
    const characterId = c.req.param("characterId");
    const role = await campaignRole({ db, campaignId, userId: session.user.id });
    await requireCharacterControl({ db, campaignId, userId: session.user.id, role, characterId });
    try {
      const result = await attemptPersistentStabilization(
        { db, binding },
        { campaignId, characterId },
      );
      schedulePostprocess(c, { campaignId, sessionId: result.sessionId, eventId: result.eventId });
      return c.json(result);
    } catch (error) {
      translate(error);
    }
  });
