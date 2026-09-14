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
import { executeGameCommand, type GameCommand } from "./gameCommandService";

interface Bindings extends AuthEnv {
  DB?: D1Database;
  BACKGROUND_QUEUE?: Queue<BackgroundJob>;
  CAMPAIGN_ROOM?: DurableObjectNamespace<CampaignRoom>;
}

type Env = { Bindings: Bindings };
type CampaignRole = "owner" | "gm" | "player" | "observer";

const id = z.string().trim().min(1).max(200);
const targetIds = z.array(id).max(100).optional();
const dc = z.number().int().min(0).max(1_000_000);
const d20 = z.number().int().min(1).max(20);

const commandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("encounter.start"), participantIds: z.array(id).min(1).max(100) }),
  z.object({ type: z.literal("encounter.end_turn"), encounterId: id, actorId: id }),
  z.object({
    type: z.literal("encounter.finish"),
    encounterId: id,
    status: z.enum(["completed", "abandoned"]).optional(),
  }),
  z.object({
    type: z.literal("combat.attack"),
    attackerId: id,
    targetId: id,
    kind: z.enum(["melee", "ranged"]),
    weaponInventoryId: id.optional(),
    monsterAttackId: id.optional(),
  }),
  z.object({
    type: z.literal("check.skill"),
    actorId: id,
    skillId: id,
    specialization: z.string().trim().max(200).optional(),
    dc,
    roll: d20.optional(),
  }),
  z.object({
    type: z.literal("check.save"),
    actorId: id,
    save: z.enum(["fort", "ref", "will"]),
    dc,
    sourceId: id.optional(),
    roll: d20.optional(),
  }),
  z.object({
    type: z.literal("spell.cast.prepared"),
    actorId: id,
    castingTrackId: id,
    spellId: id,
    preparationId: id,
    targetIds,
  }),
  z.object({
    type: z.literal("spell.cast.spontaneous"),
    actorId: id,
    castingTrackId: id,
    spellId: id,
    slotLevel: z.number().int().min(0).max(100).optional(),
    targetIds,
  }),
  z.object({
    type: z.literal("power.manifest"),
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
  }),
]);

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

function controlledActorId(command: GameCommand): string | null {
  switch (command.type) {
    case "encounter.end_turn":
    case "check.skill":
    case "check.save":
    case "spell.cast.prepared":
    case "spell.cast.spontaneous":
    case "power.manifest":
      return command.actorId;
    case "combat.attack":
      return command.attackerId;
    case "encounter.start":
    case "encounter.finish":
      return null;
  }
}

async function authorizeCommand(input: {
  db: ReturnType<typeof createDatabase>;
  campaignId: string;
  userId: string;
  role: CampaignRole;
  command: GameCommand;
}): Promise<void> {
  if (input.command.type === "encounter.start" || input.command.type === "encounter.finish") {
    if (input.role !== "owner" && input.role !== "gm") {
      throw new ForbiddenError("Only the campaign owner or Game Master can manage encounters.");
    }
    return;
  }
  if (input.role === "owner" || input.role === "gm") return;
  if (input.role === "observer") throw new ForbiddenError("Observers cannot perform game commands.");
  const actorId = controlledActorId(input.command);
  if (!actorId) throw new ForbiddenError("This command requires Game Master control.");
  const actor = await input.db
    .select({ kind: gameActors.kind, controllerUserId: gameActors.controllerUserId })
    .from(gameActors)
    .where(and(eq(gameActors.id, actorId), eq(gameActors.campaignId, input.campaignId)))
    .get();
  if (!actor || actor.kind !== "character" || actor.controllerUserId !== input.userId) {
    throw new ForbiddenError("You can only issue commands for a character assigned to you.");
  }
}

function scheduleIfEvent(
  c: { env: Bindings; executionCtx: { waitUntil(promise: Promise<unknown>): void } },
  campaignId: string,
  value: unknown,
): void {
  if (typeof value !== "object" || value === null) return;
  const candidate = value as { eventId?: unknown; sessionId?: unknown };
  if (typeof candidate.eventId !== "string" || typeof candidate.sessionId !== "string") return;
  const event = { campaignId, eventId: candidate.eventId, sessionId: candidate.sessionId };
  c.executionCtx.waitUntil(
    Promise.all([
      publishCommittedGameEvent(c.env, event).catch((error) => {
        console.error("Unable to publish game command event", { ...event, error });
      }),
      enqueueGameEventPostprocess(c.env.BACKGROUND_QUEUE, event).catch((error) => {
        console.error("Unable to enqueue game command event", { ...event, error });
      }),
    ]).then(() => undefined),
  );
}

function translate(error: unknown): never {
  if (error instanceof RangeError) throw new ValidationError(error.message);
  if (!(error instanceof Error)) throw error;
  if (error.message.startsWith("CASTING_EFFECT_HANDLER_UNAVAILABLE:")) {
    throw new ValidationError(error.message.replaceAll("_", " ").toLowerCase());
  }
  switch (error.message) {
    case "CAMPAIGN_GAME_NOT_ACTIVE":
      throw new ConflictError("This campaign does not currently have an active game session.");
    case "GAME_STATE_CONFLICT":
    case "ENCOUNTER_ALREADY_ACTIVE":
    case "ENCOUNTER_NOT_ACTORS_TURN":
      throw new ConflictError(error.message.replaceAll("_", " ").toLowerCase());
    case "ENCOUNTER_NOT_ACTIVE":
    case "GAME_ACTOR_NOT_FOUND":
    case "GAME_ACTOR_OR_SKILL_NOT_FOUND":
    case "GAME_ATTACK_PARTICIPANT_NOT_FOUND":
    case "GAME_TARGET_HEALTH_UNAVAILABLE":
    case "GAME_TARGET_SAVE_UNAVAILABLE":
    case "CASTING_TRACK_NOT_FOUND":
    case "SPELL_NOT_AVAILABLE":
    case "SPELL_PREPARATION_NOT_FOUND":
    case "SPELL_NOT_KNOWN":
    case "POWER_NOT_AVAILABLE":
    case "POWER_NOT_KNOWN":
      throw new NotFoundError(error.message.replaceAll("_", " ").toLowerCase());
    case "CAMPAIGN_RULESET_UNSUPPORTED":
    case "ENCOUNTER_PARTICIPANT_INVALID":
    case "ENCOUNTER_STATE_INVALID":
    case "GAME_WEAPON_INVALID":
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

export const gameCommandRoutes = new Hono<Env>()
  .use("/api/campaigns/:campaignId/game/commands*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .post(
    "/api/campaigns/:campaignId/game/commands",
    zValidator("json", commandSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const command = c.req.valid("json") as GameCommand;
      const campaignRole = await role({ db, campaignId, userId: session.user.id });
      await authorizeCommand({
        db,
        campaignId,
        userId: session.user.id,
        role: campaignRole,
        command,
      });
      try {
        const result = await executeGameCommand({ db, binding }, campaignId, command);
        scheduleIfEvent(c, campaignId, result.value);
        return c.json(result);
      } catch (error) {
        translate(error);
      }
    },
  );
