/// <reference types="@cloudflare/workers-types" />

import { legacyDmReplyUserPrompt } from "@/prompts/legacyDmReplyUser";
import { dmSystemPrompt } from "@/prompts/legacyDmReplySystem";
import { Hono } from "hono";
import { z } from "zod";
import {
  generateOpenAICompatibleText,
  type OpenAICompatibleEnv,
} from "@/infrastructure/ai/openaiCompatible";
import type { CampaignDmActionArguments } from "@/infrastructure/database/schema";
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
  createPendingDmAction,
  findPendingDmAction,
  loadDmCharacterContext,
  type DmCharacterContext,
  type PublicCampaignDmAction,
} from "./dmActionService";
import { planDmTurn, type DmTurnDecision, type LegacyDmTurnDecision } from "./dmToolPlanner";

type CampaignRole = "owner" | "gm" | "player" | "observer";
type PlayChannel = "campaign" | "ooc_dm";
type AuthorKind = "player" | "dm" | "system";

interface Bindings extends AuthEnv, OpenAICompatibleEnv {
  DB?: D1Database;
  AI_GAME_MODEL?: string;
}

type Env = { Bindings: Bindings };

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
  authorKind: AuthorKind;
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

interface RecentEventRow {
  eventType: string;
  occurredAt: number;
  payload: string;
}

const channelSchema = z.enum(["campaign", "ooc_dm"]);
const createMessageSchema = z.object({
  channel: channelSchema,
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

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return {};
  }
}

function publicMessage(row: MessageRow) {
  const authorName =
    row.authorKind === "dm"
      ? "Dungeon Master"
      : row.authorKind === "system"
        ? "The Endless Codex"
        : row.characterName || row.displayUsername || row.username || row.userName || "Player";
  return {
    id: row.id,
    campaignId: row.campaignId,
    channel: row.channel,
    authorKind: row.authorKind,
    authorUserId: row.authorUserId,
    authorName,
    characterId: row.characterId,
    characterName: row.characterName,
    content: row.content,
    createdAt: row.createdAt,
  };
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

  return {
    id: campaign.id,
    name: campaign.name,
    description: campaign.description,
    status: campaign.status,
    gameMasterMode: campaign.gameMasterMode,
    rulesetId: campaign.rulesetId,
    rulesetVersion: campaign.rulesetVersion,
    settings: campaign.settings,
    role,
  };
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
         ON a.character_id = c.id
        AND a.campaign_id = c.campaign_id
       WHERE c.id = ?
         AND c.campaign_id = ?
         AND (c.owner_user_id = ? OR a.controller_user_id = ?)
       LIMIT 1`,
    )
    .bind(characterId, campaignId, userId, userId)
    .first<{ id: string }>();
  if (!controlled) {
    throw new ForbiddenError("You can only speak as a character assigned to you.");
  }
}

async function readMessages(
  db: D1Database,
  campaignId: string,
  channel: PlayChannel,
  userId: string,
  limit: number,
) {
  const privacyClause =
    channel === "campaign" ? "m.private_user_id IS NULL" : "m.private_user_id = ?";
  const statement = db.prepare(
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
     WHERE m.campaign_id = ?
       AND m.channel = ?
       AND ${privacyClause}
     ORDER BY m.created_at DESC, m.rowid DESC
     LIMIT ?`,
  );
  const result =
    channel === "campaign"
      ? await statement.bind(campaignId, channel, limit).all<MessageRow>()
      : await statement.bind(campaignId, channel, userId, limit).all<MessageRow>();
  return result.results.reverse().map(publicMessage);
}

