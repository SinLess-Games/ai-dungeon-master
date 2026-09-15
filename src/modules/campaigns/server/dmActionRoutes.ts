/// <reference types="@cloudflare/workers-types" />

import { Hono } from "hono";
import { z } from "zod";
import {
  generateOpenAICompatibleText,
  type OpenAICompatibleEnv,
} from "@/infrastructure/ai/openaiCompatible";
import {
  enqueueGameEventPostprocess,
  publishCommittedGameEvent,
  type BackgroundJob,
} from "@/infrastructure/cloudflare/backgroundJobs";
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
  attachDmResolutionMessage,
  findPendingDmAction,
  resolvePendingDmAction,
  type PublicCampaignDmAction,
} from "./dmActionService";

interface Bindings extends AuthEnv, OpenAICompatibleEnv {
  DB?: D1Database;
  BACKGROUND_QUEUE?: Queue<BackgroundJob>;
  CAMPAIGN_ROOM?: DurableObjectNamespace<CampaignRoom>;
  AI_GAME_MODEL?: string;
}

type Env = { Bindings: Bindings };
type CampaignRole = "owner" | "gm" | "player" | "observer";

interface CampaignAccess {
  id: string;
  name: string;
  status: string;
  rulesetId: string;
  rulesetVersion: string;
  role: CampaignRole;
}

interface StoredMessageRow {
  id: string;
  campaignId: string;
  channel: "campaign" | "ooc_dm";
  authorKind: "player" | "dm" | "system";
  authorUserId: string | null;
  characterId: string | null;
  content: string;
  createdAt: number;
  characterName: string | null;
}

const resolveSchema = z.object({ roll: z.number().int().min(1).max(20) });

function requireDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("Campaign play storage is unavailable.");
  return binding;
}

async function requireCampaignAccess(
  db: D1Database,
  campaignId: string,
  userId: string,
): Promise<CampaignAccess> {
  const campaign = await db
    .prepare(
      `SELECT id,
              owner_user_id AS ownerUserId,
              name,
              status,
              ruleset_id AS rulesetId,
              ruleset_version AS rulesetVersion
       FROM campaigns
       WHERE id = ?
       LIMIT 1`,
    )
    .bind(campaignId)
    .first<{
      id: string;
      ownerUserId: string;
      name: string;
      status: string;
      rulesetId: string;
      rulesetVersion: string;
    }>();
  if (!campaign) throw new NotFoundError("Campaign not found.");

  let role: CampaignRole = "owner";
  if (campaign.ownerUserId !== userId) {
    const membership = await db
      .prepare(
        `SELECT role, status
         FROM campaign_memberships
         WHERE campaign_id = ? AND user_id = ?
         LIMIT 1`,
      )
      .bind(campaignId, userId)
      .first<{ role: CampaignRole; status: string }>();
    if (!membership || membership.status !== "active") {
      throw new ForbiddenError("You do not have access to this campaign.");
    }
    role = membership.role;
  }

  if (campaign.status !== "active" && campaign.status !== "paused") {
    throw new ConflictError("The campaign must be active or paused before using campaign play.");
  }

  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    rulesetId: campaign.rulesetId,
    rulesetVersion: campaign.rulesetVersion,
    role,
  };
}

