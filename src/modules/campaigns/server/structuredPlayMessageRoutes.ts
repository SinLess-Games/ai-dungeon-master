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
import type { CampaignDmActionArguments } from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import type { CampaignRoom } from "@/modules/game/live/CampaignRoom";
import type { GameCommandResult } from "@/modules/game/server/gameCommandService";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from "@/server/middleware/errors";
import {
  createPendingDmAction,
  findPendingDmAction,
  loadDmCharacterContext,
  type PublicCampaignDmAction,
} from "./dmActionService";
import { runStructuredDmTurn } from "./dmTurnOrchestrator";
import { loadRecentDmEvents } from "./dmTurnRuntime";
import type { DmTurnDecision } from "./dmToolPlanner";

interface Bindings extends AuthEnv, OpenAICompatibleEnv {
  DB?: D1Database;
  BACKGROUND_QUEUE?: Queue<BackgroundJob>;
  CAMPAIGN_ROOM?: DurableObjectNamespace<CampaignRoom>;
  AI_GAME_MODEL?: string;
}

type Env = { Bindings: Bindings };
type CampaignRole = "owner" | "gm" | "player" | "observer";
type PlayChannel = "campaign" | "ooc_dm";

interface CampaignAccess {
  id: string;
  name: string;
  description: string | null;
  status: string;
  gameMasterMode: "ai" | "human" | "hybrid";
  rulesetId: string;
  rulesetVersion: string;
  settings: string;
  role: CampaignRole;
}

interface MessageRow {
  id: string;
  campaignId: string;
  channel: PlayChannel;
  authorKind: "player" | "dm" | "system";
  authorUserId: string | null;
  privateUserId: string | null;
  characterId: string | null;
  content: string;
  createdAt: number;
  userName: string | null;
  username: string | null;
  displayUsername: string | null;
  characterName: string | null;
}

const createMessageSchema = z.object({
  channel: z.enum(["campaign", "ooc_dm"]),
  content: z.string().trim().min(1).max(4000),
  characterId: z.string().trim().min(1).max(200).nullable().optional(),
});

function requireDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("Campaign play storage is unavailable.");
  return binding;
}

