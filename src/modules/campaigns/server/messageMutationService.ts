/// <reference types="@cloudflare/workers-types" />

import { ConflictError, ForbiddenError, NotFoundError } from "@/server/middleware/errors";

export type CampaignMessageRole = "owner" | "gm" | "player" | "observer";
export type CampaignMessageChannel = "campaign" | "ooc_dm";
export type CampaignMessageAuthorKind = "player" | "dm" | "system";

export interface MutableCampaignMessage {
  id: string;
  campaignId: string;
  channel: CampaignMessageChannel;
  authorKind: CampaignMessageAuthorKind;
  authorUserId: string | null;
  privateUserId: string | null;
  content: string;
}

async function readMessage(
  binding: D1Database,
  campaignId: string,
  messageId: string,
): Promise<MutableCampaignMessage | null> {
  return binding
    .prepare(
      `SELECT id,
              campaign_id AS campaignId,
              channel,
              author_kind AS authorKind,
              author_user_id AS authorUserId,
              private_user_id AS privateUserId,
              content
       FROM campaign_play_messages
       WHERE id = ? AND campaign_id = ?
       LIMIT 1`,
    )
    .bind(messageId, campaignId)
    .first<MutableCampaignMessage>();
}

function assertVisibleToUser(message: MutableCampaignMessage, userId: string): void {
  if (message.channel === "ooc_dm" && message.privateUserId !== userId) {
    // Do not reveal that another player's private OOC message exists.
    throw new NotFoundError("Campaign message not found.");
  }
}

export function canMutateCampaignMessage(
  message: MutableCampaignMessage,
  userId: string,
  role: CampaignMessageRole,
): boolean {
  if (role === "observer" || message.authorKind === "system") return false;

  if (message.authorKind === "player" && message.authorUserId === userId) {
    return true;
  }

  if (role !== "owner" && role !== "gm") return false;

  // Campaign owners/GMs can curate the shared table. In OOC they can curate
  // only their own private DM thread; another player's private thread is never
  // exposed through this service.
  return message.channel === "campaign" || message.privateUserId === userId;
}

async function messageHasAuthoritativeDmAction(
  binding: D1Database,
  messageId: string,
): Promise<boolean> {
  const table = await binding
    .prepare(
      `SELECT 1 AS present
       FROM sqlite_master
       WHERE type = 'table' AND name = 'campaign_dm_actions'
       LIMIT 1`,
    )
    .first<{ present: number }>();
  if (!table) return false;

  const action = await binding
    .prepare(
      `SELECT id
       FROM campaign_dm_actions
       WHERE requested_by_message_id = ?
          OR request_message_id = ?
          OR resolution_message_id = ?
       LIMIT 1`,
    )
    .bind(messageId, messageId, messageId)
    .first<{ id: string }>();
  return Boolean(action);
}

async function requireMutableMessage(
  binding: D1Database,
  input: {
    campaignId: string;
    messageId: string;
    userId: string;
    role: CampaignMessageRole;
  },
): Promise<MutableCampaignMessage> {
  const message = await readMessage(binding, input.campaignId, input.messageId);
  if (!message) throw new NotFoundError("Campaign message not found.");
  assertVisibleToUser(message, input.userId);

  if (!canMutateCampaignMessage(message, input.userId, input.role)) {
    throw new ForbiddenError("You do not have permission to edit or delete this message.");
  }

  if (await messageHasAuthoritativeDmAction(binding, message.id)) {
    throw new ConflictError(
      "Messages tied to an authoritative Dungeon Master roll cannot be edited or deleted because they are part of the rules audit trail.",
    );
  }

  return message;
}

export async function editCampaignMessage(
  binding: D1Database,
  input: {
    campaignId: string;
    messageId: string;
    userId: string;
    role: CampaignMessageRole;
    content: string;
  },
): Promise<{ id: string; content: string }> {
  const message = await requireMutableMessage(binding, input);
  const content = input.content.trim();

  const result = await binding
    .prepare(
      `UPDATE campaign_play_messages
       SET content = ?
       WHERE id = ? AND campaign_id = ?`,
    )
    .bind(content, message.id, input.campaignId)
    .run();
  if ((result.meta.changes ?? 0) !== 1) {
    throw new NotFoundError("Campaign message not found.");
  }

  return { id: message.id, content };
}

export async function deleteCampaignMessage(
  binding: D1Database,
  input: {
    campaignId: string;
    messageId: string;
    userId: string;
    role: CampaignMessageRole;
  },
): Promise<{ id: string }> {
  const message = await requireMutableMessage(binding, input);

  const result = await binding
    .prepare("DELETE FROM campaign_play_messages WHERE id = ? AND campaign_id = ?")
    .bind(message.id, input.campaignId)
    .run();
  if ((result.meta.changes ?? 0) !== 1) {
    throw new NotFoundError("Campaign message not found.");
  }

  return { id: message.id };
}
