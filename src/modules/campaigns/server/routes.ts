/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import {
  campaignMemberships,
  campaigns,
  characters,
  worlds,
} from "@/infrastructure/database/schema";
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
  CAMPAIGN_STYLE_LIMIT,
  campaignPaceIds,
  campaignScaleIds,
  campaignStructureIds,
  campaignStyleIds,
} from "../domain/creatorOptions";
import { BootstrapWorldGenerator } from "./bootstrapWorldGenerator";
import { D1CampaignStartRepository } from "./d1StartRepository";
import { startCampaign } from "./startCampaign";

interface CampaignBindings extends AuthEnv {
  DB?: D1Database;
}

type CampaignEnv = { Bindings: CampaignBindings };

const campaignSettingsSchema = z.record(z.string(), z.unknown()).superRefine((settings, ctx) => {
  const creatorV1 = settings["creatorVersion"] === 1;
  const genres = settings["genres"];

  if (genres !== undefined || creatorV1) {
    if (!Array.isArray(genres)) {
      ctx.addIssue({
        code: "custom",
        path: ["genres"],
        message: "Campaign genres must be an array.",
      });
    } else {
      if (creatorV1 && genres.length < 1) {
        ctx.addIssue({
          code: "custom",
          path: ["genres"],
          message: "Choose at least one campaign style or genre.",
        });
      }
      if (genres.length > CAMPAIGN_STYLE_LIMIT) {
        ctx.addIssue({
          code: "custom",
          path: ["genres"],
          message: `Choose no more than ${CAMPAIGN_STYLE_LIMIT} campaign styles or genres.`,
        });
      }
      const seen = new Set<string>();
      for (const genre of genres) {
        if (typeof genre !== "string" || !campaignStyleIds.has(genre)) {
          ctx.addIssue({
            code: "custom",
            path: ["genres"],
            message: "Campaign genres include an unsupported value.",
          });
          break;
        }
        if (seen.has(genre)) {
          ctx.addIssue({
            code: "custom",
            path: ["genres"],
            message: "Campaign genres cannot contain duplicates.",
          });
          break;
        }
        seen.add(genre);
      }
    }
  }

  const shortDescription = settings["shortDescription"];
  if (
    shortDescription !== undefined &&
    (typeof shortDescription !== "string" || shortDescription.trim().length > 200)
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["shortDescription"],
      message: "Campaign short description must be 200 characters or fewer.",
    });
  }

  const pace = settings["pace"];
  if ((pace !== undefined || creatorV1) && (typeof pace !== "string" || !campaignPaceIds.has(pace))) {
    ctx.addIssue({ code: "custom", path: ["pace"], message: "Choose a supported campaign pace." });
  }

  const scale = settings["scale"];
  if ((scale !== undefined || creatorV1) && (typeof scale !== "string" || !campaignScaleIds.has(scale))) {
    ctx.addIssue({ code: "custom", path: ["scale"], message: "Choose a supported campaign scale." });
  }

  const structure = settings["structure"];
  if (
    (structure !== undefined || creatorV1) &&
    (typeof structure !== "string" || !campaignStructureIds.has(structure))
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["structure"],
      message: "Choose a supported campaign structure.",
    });
  }
});

const createCampaignSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  playMode: z.enum(["solo", "multiplayer"]).default("solo"),
  gameMasterMode: z.enum(["ai", "human", "hybrid"]).default("ai"),
  timeMode: z.enum(["paused", "session", "living", "custom"]).default("paused"),
  visibility: z.enum(["private", "invite_only", "unlisted", "public"]).default("private"),
  maxPlayers: z.number().int().positive().nullable().optional(),
  generationSeed: z.string().trim().min(1).max(256).optional(),
  settings: campaignSettingsSchema.optional(),
});

const updateCampaignSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(4000).nullable().optional(),
    notes: z.string().trim().max(20000).nullable().optional(),
    playMode: z.enum(["solo", "multiplayer"]).optional(),
    gameMasterMode: z.enum(["ai", "human", "hybrid"]).optional(),
    timeMode: z.enum(["paused", "session", "living", "custom"]).optional(),
    visibility: z.enum(["private", "invite_only", "unlisted", "public"]).optional(),
    maxPlayers: z.number().int().positive().nullable().optional(),
    generationSeed: z.string().trim().min(1).max(256).optional(),
    settings: campaignSettingsSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one campaign field is required.");

function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return slug || `campaign-${crypto.randomUUID().slice(0, 8)}`;
}

function requireDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("Campaign storage is unavailable.");
  return binding;
}

async function requireCampaignAccess(input: {
  db: ReturnType<typeof createDatabase>;
  campaignId: string;
  userId: string;
  ownerOnly?: boolean;
}) {
  const campaign = await input.db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, input.campaignId))
    .get();
  if (!campaign) throw new NotFoundError("Campaign not found.");
  if (campaign.ownerUserId === input.userId) return campaign;
  if (input.ownerOnly) throw new ForbiddenError("Only the campaign owner can perform this action.");

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
  return campaign;
}