function parseSettings(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

async function requireCampaignAccess(
  db: D1Database,
  campaignId: string,
  userId: string,
): Promise<CampaignAccess> {
  const campaign = await db
    .prepare(
      `SELECT id, owner_user_id AS ownerUserId, name, description, status,
              game_master_mode AS gameMasterMode, ruleset_id AS rulesetId,
              ruleset_version AS rulesetVersion, settings
       FROM campaigns
       WHERE id = ?
       LIMIT 1`,
    )
    .bind(campaignId)
    .first<{
      id: string;
      ownerUserId: string;
      name: string;
      description: string | null;
      status: string;
      gameMasterMode: "ai" | "human" | "hybrid";
      rulesetId: string;
      rulesetVersion: string;
      settings: string;
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
  return { ...campaign, role };
}

async function validateCharacterControl(
  db: D1Database,
  campaignId: string,
  characterId: string,
  userId: string,
): Promise<void> {
  const controlled = await db
    .prepare(
      `SELECT c.id
       FROM characters c
       LEFT JOIN game_actors a
         ON a.character_id = c.id AND a.campaign_id = c.campaign_id
       WHERE c.id = ? AND c.campaign_id = ?
         AND (c.owner_user_id = ? OR a.controller_user_id = ?)
       LIMIT 1`,
    )
    .bind(characterId, campaignId, userId, userId)
    .first<{ id: string }>();
  if (!controlled) throw new ForbiddenError("You can only speak as a character assigned to you.");
}

async function insertMessage(
  db: D1Database,
  input: {
    campaignId: string;
    channel: PlayChannel;
    authorKind: "player" | "dm" | "system";
    authorUserId: string | null;
    privateUserId: string | null;
    characterId: string | null;
    content: string;
  },
): Promise<string> {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO campaign_play_messages
         (id, campaign_id, channel, author_kind, author_user_id, private_user_id, character_id, content)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.campaignId,
      input.channel,
      input.authorKind,
      input.authorUserId,
      input.privateUserId,
      input.characterId,
      input.content,
    )
    .run();
  return id;
}

async function getMessage(db: D1Database, id: string) {
  const row = await db
    .prepare(
      `SELECT m.id,
              m.campaign_id AS campaignId,
              m.channel,
              m.author_kind AS authorKind,
              m.author_user_id AS authorUserId,
              m.private_user_id AS privateUserId,
              m.character_id AS characterId,
              m.content,
              m.created_at AS createdAt,
              u.name AS userName,
              u.username,
              u.display_username AS displayUsername,
              c.name AS characterName
       FROM campaign_play_messages m
       LEFT JOIN users u ON u.id = m.author_user_id
       LEFT JOIN characters c ON c.id = m.character_id
       WHERE m.id = ?
       LIMIT 1`,
    )
    .bind(id)
    .first<MessageRow>();
  if (!row) throw new Error("CAMPAIGN_PLAY_MESSAGE_MISSING");
  return {
    id: row.id,
    campaignId: row.campaignId,
    channel: row.channel,
    authorKind: row.authorKind,
    authorUserId: row.authorUserId,
    authorName:
      row.authorKind === "dm"
        ? "Dungeon Master"
        : row.authorKind === "system"
          ? "The Endless Codex"
          : row.characterName || row.displayUsername || row.username || row.userName || "Player",
    characterId: row.characterId,
    characterName: row.characterName,
    content: row.content,
    createdAt: row.createdAt,
  };
}

async function basicDmReply(
  env: Bindings,
  db: D1Database,
  campaign: CampaignAccess,
  channel: PlayChannel,
  userId: string,
): Promise<string> {
  const messages = await db
    .prepare(
      `SELECT m.author_kind AS authorKind, m.content,
              COALESCE(c.name, u.display_username, u.username, u.name, 'Player') AS authorName
       FROM campaign_play_messages m
       LEFT JOIN users u ON u.id = m.author_user_id
       LEFT JOIN characters c ON c.id = m.character_id
       WHERE m.campaign_id = ? AND m.channel = ?
         AND ${channel === "campaign" ? "m.private_user_id IS NULL" : "m.private_user_id = ?"}
       ORDER BY m.created_at DESC, m.rowid DESC
       LIMIT 18`,
    )
    .bind(...(channel === "campaign" ? [campaign.id, channel] : [campaign.id, channel, userId]))
    .all<{ authorKind: string; content: string; authorName: string }>();
  const conversation = messages.results
    .reverse()
    .map((message) => `${message.authorKind === "dm" ? "DM" : message.authorName}: ${message.content}`)
    .join("\n");
  const system =
    channel === "ooc_dm"
      ? [
          `You are the private Dungeon Master assistant for an ${campaign.rulesetId} ${campaign.rulesetVersion} campaign.`,
          "Answer rules, table, intent, world, and clarification questions directly.",
          "Never invent a roll or claim authoritative state changed unless the supplied game context records it.",
        ].join(" ")
      : [
          `You are the Dungeon Master running an ${campaign.rulesetId} ${campaign.rulesetVersion} campaign.`,
          campaign.status === "paused"
            ? "The campaign is paused: narrate or answer table talk, but do not imply authoritative mechanics changed."
            : "Narrate the table faithfully without inventing unrecorded mechanical results.",
        ].join(" ");
  return generateOpenAICompatibleText(env, {
    system,
    prompt: [
      `Campaign: ${campaign.name}`,
      `Description: ${campaign.description || "No campaign description provided."}`,
      `Recent events: ${JSON.stringify(await loadRecentDmEvents(db, campaign.id)).slice(0, 7000)}`,
      "Conversation:",
      conversation,
      "Respond to the most recent player message.",
    ].join("\n\n"),
    temperature: channel === "campaign" ? 0.7 : 0.3,
    maxTokens: channel === "campaign" ? 900 : 700,
    ...(env.AI && env.AI_GAME_MODEL ? { model: env.AI_GAME_MODEL } : {}),
  });
}

function pendingArguments(
  decision: Extract<DmTurnDecision, { kind: "check" }>,
  context: Awaited<ReturnType<typeof loadDmCharacterContext>>,
): CampaignDmActionArguments {
  const check = decision.check;
  if (check.type === "check.save") {
    return {
      type: "check.save",
      save: check.save,
      dc: check.dc,
      reason: check.reason,
    };
  }
  const specialization = check.specialization ?? "";
  const skill = context?.skills.find(
    (option) => option.id === check.skillId && option.specialization === specialization,
  );
  if (!skill) throw new Error("AI_DM_REQUESTED_UNAVAILABLE_SKILL");
  return {
    type: "check.skill",
    skillId: skill.id,
    skillName: skill.name,
    ...(skill.specialization ? { specialization: skill.specialization } : {}),
    dc: check.dc,
    reason: check.reason,
  };
}

function scheduleResult(
  c: { env: Bindings; executionCtx: { waitUntil(promise: Promise<unknown>): void } },
  campaignId: string,
  result: GameCommandResult,
): void {
  if (typeof result.value !== "object" || result.value === null) return;
  const value = result.value as { eventId?: unknown; sessionId?: unknown };
  if (typeof value.eventId !== "string" || typeof value.sessionId !== "string") return;
  const event = { campaignId, eventId: value.eventId, sessionId: value.sessionId };
  c.executionCtx.waitUntil(
    Promise.all([
      publishCommittedGameEvent(c.env, event).catch((error) =>
        console.error("Unable to publish AI DM tool event", { ...event, error }),
      ),
      enqueueGameEventPostprocess(c.env.BACKGROUND_QUEUE, event).catch((error) =>
        console.error("Unable to enqueue AI DM tool event", { ...event, error }),
      ),
    ]).then(() => undefined),
  );
}

/** Registered ahead of the legacy message POST handler; GET remains on the existing route. */
export const structuredPlayMessageRoutes = new Hono<Env>().post(
  "/api/campaigns/:campaignId/play/messages",
  async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = requireDatabase(c.env.DB);
    const campaignId = c.req.param("campaignId");
    const campaign = await requireCampaignAccess(db, campaignId, session.user.id);
    if (campaign.role === "observer") {
      throw new ForbiddenError("Observers cannot send campaign play messages.");
    }

    const body = await c.req.json().catch(() => null);
    const parsed = createMessageSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError("Campaign play message is invalid.");
    const input = parsed.data;
    if (input.channel === "ooc_dm" && input.characterId) {
      throw new ValidationError("Private OOC DM messages are sent as the player, not as a character.");
    }
    if (input.characterId) {
      await validateCharacterControl(db, campaignId, input.characterId, session.user.id);
    }

    const aiManaged = campaign.gameMasterMode === "ai" || campaign.gameMasterMode === "hybrid";
    if (aiManaged && input.channel === "campaign") {
      const pending = await findPendingDmAction(db, campaignId, session.user.id);
      if (pending) {
        throw new ConflictError(
          "Resolve the Dungeon Master's outstanding check before taking another in-character action.",
        );
      }
    }

    const playerId = await insertMessage(db, {
      campaignId,
      channel: input.channel,
      authorKind: "player",
      authorUserId: session.user.id,
      privateUserId: input.channel === "ooc_dm" ? session.user.id : null,
      characterId: input.channel === "campaign" ? (input.characterId ?? null) : null,
      content: input.content,
    });
    const playerMessage = await getMessage(db, playerId);

    let dmMessage: Awaited<ReturnType<typeof getMessage>> | null = null;
    let pendingAction: PublicCampaignDmAction | null = null;
    let aiError: string | null = null;
    if (aiManaged) {
      try {
        let reply: string;
        let decision: Extract<DmTurnDecision, { kind: "narration" | "check" }> | null = null;
        if (
          input.channel === "campaign" &&
          input.characterId &&
          campaign.status === "active"
        ) {
          const structured = await runStructuredDmTurn({
            env: c.env,
            binding: db,
            campaign: {
              id: campaign.id,
              name: campaign.name,
              description: campaign.description,
              rulesetId: campaign.rulesetId,
              rulesetVersion: campaign.rulesetVersion,
              settings: parseSettings(campaign.settings),
            },
            userId: session.user.id,
            characterId: input.characterId,
            playerAction: input.content,
            onCommittedResult: (result) => scheduleResult(c, campaignId, result),
          });
          if (structured) {
            decision = structured.decision;
            reply = decision.kind === "check" ? decision.preface : decision.text;
          } else {
            reply = await basicDmReply(c.env, db, campaign, input.channel, session.user.id);
          }
        } else {
          reply = await basicDmReply(c.env, db, campaign, input.channel, session.user.id);
        }

        const dmId = await insertMessage(db, {
          campaignId,
          channel: input.channel,
          authorKind: "dm",
          authorUserId: null,
          privateUserId: input.channel === "ooc_dm" ? session.user.id : null,
          characterId: null,
          content: reply,
        });
        dmMessage = await getMessage(db, dmId);

        if (decision?.kind === "check" && input.characterId) {
          const context = await loadDmCharacterContext(
            db,
            campaignId,
            input.characterId,
            session.user.id,
          );
          if (!context) throw new Error("AI_DM_CHARACTER_CONTEXT_LOST");
          pendingAction = await createPendingDmAction(db, {
            campaignId,
            requestedByMessageId: playerId,
            requestMessageId: dmId,
            requestedUserId: session.user.id,
            characterId: input.characterId,
            actorId: context.character.actorId,
            arguments: pendingArguments(decision, context),
          });
        }
      } catch (error) {
        console.error("Structured campaign AI DM response failed", {
          campaignId,
          channel: input.channel,
          userId: session.user.id,
          error,
        });
        aiError = "The Dungeon Master response is temporarily unavailable. Your message was saved.";
      }
    }

    return c.json(
      {
        message: playerMessage,
        dmMessage,
        pendingAction,
        aiError,
        awaitingHumanDm: campaign.gameMasterMode === "human",
      },
      201,
    );
  },
);
