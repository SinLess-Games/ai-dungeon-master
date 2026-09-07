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
import { campaignMemberships, campaigns, gameActors } from "@/infrastructure/database/schema";
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
  castPreparedSpellResolved,
  castSpontaneousSpellResolved,
  manifestPowerResolved,
} from "./resolvedCastingService";

interface Bindings extends AuthEnv {
  DB?: D1Database;
  BACKGROUND_QUEUE?: Queue<BackgroundJob>;
  CAMPAIGN_ROOM?: DurableObjectNamespace<CampaignRoom>;
}

type Env = { Bindings: Bindings };
type CampaignRole = "owner" | "gm" | "player" | "observer";

const id = z.string().trim().min(1).max(200);
const targetIds = z.array(id).max(100).optional();
const spellSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("prepared"),
    actorId: id,
    castingTrackId: id,
    spellId: id,
    preparationId: id,
    targetIds,
  }),
  z.object({
    mode: z.literal("spontaneous"),
    actorId: id,
    castingTrackId: id,
    spellId: id,
    slotLevel: z.number().int().min(0).max(100).optional(),
    targetIds,
  }),
]);
const powerSchema = z.object({
  actorId: id,
  castingTrackId: id,
  powerId: id,
  augmentations: z
    .array(
      z.object({
        index: z.number().int().min(0).max(1000),
        applications: z.number().int().min(1).max(1000).optional(),
      }),
    )
    .max(100)
    .optional(),
  targetIds,
});

function requireDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("Game storage is unavailable.");
  return binding;
}