function throwStartFailure(
  errors: readonly { code: string; message: string; path?: string; details?: unknown }[],
): never {
  const first = errors[0];
  const details = {
    issues: errors.map((error) => ({
      code: error.code,
      message: error.message,
      ...(error.path ? { path: error.path } : {}),
      ...(error.details ? { details: error.details } : {}),
    })),
  };
  if (first?.code === "CAMPAIGN_NOT_FOUND") throw new NotFoundError(first.message, details);
  if (first?.code === "CAMPAIGN_START_FORBIDDEN") throw new ForbiddenError(first.message, details);
  if (first?.code === "CAMPAIGN_WORLD_GENERATION_FAILED") {
    throw new ServiceUnavailableError(first.message, details);
  }
  if (
    first?.code.includes("CONFLICT") ||
    first?.code === "CAMPAIGN_START_INVALID_STATUS" ||
    first?.code === "CAMPAIGN_WORLD_ALREADY_EXISTS"
  ) {
    throw new ConflictError(first.message, details);
  }
  throw new ValidationError(first?.message ?? "Campaign is not ready to start.", details);
}

export const campaignRoutes = new Hono<CampaignEnv>()
  .use("/api/campaigns/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/campaigns", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireDatabase(c.env.DB));
    const owned = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        slug: campaigns.slug,
        description: campaigns.description,
        status: campaigns.status,
        playMode: campaigns.playMode,
        gameMasterMode: campaigns.gameMasterMode,
        rulesetId: campaigns.rulesetId,
        rulesetVersion: campaigns.rulesetVersion,
        worldId: campaigns.worldId,
        updatedAt: campaigns.updatedAt,
        createdAt: campaigns.createdAt,
      })
      .from(campaigns)
      .where(eq(campaigns.ownerUserId, session.user.id))
      .orderBy(desc(campaigns.updatedAt))
      .all();
    return c.json({ items: owned });
  })
  .post("/api/campaigns", zValidator("json", createCampaignSchema), async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const input = c.req.valid("json");
    const db = createDatabase(requireDatabase(c.env.DB));
    const id = crypto.randomUUID();
    const slug = input.slug ?? slugify(input.name);
    const existing = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(and(eq(campaigns.ownerUserId, session.user.id), eq(campaigns.slug, slug)))
      .get();
    if (existing) throw new ConflictError("You already have a campaign with that slug.");

    const now = new Date();
    await db.batch([
      db.insert(campaigns).values({
        id,
        ownerUserId: session.user.id,
        worldId: null,
        rulesetId: "dnd35",
        rulesetVersion: "3.5",
        name: input.name,
        slug,
        description: input.description ?? null,
        status: "draft",
        playMode: input.playMode,
        gameMasterMode: input.gameMasterMode,
        timeMode: input.timeMode,
        visibility: input.visibility,
        maxPlayers: input.maxPlayers ?? null,
        generationSeed: input.generationSeed ?? crypto.randomUUID(),
        settings: input.settings ?? {},
      }),
      db.insert(campaignMemberships).values({
        campaignId: id,
        userId: session.user.id,
        role: "owner",
        status: "active",
        joinedAt: now,
      }),
    ]);

    const created = await db.select().from(campaigns).where(eq(campaigns.id, id)).get();
    return c.json(created, 201);
  })
  .get("/api/campaigns/:campaignId", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireDatabase(c.env.DB));
    const campaign = await requireCampaignAccess({
      db,
      campaignId: c.req.param("campaignId"),
      userId: session.user.id,
    });
    const [campaignCharacters, world] = await Promise.all([
      db
        .select({
          id: characters.id,
          name: characters.name,
          status: characters.status,
          ownerUserId: characters.ownerUserId,
          rulesetId: characters.rulesetId,
          rulesetVersion: characters.rulesetVersion,
          readyAt: characters.readyAt,
        })
        .from(characters)
        .where(eq(characters.campaignId, campaign.id))
        .all(),
      campaign.worldId
        ? db.select().from(worlds).where(eq(worlds.id, campaign.worldId)).get()
        : Promise.resolve(undefined),
    ]);
    return c.json({ campaign, characters: campaignCharacters, world: world ?? null });
  })
  .patch("/api/campaigns/:campaignId", zValidator("json", updateCampaignSchema), async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const input = c.req.valid("json");
    const db = createDatabase(requireDatabase(c.env.DB));
    const campaign = await requireCampaignAccess({
      db,
      campaignId: c.req.param("campaignId"),
      userId: session.user.id,
      ownerOnly: true,
    });
    if (campaign.status !== "draft" && campaign.status !== "ready") {
      throw new ConflictError("Campaign settings are locked after campaign start begins.");
    }

    await db
      .update(campaigns)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(campaigns.id, campaign.id))
      .run();
    return c.json(await db.select().from(campaigns).where(eq(campaigns.id, campaign.id)).get());
  })
  .post("/api/campaigns/:campaignId/start", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireDatabase(c.env.DB));
    const result = await startCampaign({
      campaignId: c.req.param("campaignId"),
      requestingUserId: session.user.id,
      repository: new D1CampaignStartRepository(db),
      worldGenerator: new BootstrapWorldGenerator(db),
    });
    if (!result.ok) throwStartFailure(result.errors);
    return c.json(result.value);
  });
