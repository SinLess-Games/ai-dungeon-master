import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";
import {
  canMutateCampaignMessage,
  deleteCampaignMessage,
  editCampaignMessage,
} from "@/modules/campaigns/server/messageMutationService";
import { createSqliteD1 } from "../helpers/sqliteD1";

const databases: DatabaseSync[] = [];

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function setup() {
  const sqlite = new DatabaseSync(":memory:");
  databases.push(sqlite);
  sqlite.exec(`
    CREATE TABLE campaign_play_messages (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      author_kind TEXT NOT NULL,
      author_user_id TEXT,
      private_user_id TEXT,
      content TEXT NOT NULL
    );
  `);
  const insert = sqlite.prepare(`
    INSERT INTO campaign_play_messages
      (id, campaign_id, channel, author_kind, author_user_id, private_user_id, content)
    VALUES (?, 'campaign-1', ?, ?, ?, ?, ?)
  `);
  insert.run("player-1", "campaign", "player", "user-1", null, "Original action");
  insert.run("player-2", "campaign", "player", "user-2", null, "Another action");
  insert.run("dm-1", "campaign", "dm", null, null, "Dungeon Master narration");
  insert.run("system-1", "campaign", "system", null, null, "Campaign started");
  insert.run("ooc-1", "ooc_dm", "player", "user-1", "user-1", "Private direction");
  insert.run("ooc-2", "ooc_dm", "player", "user-2", "user-2", "Other private direction");
  return { sqlite, binding: createSqliteD1(sqlite) };
}

describe("campaign message mutations", () => {
  it("lets a player edit and delete their own messages", async () => {
    const { sqlite, binding } = setup();

    await expect(
      editCampaignMessage(binding, {
        campaignId: "campaign-1",
        messageId: "player-1",
        userId: "user-1",
        role: "player",
        content: "  Corrected action  ",
      }),
    ).resolves.toEqual({ id: "player-1", content: "Corrected action" });

    expect(
      sqlite.prepare("SELECT content FROM campaign_play_messages WHERE id = 'player-1'").get(),
    ).toEqual({ content: "Corrected action" });

    await expect(
      deleteCampaignMessage(binding, {
        campaignId: "campaign-1",
        messageId: "ooc-1",
        userId: "user-1",
        role: "player",
      }),
    ).resolves.toEqual({ id: "ooc-1" });
    expect(
      sqlite.prepare("SELECT count(*) AS count FROM campaign_play_messages WHERE id = 'ooc-1'").get(),
    ).toEqual({ count: 0 });
  });

  it("keeps DM and other-player messages protected from normal players", async () => {
    const { binding } = setup();

    await expect(
      editCampaignMessage(binding, {
        campaignId: "campaign-1",
        messageId: "dm-1",
        userId: "user-1",
        role: "player",
        content: "Changed DM narration",
      }),
    ).rejects.toMatchObject({ status: 403 });

    await expect(
      deleteCampaignMessage(binding, {
        campaignId: "campaign-1",
        messageId: "player-2",
        userId: "user-1",
        role: "player",
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("lets campaign owners and GMs curate non-system shared messages", () => {
    const base = {
      id: "dm-1",
      campaignId: "campaign-1",
      channel: "campaign" as const,
      authorKind: "dm" as const,
      authorUserId: null,
      privateUserId: null,
      content: "Narration",
    };
    expect(canMutateCampaignMessage(base, "gm-1", "gm")).toBe(true);
    expect(canMutateCampaignMessage(base, "owner-1", "owner")).toBe(true);
    expect(
      canMutateCampaignMessage({ ...base, authorKind: "system" }, "owner-1", "owner"),
    ).toBe(false);
  });

  it("never exposes another player's private OOC thread through mutation errors", async () => {
    const { binding } = setup();

    await expect(
      editCampaignMessage(binding, {
        campaignId: "campaign-1",
        messageId: "ooc-2",
        userId: "user-1",
        role: "owner",
        content: "Should not be visible",
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("keeps messages linked to authoritative DM rolls immutable", async () => {
    const { sqlite, binding } = setup();
    sqlite.exec(`
      CREATE TABLE campaign_dm_actions (
        id TEXT PRIMARY KEY,
        requested_by_message_id TEXT NOT NULL,
        request_message_id TEXT,
        resolution_message_id TEXT
      );
      INSERT INTO campaign_dm_actions
        (id, requested_by_message_id, request_message_id, resolution_message_id)
      VALUES ('action-1', 'player-1', 'dm-1', NULL);
    `);

    await expect(
      editCampaignMessage(binding, {
        campaignId: "campaign-1",
        messageId: "player-1",
        userId: "user-1",
        role: "player",
        content: "Rewrite a resolved mechanic",
      }),
    ).rejects.toMatchObject({ status: 409 });

    await expect(
      deleteCampaignMessage(binding, {
        campaignId: "campaign-1",
        messageId: "dm-1",
        userId: "owner-1",
        role: "owner",
      }),
    ).rejects.toMatchObject({ status: 409 });
  });
});
