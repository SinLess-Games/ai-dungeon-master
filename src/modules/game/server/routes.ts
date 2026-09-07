/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { and, asc, eq, gt } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import {
  enqueueGameEventPostprocess,
  publishCommittedGameEvent,
  type BackgroundJob,
} from "@/infrastructure/cloudflare/backgroundJobs";
import { createDatabase } from "@/infrastructure/database/client";
import {
  campaignMemberships,
  campaigns,
  characters,
  gameEvents,
} from "@/infrastructure/database/schema";
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
import { loadActiveGameContext } from "./d1Dnd35State";
import {
  applyDirectDamage,
  applyDirectHealing,
  applyPersistentCondition,
  performAttack,
  performSavingThrow,
  performSkillCheck,
} from "./gameActionService";

interface GameBindings extends AuthEnv {
  DB?: D1Database;
  BACKGROUND_QUEUE?: Queue<BackgroundJob>;
  CAMPAIGN_ROOM?: DurableObjectNamespace<CampaignRoom>;
}

type GameEnv = { Bindings: GameBindings };
type CampaignRole = "owner" | "gm" | "player" | "observer";

const dcSchema = z.number().int().min(0).max(1000000);
const skillCheckSchema = z.object({
  actorId: z.string().trim().min(1),
  skillId: z.string().trim().min(1),
  specialization: z.string().trim().max(200).optional(),
  dc: dcSchema,
});
const savingThrowSchema = z.object({
  actorId: z.string().trim().min(1),
  save: z.enum(["fort", "ref", "will"]),
  dc: dcSchema,
  sourceId: z.string().trim().min(1).max(200).optional(),
});
const attackSchema = z.object({
  attackerId: z.string().trim().min(1),
  targetId: z.string().trim().min(1),
  kind: z.enum(["melee", "ranged"]),
  weaponInventoryId: z.string().trim().min(1).optional(),
});
const healthMutationSchema = z.object({
  actorId: z.string().trim().min(1).optional(),
  targetId: z.string().trim().min(1),
  amount: z.number().int().min(0).max(1000000),
  sourceId: z.string().trim().min(1).max(200).optional(),
  reason: z.string().trim().min(1).max(500).optional(),
});
const conditionSchema = z
  .object({
    actorId: z.string().trim().min(1).optional(),
    targetId: z.string().trim().min(1),
    conditionId: z.string().trim().min(1),
    sourceDescription: z.string().trim().max(500).optional(),
    durationKind: z.enum(["rounds", "until_time", "permanent", "concentration", "special"]),
    remainingRounds: z.number().int().min(0).optional(),
    expiresAt: z.string().datetime().optional(),
    state: z.record(z.string(), z.unknown()).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.durationKind === "rounds" && value.remainingRounds === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["remainingRounds"],
        message: "Round-based conditions require remainingRounds.",
      });
    }
    if (value.durationKind !== "rounds" && value.remainingRounds !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["remainingRounds"],
        message: "remainingRounds is only valid for round-based conditions.",
      });
    }
    if (value.durationKind === "until_time" && value.expiresAt === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "until_time conditions require expiresAt.",
      });
    }
    if (value.durationKind !== "until_time" && value.expiresAt !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "expiresAt is only valid for until_time conditions.",
      });
    }
  });

function requireDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("Game storage is unavailable.");
  return binding;
}

function scheduleEventPostprocess(
  c: { env: GameBindings; executionCtx: { waitUntil(promise: Promise<unknown>): void } },
  input: { campaignId: string; sessionId: string; eventId: string },
): void {
  const publish = publishCommittedGameEvent(c.env, input).catch((error) => {
    // Live delivery is deliberately best-effort. Clients can recover by
    // reading the authoritative event stream from D1, and the Queue consumer
    // will attempt the same broadcast again after delivery.
    console.error("Unable to publish committed game event", {
      campaignId: input.campaignId,
      sessionId: input.sessionId,
      eventId: input.eventId,
      error,
    });
  });

  const enqueue = enqueueGameEventPostprocess(c.env.BACKGROUND_QUEUE, input).catch((error) => {
    // The authoritative D1 command already committed. Queue delivery is
    // deliberately best-effort here so an optional async subsystem cannot
    // turn a successful game action into a client-visible failure.
    console.error("Unable to enqueue game-event postprocessing", {
      campaignId: input.campaignId,
      sessionId: input.sessionId,
      eventId: input.eventId,
      error,
    });
  });

  c.executionCtx.waitUntil(Promise.all([publish, enqueue]).then(() => undefined));
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
}) {
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
    throw new ForbiddenError(
      "Only the campaign owner or Game Master can apply direct state changes.",
    );
  }
}

