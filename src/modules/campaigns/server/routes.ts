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
  campaignDifficultyIds,
  campaignPaceIds,
  campaignScaleIds,
  campaignStructureIds,
  campaignStyleIds,
  characterProgressionIds,
  contentPolicyIds,
  dmCreativityIds,
  levelingModeIds,
  rulesStrictnessIds,
  worldTemplateIds,
} from "../domain/creatorOptions";
import { BootstrapWorldGenerator } from "./bootstrapWorldGenerator";
import { D1CampaignStartRepository } from "./d1StartRepository";
import { startCampaign } from "./startCampaign";

interface CampaignBindings extends AuthEnv {
  DB?: D1Database;
}

type CampaignEnv = { Bindings: CampaignBindings };
type CampaignAccessRole = "owner" | "gm" | "player" | "observer";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function addSettingsIssue(
  ctx: z.RefinementCtx,
  path: Array<string | number>,
  message: string,
): void {
  ctx.addIssue({ code: "custom", path, message });
}

function validateGenreArray(
  value: unknown,
  ctx: z.RefinementCtx,
  path: Array<string | number>,
  required: boolean,
): string[] | null {
  if (!Array.isArray(value)) {
    if (value !== undefined || required) addSettingsIssue(ctx, path, "Campaign genres must be an array.");
    return null;
  }
  if (required && value.length < 1) {
    addSettingsIssue(ctx, path, "Choose at least one campaign style or genre.");
  }
  if (value.length > CAMPAIGN_STYLE_LIMIT) {
    addSettingsIssue(
      ctx,
      path,
      `Choose no more than ${CAMPAIGN_STYLE_LIMIT} campaign styles or genres.`,
    );
  }
  const seen = new Set<string>();
  const result: string[] = [];
  for (const genre of value) {
    if (typeof genre !== "string" || !campaignStyleIds.has(genre)) {
      addSettingsIssue(ctx, path, "Campaign genres include an unsupported value.");
      return null;
    }
    if (seen.has(genre)) {
      addSettingsIssue(ctx, path, "Campaign genres cannot contain duplicates.");
      return null;
    }
    seen.add(genre);
    result.push(genre);
  }
  return result;
}