async function insertMessage(
  db: D1Database,
  input: {
    campaignId: string;
    channel: PlayChannel;
    authorKind: AuthorKind;
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
  return publicMessage(row);
}

async function recentAuthoritativeEvents(db: D1Database, campaignId: string) {
  const result = await db
    .prepare(
      `SELECT event_type AS eventType, occurred_at AS occurredAt, payload
       FROM game_events
       WHERE campaign_id = ?
       ORDER BY sequence DESC
       LIMIT 12`,
    )
    .bind(campaignId)
    .all<RecentEventRow>();
  return result.results.reverse().map((event) => ({
    type: event.eventType,
    occurredAt: event.occurredAt,
    payload: safeJson(event.payload),
  }));
}

async function liveActors(db: D1Database, campaignId: string) {
  const result = await db
    .prepare(
      `SELECT id,
              character_id AS characterId,
              name,
              kind,
              status
       FROM game_actors
       WHERE campaign_id = ? AND status IN ('active', 'defeated')
       ORDER BY created_at ASC, id ASC
       LIMIT 40`,
    )
    .bind(campaignId)
    .all<{
      id: string;
      characterId: string | null;
      name: string;
      kind: string;
      status: string;
    }>();
  return result.results;
}

function conversationText(messages: Awaited<ReturnType<typeof readMessages>>): string {
  return messages
    .map(
      (message) => `${message.authorKind === "dm" ? "DM" : message.authorName}: ${message.content}`,
    )
    .join("\n");
}

async function generateDmReply(
  env: Bindings,
  db: D1Database,
  campaign: CampaignAccess,
  channel: PlayChannel,
  userId: string,
): Promise<string> {
  const [messages, events, actors] = await Promise.all([
    readMessages(db, campaign.id, channel, userId, 18),
    recentAuthoritativeEvents(db, campaign.id),
    liveActors(db, campaign.id),
  ]);
  const settings = parseSettings(campaign.settings);
  const conversation = conversationText(messages);

  const prompt = legacyDmReplyUserPrompt(campaign, settings, actors, events, conversation);

  return generateOpenAICompatibleText(env, {
    system: dmSystemPrompt(channel, campaign.rulesetId, campaign.rulesetVersion),
    prompt,
    temperature: channel === "campaign" ? 0.75 : 0.35,
    maxTokens: channel === "campaign" ? 900 : 700,
    ...(env.AI && env.AI_GAME_MODEL ? { model: env.AI_GAME_MODEL } : {}),
  });
}

async function planCampaignDmTurn(
  env: Bindings,
  db: D1Database,
  campaign: CampaignAccess,
  userId: string,
  context: DmCharacterContext,
): Promise<LegacyDmTurnDecision> {
  const [messages, events, actors] = await Promise.all([
    readMessages(db, campaign.id, "campaign", userId, 18),
    recentAuthoritativeEvents(db, campaign.id),
    liveActors(db, campaign.id),
  ]);

  return planDmTurn(env, {
    campaignName: campaign.name,
    campaignDescription: campaign.description,
    rulesetId: campaign.rulesetId,
    rulesetVersion: campaign.rulesetVersion,
    settings: parseSettings(campaign.settings),
    actors,
    recentEvents: events,
    conversation: conversationText(messages),
    character: context.character,
    skills: context.skills,
  });
}

function actionArguments(
  decision: Extract<DmTurnDecision, { kind: "check" }>,
  context: DmCharacterContext,
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
  const skill = context.skills.find(
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

export const campaignPlayMessageRoutes = new Hono<Env>()
  .use("/api/campaigns/:campaignId/play/messages*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/campaigns/:campaignId/play/messages", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = requireDatabase(c.env.DB);
    const campaignId = c.req.param("campaignId");
    await requireCampaignAccess(db, campaignId, session.user.id);

    const parsed = z
      .object({
        channel: channelSchema.default("campaign"),
        limit: z.coerce.number().int().min(1).max(100).default(60),
      })
      .safeParse(c.req.query());
    if (!parsed.success) throw new ValidationError("Invalid campaign play message query.");

    return c.json({
      items: await readMessages(
        db,
        campaignId,
        parsed.data.channel,
        session.user.id,
        parsed.data.limit,
      ),
    });
  })
  .post("/api/campaigns/:campaignId/play/messages", async (c) => {
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
      throw new ValidationError(
        "Private OOC DM messages are sent as the player, not as a character.",
      );
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
        let checkDecision: Extract<DmTurnDecision, { kind: "check" }> | null = null;
        let characterContext: DmCharacterContext | null = null;

        if (input.channel === "campaign" && input.characterId) {
          characterContext = await loadDmCharacterContext(
            db,
            campaignId,
            input.characterId,
            session.user.id,
          );
          if (characterContext) {
            const decision = await planCampaignDmTurn(
              c.env,
              db,
              campaign,
              session.user.id,
              characterContext,
            );
            if (decision.kind === "check") {
              checkDecision = decision;
              reply = decision.preface;
            } else {
              reply = decision.text;
            }
          } else {
            reply = await generateDmReply(c.env, db, campaign, input.channel, session.user.id);
          }
        } else {
          reply = await generateDmReply(c.env, db, campaign, input.channel, session.user.id);
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

        if (checkDecision && characterContext && input.characterId) {
          pendingAction = await createPendingDmAction(db, {
            campaignId,
            requestedByMessageId: playerId,
            requestMessageId: dmId,
            requestedUserId: session.user.id,
            characterId: input.characterId,
            actorId: characterContext.character.actorId,
            arguments: actionArguments(checkDecision, characterContext),
          });
        }
      } catch (error) {
        console.error("Campaign AI DM response failed", {
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
  });