function translateGameError(error: unknown): never {
  if (error instanceof RangeError) throw new ValidationError(error.message);
  if (!(error instanceof Error)) throw error;
  switch (error.message) {
    case "CAMPAIGN_GAME_NOT_ACTIVE":
      throw new ConflictError("This campaign does not currently have an active game session.");
    case "CAMPAIGN_RULESET_UNSUPPORTED":
      throw new ValidationError(
        "The active campaign ruleset is not supported by this game action runtime.",
      );
    case "GAME_ACTOR_OR_SKILL_NOT_FOUND":
      throw new NotFoundError("The actor or requested skill is unavailable in this campaign.");
    case "GAME_ACTOR_NOT_FOUND":
      throw new NotFoundError("The acting character is unavailable in this campaign.");
    case "GAME_ATTACK_PARTICIPANT_NOT_FOUND":
      throw new NotFoundError("The attacker or target is unavailable in this campaign.");
    case "GAME_WEAPON_INVALID":
      throw new ValidationError("The selected weapon cannot be used for this attack.");
    case "GAME_TARGET_HEALTH_UNAVAILABLE":
    case "GAME_TARGET_NOT_FOUND":
      throw new NotFoundError("The target does not have active D&D 3.5 game state.");
    case "GAME_CONDITION_NOT_FOUND":
      throw new NotFoundError("Condition definition not found.");
    case "GAME_STATE_CONFLICT":
      throw new ConflictError(
        "Game state changed while the action was resolving. Reload and try again.",
      );
    default:
      throw error;
  }
}