async function role(input: {
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

async function requireActorControl(input: {
  db: ReturnType<typeof createDatabase>;
  campaignId: string;
  actorId: string;
  userId: string;
  role: CampaignRole;
}) {
  if (input.role === "owner" || input.role === "gm") return;
  if (input.role === "observer") throw new ForbiddenError("Observers cannot perform game actions.");
  const actor = await input.db
    .select({ kind: gameActors.kind, controllerUserId: gameActors.controllerUserId })
    .from(gameActors)
    .where(and(eq(gameActors.id, input.actorId), eq(gameActors.campaignId, input.campaignId)))
    .get();
  if (!actor || actor.kind !== "character" || actor.controllerUserId !== input.userId) {
    throw new ForbiddenError("You can only cast or manifest as a character assigned to you.");
  }
}

function schedule(
  c: { env: Bindings; executionCtx: { waitUntil(promise: Promise<unknown>): void } },
  input: { campaignId: string; sessionId: string; eventId: string },
) {
  c.executionCtx.waitUntil(
    Promise.all([
      publishCommittedGameEvent(c.env, input).catch((error) => {
        console.error("Unable to publish resolved casting event", { ...input, error });
      }),
      enqueueGameEventPostprocess(c.env.BACKGROUND_QUEUE, input).catch((error) => {
        console.error("Unable to enqueue resolved casting event", { ...input, error });
      }),
    ]).then(() => undefined),
  );
}

function translate(error: unknown): never {
  if (error instanceof RangeError) throw new ValidationError(error.message);
  if (!(error instanceof Error)) throw error;
  if (error.message.startsWith("CASTING_EFFECT_HANDLER_UNAVAILABLE:")) {
    throw new ValidationError(
      `This spell or power requires an effect handler that is not installed: ${error.message.split(":")[1] ?? "unknown"}.`,
    );
  }
  switch (error.message) {
    case "CAMPAIGN_GAME_NOT_ACTIVE":
      throw new ConflictError("This campaign does not currently have an active game session.");
    case "GAME_STATE_CONFLICT":
      throw new ConflictError("Game state changed while the casting action was resolving. Reload and try again.");
    case "GAME_ACTOR_NOT_FOUND":
      throw new NotFoundError("The acting character is unavailable in this campaign.");
    case "GAME_TARGET_HEALTH_UNAVAILABLE":
    case "GAME_TARGET_SAVE_UNAVAILABLE":
      throw new NotFoundError("A target does not expose the D&D 3.5 state required by this effect.");
    case "CASTING_TRACK_NOT_FOUND":
    case "SPELL_NOT_AVAILABLE":
    case "SPELL_PREPARATION_NOT_FOUND":
    case "SPELL_NOT_KNOWN":
    case "POWER_NOT_AVAILABLE":
    case "POWER_NOT_KNOWN":
      throw new NotFoundError(error.message.replaceAll("_", " ").toLowerCase());
    case "SPELL_NOT_PREPARED":
    case "SPELL_SLOTS_EXHAUSTED":
    case "INSUFFICIENT_POWER_POINTS":
      throw new ConflictError(error.message.replaceAll("_", " ").toLowerCase());
    case "CAMPAIGN_RULESET_UNSUPPORTED":
    case "CASTING_TRACK_RUNTIME_UNSUPPORTED":
    case "CASTING_ACTION_TYPE_UNSUPPORTED":
    case "CASTING_MODE_MISMATCH":
    case "CASTING_ABILITY_UNAVAILABLE":
    case "CASTING_ABILITY_TOO_LOW":
    case "MANIFESTING_ABILITY_TOO_LOW":
    case "SPELL_SLOT_TOO_LOW":
    case "SPELL_SLOT_LEVEL_UNAVAILABLE":
    case "EPIC_SPONTANEOUS_SLOT_DERIVATION_UNSUPPORTED":
    case "POWER_AUGMENTATION_DATA_INVALID":
    case "POWER_MANIFESTATION_INVALID":
    case "MANIFESTER_LEVEL_POWER_POINT_CAP":
    case "POWER_AUGMENT_NOT_REPEATABLE":
    case "POWER_POINT_STATE_INVALID":
    case "CASTING_CONDITION_HALF_EFFECT_UNSUPPORTED":
      throw new ValidationError(error.message.replaceAll("_", " ").toLowerCase());
    default:
      throw error;
  }
}

export const resolvedCastingRoutes = new Hono<Env>()
  .use("/api/campaigns/:campaignId/game/resolved-casting/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .post(
    "/api/campaigns/:campaignId/game/resolved-casting/spells",
    zValidator("json", spellSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const input = c.req.valid("json");
      const campaignRole = await role({ db, campaignId, userId: session.user.id });
      await requireActorControl({
        db,
        campaignId,
        actorId: input.actorId,
        userId: session.user.id,
        role: campaignRole,
      });
      try {
        const result =
          input.mode === "prepared"
            ? await castPreparedSpellResolved(
                { db, binding },
                {
                  campaignId,
                  actorId: input.actorId,
                  castingTrackId: input.castingTrackId,
                  spellId: input.spellId,
                  preparationId: input.preparationId,
                  ...(input.targetIds === undefined ? {} : { targetIds: input.targetIds }),
                },
              )
            : await castSpontaneousSpellResolved(
                { db, binding },
                {
                  campaignId,
                  actorId: input.actorId,
                  castingTrackId: input.castingTrackId,
                  spellId: input.spellId,
                  ...(input.slotLevel === undefined ? {} : { slotLevel: input.slotLevel }),
                  ...(input.targetIds === undefined ? {} : { targetIds: input.targetIds }),
                },
              );
        schedule(c, { campaignId, sessionId: result.sessionId, eventId: result.eventId });
        return c.json(result);
      } catch (error) {
        translate(error);
      }
    },
  )
  .post(
    "/api/campaigns/:campaignId/game/resolved-casting/powers",
    zValidator("json", powerSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const input = c.req.valid("json");
      const campaignRole = await role({ db, campaignId, userId: session.user.id });
      await requireActorControl({
        db,
        campaignId,
        actorId: input.actorId,
        userId: session.user.id,
        role: campaignRole,
      });
      try {
        const result = await manifestPowerResolved(
          { db, binding },
          {
            campaignId,
            actorId: input.actorId,
            castingTrackId: input.castingTrackId,
            powerId: input.powerId,
            ...(input.augmentations === undefined ? {} : { augmentations: input.augmentations }),
            ...(input.targetIds === undefined ? {} : { targetIds: input.targetIds }),
          },
        );
        schedule(c, { campaignId, sessionId: result.sessionId, eventId: result.eventId });
        return c.json(result);
      } catch (error) {
        translate(error);
      }
    },
  );
