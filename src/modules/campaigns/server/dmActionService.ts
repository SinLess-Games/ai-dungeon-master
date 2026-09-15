/// <reference types="@cloudflare/workers-types" />

import { createDatabase } from "@/infrastructure/database/client";
import type { CampaignDmActionArguments } from "@/infrastructure/database/schema";
import {
  executeGameCommand,
  type GameCommand,
  type GameCommandResult,
} from "@/modules/game/server/gameCommandService";
import { startActorEncounter } from "@/modules/game/server/actorEncounterService";
import { getActiveEncounter } from "@/modules/game/server/encounterService";
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
  kind: "check.skill" | "check.save" | "check.initiative";
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

interface ControlledInitiativeActor {
  actorId: string;
  characterId: string;
  controllerUserId: string;
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
  kind: "check.skill" | "check.save" | "check.initiative";
  status: "pending" | "resolving" | "resolved" | "failed" | "cancelled";
  dc: number | null;
  reason: string;
  skill: { id: string; name: string; specialization: string } | null;
  save: "fort" | "ref" | "will" | null;
  error: string | null;
  createdAt: number;
  resolvedAt: number | null;
}

export interface InitiativeSubmissionResult {
  type: "check.initiative";
  value: {
    actorId: string;
    naturalRoll: number;
    awaitingOthers: true;
  };
}

export type DmActionResolutionResult = GameCommandResult | InitiativeSubmissionResult;

