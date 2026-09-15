import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSqliteD1 } from "../helpers/sqliteD1";

const mocks = vi.hoisted(() => ({
  createDatabase: vi.fn(() => ({})),
  executeGameCommand: vi.fn(),
  startActorEncounter: vi.fn(),
  getActiveEncounter: vi.fn(),
}));

vi.mock("@/infrastructure/database/client", () => ({
  createDatabase: mocks.createDatabase,
}));

vi.mock("@/modules/game/server/gameCommandService", () => ({
  executeGameCommand: mocks.executeGameCommand,
}));

vi.mock("@/modules/game/server/actorEncounterService", () => ({
  startActorEncounter: mocks.startActorEncounter,
}));

vi.mock("@/modules/game/server/encounterService", () => ({
  getActiveEncounter: mocks.getActiveEncounter,
}));

import {
  createPendingDmAction,
  resolvePendingDmAction,
} from "@/modules/campaigns/server/dmActionService";

const databases: DatabaseSync[] = [];

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function database() {
  const sqlite = new DatabaseSync(":memory:");
  databases.push(sqlite);
  sqlite.exec(`
    CREATE TABLE game_actors (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      character_id TEXT,
      controller_user_id TEXT,
      kind TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE campaign_dm_actions (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      requested_by_message_id TEXT NOT NULL,
      request_message_id TEXT,
      resolution_message_id TEXT,
      requested_user_id TEXT NOT NULL,
      character_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      arguments TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      result TEXT,
      error TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      resolved_at INTEGER,
      CHECK (kind IN ('check.skill', 'check.save', 'check.initiative'))
    );

    CREATE UNIQUE INDEX campaign_dm_actions_one_outstanding_per_user_uidx
      ON campaign_dm_actions (campaign_id, requested_user_id)
      WHERE status IN ('pending', 'resolving');

    INSERT INTO game_actors
      (id, campaign_id, character_id, controller_user_id, kind, status)
    VALUES
      ('actor-a', 'campaign-1', 'character-a', 'user-a', 'character', 'active'),
      ('actor-b', 'campaign-1', 'character-b', 'user-b', 'character', 'active'),
      ('monster-1', 'campaign-1', NULL, NULL, 'monster', 'active');
  `);
  return { sqlite, binding: createSqliteD1(sqlite) };
}

function actionIdForUser(sqlite: DatabaseSync, userId: string): string {
  const row = sqlite
    .prepare(
      `SELECT id
       FROM campaign_dm_actions
       WHERE campaign_id = 'campaign-1'
         AND requested_user_id = ?
         AND status IN ('pending', 'resolving')
       ORDER BY created_at DESC, rowid DESC
       LIMIT 1`,
    )
    .get(userId) as { id: string } | undefined;
  if (!row) throw new Error(`Missing initiative action for ${userId}`);
  return row.id;
}

describe("AI DM multiplayer initiative", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.startActorEncounter.mockResolvedValue({
      id: "encounter-1",
      campaignId: "campaign-1",
      sessionId: "session-1",
      status: "active",
      roundNumber: 1,
      activeTurnIndex: 0,
      currentCharacterId: "actor-a",
      participants: [],
      eventId: "event-1",
    });
  });

  it("collects every player roll before starting combat and leaves monsters to the server roller", async () => {
    const { sqlite, binding } = database();
    const arguments_ = {
      type: "check.initiative" as const,
      participantIds: ["actor-a", "actor-b", "monster-1"],
      reason: "Combat is beginning. Roll initiative.",
    };

    const first = await createPendingDmAction(binding, {
      campaignId: "campaign-1",
      requestedByMessageId: "player-message-1",
      requestMessageId: "dm-message-1",
      requestedUserId: "user-a",
      characterId: "character-a",
      actorId: "actor-a",
      arguments: arguments_,
    });

    expect(first.actorId).toBe("actor-a");
    const userBActionId = actionIdForUser(sqlite, "user-b");

    const userAResolution = await resolvePendingDmAction(binding, {
      campaignId: "campaign-1",
      actionId: first.id,
      userId: "user-a",
      roll: 14,
    });

    expect(userAResolution.result).toEqual({
      type: "check.initiative",
      value: { actorId: "actor-a", naturalRoll: 14, awaitingOthers: true },
    });
    expect(userAResolution.action.status).toBe("resolving");
    expect(userAResolution.nextPendingAction).toBeNull();
    expect(mocks.startActorEncounter).not.toHaveBeenCalled();

    const userBResolution = await resolvePendingDmAction(binding, {
      campaignId: "campaign-1",
      actionId: userBActionId,
      userId: "user-b",
      roll: 7,
    });

    expect(mocks.startActorEncounter).toHaveBeenCalledOnce();
    expect(mocks.startActorEncounter).toHaveBeenCalledWith(
      expect.anything(),
      {
        campaignId: "campaign-1",
        participantIds: ["actor-a", "actor-b", "monster-1"],
        initiativeRolls: { "actor-a": 14, "actor-b": 7 },
      },
    );
    expect(userBResolution.result.type).toBe("encounter.start");

    const statuses = sqlite
      .prepare(
        `SELECT requested_user_id AS userId, status
         FROM campaign_dm_actions
         ORDER BY requested_user_id`,
      )
      .all() as Array<{ userId: string; status: string }>;
    expect(statuses).toEqual([
      { userId: "user-a", status: "resolved" },
      { userId: "user-b", status: "resolved" },
    ]);
  });

  it("sequences multiple participating PCs controlled by the same player", async () => {
    const { sqlite, binding } = database();
    sqlite.exec(`
      INSERT INTO game_actors
        (id, campaign_id, character_id, controller_user_id, kind, status)
      VALUES ('actor-a2', 'campaign-1', 'character-a2', 'user-a', 'character', 'active');
    `);
    const arguments_ = {
      type: "check.initiative" as const,
      participantIds: ["actor-a", "actor-a2", "actor-b", "monster-1"],
      reason: "Combat is beginning. Roll initiative.",
    };

    const first = await createPendingDmAction(binding, {
      campaignId: "campaign-1",
      requestedByMessageId: "player-message-1",
      requestMessageId: "dm-message-1",
      requestedUserId: "user-a",
      characterId: "character-a",
      actorId: "actor-a",
      arguments: arguments_,
    });
    const userBActionId = actionIdForUser(sqlite, "user-b");

    const firstResolution = await resolvePendingDmAction(binding, {
      campaignId: "campaign-1",
      actionId: first.id,
      userId: "user-a",
      roll: 16,
    });
    expect(firstResolution.action.status).toBe("resolved");
    expect(firstResolution.nextPendingAction?.actorId).toBe("actor-a2");
    expect(mocks.startActorEncounter).not.toHaveBeenCalled();

    const secondResolution = await resolvePendingDmAction(binding, {
      campaignId: "campaign-1",
      actionId: firstResolution.nextPendingAction!.id,
      userId: "user-a",
      roll: 11,
    });
    expect(secondResolution.action.status).toBe("resolving");
    expect(secondResolution.nextPendingAction).toBeNull();
    expect(mocks.startActorEncounter).not.toHaveBeenCalled();

    await resolvePendingDmAction(binding, {
      campaignId: "campaign-1",
      actionId: userBActionId,
      userId: "user-b",
      roll: 5,
    });

    expect(mocks.startActorEncounter).toHaveBeenCalledWith(
      expect.anything(),
      {
        campaignId: "campaign-1",
        participantIds: ["actor-a", "actor-a2", "actor-b", "monster-1"],
        initiativeRolls: { "actor-a": 16, "actor-a2": 11, "actor-b": 5 },
      },
    );
  });
});