export const gameRoutes = new Hono<GameEnv>()
  .use("/api/campaigns/:campaignId/game/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/campaigns/:campaignId/game", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    await campaignRole({
      db,
      campaignId: c.req.param("campaignId"),
      userId: session.user.id,
    });
    const context = await loadActiveGameContext(db, c.req.param("campaignId"));
    if (!context) {
      throw new ConflictError("This campaign does not have an active game session.");
    }
    return c.json(context);
  })
  .get("/api/campaigns/:campaignId/game/events", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const campaignId = c.req.param("campaignId");
    await campaignRole({ db, campaignId, userId: session.user.id });
    const after = Math.max(0, Number.parseInt(c.req.query("after") ?? "0", 10) || 0);
    const requestedLimit = Number.parseInt(c.req.query("limit") ?? "100", 10) || 100;
    const limit = Math.min(250, Math.max(1, requestedLimit));
    const items = await db
      .select()
      .from(gameEvents)
      .where(and(eq(gameEvents.campaignId, campaignId), gt(gameEvents.sequence, after)))
      .orderBy(asc(gameEvents.sequence))
      .limit(limit)
      .all();
    return c.json({ items, after, limit });
  })
  .post(
    "/api/campaigns/:campaignId/game/skill-check",
    zValidator("json", skillCheckSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const input = c.req.valid("json");
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const role = await campaignRole({ db, campaignId, userId: session.user.id });
      await requireActorControl({
        db,
        campaignId,
        userId: session.user.id,
        role,
        characterId: input.actorId,
      });
      try {
        const result = await performSkillCheck(
          { db, binding },
          {
            campaignId,
            actorId: input.actorId,
            skillId: input.skillId,
            dc: input.dc,
            ...(input.specialization === undefined
              ? {}
              : { specialization: input.specialization }),
          },
        );
        if (!result.allowed) {
          throw new ValidationError(result.message, { code: result.code });
        }
        scheduleEventPostprocess(c, {
          campaignId,
          sessionId: result.sessionId,
          eventId: result.eventId,
        });
        return c.json(result);
      } catch (error) {
        translateGameError(error);
      }
    },
  )
  .post(
    "/api/campaigns/:campaignId/game/saving-throw",
    zValidator("json", savingThrowSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const input = c.req.valid("json");
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const role = await campaignRole({ db, campaignId, userId: session.user.id });
      await requireActorControl({
        db,
        campaignId,
        userId: session.user.id,
        role,
        characterId: input.actorId,
      });
      try {
        const result = await performSavingThrow(
          { db, binding },
          {
            campaignId,
            actorId: input.actorId,
            save: input.save,
            dc: input.dc,
            ...(input.sourceId === undefined ? {} : { sourceId: input.sourceId }),
          },
        );
        scheduleEventPostprocess(c, {
          campaignId,
          sessionId: result.sessionId,
          eventId: result.eventId,
        });
        return c.json(result);
      } catch (error) {
        translateGameError(error);
      }
    },
  )
  .post(
    "/api/campaigns/:campaignId/game/attack",
    zValidator("json", attackSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const input = c.req.valid("json");
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const role = await campaignRole({ db, campaignId, userId: session.user.id });
      await requireActorControl({
        db,
        campaignId,
        userId: session.user.id,
        role,
        characterId: input.attackerId,
      });
      try {
        const result = await performAttack(
          { db, binding },
          {
            campaignId,
            attackerId: input.attackerId,
            targetId: input.targetId,
            kind: input.kind,
            ...(input.weaponInventoryId === undefined
              ? {}
              : { weaponInventoryId: input.weaponInventoryId }),
          },
        );
        scheduleEventPostprocess(c, {
          campaignId,
          sessionId: result.sessionId,
          eventId: result.eventId,
        });
        return c.json(result);
      } catch (error) {
        translateGameError(error);
      }
    },
  )
  .post(
    "/api/campaigns/:campaignId/game/damage",
    zValidator("json", healthMutationSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const input = c.req.valid("json");
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const role = await campaignRole({ db, campaignId, userId: session.user.id });
      requireGameMaster(role);
      try {
        const result = await applyDirectDamage(
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
        scheduleEventPostprocess(c, {
          campaignId,
          sessionId: result.sessionId,
          eventId: result.eventId,
        });
        return c.json(result);
      } catch (error) {
        translateGameError(error);
      }
    },
  )
  .post(
    "/api/campaigns/:campaignId/game/healing",
    zValidator("json", healthMutationSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const input = c.req.valid("json");
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const role = await campaignRole({ db, campaignId, userId: session.user.id });
      requireGameMaster(role);
      try {
        const result = await applyDirectHealing(
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
        scheduleEventPostprocess(c, {
          campaignId,
          sessionId: result.sessionId,
          eventId: result.eventId,
        });
        return c.json(result);
      } catch (error) {
        translateGameError(error);
      }
    },
  )
  .post(
    "/api/campaigns/:campaignId/game/conditions",
    zValidator("json", conditionSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const input = c.req.valid("json");
      const binding = requireDatabase(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const role = await campaignRole({ db, campaignId, userId: session.user.id });
      requireGameMaster(role);
      try {
        const result = await applyPersistentCondition(
          { db, binding },
          {
            campaignId,
            targetId: input.targetId,
            conditionId: input.conditionId,
            durationKind: input.durationKind,
            ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
            ...(input.sourceDescription === undefined
              ? {}
              : { sourceDescription: input.sourceDescription }),
            ...(input.remainingRounds === undefined
              ? {}
              : { remainingRounds: input.remainingRounds }),
            ...(input.expiresAt === undefined
              ? {}
              : { expiresAt: new Date(input.expiresAt) }),
            ...(input.state === undefined ? {} : { state: input.state }),
          },
        );
        scheduleEventPostprocess(c, {
          campaignId,
          sessionId: result.sessionId,
          eventId: result.eventId,
        });
        return c.json(result, 201);
      } catch (error) {
        translateGameError(error);
      }
    },
  );
