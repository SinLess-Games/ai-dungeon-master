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
import { campaignMemberships, campaigns } from "@/infrastructure/database/schema";
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
import { createMonsterActor, getGameActor, listGameActors } from "./actorService";

interface ActorBindings extends AuthEnv {
  DB?: D1Database;
  BACKGROUND_QUEUE?: Queue<BackgroundJob>;
  CAMPAIGN_ROOM?: DurableObjectNamespace<CampaignRoom>;
}

type ActorEnv = { Bindings: ActorBindings };
type CampaignRole = "owner" | "gm" | "player" | "observer";

const createMonsterSchema = z.object({
  monsterId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
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

function requireGameMaster(role: CampaignRole) {
  if (role !== "owner" && role !== "gm") {
    throw new ForbiddenError("Only the campaign owner or Game Master can create runtime creatures.");
  }
}

function translate(error: unknown): never {
  if (error instanceof RangeError) throw new ValidationError(error.message);
  if (!(error instanceof Error)) throw error;
  switch (error.message) {
    case "CAMPAIGN_GAME_NOT_ACTIVE":
      throw new ConflictError("This campaign does not currently have an active game session.");
    case "CAMPAIGN_RULESET_UNSUPPORTED":
      throw new ValidationError("The active campaign ruleset does not support runtime monster actors.");
    case "MONSTER_DEFINITION_NOT_FOUND":
      throw new NotFoundError("Monster definition not found.");
    case "MONSTER_RUNTIME_STATE_MISSING":
      throw new ConflictError("The monster actor is missing its authoritative runtime state.");
    default:
      throw error;
  }
}

function schedule(
  c: { env: ActorBindings; executionCtx: { waitUntil(promise: Promise<unknown>): void } },
  input: { campaignId: string; sessionId: string; eventId: string },
) {
  c.executionCtx.waitUntil(
    Promise.all([
      publishCommittedGameEvent(c.env, input).catch((error) => {
        console.error("Unable to publish actor event", { ...input, error });
      }),
      enqueueGameEventPostprocess(c.env.BACKGROUND_QUEUE, input).catch((error) => {
        console.error("Unable to enqueue actor event", { ...input, error });
      }),
    ]).then(() => undefined),
  );
}

export const actorRoutes = new Hono<ActorEnv>()
  .use("/api/campaigns/:campaignId/game/actors*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/campaigns/:campaignId/game/actors", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const campaignId = c.req.param("campaignId");
    await campaignRole({ db, campaignId, userId: session.user.id });
    try {
      return c.json({ actors: await listGameActors({ db, binding }, { campaignId }) });
    } catch (error) {
      translate(error);
    }
  })
  .get("/api/campaigns/:campaignId/game/actors/:actorId", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const campaignId = c.req.param("campaignId");
    await campaignRole({ db, campaignId, userId: session.user.id });
    try {
      const actor = await getGameActor(
        { db, binding },
        { campaignId, actorId: c.req.param("actorId") },
      );
      if (!actor) throw new NotFoundError("Runtime actor not found.");
      return c.json(actor);
    } catch (error) {
      translate(error);
    }
  })
  .post(
    "/api/campaigns/:campaignId/game/actors/monsters",
    zValidator("json", createMonsterSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      requireGameMaster(await campaignRole({ db, campaignId, userId: session.user.id }));
      const input = c.req.valid("json");
      try {
        const result = await createMonsterActor(
          { db, binding },
          {
            campaignId,
            monsterId: input.monsterId,
            ...(input.name === undefined ? {} : { name: input.name }),
            ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
          },
        );
        schedule(c, { campaignId, sessionId: result.sessionId, eventId: result.eventId });
        return c.json(result, 201);
      } catch (error) {
        translate(error);
      }
    },
  );
