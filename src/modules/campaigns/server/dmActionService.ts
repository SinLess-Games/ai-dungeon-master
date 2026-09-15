/// <reference types="@cloudflare/workers-types" />

import { createDatabase } from "@/infrastructure/database/client";
import type { CampaignDmActionArguments } from "@/infrastructure/database/schema";
import {
  executeGameCommand,
  type GameCommand,
  type GameCommandResult,
} from "@/modules/game/server/gameCommandService";
import { loadCampaignPlaySchemaReadiness } from "./campaignPlaySchemaReadiness";
import type { DmPlannerSkillOption } from "./dmToolPlanner";

interface DmActionRow {
  id: string;
  campaignId: string;
  requestedByMessageId: string;
  requestMessageId: string | null;
  resolutionMessageId: string | null;
  requestedUserId: string;
  characterId: string;
  actorId: string;
  kind: "check.skill" | "check.save";
  arguments: string;
  status: "pending" | "resolving" | "resolved" | "failed" | "cancelled";
  result: string | null;
  error: string | null;
  createdAt: number;
  resolvedAt: number | null;
}

interface SkillRow {
  id: string;
  slug: string;
  name: string;
  ability: string | null;
  specialization: string | null;
  ranks: number;
  trainedOnly: number;
}

interface UntrainedSkillRow {
  id: string;
  slug: string;
  name: string;
  ability: string | null;
  trainedOnly: number;
}

export interface DmCharacterContext {
  character: { id: string; name: string; actorId: string };
  skills: DmPlannerSkillOption[];
}

export interface PublicCampaignDmAction {
  id: string;
  campaignId: string;
  characterId: string;
  actorId: string;
  kind: "check.skill" | "check.save";
  status: "pending" | "resolving" | "resolved" | "failed" | "cancelled";
  dc: number;
  reason: string;
  skill: { id: string; name: string; specialization: string } | null;
  save: "fort" | "ref" | "will" | null;
  error: string | null;
  createdAt: number;
  resolvedAt: number | null;
}

function parseArguments(value: string): CampaignDmActionArguments {
  const parsed = JSON.parse(value) as CampaignDmActionArguments;
  if (!parsed || typeof parsed !== "object") throw new Error("AI_DM_ACTION_ARGUMENTS_INVALID");
  if (parsed.type !== "check.skill" && parsed.type !== "check.save") {
    throw new Error("AI_DM_ACTION_ARGUMENTS_INVALID");
  }
  return parsed;
}

function publicAction(row: DmActionRow): PublicCampaignDmAction {
  const args = parseArguments(row.arguments);
  return {
    id: row.id,
    campaignId: row.campaignId,
    characterId: row.characterId,
    actorId: row.actorId,
    kind: row.kind,
    status: row.status,
    dc: args.dc,
    reason: args.reason,
    skill:
      args.type === "check.skill"
        ? {
            id: args.skillId,
            name: args.skillName?.trim() || args.skillId,
            specialization: args.specialization ?? "",
          }
        : null,
    save: args.type === "check.save" ? args.save : null,
    error: row.error,
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
  };
}

async function readAction(
  binding: D1Database,
  campaignId: string,
  actionId: string,
  userId: string,
): Promise<DmActionRow | null> {
  return binding
    .prepare(
      `SELECT id,
              campaign_id AS campaignId,
              requested_by_message_id AS requestedByMessageId,
              request_message_id AS requestMessageId,
              resolution_message_id AS resolutionMessageId,
              requested_user_id AS requestedUserId,
              character_id AS characterId,
              actor_id AS actorId,
              kind,
              arguments,
              status,
              result,
              error,
              created_at AS createdAt,
              resolved_at AS resolvedAt
       FROM campaign_dm_actions
       WHERE id = ? AND campaign_id = ? AND requested_user_id = ?
       LIMIT 1`,
    )
    .bind(actionId, campaignId, userId)
    .first<DmActionRow>();
}

