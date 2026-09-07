/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import { campaignMemberships, campaigns, characters } from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from "@/server/middleware/errors";
import {
  endEncounterTurn,
  finishEncounter,
  getActiveEncounter,
  startEncounter,
} from "./encounterService";

interface EncounterBindings extends AuthEnv {
  DB?: D1Database;
}

type EncounterEnv = { Bindings: EncounterBindings };
type CampaignRole = "owner" | "gm" | "player" | "observer";

const startEncounterSchema = z.object({
  participantIds: z.array(z.string().trim().min(1)).min(1).max(100),
});

const endTurnSchema = z.object({
  actorId: z.string().trim().min(1),
});

const finishEncounterSchema = z.object({
  status: z.enum(["completed", "abandoned"]).optional(),
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
    throw new ForbiddenError("Only the campaign owner or Game Master can manage encounters.");
  }
}

async function requireActorControl(input: {
  db: ReturnType<typeof createDatabase>;
  campaignId: string;
  userId: string;
  role: CampaignRole;
  characterId: string;
}): Promise<void> {
  if (input.role === "owner" || input.role === "gm") return;
  if (input.role === "observer") {
    throw new ForbiddenError("Observers cannot perform encounter actions.");
  }
  const character = await input.db
    .select({ ownerUserId: characters.ownerUserId })
    .from(characters)
    .where(
      and(
        eq(characters.id, input.characterId),
        eq(characters.campaignId, input.campaignId),
      ),
    )
    .get();
  if (!character || character.ownerUserId !== input.userId) {
    throw new ForbiddenError("You can only end the turn of your own character.");
  }
}

function translateEncounterError(error: unknown): never {
  if (error instanceof RangeError) throw new ValidationError(error.message);
  if (!(error instanceof Error)) throw error;
  switch (error.message) {
    case "CAMPAIGN_GAME_NOT_ACTIVE":
      throw new ConflictError("This campaign does not currently have an active game session.");
    case "CAMPAIGN_RULESET_UNSUPPORTED":
      throw new ValidationError("The active campaign ruleset does not support this encounter runtime.");
    case "ENCOUNTER_ALREADY_ACTIVE":
      throw new ConflictError("This session already has an active encounter.");
    case "ENCOUNTER_NOT_ACTIVE":
      throw new NotFoundError("Active encounter not found.");
    case "ENCOUNTER_PARTICIPANT_INVALID":
      throw new ValidationError("Every encounter participant must be an active character in this campaign.");
    case "ENCOUNTER_NOT_ACTORS_TURN":
      throw new ConflictError("That character does not currently have the turn.");
    case "ENCOUNTER_STATE_INVALID":
    case "GAME_STATE_CONFLICT":
      throw new ConflictError("Encounter state changed while the command was resolving. Reload and try again.");
    default:
      throw error;
  }
}

export const encounterRoutes = new Hono<EncounterEnv>()
  .use("/api/campaigns/:campaignId/game/encounter*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/campaigns/:campaignId/game/encounter", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const campaignId = c.req.param("campaignId");
    await campaignRole({ db, campaignId, userId: session.user.id });
    try {
      return c.json({ encounter: await getActiveEncounter({ db, binding }, campaignId) });
    } catch (error) {
      translateEncounterError(error);
    }
  })
  .post(
    "/api/campaigns/:campaignId/game/encounters",
    zValidator("json", startEncounterSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const role = await campaignRole({ db, campaignId, userId: session.user.id });
      requireGameMaster(role);
      const input = c.req.valid("json");
      try {
        return c.json(
          await startEncounter(
            { db, binding },
            { campaignId, participantIds: input.participantIds },
          ),
          201,
        );
      } catch (error) {
        translateEncounterError(error);
      }
    },
  )
  .post(
    "/api/campaigns/:campaignId/game/encounters/:encounterId/turn/end",
    zValidator("json", endTurnSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const role = await campaignRole({ db, campaignId, userId: session.user.id });
      const input = c.req.valid("json");
      await requireActorControl({
        db,
        campaignId,
        userId: session.user.id,
        role,
        characterId: input.actorId,
      });
      try {
        return c.json(
          await endEncounterTurn(
            { db, binding },
            {
              campaignId,
              encounterId: c.req.param("encounterId"),
              actorId: input.actorId,
            },
          ),
        );
      } catch (error) {
        translateEncounterError(error);
      }
    },
  )
  .post(
    "/api/campaigns/:campaignId/game/encounters/:encounterId/end",
    zValidator("json", finishEncounterSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const role = await campaignRole({ db, campaignId, userId: session.user.id });
      requireGameMaster(role);
      const input = c.req.valid("json");
      try {
        return c.json(
          await finishEncounter(
            { db, binding },
            {
              campaignId,
              encounterId: c.req.param("encounterId"),
              ...(input.status === undefined ? {} : { status: input.status }),
            },
          ),
        );
      } catch (error) {
        translateEncounterError(error);
      }
    },
  );