async function insertDmMessage(
  db: D1Database,
  campaignId: string,
  content: string,
): Promise<StoredMessageRow> {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO campaign_play_messages
         (id, campaign_id, channel, author_kind, author_user_id, private_user_id, character_id, content)
       VALUES (?, ?, 'campaign', 'dm', NULL, NULL, NULL, ?)`,
    )
    .bind(id, campaignId, content)
    .run();

  const row = await db
    .prepare(
      `SELECT m.id,
              m.campaign_id AS campaignId,
              m.channel,
              m.author_kind AS authorKind,
              m.author_user_id AS authorUserId,
              m.character_id AS characterId,
              m.content,
              m.created_at AS createdAt,
              c.name AS characterName
       FROM campaign_play_messages m
       LEFT JOIN characters c ON c.id = m.character_id
       WHERE m.id = ?
       LIMIT 1`,
    )
    .bind(id)
    .first<StoredMessageRow>();
  if (!row) throw new Error("CAMPAIGN_PLAY_MESSAGE_MISSING");
  return row;
}

function publicDmMessage(row: StoredMessageRow) {
  return {
    id: row.id,
    campaignId: row.campaignId,
    channel: row.channel,
    authorKind: row.authorKind,
    authorUserId: row.authorUserId,
    authorName: "Dungeon Master",
    characterId: row.characterId,
    characterName: row.characterName,
    content: row.content,
    createdAt: row.createdAt,
  };
}

function actionLabel(action: PublicCampaignDmAction): string {
  if (action.kind === "check.skill" && action.skill) {
    return `${action.skill.name}${action.skill.specialization ? ` (${action.skill.specialization})` : ""}`;
  }
  switch (action.save) {
    case "fort":
      return "Fortitude save";
    case "ref":
      return "Reflex save";
    case "will":
      return "Will save";
    default:
      return "d20 check";
  }
}

function extractResolutionFacts(value: unknown): {
  naturalRoll: number | null;
  total: number | null;
  success: boolean | null;
  margin: number | null;
} {
  if (!value || typeof value !== "object") {
    return { naturalRoll: null, total: null, success: null, margin: null };
  }
  const record = value as Record<string, unknown>;
  const skill = record["check"];
  if (skill && typeof skill === "object") {
    const check = skill as Record<string, unknown>;
    return {
      naturalRoll: typeof check["naturalRoll"] === "number" ? check["naturalRoll"] : null,
      total: typeof check["total"] === "number" ? check["total"] : null,
      success: typeof check["success"] === "boolean" ? check["success"] : null,
      margin: typeof check["margin"] === "number" ? check["margin"] : null,
    };
  }
  const save = record["result"];
  if (save && typeof save === "object") {
    const check = save as Record<string, unknown>;
    return {
      naturalRoll: typeof check["naturalRoll"] === "number" ? check["naturalRoll"] : null,
      total: typeof check["total"] === "number" ? check["total"] : null,
      success: typeof check["passed"] === "boolean" ? check["passed"] : null,
      margin: typeof check["margin"] === "number" ? check["margin"] : null,
    };
  }
  return { naturalRoll: null, total: null, success: null, margin: null };
}

function authoritativeSummary(action: PublicCampaignDmAction, value: unknown): string {
  const facts = extractResolutionFacts(value);
  const label = actionLabel(action);
  const rollText =
    facts.naturalRoll === null
      ? "The rules engine resolved the roll"
      : facts.total === null
        ? `${label}: natural ${facts.naturalRoll}`
        : `${label}: natural ${facts.naturalRoll}, total ${facts.total} vs DC ${action.dc}`;
  const outcome =
    facts.success === null ? "" : facts.success ? " — success." : " — failure.";
  return `${rollText}${outcome}`;
}

async function generateResolutionNarration(
  env: Bindings,
  campaign: CampaignAccess,
  action: PublicCampaignDmAction,
  value: unknown,
): Promise<string> {
  const summary = authoritativeSummary(action, value);
  try {
    return await generateOpenAICompatibleText(env, {
      system: [
        `You are the Dungeon Master running an ${campaign.rulesetId} ${campaign.rulesetVersion} campaign.`,
        "A player-requested mechanical check has just been resolved by the authoritative rules engine.",
        "Narrate only the consequences supported by the supplied result. Never change or invent another mechanical outcome.",
        "Keep the response immersive and concise, usually one or two paragraphs. Do not include a speaker label or mention being an AI.",
      ].join(" "),
      prompt: [
        `Campaign: ${campaign.name}`,
        `Check reason: ${action.reason}`,
        `Authoritative summary: ${summary}`,
        `Authoritative result JSON: ${JSON.stringify(value).slice(0, 6000)}`,
        "Narrate what happens next and give the player a clear next decision when appropriate.",
      ].join("\n\n"),
      temperature: 0.6,
      maxTokens: 600,
      ...(env.AI && env.AI_GAME_MODEL ? { model: env.AI_GAME_MODEL } : {}),
    });
  } catch (error) {
    console.error("AI DM resolution narration failed", {
      campaignId: campaign.id,
      actionId: action.id,
      error,
    });
    return summary;
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
        console.error("Unable to publish AI DM game event", { ...event, error });
      }),
      enqueueGameEventPostprocess(c.env.BACKGROUND_QUEUE, event).catch((error) => {
        console.error("Unable to enqueue AI DM game event", { ...event, error });
      }),
    ]).then(() => undefined),
  );
}

function translateResolutionError(error: unknown): never {
  if (error instanceof RangeError) throw new ValidationError(error.message);
  if (!(error instanceof Error)) throw error;
  switch (error.message) {
    case "AI_DM_ACTION_NOT_FOUND":
      throw new NotFoundError("The requested Dungeon Master action no longer exists.");
    case "AI_DM_ACTION_NOT_PENDING":
      throw new ConflictError("This Dungeon Master action has already been resolved or is resolving.");
    case "AI_DM_ACTION_SKILL_NOT_ALLOWED":
      throw new ValidationError("That skill can no longer be used for this requested check.");
    case "CAMPAIGN_GAME_NOT_ACTIVE":
      throw new ConflictError("This campaign does not currently have an active game session.");
    case "GAME_ACTOR_OR_SKILL_NOT_FOUND":
    case "GAME_ACTOR_NOT_FOUND":
      throw new NotFoundError("The requested character check is no longer available.");
    case "CAMPAIGN_RULESET_UNSUPPORTED":
      throw new ValidationError("The active campaign ruleset cannot resolve this check.");
    default:
      throw error;
  }
}

export const campaignDmActionRoutes = new Hono<Env>()
  .use("/api/campaigns/:campaignId/play/dm-actions*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/campaigns/:campaignId/play/dm-actions/pending", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = requireDatabase(c.env.DB);
    const campaignId = c.req.param("campaignId");
    await requireCampaignAccess(db, campaignId, session.user.id);
    return c.json({ action: await findPendingDmAction(db, campaignId, session.user.id) });
  })
  .post("/api/campaigns/:campaignId/play/dm-actions/:actionId/resolve", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = requireDatabase(c.env.DB);
    const campaignId = c.req.param("campaignId");
    const campaign = await requireCampaignAccess(db, campaignId, session.user.id);
    if (campaign.status !== "active") {
      throw new ConflictError("Resume the campaign before resolving a Dungeon Master check.");
    }

    const body = await c.req.json().catch(() => null);
    const parsed = resolveSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError("A natural d20 roll from 1 to 20 is required.");

    try {
      const resolved = await resolvePendingDmAction(db, {
        campaignId,
        actionId: c.req.param("actionId"),
        userId: session.user.id,
        roll: parsed.data.roll,
      });
      scheduleIfEvent(c, campaignId, resolved.result.value);

      const narration = await generateResolutionNarration(
        c.env,
        campaign,
        resolved.action,
        resolved.result.value,
      );
      const message = await insertDmMessage(db, campaignId, narration);
      await attachDmResolutionMessage(db, resolved.action.id, message.id);

      return c.json({
        action: resolved.action,
        result: resolved.result,
        dmMessage: publicDmMessage(message),
      });
    } catch (error) {
      translateResolutionError(error);
    }
  });