export async function findPendingDmAction(
  binding: D1Database,
  campaignId: string,
  userId: string,
): Promise<PublicCampaignDmAction | null> {
  const readiness = await loadCampaignPlaySchemaReadiness(binding);
  if (!readiness.dmActions) return null;

  const row = await binding
    .prepare(
      `SELECT id,
              campaign_id AS campaignId,
              requested_by_message_id AS requestedByMessageId,
              request_message_id AS requestMessageId,
              resolution_message_id AS resolutionMessageId,
              requested_user_id AS requestedUserId,
              character_id AS characterId,
              actor_id AS actorId,
              kind,
              arguments,
              status,
              result,
              error,
              created_at AS createdAt,
              resolved_at AS resolvedAt
       FROM campaign_dm_actions
       WHERE campaign_id = ?
         AND requested_user_id = ?
         AND status IN ('pending', 'resolving')
       ORDER BY created_at DESC, rowid DESC
       LIMIT 1`,
    )
    .bind(campaignId, userId)
    .first<DmActionRow>();

  return row ? publicAction(row) : null;
}

export async function loadDmCharacterContext(
  binding: D1Database,
  campaignId: string,
  characterId: string,
  userId: string,
): Promise<DmCharacterContext | null> {
  const actor = await binding
    .prepare(
      `SELECT a.id AS actorId, c.id AS characterId, c.name AS characterName
       FROM game_actors a
       JOIN characters c ON c.id = a.character_id
       WHERE a.campaign_id = ?
         AND a.character_id = ?
         AND a.kind = 'character'
         AND a.status = 'active'
       LIMIT 1`,
    )
    .bind(campaignId, characterId)
    .first<{ actorId: string; characterId: string; characterName: string }>();
  if (!actor) return null;

  const [trainedResult, untrainedResult] = await Promise.all([
    binding
      .prepare(
        `SELECT s.id,
                s.slug,
                s.name,
                s.ability,
                cs.specialization,
                cs.ranks,
                s.trained_only AS trainedOnly
         FROM dnd35_character_skills cs
         JOIN dnd35_skills s ON s.id = cs.skill_id
         WHERE cs.character_id = ?
           AND s.is_enabled = 1
           AND (s.owner_user_id IS NULL OR s.owner_user_id = ?)
         ORDER BY s.name, cs.specialization`,
      )
      .bind(characterId, userId)
      .all<SkillRow>(),
    binding
      .prepare(
        `SELECT s.id,
                s.slug,
                s.name,
                s.ability,
                s.trained_only AS trainedOnly
         FROM dnd35_skills s
         WHERE s.is_enabled = 1
           AND s.trained_only = 0
           AND s.requires_specialization = 0
           AND (s.owner_user_id IS NULL OR s.owner_user_id = ?)
         ORDER BY s.name`,
      )
      .bind(userId)
      .all<UntrainedSkillRow>(),
  ]);

  const skills = new Map<string, DmPlannerSkillOption>();
  for (const skill of untrainedResult.results) {
    if (skill.slug === "speak-language") continue;
    skills.set(`${skill.id}\u0000`, {
      id: skill.id,
      name: skill.name,
      ability: skill.ability,
      specialization: "",
      ranks: 0,
      trainedOnly: false,
    });
  }
  for (const skill of trainedResult.results) {
    if (skill.slug === "speak-language") continue;
    if (Boolean(skill.trainedOnly) && skill.ranks <= 0) continue;
    const specialization = skill.specialization ?? "";
    skills.set(`${skill.id}\u0000${specialization.toLocaleLowerCase()}`, {
      id: skill.id,
      name: skill.name,
      ability: skill.ability,
      specialization,
      ranks: skill.ranks,
      trainedOnly: Boolean(skill.trainedOnly),
    });
  }

  return {
    character: {
      id: actor.characterId,
      name: actor.characterName,
      actorId: actor.actorId,
    },
    skills: [...skills.values()].sort((a, b) =>
      `${a.name}\u0000${a.specialization}`.localeCompare(`${b.name}\u0000${b.specialization}`),
    ),
  };
}

