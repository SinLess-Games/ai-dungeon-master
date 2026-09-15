/// <reference types="@cloudflare/workers-types" />

import {
  loadDmToolActiveConditions,
  loadDmToolCharacterContext,
  loadDmToolEncounterContext,
} from "./dmToolContext";
import type { DmPlannerActor, DmPlannerContext } from "./dmToolPlanner";

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return {};
  }
}

export async function loadDmActors(
  binding: D1Database,
  campaignId: string,
): Promise<DmPlannerActor[]> {
  const result = await binding
    .prepare(
      `SELECT id,
              character_id AS characterId,
              name,
              kind,
              status
       FROM game_actors
       WHERE campaign_id = ? AND status IN ('active', 'defeated')
       ORDER BY created_at ASC, id ASC
       LIMIT 80`,
    )
    .bind(campaignId)
    .all<DmPlannerActor>();
  return result.results;
}

export async function loadDmPlannerContext(input: {
  binding: D1Database;
  campaignId: string;
  characterId: string;
  userId: string;
}): Promise<DmPlannerContext | null> {
  const [actors, encounter, activeConditions, character] = await Promise.all([
    loadDmActors(input.binding, input.campaignId),
    loadDmToolEncounterContext(input.binding, input.campaignId),
    loadDmToolActiveConditions(input.binding, input.campaignId),
    loadDmToolCharacterContext(
      input.binding,
      input.campaignId,
      input.characterId,
      input.userId,
    ),
  ]);
  if (!character) return null;
  return { actors, encounter, activeConditions, character };
}

export async function loadRecentDmEvents(
  binding: D1Database,
  campaignId: string,
  limit = 16,
): Promise<unknown[]> {
  const result = await binding
    .prepare(
      `SELECT event_type AS eventType, occurred_at AS occurredAt, payload
       FROM game_events
       WHERE campaign_id = ?
       ORDER BY sequence DESC
       LIMIT ?`,
    )
    .bind(campaignId, limit)
    .all<{ eventType: string; occurredAt: number; payload: string }>();
  return result.results.reverse().map((event) => ({
    type: event.eventType,
    occurredAt: event.occurredAt,
    payload: safeJson(event.payload),
  }));
}

export async function loadDmConversationText(input: {
  binding: D1Database;
  campaignId: string;
  userId: string;
  limit?: number;
}): Promise<string> {
  const result = await input.binding
    .prepare(
      `SELECT m.author_kind AS authorKind,
              m.content,
              u.name AS userName,
              u.username,
              u.display_username AS displayUsername,
              c.name AS characterName
       FROM campaign_play_messages m
       LEFT JOIN users u ON u.id = m.author_user_id
       LEFT JOIN characters c ON c.id = m.character_id
       WHERE m.campaign_id = ?
         AND m.channel = 'campaign'
         AND m.private_user_id IS NULL
       ORDER BY m.created_at DESC, m.rowid DESC
       LIMIT ?`,
    )
    .bind(input.campaignId, input.limit ?? 18)
    .all<{
      authorKind: "player" | "dm" | "system";
      content: string;
      userName: string | null;
      username: string | null;
      displayUsername: string | null;
      characterName: string | null;
    }>();
  return result.results
    .reverse()
    .map((message) => {
      const author =
        message.authorKind === "dm"
          ? "DM"
          : message.authorKind === "system"
            ? "The Endless Codex"
            : message.characterName ||
              message.displayUsername ||
              message.username ||
              message.userName ||
              "Player";
      return `${author}: ${message.content}`;
    })
    .join("\n");
}

export async function loadDmPlayerMessage(
  binding: D1Database,
  messageId: string,
): Promise<{ content: string; characterId: string | null; authorUserId: string | null } | null> {
  return binding
    .prepare(
      `SELECT content,
              character_id AS characterId,
              author_user_id AS authorUserId
       FROM campaign_play_messages
       WHERE id = ? AND author_kind = 'player'
       LIMIT 1`,
    )
    .bind(messageId)
    .first<{ content: string; characterId: string | null; authorUserId: string | null }>();
}
