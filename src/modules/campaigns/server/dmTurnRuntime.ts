/// <reference types="@cloudflare/workers-types" />

import {
  loadDmCampaignCharacterProfiles,
  serializeDmCampaignCharacterProfiles,
} from "./dmCharacterProfiles";
import {
  loadCampaignNpcRegistry,
  serializeCampaignNpcRegistry,
} from "./dmNpcRegistry";
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
  const [actors, monsterAttacks] = await Promise.all([
    binding
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
      .all<Omit<DmPlannerActor, "attacks">>(),
    binding
      .prepare(
        `SELECT instance.actor_id AS actorId,
                attack.id,
                attack.name,
                attack.attack_mode AS attackMode,
                attack.can_use_as_standard AS canUseAsStandard,
                attack.attack_count AS attackCount,
                attack.routine_key AS routineKey,
                attack.sequence
         FROM runtime_dnd35_monster_instances instance
         JOIN game_actors actor ON actor.id = instance.actor_id
         JOIN dnd35_monster_attacks attack ON attack.monster_id = instance.monster_id
         WHERE actor.campaign_id = ?
           AND actor.status = 'active'
         ORDER BY instance.actor_id, attack.routine_key, attack.sequence, attack.id`,
      )
      .bind(campaignId)
      .all<{
        actorId: string;
        id: string;
        name: string;
        attackMode: "melee" | "ranged" | "melee_touch" | "ranged_touch";
        canUseAsStandard: number;
        attackCount: number;
        routineKey: string;
        sequence: number;
      }>(),
  ]);

  const byActor = new Map<string, NonNullable<DmPlannerActor["attacks"]>>();
  for (const attack of monsterAttacks.results) {
    const list = byActor.get(attack.actorId) ?? [];
    list.push({
      id: attack.id,
      name: attack.name,
      attackMode: attack.attackMode,
      canUseAsStandard: Boolean(attack.canUseAsStandard),
      attackCount: attack.attackCount,
      routineKey: attack.routineKey,
      sequence: attack.sequence,
    });
    byActor.set(attack.actorId, list);
  }
  return actors.results.map((actor) => ({
    ...actor,
    ...(byActor.has(actor.id) ? { attacks: byActor.get(actor.id)! } : {}),
  }));
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

interface DmConversationRow {
  authorKind: "player" | "dm" | "system";
  content: string;
  userName: string | null;
  username: string | null;
  displayUsername: string | null;
  characterName: string | null;
}

function formatConversationRows(rows: readonly DmConversationRow[]): string {
  return rows
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

export function composeDmConversationContext(input: {
  characterProfilesJson: string;
  npcRegistryJson?: string;
  privateOoc: string;
  campaign: string;
}): string {
  const sections: string[] = [];

  if (input.characterProfilesJson && input.characterProfilesJson !== "[]") {
    sections.push(
      [
        "Authoritative current campaign character sheets (DM reference context):",
        "These sheets cover every campaign character, including identity, race/deity/alignment, XP, raw and derived abilities, class history, combat/health/encumbrance, skills, feats, inventory and item state, languages, domains, templates, race traits, class features, spellbooks, known/prepared spells, powers, casting resources, psionic state, alignment state, metadata, player notes, and other persisted character selections available to the system.",
        "Use this information to keep narration, rules calls, NPC reactions, and OOC answers consistent. Knowing another character's sheet does NOT grant permission to choose that player's actions or bypass authoritative game tools. Treat player notes and sheet metadata as DM reference, not automatically as public/NPC knowledge.",
        input.characterProfilesJson,
      ].join("\n"),
    );
  }
  if (input.npcRegistryJson && input.npcRegistryJson !== "[]") {
    sections.push(
      [
        "Persistent campaign NPC registry (DM memory):",
        "Reuse these NPCs consistently when they return. Their ids are stable runtime identities. Preserve established role, description, location, attitude, and notes unless play changes them. Do not invent a duplicate NPC merely because an earlier appearance fell out of recent chat history.",
        input.npcRegistryJson,
      ].join("\n"),
    );
  }
  if (input.privateOoc) {
    sections.push(
      `Private OOC · DM context for this player (DM-only; not character speech or public table knowledge):\n${input.privateOoc}`,
    );
  }
  if (input.campaign) {
    sections.push(`Shared campaign table:\n${input.campaign}`);
  }

  return sections.join("\n\n");
}

/**
 * Builds the AI Dungeon Master's shared context.
 *
 * Every call hydrates complete current campaign character profiles plus the
 * persistent NPC registry directly from authoritative D1 state. Character
 * sheets and NPC memory are informational and never widen the validated tool
 * permissions for the acting character. The requesting player's private OOC ·
 * DM thread remains separate and the shared campaign table remains last so the
 * active turn is the final dialogue the planner sees.
 */
export async function loadDmConversationText(input: {
  binding: D1Database;
  campaignId: string;
  userId: string;
  limit?: number;
}): Promise<string> {
  const limit = input.limit ?? 18;
  const [campaignResult, privateOocResult, characterProfiles, npcRegistry] = await Promise.all([
    input.binding
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
      .bind(input.campaignId, limit)
      .all<DmConversationRow>(),
    input.binding
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
           AND m.channel = 'ooc_dm'
           AND m.private_user_id = ?
         ORDER BY m.created_at DESC, m.rowid DESC
         LIMIT ?`,
      )
      .bind(input.campaignId, input.userId, limit)
      .all<DmConversationRow>(),
    loadDmCampaignCharacterProfiles(input.binding, input.campaignId),
    loadCampaignNpcRegistry(input.binding, input.campaignId, 100),
  ]);

  const campaign = formatConversationRows([...campaignResult.results].reverse());
  const privateOoc = formatConversationRows([...privateOocResult.results].reverse());

  return composeDmConversationContext({
    characterProfilesJson: serializeDmCampaignCharacterProfiles(characterProfiles),
    npcRegistryJson: serializeCampaignNpcRegistry(npcRegistry),
    privateOoc,
    campaign,
  });
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