function parseArguments(value: string): CampaignDmActionArguments {
  const parsed = JSON.parse(value) as CampaignDmActionArguments;
  if (!parsed || typeof parsed !== "object") throw new Error("AI_DM_ACTION_ARGUMENTS_INVALID");
  if (
    parsed.type !== "check.skill" &&
    parsed.type !== "check.save" &&
    parsed.type !== "check.initiative"
  ) {
    throw new Error("AI_DM_ACTION_ARGUMENTS_INVALID");
  }
  if (
    parsed.type === "check.initiative" &&
    (!Array.isArray(parsed.participantIds) ||
      parsed.participantIds.length === 0 ||
      parsed.participantIds.some((id) => typeof id !== "string" || id.trim().length === 0))
  ) {
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
    kind: args.type,
    status: row.status,
    dc: args.type === "check.initiative" ? null : args.dc,
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

async function readInitiativeGroup(
  binding: D1Database,
  campaignId: string,
  requestMessageId: string,
): Promise<DmActionRow[]> {
  const result = await binding
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
         AND request_message_id = ?
         AND kind = 'check.initiative'
       ORDER BY created_at, rowid`,
    )
    .bind(campaignId, requestMessageId)
    .all<DmActionRow>();
  return result.results;
}

function normalizeParticipantIds(participantIds: readonly string[]): string[] {
  const normalized = participantIds.map((id) => id.trim());
  if (
    normalized.length === 0 ||
    normalized.some((id) => id.length === 0) ||
    new Set(normalized).size !== normalized.length
  ) {
    throw new Error("AI_DM_ACTION_ARGUMENTS_INVALID");
  }
  return normalized;
}

async function loadControlledInitiativeActors(
  binding: D1Database,
  campaignId: string,
  participantIds: readonly string[],
): Promise<ControlledInitiativeActor[]> {
  const normalized = normalizeParticipantIds(participantIds);
  const placeholders = normalized.map(() => "?").join(", ");
  const result = await binding
    .prepare(
      `SELECT id AS actorId,
              character_id AS characterId,
              controller_user_id AS controllerUserId
       FROM game_actors
       WHERE campaign_id = ?
         AND id IN (${placeholders})
         AND kind = 'character'
         AND status = 'active'
         AND character_id IS NOT NULL
         AND controller_user_id IS NOT NULL`,
    )
    .bind(campaignId, ...normalized)
    .all<ControlledInitiativeActor>();
  const byId = new Map(result.results.map((actor) => [actor.actorId, actor]));
  return normalized.flatMap((actorId) => {
    const actor = byId.get(actorId);
    return actor ? [actor] : [];
  });
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

type PendingActionInput = {
  campaignId: string;
  requestedByMessageId: string;
  requestMessageId: string | null;
  requestedUserId: string;
  characterId: string;
  actorId: string;
  arguments: CampaignDmActionArguments;
};

function pendingActionInsert(
  binding: D1Database,
  id: string,
  input: PendingActionInput,
): D1PreparedStatement {
  return binding
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
    );
}

async function insertPendingDmAction(
  binding: D1Database,
  input: PendingActionInput,
): Promise<PublicCampaignDmAction> {
  const id = crypto.randomUUID();
  await pendingActionInsert(binding, id, input).run();
  const row = await readAction(binding, input.campaignId, id, input.requestedUserId);
  if (!row) throw new Error("AI_DM_ACTION_CREATE_FAILED");
  return publicAction(row);
}

async function createInitialInitiativeActions(
  binding: D1Database,
  input: PendingActionInput & { arguments: Extract<CampaignDmActionArguments, { type: "check.initiative" }> },
): Promise<PublicCampaignDmAction> {
  if (!input.requestMessageId) throw new Error("AI_DM_ACTION_ARGUMENTS_INVALID");
  const controlled = await loadControlledInitiativeActors(
    binding,
    input.campaignId,
    input.arguments.participantIds,
  );
  const initiating = controlled.find(
    (actor) =>
      actor.actorId === input.actorId && actor.controllerUserId === input.requestedUserId,
  );
  if (!initiating) throw new Error("ENCOUNTER_PARTICIPANT_INVALID");

  const firstByUser = new Map<string, ControlledInitiativeActor>();
  firstByUser.set(input.requestedUserId, initiating);
  for (const actor of controlled) {
    if (!firstByUser.has(actor.controllerUserId)) {
      firstByUser.set(actor.controllerUserId, actor);
    }
  }

  const entries = [...firstByUser.entries()].map(([requestedUserId, actor]) => ({
    id: crypto.randomUUID(),
    requestedUserId,
    actor,
  }));
  await binding.batch(
    entries.map((entry) =>
      pendingActionInsert(binding, entry.id, {
        campaignId: input.campaignId,
        requestedByMessageId: input.requestedByMessageId,
        requestMessageId: input.requestMessageId,
        requestedUserId: entry.requestedUserId,
        characterId: entry.actor.characterId,
        actorId: entry.actor.actorId,
        arguments: input.arguments,
      }),
    ),
  );

  const current = entries.find((entry) => entry.requestedUserId === input.requestedUserId);
  if (!current) throw new Error("AI_DM_ACTION_CREATE_FAILED");
  const row = await readAction(binding, input.campaignId, current.id, current.requestedUserId);
  if (!row) throw new Error("AI_DM_ACTION_CREATE_FAILED");
  return publicAction(row);
}

export async function createPendingDmAction(
  binding: D1Database,
  input: PendingActionInput,
): Promise<PublicCampaignDmAction> {
  if (input.arguments.type === "check.initiative") {
    return createInitialInitiativeActions(binding, {
      ...input,
      arguments: input.arguments,
    });
  }
  return insertPendingDmAction(binding, input);
}

function commandForAction(
  row: DmActionRow,
  args: Exclude<CampaignDmActionArguments, { type: "check.initiative" }>,
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
    "ENCOUNTER_ALREADY_ACTIVE",
    "ENCOUNTER_PARTICIPANT_INVALID",
    "ENCOUNTER_PLAYER_INITIATIVE_REQUIRED",
  ]).has(error.message);
}

function resultIsDisallowed(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const allowed = (value as Record<string, unknown>)["allowed"];
  return allowed === false;
}

function initiativeSubmission(row: DmActionRow, roll: number): InitiativeSubmissionResult {
  return {
    type: "check.initiative",
    value: { actorId: row.actorId, naturalRoll: roll, awaitingOthers: true },
  };
}

function initiativeRoll(row: DmActionRow): number | null {
  if (!row.result) return null;
  try {
    const parsed = JSON.parse(row.result) as {
      type?: unknown;
      value?: { actorId?: unknown; naturalRoll?: unknown };
    };
    if (parsed.type !== "check.initiative") return null;
    if (parsed.value?.actorId !== row.actorId) return null;
    const roll = parsed.value.naturalRoll;
    return typeof roll === "number" && Number.isSafeInteger(roll) && roll >= 1 && roll <= 20
      ? roll
      : null;
  } catch {
    return null;
  }
}

function isEncounterAlreadyActiveRace(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message === "ENCOUNTER_ALREADY_ACTIVE" ||
    /game_encounters_one_active_per_session_uidx|UNIQUE constraint failed: game_encounters\.session_id/i.test(
      message,
    )
  );
}

async function resolveInitiativeAction(
  binding: D1Database,
  row: DmActionRow,
  args: Extract<CampaignDmActionArguments, { type: "check.initiative" }>,
  roll: number,
): Promise<{
  action: PublicCampaignDmAction;
  result: DmActionResolutionResult;
  nextPendingAction: PublicCampaignDmAction | null;
}> {
  if (!row.requestMessageId) throw new Error("AI_DM_ACTION_ARGUMENTS_INVALID");
  const submission = initiativeSubmission(row, roll);
  await binding
    .prepare(
      `UPDATE campaign_dm_actions
       SET result = ?, error = NULL
       WHERE id = ? AND status = 'resolving'`,
    )
    .bind(JSON.stringify(submission), row.id)
    .run();

  const controlled = await loadControlledInitiativeActors(binding, row.campaignId, args.participantIds);
  const currentActor = controlled.find(
    (actor) => actor.actorId === row.actorId && actor.controllerUserId === row.requestedUserId,
  );
  if (!currentActor) throw new Error("ENCOUNTER_PARTICIPANT_INVALID");

  const group = await readInitiativeGroup(binding, row.campaignId, row.requestMessageId);
  const rolls = new Map<string, number>();
  for (const action of group) {
    const natural = initiativeRoll(action);
    if (natural !== null) rolls.set(action.actorId, natural);
  }
  const missing = controlled.filter((actor) => !rolls.has(actor.actorId));
  const nextForCurrentUser = missing.find(
    (actor) => actor.controllerUserId === row.requestedUserId,
  );

  if (nextForCurrentUser) {
    await binding
      .prepare(
        `UPDATE campaign_dm_actions
         SET status = 'resolved', error = NULL, resolved_at = unixepoch()
         WHERE id = ? AND status = 'resolving'`,
      )
      .bind(row.id)
      .run();
    const nextPendingAction = await insertPendingDmAction(binding, {
      campaignId: row.campaignId,
      requestedByMessageId: row.requestedByMessageId,
      requestMessageId: row.requestMessageId,
      requestedUserId: row.requestedUserId,
      characterId: nextForCurrentUser.characterId,
      actorId: nextForCurrentUser.actorId,
      arguments: args,
    });
    const updated = await readAction(binding, row.campaignId, row.id, row.requestedUserId);
    if (!updated) throw new Error("AI_DM_ACTION_NOT_FOUND");
    return { action: publicAction(updated), result: submission, nextPendingAction };
  }

  if (missing.length > 0) {
    const updated = await readAction(binding, row.campaignId, row.id, row.requestedUserId);
    if (!updated) throw new Error("AI_DM_ACTION_NOT_FOUND");
    return { action: publicAction(updated), result: submission, nextPendingAction: null };
  }

  const initiativeRolls = Object.fromEntries(
    controlled.map((actor) => [actor.actorId, rolls.get(actor.actorId)!]),
  );
  const deps = { db: createDatabase(binding), binding };
  let encounter: Awaited<ReturnType<typeof startActorEncounter>> | Awaited<ReturnType<typeof getActiveEncounter>>;
  try {
    encounter = await startActorEncounter(deps, {
      campaignId: row.campaignId,
      participantIds: args.participantIds,
      initiativeRolls,
    });
  } catch (error) {
    if (!isEncounterAlreadyActiveRace(error)) throw error;
    encounter = await getActiveEncounter(deps, row.campaignId);
    if (!encounter) throw error;
  }

  const finalResult: GameCommandResult = { type: "encounter.start", value: encounter };
  await binding
    .prepare(
      `UPDATE campaign_dm_actions
       SET status = 'resolved', result = ?, error = NULL,
           resolved_at = COALESCE(resolved_at, unixepoch())
       WHERE campaign_id = ?
         AND request_message_id = ?
         AND kind = 'check.initiative'
         AND status IN ('pending', 'resolving', 'resolved')`,
    )
    .bind(JSON.stringify(finalResult), row.campaignId, row.requestMessageId)
    .run();

  const updated = await readAction(binding, row.campaignId, row.id, row.requestedUserId);
  if (!updated) throw new Error("AI_DM_ACTION_NOT_FOUND");
  return { action: publicAction(updated), result: finalResult, nextPendingAction: null };
}

export async function resolvePendingDmAction(
  binding: D1Database,
  input: {
    campaignId: string;
    actionId: string;
    userId: string;
    roll: number;
  },
): Promise<{
  action: PublicCampaignDmAction;
  result: DmActionResolutionResult;
  nextPendingAction: PublicCampaignDmAction | null;
}> {
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

  try {
    const args = parseArguments(row.arguments);
    if (args.type === "check.initiative") {
      return await resolveInitiativeAction(binding, row, args, input.roll);
    }

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
    return { action: publicAction(updated), result, nextPendingAction: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI DM action resolution failed.";
    const terminal = isTerminalResolutionError(error);
    if (row.kind === "check.initiative" && row.requestMessageId && terminal) {
      await binding
        .prepare(
          `UPDATE campaign_dm_actions
           SET status = 'failed', error = ?, resolved_at = unixepoch()
           WHERE campaign_id = ?
             AND request_message_id = ?
             AND kind = 'check.initiative'
             AND status IN ('pending', 'resolving')`,
        )
        .bind(message.slice(0, 1000), row.campaignId, row.requestMessageId)
        .run();
    } else {
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
    }
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
       WHERE id = ? AND status IN ('resolved', 'resolving')`,
    )
    .bind(messageId, actionId)
    .run();
}
