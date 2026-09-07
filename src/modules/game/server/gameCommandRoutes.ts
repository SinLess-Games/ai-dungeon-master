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

interface CommandBindings extends AuthEnv {
  DB?: D1Database;
  BACKGROUND_QUEUE?: Queue<BackgroundJob>;
  CAMPAIGN_ROOM?: DurableObjectNamespace<CampaignRoom>;
}

type CommandEnv = { Bindings: CommandBindings };
type CampaignRole = "owner" | "gm" | "player" | "observer";

const id = z.string().trim().min(1).max(200);
const targetIds = z.array(id).max(100).optional();
const amount = z.number().int().min(0).max(1_000_000);
const reason = z.string().trim().min(1).max(500).optional();

const commandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("attack"),
    actorId: id,
    targetId: id,
    kind: z.enum(["melee", "ranged"]),
    weaponInventoryId: id.optional(),
    monsterAttackId: id.optional(),
  }),
  z.object({
    type: z.literal("skill_check"),
    actorId: id,
    skillId: id,
    specialization: z.string().trim().max(200).optional(),
    dc: z.number().int().min(0).max(1_000_000),
  }),
  z.object({
    type: z.literal("saving_throw"),
    actorId: id,
    save: z.enum(["fort", "ref", "will"]),
    dc: z.number().int().min(0).max(1_000_000),
    sourceId: id.optional(),
  }),
  z.object({
    type: z.literal("damage"),
    actorId: id.optional(),
    targetId: id,
    amount,
    sourceId: id.optional(),
    reason,
  }),
  z.object({
    type: z.literal("healing"),
    actorId: id.optional(),
    targetId: id,
    amount,
    sourceId: id.optional(),
    reason,
  }),
  z.object({
    type: z.literal("nonlethal_damage"),
    actorId: id.optional(),
    targetId: id,
    amount,
    reason,
  }),
  z.object({
    type: z.literal("temporary_hit_points"),
    actorId: id.optional(),
    targetId: id,
    amount,
    reason,
  }),
  z
    .object({
      type: z.literal("apply_condition"),
      actorId: id.optional(),
      targetId: id,
      conditionId: id,
      sourceDescription: z.string().trim().max(500).optional(),
      durationKind: z.enum(["rounds", "until_time", "permanent", "concentration", "special"]),
      remainingRounds: z.number().int().min(1).max(1_000_000).optional(),
      expiresAt: z.string().datetime().optional(),
      state: z.record(z.string(), z.unknown()).optional(),
    })
    .superRefine((value, ctx) => {
      if (value.durationKind === "rounds" && value.remainingRounds === undefined) {
        ctx.addIssue({ code: "custom", path: ["remainingRounds"], message: "Round conditions require remainingRounds." });
      }
      if (value.durationKind !== "rounds" && value.remainingRounds !== undefined) {
        ctx.addIssue({ code: "custom", path: ["remainingRounds"], message: "remainingRounds is only valid for round conditions." });
      }
      if (value.durationKind === "until_time" && value.expiresAt === undefined) {
        ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "until_time conditions require expiresAt." });
      }
      if (value.durationKind !== "until_time" && value.expiresAt !== undefined) {
        ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "expiresAt is only valid for until_time conditions." });
      }
    }),
  z.object({ type: z.literal("stabilize"), actorId: id }),
  z.object({
    type: z.literal("start_encounter"),
    participantIds: z.array(id).min(1).max(100),
  }),
  z.object({ type: z.literal("end_turn"), actorId: id, encounterId: id }),
  z.object({
    type: z.literal("finish_encounter"),
    encounterId: id,
    status: z.enum(["completed", "abandoned"]).optional(),
  }),
  z.object({
    type: z.literal("cast_spell"),
    mode: z.literal("prepared"),
    actorId: id,
    castingTrackId: id,
    spellId: id,
    preparationId: id,
    targetIds,
  }),
  z.object({
    type: z.literal("cast_spell"),
    mode: z.literal("spontaneous"),
    actorId: id,
    castingTrackId: id,
    spellId: id,
    slotLevel: z.number().int().min(0).max(100).optional(),
    targetIds,
  }),
  z.object({
    type: z.literal("manifest_power"),
    actorId: id,
    castingTrackId: id,
    powerId: id,
    augmentations: z
      .array(
        z.object({
          index: z.number().int().min(0).max(1000),
          applications: z.number().int().min(1).max(1000).default(1),
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

function requiresGameMaster(command: GameCommand): boolean {
  return [
    "damage",
    "healing",
    "nonlethal_damage",
    "temporary_hit_points",
    "apply_condition",
    "start_encounter",
    "finish_encounter",
  ].includes(command.type);
}

function actingActorId(command: GameCommand): string | null {
  switch (command.type) {
    case "attack":
    case "skill_check":
    case "saving_throw":
    case "stabilize":
    case "end_turn":
    case "cast_spell":
    case "manifest_power":
      return command.actorId;
    default:
      return null;
  }
}

async function requireCommandAuthorization(input: {
  db: ReturnType<typeof createDatabase>;
  campaignId: string;
  userId: string;
  role: CampaignRole;
  command: GameCommand;
}) {
  if (requiresGameMaster(input.command)) {
    if (input.role !== "owner" && input.role !== "gm") {
      throw new ForbiddenError("Only the campaign owner or Game Master can perform this command.");
    }
    return;
  }

  const actorId = actingActorId(input.command);
  if (actorId === null) return;
  if (input.role === "owner" || input.role === "gm") return;
  if (input.role === "observer") throw new ForbiddenError("Observers cannot perform game commands.");

  const actor = await input.db
    .select({ kind: gameActors.kind, controllerUserId: gameActors.controllerUserId })
    .from(gameActors)
    .where(and(eq(gameActors.id, actorId), eq(gameActors.campaignId, input.campaignId)))
    .get();
  if (!actor || actor.kind !== "character" || actor.controllerUserId !== input.userId) {
    throw new ForbiddenError("You can only issue commands for a character assigned to you.");
  }
}

function schedule(
  c: { env: CommandBindings; executionCtx: { waitUntil(promise: Promise<unknown>): void } },
  input: { campaignId: string; sessionId: string; eventId: string },
) {
  c.executionCtx.waitUntil(
    Promise.all([
      publishCommittedGameEvent(c.env, input).catch((error) => {
        console.error("Unable to publish committed game command event", { ...input, error });
      }),
      enqueueGameEventPostprocess(c.env.BACKGROUND_QUEUE, input).catch((error) => {
        console.error("Unable to enqueue game command event", { ...input, error });
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
    case "ENCOUNTER_ALREADY_ACTIVE":
    case "ENCOUNTER_NOT_ACTORS_TURN":
    case "GAME_STATE_CONFLICT":
    case "SPELL_NOT_PREPARED":
    case "SPELL_SLOTS_EXHAUSTED":
    case "INSUFFICIENT_POWER_POINTS":
      throw new ConflictError(error.message.replaceAll("_", " ").toLowerCase());
    case "ENCOUNTER_NOT_ACTIVE":
    case "GAME_ACTOR_NOT_FOUND":
    case "GAME_ATTACK_PARTICIPANT_NOT_FOUND":
    case "GAME_TARGET_HEALTH_UNAVAILABLE":
    case "GAME_TARGET_NOT_FOUND":
    case "GAME_TARGET_SAVE_UNAVAILABLE":
    case "GAME_CONDITION_NOT_FOUND":
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
    case "ROUND_CONDITION_REQUIRES_ACTIVE_ENCOUNTER":
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

export const gameCommandRoutes = new Hono<CommandEnv>()
  .use("/api/campaigns/:campaignId/game/commands", async (c, next) => {
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
      const role = await campaignRole({ db, campaignId, userId: session.user.id });
      await requireCommandAuthorization({
        db,
        campaignId,
        userId: session.user.id,
        role,
        command,
      });

      try {
        const result = await executeGameCommand({ db, binding }, campaignId, command);
        if (result.eventId && result.sessionId) {
          schedule(c, { campaignId, eventId: result.eventId, sessionId: result.sessionId });
        }
        return c.json(result);
      } catch (error) {
        translate(error);
      }
    },
  );
