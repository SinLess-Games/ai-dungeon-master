/// <reference types="@cloudflare/workers-types" />

import { respondWithDmStream } from "./dmResponseStream";
import { streamDmNarration } from "./dmNarrationStream";
import { Hono } from "hono";
import { z } from "zod";
import type { OpenAICompatibleEnv } from "@/infrastructure/ai/openaiCompatible";
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
  attachDmResolutionMessage,
  createPendingDmAction,
  findPendingDmAction,
  loadDmCharacterContext,
  resolvePendingDmAction,
  type PublicCampaignDmAction,
} from "./dmActionService";
import {
  runStructuredDmTurn,
  type PendingInitiativeRequest,
} from "./dmTurnOrchestrator";
import { loadDmPlayerMessage } from "./dmTurnRuntime";
import type { DmTurnDecision } from "./dmToolPlanner";

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
  description: string | null;
  status: string;
  rulesetId: string;
  rulesetVersion: string;
  settings: string;
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

interface DmActionOriginRow {
  requestedByMessageId: string;
  characterId: string;
}

const resolveSchema = z.object({ roll: z.number().int().min(1).max(20) });

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
      `SELECT id,
              owner_user_id AS ownerUserId,
              name,
              description,
              status,
              ruleset_id AS rulesetId,
              ruleset_version AS rulesetVersion,
              settings
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
  if (action.kind === "check.initiative") return "Initiative";
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

function authoritativeSummary(action: PublicCampaignDmAction, value: unknown): string {
  if (action.kind === "check.initiative") return "Initiative resolved. Combat begins.";
  if (!value || typeof value !== "object") return `${actionLabel(action)} resolved.`;
  const record = value as Record<string, unknown>;
  const raw = record["check"] ?? record["result"];
  if (!raw || typeof raw !== "object") return `${actionLabel(action)} resolved.`;
  const check = raw as Record<string, unknown>;
  const natural = typeof check["naturalRoll"] === "number" ? check["naturalRoll"] : null;
  const total = typeof check["total"] === "number" ? check["total"] : null;
  const success =
    typeof check["success"] === "boolean"
      ? check["success"]
      : typeof check["passed"] === "boolean"
        ? check["passed"]
        : null;
  const roll =
    natural === null
      ? `${actionLabel(action)} resolved`
      : total === null
        ? `${actionLabel(action)}: natural ${natural}`
        : `${actionLabel(action)}: natural ${natural}, total ${total} vs DC ${action.dc}`;
  return `${roll}${success === null ? "." : success ? " — success." : " — failure."}`;
}

async function loadActionOrigin(
  db: D1Database,
  campaignId: string,
  actionId: string,
  userId: string,
): Promise<DmActionOriginRow> {
  const row = await db
    .prepare(
      `SELECT requested_by_message_id AS requestedByMessageId,
              character_id AS characterId
       FROM campaign_dm_actions
       WHERE id = ? AND campaign_id = ? AND requested_user_id = ?
       LIMIT 1`,
    )
    .bind(actionId, campaignId, userId)
    .first<DmActionOriginRow>();
  if (!row) throw new NotFoundError("The requested Dungeon Master action no longer exists.");
  return row;
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

function scheduleResult(
  c: { env: Bindings; executionCtx: { waitUntil(promise: Promise<unknown>): void } },
  campaignId: string,
  result: GameCommandResult,
): void {
  scheduleIfEvent(c, campaignId, result.value);
}

function translateResolutionError(error: unknown): never {
  if (error instanceof RangeError) throw new ValidationError(error.message);
  if (!(error instanceof Error)) throw error;
  switch (error.message) {
    case "AI_DM_ACTION_NOT_FOUND":
      throw new NotFoundError("The requested Dungeon Master action no longer exists.");
    case "AI_DM_ACTION_NOT_PENDING":
      throw new ConflictError(
        "This Dungeon Master action has already been resolved or is resolving.",
      );
    case "AI_DM_ACTION_SKILL_NOT_ALLOWED":
      throw new ValidationError("That skill can no longer be used for this requested check.");
    case "CAMPAIGN_GAME_NOT_ACTIVE":
      throw new ConflictError("This campaign does not currently have an active game session.");
    case "ENCOUNTER_ALREADY_ACTIVE":
      throw new ConflictError("Combat has already started; this initiative request is no longer pending.");
    case "ENCOUNTER_PARTICIPANT_INVALID":
      throw new ValidationError("The encounter participants changed before initiative was resolved.");
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
      const actionId = c.req.param("actionId");
      const origin = await loadActionOrigin(db, campaignId, actionId, session.user.id);
      const playerMessage = await loadDmPlayerMessage(db, origin.requestedByMessageId);
      const resolved = await resolvePendingDmAction(db, {
        campaignId,
        actionId,
        userId: session.user.id,
        roll: parsed.data.roll,
      });
      scheduleIfEvent(c, campaignId, resolved.result.value);

      return respondWithDmStream(c, async (stream) => {
        await stream?.saved();
        let content = authoritativeSummary(resolved.action, resolved.result.value);
        let finalDecision: Extract<DmTurnDecision, { kind: "narration" | "check" }> | null = null;
        let pendingInitiative: PendingInitiativeRequest | null = null;
        let nextPendingAction: PublicCampaignDmAction | null = null;
        let structuredError: string | null = null;

        if (playerMessage && playerMessage.authorUserId === session.user.id) {
          try {
            const campaignDescriptor: Parameters<typeof runStructuredDmTurn>[0]["campaign"] = {
              id: campaign.id,
              name: campaign.name,
              description: campaign.description,
              rulesetId: campaign.rulesetId,
              rulesetVersion: campaign.rulesetVersion,
              settings: parseSettings(campaign.settings),
            };
            const turn = await runStructuredDmTurn({
              env: c.env,
              binding: db,
              campaign: campaignDescriptor,
              userId: session.user.id,
              characterId: origin.characterId,
              playerMessageId: origin.requestedByMessageId,
              playerAction: playerMessage.content,
              seedAuthoritativeResults: [resolved.result.value],
              ...(stream ? { signal: stream.signal } : {}),
              onCommittedResult: (result) => scheduleResult(c, campaignId, result),
            });
            if (turn) {
              finalDecision = turn.decision;
              pendingInitiative = turn.pendingInitiative;
              content = turn.decision.kind === "check" ? turn.decision.preface : turn.decision.text;
              if (stream && turn.decision.kind === "narration") {
                content = await streamDmNarration(c.env, content, stream);
              }
            }
          } catch (error) {
            stream?.signal.throwIfAborted();
            await stream?.reset();
            content = authoritativeSummary(resolved.action, resolved.result.value);
            finalDecision = null;
            pendingInitiative = null;
            console.error("AI DM post-check tool loop failed", {
              campaignId,
              actionId,
              userId: session.user.id,
              error,
            });
            structuredError =
              "The check was resolved, but the Dungeon Master could not continue the structured turn. The authoritative result was preserved.";
          }
        }

        stream?.signal.throwIfAborted();
        const message = await insertDmMessage(db, campaignId, content);
        await attachDmResolutionMessage(db, resolved.action.id, message.id);

        if (pendingInitiative || finalDecision?.kind === "check") {
          try {
            const context = await loadDmCharacterContext(
              db,
              campaignId,
              origin.characterId,
              session.user.id,
            );
            if (!context) throw new Error("AI_DM_CHARACTER_CONTEXT_LOST");

            let nextArguments: CampaignDmActionArguments;
            if (pendingInitiative) {
              nextArguments = {
                type: "check.initiative",
                participantIds: [...pendingInitiative.participantIds],
                reason: pendingInitiative.reason,
              };
            } else if (finalDecision?.kind === "check") {
              nextArguments = pendingArguments(finalDecision, context);
            } else {
              throw new Error("AI_DM_FOLLOWUP_ACTION_MISSING");
            }

            nextPendingAction = await createPendingDmAction(db, {
              campaignId,
              requestedByMessageId: origin.requestedByMessageId,
              requestMessageId: message.id,
              requestedUserId: session.user.id,
              characterId: origin.characterId,
              actorId: context.character.actorId,
              arguments: nextArguments,
            });
          } catch (error) {
            console.error("Unable to persist chained AI DM check", {
              campaignId,
              actionId,
              userId: session.user.id,
              error,
            });
            structuredError =
              structuredError ??
              "The previous check was resolved, but the next requested check could not be persisted.";
          }
        }

        return {
          action: resolved.action,
          result: resolved.result,
          dmMessage: publicDmMessage(message),
          pendingAction: nextPendingAction,
          aiError: structuredError,
        };
      });
    } catch (error) {
      translateResolutionError(error);
    }
  });
