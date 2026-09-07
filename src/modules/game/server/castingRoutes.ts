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
  castPreparedSpell,
  castSpontaneousSpell,
  getCharacterCastingState,
  manifestPower,
  restorePersistentCastingResources,
} from "./castingService";
import { gainPersistentPsionicFocus } from "./psionicFocusAttemptService";

interface CastingBindings extends AuthEnv {
  DB?: D1Database;
  BACKGROUND_QUEUE?: Queue<BackgroundJob>;
  CAMPAIGN_ROOM?: DurableObjectNamespace<CampaignRoom>;
}

type CastingEnv = { Bindings: CastingBindings };
type CampaignRole = "owner" | "gm" | "player" | "observer";

const id = z.string().trim().min(1).max(200);
const targetIds = z.array(id).max(100).optional();
const spellCastSchema = z.discriminatedUnion("mode", [
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
const manifestPowerSchema = z.object({
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
const focusSchema = z.object({ actorId: id });
const restoreSchema = z.object({ characterId: id });

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

async function requireActorControl(input: {
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
      and(
        eq(characters.id, input.characterId),
        eq(characters.campaignId, input.campaignId),
      ),
    )
    .get();
  if (!character || character.ownerUserId !== input.userId) {
    throw new ForbiddenError("You can only act as your own character.");
  }
}

function requireGameMaster(role: CampaignRole): void {
  if (role !== "owner" && role !== "gm") {
    throw new ForbiddenError("Only the campaign owner or Game Master can restore daily resources.");
  }
}

function scheduleEventPostprocess(
  c: { env: CastingBindings; executionCtx: { waitUntil(promise: Promise<unknown>): void } },
  input: { campaignId: string; sessionId: string; eventId: string },
): void {
  const publish = publishCommittedGameEvent(c.env, input).catch((error) => {
    console.error("Unable to publish committed casting event", { ...input, error });
  });
  const enqueue = enqueueGameEventPostprocess(c.env.BACKGROUND_QUEUE, input).catch((error) => {
    console.error("Unable to enqueue casting-event postprocessing", { ...input, error });
  });
  c.executionCtx.waitUntil(Promise.all([publish, enqueue]).then(() => undefined));
}

function translateCastingError(error: unknown): never {
  if (error instanceof RangeError) throw new ValidationError(error.message);
  if (!(error instanceof Error)) throw error;
  switch (error.message) {
    case "CAMPAIGN_GAME_NOT_ACTIVE":
      throw new ConflictError("This campaign does not currently have an active game session.");
    case "GAME_STATE_CONFLICT":
      throw new ConflictError("Game state changed while the casting action was resolving. Reload and try again.");
    case "SPELL_NOT_PREPARED":
    case "SPELL_SLOTS_EXHAUSTED":
    case "INSUFFICIENT_POWER_POINTS":
    case "PSIONIC_ALREADY_FOCUSED":
      throw new ConflictError(error.message.replaceAll("_", " ").toLowerCase());
    case "GAME_ACTOR_NOT_FOUND":
      throw new NotFoundError("The acting character is unavailable in this campaign.");
    case "CASTING_TRACK_NOT_FOUND":
      throw new NotFoundError("Casting track not found for this character.");
    case "SPELL_NOT_AVAILABLE":
    case "SPELL_PREPARATION_NOT_FOUND":
    case "SPELL_NOT_KNOWN":
      throw new NotFoundError("The requested spell or preparation is unavailable to this character.");
    case "POWER_NOT_AVAILABLE":
    case "POWER_NOT_KNOWN":
      throw new NotFoundError("The requested power is unavailable to this character.");
    case "CONCENTRATION_SKILL_NOT_AVAILABLE":
      throw new NotFoundError("The D&D 3.5 Concentration skill definition is unavailable.");
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
    case "PSIONIC_RUNTIME_UNAVAILABLE":
    case "DND35_SKILL_TRAINING_REQUIRED":
      throw new ValidationError(error.message.replaceAll("_", " ").toLowerCase());
    default:
      throw error;
  }
}

export const castingRoutes = new Hono<CastingEnv>()
  .use("/api/campaigns/:campaignId/game/casting/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/campaigns/:campaignId/game/casting/:characterId", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const campaignId = c.req.param("campaignId");
    await campaignRole({ db, campaignId, userId: session.user.id });
    try {
      return c.json(
        await getCharacterCastingState(
          { db, binding },
          { campaignId, characterId: c.req.param("characterId") },
        ),
      );
    } catch (error) {
      translateCastingError(error);
    }
  })
  .post(
    "/api/campaigns/:campaignId/game/casting/spells/cast",
    zValidator("json", spellCastSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const input = c.req.valid("json");
      const role = await campaignRole({ db, campaignId, userId: session.user.id });
      await requireActorControl({
        db,
        campaignId,
        userId: session.user.id,
        role,
        characterId: input.actorId,
      });
      try {
        const result =
          input.mode === "prepared"
            ? await castPreparedSpell(
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
            : await castSpontaneousSpell(
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
        scheduleEventPostprocess(c, {
          campaignId,
          sessionId: result.sessionId,
          eventId: result.eventId,
        });
        return c.json(result);
      } catch (error) {
        translateCastingError(error);
      }
    },
  )
  .post(
    "/api/campaigns/:campaignId/game/casting/powers/manifest",
    zValidator("json", manifestPowerSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const input = c.req.valid("json");
      const role = await campaignRole({ db, campaignId, userId: session.user.id });
      await requireActorControl({
        db,
        campaignId,
        userId: session.user.id,
        role,
        characterId: input.actorId,
      });
      try {
        const augmentations = input.augmentations?.map((selection) =>
          selection.applications === undefined
            ? { index: selection.index }
            : { index: selection.index, applications: selection.applications },
        );
        const result = await manifestPower(
          { db, binding },
          {
            campaignId,
            actorId: input.actorId,
            castingTrackId: input.castingTrackId,
            powerId: input.powerId,
            ...(augmentations === undefined ? {} : { augmentations }),
            ...(input.targetIds === undefined ? {} : { targetIds: input.targetIds }),
          },
        );
        scheduleEventPostprocess(c, {
          campaignId,
          sessionId: result.sessionId,
          eventId: result.eventId,
        });
        return c.json(result);
      } catch (error) {
        translateCastingError(error);
      }
    },
  )
  .post(
    "/api/campaigns/:campaignId/game/casting/psionic-focus",
    zValidator("json", focusSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const input = c.req.valid("json");
      const role = await campaignRole({ db, campaignId, userId: session.user.id });
      await requireActorControl({
        db,
        campaignId,
        userId: session.user.id,
        role,
        characterId: input.actorId,
      });
      try {
        const result = await gainPersistentPsionicFocus(
          { db, binding },
          { campaignId, actorId: input.actorId },
        );
        scheduleEventPostprocess(c, {
          campaignId,
          sessionId: result.sessionId,
          eventId: result.eventId,
        });
        return c.json(result);
      } catch (error) {
        translateCastingError(error);
      }
    },
  )
  .post(
    "/api/campaigns/:campaignId/game/casting/daily-resources/restore",
    zValidator("json", restoreSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const input = c.req.valid("json");
      const role = await campaignRole({ db, campaignId, userId: session.user.id });
      requireGameMaster(role);
      try {
        const result = await restorePersistentCastingResources(
          { db, binding },
          { campaignId, characterId: input.characterId },
        );
        scheduleEventPostprocess(c, {
          campaignId,
          sessionId: result.sessionId,
          eventId: result.eventId,
        });
        return c.json(result);
      } catch (error) {
        translateCastingError(error);
      }
    },
  );