export async function createPendingDmAction(
  binding: D1Database,
  input: {
    campaignId: string;
    requestedByMessageId: string;
    requestMessageId: string | null;
    requestedUserId: string;
    characterId: string;
    actorId: string;
    arguments: CampaignDmActionArguments;
  },
): Promise<PublicCampaignDmAction> {
  const id = crypto.randomUUID();
  await binding
    .prepare(
      `INSERT INTO campaign_dm_actions
         (id, campaign_id, requested_by_message_id, request_message_id, requested_user_id,
          character_id, actor_id, kind, arguments, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    )
    .bind(
      id,
      input.campaignId,
      input.requestedByMessageId,
      input.requestMessageId,
      input.requestedUserId,
      input.characterId,
      input.actorId,
      input.arguments.type,
      JSON.stringify(input.arguments),
    )
    .run();

  const row = await readAction(binding, input.campaignId, id, input.requestedUserId);
  if (!row) throw new Error("AI_DM_ACTION_CREATE_FAILED");
  return publicAction(row);
}

function commandForAction(
  row: DmActionRow,
  args: CampaignDmActionArguments,
  roll: number,
): GameCommand {
  if (args.type === "check.skill") {
    return {
      type: "check.skill",
      actorId: row.actorId,
      skillId: args.skillId,
      dc: args.dc,
      roll,
      ...(args.specialization ? { specialization: args.specialization } : {}),
    };
  }
  return {
    type: "check.save",
    actorId: row.actorId,
    save: args.save,
    dc: args.dc,
    roll,
  };
}

function isTerminalResolutionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return new Set([
    "AI_DM_ACTION_ARGUMENTS_INVALID",
    "AI_DM_ACTION_SKILL_NOT_ALLOWED",
    "CAMPAIGN_GAME_NOT_ACTIVE",
    "CAMPAIGN_RULESET_UNSUPPORTED",
    "GAME_ACTOR_NOT_FOUND",
    "GAME_ACTOR_OR_SKILL_NOT_FOUND",
  ]).has(error.message);
}

function resultIsDisallowed(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const allowed = (value as Record<string, unknown>)["allowed"];
  return allowed === false;
}

export async function resolvePendingDmAction(
  binding: D1Database,
  input: {
    campaignId: string;
    actionId: string;
    userId: string;
    roll: number;
  },
): Promise<{ action: PublicCampaignDmAction; result: GameCommandResult }> {
  if (!Number.isSafeInteger(input.roll) || input.roll < 1 || input.roll > 20) {
    throw new RangeError("A natural d20 roll must be an integer from 1 to 20.");
  }

  const row = await readAction(binding, input.campaignId, input.actionId, input.userId);
  if (!row) throw new Error("AI_DM_ACTION_NOT_FOUND");
  if (row.status !== "pending") throw new Error("AI_DM_ACTION_NOT_PENDING");

  const claim = await binding
    .prepare(
      `UPDATE campaign_dm_actions
       SET status = 'resolving', error = NULL
       WHERE id = ? AND campaign_id = ? AND requested_user_id = ? AND status = 'pending'`,
    )
    .bind(input.actionId, input.campaignId, input.userId)
    .run();
  if ((claim.meta.changes ?? 0) !== 1) throw new Error("AI_DM_ACTION_NOT_PENDING");

  const args = parseArguments(row.arguments);
  try {
    const result = await executeGameCommand(
      { db: createDatabase(binding), binding },
      input.campaignId,
      commandForAction(row, args, input.roll),
    );
    if (resultIsDisallowed(result.value)) {
      throw new Error("AI_DM_ACTION_SKILL_NOT_ALLOWED");
    }

    await binding
      .prepare(
        `UPDATE campaign_dm_actions
         SET status = 'resolved', result = ?, error = NULL, resolved_at = unixepoch()
         WHERE id = ? AND status = 'resolving'`,
      )
      .bind(JSON.stringify(result), input.actionId)
      .run();

    const updated = await readAction(binding, input.campaignId, input.actionId, input.userId);
    if (!updated) throw new Error("AI_DM_ACTION_NOT_FOUND");
    return { action: publicAction(updated), result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI DM action resolution failed.";
    const terminal = isTerminalResolutionError(error);
    await binding
      .prepare(
        terminal
          ? `UPDATE campaign_dm_actions
             SET status = 'failed', error = ?, resolved_at = unixepoch()
             WHERE id = ? AND status = 'resolving'`
          : `UPDATE campaign_dm_actions
             SET status = 'pending', error = ?
             WHERE id = ? AND status = 'resolving'`,
      )
      .bind(message.slice(0, 1000), input.actionId)
      .run();
    throw error;
  }
}

export async function attachDmResolutionMessage(
  binding: D1Database,
  actionId: string,
  messageId: string,
): Promise<void> {
  await binding
    .prepare(
      `UPDATE campaign_dm_actions
       SET resolution_message_id = ?
       WHERE id = ? AND status = 'resolved'`,
    )
    .bind(messageId, actionId)
    .run();
}
