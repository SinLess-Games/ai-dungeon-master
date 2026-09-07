/// <reference types="@cloudflare/workers-types" />

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { createDatabase } from "@/infrastructure/database/client";
import { campaignMemberships, campaigns, gameActors } from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from "@/server/middleware/errors";
import { getGameActorReadModel, getGameStateReadModel } from "./gameReadModelService";

interface ReadModelBindings extends AuthEnv {
  DB?: D1Database;
}

type ReadModelEnv = { Bindings: ReadModelBindings };
type CampaignRole = "owner" | "gm" | "player" | "observer";

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

async function controlledActorIds(input: {
  db: ReturnType<typeof createDatabase>;
  campaignId: string;
  userId: string;
  role: CampaignRole;
}): Promise<readonly string[]> {
  if (input.role === "owner" || input.role === "gm") {
    const actors = await input.db
      .select({ id: gameActors.id })
      .from(gameActors)
      .where(and(eq(gameActors.campaignId, input.campaignId), eq(gameActors.status, "active")))
      .all();
    return actors.map((actor) => actor.id);
  }
  if (input.role === "observer") return [];
  const actors = await input.db
    .select({ id: gameActors.id })
    .from(gameActors)
    .where(
      and(
        eq(gameActors.campaignId, input.campaignId),
        eq(gameActors.kind, "character"),
        eq(gameActors.controllerUserId, input.userId),
        eq(gameActors.status, "active"),
      ),
    )
    .all();
  return actors.map((actor) => actor.id);
}

function translate(error: unknown): never {
  if (!(error instanceof Error)) throw error;
  switch (error.message) {
    case "CAMPAIGN_GAME_NOT_ACTIVE":
      throw new ConflictError("This campaign does not currently have an active game session.");
    case "GAME_ACTOR_NOT_FOUND":
    case "MONSTER_RUNTIME_STATE_MISSING":
      throw new NotFoundError("Runtime actor not found.");
    default:
      throw error;
  }
}

export const gameReadModelRoutes = new Hono<ReadModelEnv>()
  .use("/api/campaigns/:campaignId/game/state*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/campaigns/:campaignId/game/state", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const campaignId = c.req.param("campaignId");
    const role = await campaignRole({ db, campaignId, userId: session.user.id });
    try {
      const [state, controls] = await Promise.all([
        getGameStateReadModel({ db, binding }, campaignId),
        controlledActorIds({ db, campaignId, userId: session.user.id, role }),
      ]);
      return c.json({ ...state, access: { role, controlledActorIds: controls } });
    } catch (error) {
      translate(error);
    }
  })
  .get("/api/campaigns/:campaignId/game/state/actors/:actorId", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const campaignId = c.req.param("campaignId");
    const role = await campaignRole({ db, campaignId, userId: session.user.id });
    try {
      const [actor, controls] = await Promise.all([
        getGameActorReadModel(
          { db, binding },
          { campaignId, actorId: c.req.param("actorId") },
        ),
        controlledActorIds({ db, campaignId, userId: session.user.id, role }),
      ]);
      return c.json({
        ...actor,
        access: {
          role,
          controlled: controls.includes(c.req.param("actorId")),
        },
      });
    } catch (error) {
      translate(error);
    }
  });