const campaignSettingsSchema = z.record(z.string(), z.unknown()).superRefine((settings, ctx) => {
  const creatorVersion = settings["creatorVersion"];
  const creatorV1 = creatorVersion === 1;
  const creatorV2 = creatorVersion === 2;
  const creatorSettings = creatorV1 || creatorV2;

  if (creatorVersion !== undefined && !creatorSettings) {
    addSettingsIssue(ctx, ["creatorVersion"], "Unsupported campaign creator settings version.");
  }

  const genres = validateGenreArray(settings["genres"], ctx, ["genres"], creatorSettings);

  const shortDescription = settings["shortDescription"];
  if (
    shortDescription !== undefined &&
    (typeof shortDescription !== "string" || shortDescription.trim().length > 200)
  ) {
    addSettingsIssue(
      ctx,
      ["shortDescription"],
      "Campaign short description must be 200 characters or fewer.",
    );
  }
  if (creatorSettings && (typeof shortDescription !== "string" || !shortDescription.trim())) {
    addSettingsIssue(ctx, ["shortDescription"], "Campaign short description is required.");
  }

  const pace = settings["pace"];
  if (
    (pace !== undefined || creatorSettings) &&
    (typeof pace !== "string" || !campaignPaceIds.has(pace))
  ) {
    addSettingsIssue(ctx, ["pace"], "Choose a supported campaign pace.");
  }

  const scale = settings["scale"];
  if (
    (scale !== undefined || creatorSettings) &&
    (typeof scale !== "string" || !campaignScaleIds.has(scale))
  ) {
    addSettingsIssue(ctx, ["scale"], "Choose a supported campaign scale.");
  }

  const structure = settings["structure"];
  if (
    (structure !== undefined || creatorSettings) &&
    (typeof structure !== "string" || !campaignStructureIds.has(structure))
  ) {
    addSettingsIssue(ctx, ["structure"], "Choose a supported campaign structure.");
  }

  if (!creatorV2) return;

  const world = asRecord(settings["world"]);
  if (!world) {
    addSettingsIssue(ctx, ["world"], "Campaign world settings are required.");
  } else {
    if (world["mode"] !== "generated" && world["mode"] !== "seeded") {
      addSettingsIssue(ctx, ["world", "mode"], "Choose a supported world creation mode.");
    }
    if (typeof world["templateId"] !== "string" || !worldTemplateIds.has(world["templateId"])) {
      addSettingsIssue(ctx, ["world", "templateId"], "Choose a supported world template.");
    }
    for (const key of ["multiPlanar", "persistentWorld"] as const) {
      if (typeof world[key] !== "boolean") {
        addSettingsIssue(ctx, ["world", key], `${key} must be a boolean.`);
      }
    }
  }

  const rules = asRecord(settings["rules"]);
  if (!rules) {
    addSettingsIssue(ctx, ["rules"], "Campaign rules settings are required.");
  } else {
    if (
      typeof rules["levelingMode"] !== "string" ||
      !levelingModeIds.has(rules["levelingMode"])
    ) {
      addSettingsIssue(ctx, ["rules", "levelingMode"], "Choose a supported leveling mode.");
    }
    if (
      typeof rules["characterProgression"] !== "string" ||
      !characterProgressionIds.has(rules["characterProgression"])
    ) {
      addSettingsIssue(
        ctx,
        ["rules", "characterProgression"],
        "Choose a supported character progression policy.",
      );
    }
    if (typeof rules["epicLevels"] !== "boolean") {
      addSettingsIssue(ctx, ["rules", "epicLevels"], "epicLevels must be a boolean.");
    }
  }

  const players = asRecord(settings["players"]);
  if (!players) {
    addSettingsIssue(ctx, ["players"], "Campaign player settings are required.");
  } else {
    const maxPlayers = players["maxPlayers"];
    if (
      typeof maxPlayers !== "number" ||
      !Number.isInteger(maxPlayers) ||
      maxPlayers < 1 ||
      maxPlayers > 12
    ) {
      addSettingsIssue(ctx, ["players", "maxPlayers"], "Maximum players must be from 1 to 12.");
    }
    for (const key of ["requireApproval", "allowSpectators", "allowPvp"] as const) {
      if (typeof players[key] !== "boolean") {
        addSettingsIssue(ctx, ["players", key], `${key} must be a boolean.`);
      }
    }
  }

  const dm = asRecord(settings["dm"]);
  if (!dm) {
    addSettingsIssue(ctx, ["dm"], "Dungeon Master settings are required.");
  } else {
    if (typeof dm["difficulty"] !== "string" || !campaignDifficultyIds.has(dm["difficulty"])) {
      addSettingsIssue(ctx, ["dm", "difficulty"], "Choose a supported campaign difficulty.");
    }
    if (
      typeof dm["rulesStrictness"] !== "string" ||
      !rulesStrictnessIds.has(dm["rulesStrictness"])
    ) {
      addSettingsIssue(ctx, ["dm", "rulesStrictness"], "Choose a supported rules strictness.");
    }
    if (typeof dm["creativity"] !== "string" || !dmCreativityIds.has(dm["creativity"])) {
      addSettingsIssue(ctx, ["dm", "creativity"], "Choose a supported DM creativity level.");
    }
    for (const key of ["rollNpcDice", "showDmRolls", "persistentNpcs", "idlePlus"] as const) {
      if (typeof dm[key] !== "boolean") {
        addSettingsIssue(ctx, ["dm", key], `${key} must be a boolean.`);
      }
    }
  }

  const content = asRecord(settings["content"]);
  if (!content) {
    addSettingsIssue(ctx, ["content"], "Campaign content settings are required.");
  } else {
    if (typeof content["policy"] !== "string" || !contentPolicyIds.has(content["policy"])) {
      addSettingsIssue(ctx, ["content", "policy"], "Choose a supported content policy.");
    }
    for (const key of ["allowHomebrew", "allowThirdParty"] as const) {
      if (typeof content[key] !== "boolean") {
        addSettingsIssue(ctx, ["content", key], `${key} must be a boolean.`);
      }
    }
    if (
      typeof content["houseRules"] !== "string" ||
      content["houseRules"].trim().length > 5000
    ) {
      addSettingsIssue(ctx, ["content", "houseRules"], "House rules must be 5000 characters or fewer.");
    }
  }

  const ruleset = asRecord(settings["ruleset"]);
  if (!ruleset) {
    addSettingsIssue(ctx, ["ruleset"], "Ruleset generation settings are required.");
    return;
  }
  if (ruleset["id"] !== "dnd35" || ruleset["version"] !== "3.5") {
    addSettingsIssue(ctx, ["ruleset"], "Campaign creator currently supports D&D 3.5 only.");
  }
  if (
    typeof ruleset["worldTemplateId"] !== "string" ||
    !worldTemplateIds.has(ruleset["worldTemplateId"])
  ) {
    addSettingsIssue(ctx, ["ruleset", "worldTemplateId"], "Choose a supported world template.");
  }
  const rulesetGenres = validateGenreArray(
    ruleset["campaignStyleIds"],
    ctx,
    ["ruleset", "campaignStyleIds"],
    true,
  );
  if (genres && rulesetGenres && JSON.stringify(genres) !== JSON.stringify(rulesetGenres)) {
    addSettingsIssue(
      ctx,
      ["ruleset", "campaignStyleIds"],
      "Ruleset campaign styles must match the selected campaign genres.",
    );
  }
  if (ruleset["pace"] !== pace) {
    addSettingsIssue(ctx, ["ruleset", "pace"], "Ruleset pace must match campaign pace.");
  }
  if (world && ruleset["worldTemplateId"] !== world["templateId"]) {
    addSettingsIssue(
      ctx,
      ["ruleset", "worldTemplateId"],
      "Ruleset world template must match the selected world template.",
    );
  }
  if (world && ruleset["multiPlanar"] !== world["multiPlanar"]) {
    addSettingsIssue(
      ctx,
      ["ruleset", "multiPlanar"],
      "Ruleset planar setting must match the selected world setting.",
    );
  }
  if (rules && ruleset["epicLevels"] !== rules["epicLevels"]) {
    addSettingsIssue(
      ctx,
      ["ruleset", "epicLevels"],
      "Ruleset epic-level setting must match campaign rules.",
    );
  }
  if (rules && ruleset["levelingMode"] !== rules["levelingMode"]) {
    addSettingsIssue(
      ctx,
      ["ruleset", "levelingMode"],
      "Ruleset leveling mode must match campaign rules.",
    );
  }
  if (rules && ruleset["characterProgression"] !== rules["characterProgression"]) {
    addSettingsIssue(
      ctx,
      ["ruleset", "characterProgression"],
      "Ruleset character progression must match campaign rules.",
    );
  }
  if (scale === "epic" && rules?.["epicLevels"] !== true) {
    addSettingsIssue(ctx, ["rules", "epicLevels"], "Epic campaigns must enable epic levels.");
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
  maxPlayers: z.number().int().min(1).max(12).nullable().optional(),
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
    maxPlayers: z.number().int().min(1).max(12).nullable().optional(),
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

async function campaignAccessRole(input: {
  db: ReturnType<typeof createDatabase>;
  campaignId: string;
  userId: string;
  ownerUserId: string;
}): Promise<CampaignAccessRole> {
  if (input.ownerUserId === input.userId) return "owner";
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
    const [campaignCharacters, world, role] = await Promise.all([
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
      campaignAccessRole({
        db,
        campaignId: campaign.id,
        userId: session.user.id,
        ownerUserId: campaign.ownerUserId,
      }),
    ]);
    return c.json({ campaign, characters: campaignCharacters, world: world ?? null, role });
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
