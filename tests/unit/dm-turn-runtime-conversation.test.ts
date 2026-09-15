import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";
import { loadDmConversationText } from "@/modules/campaigns/server/dmTurnRuntime";
import { createSqliteD1 } from "../helpers/sqliteD1";

const databases: DatabaseSync[] = [];

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function setup() {
  const sqlite = new DatabaseSync(":memory:");
  databases.push(sqlite);
  sqlite.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      name TEXT,
      username TEXT,
      display_username TEXT
    );
    CREATE TABLE characters (
      id TEXT PRIMARY KEY,
      name TEXT
    );
    CREATE TABLE campaign_play_messages (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      author_kind TEXT NOT NULL,
      author_user_id TEXT,
      private_user_id TEXT,
      character_id TEXT,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
  sqlite.prepare("INSERT INTO users (id, name, username, display_username) VALUES (?, ?, ?, ?)")
    .run("user-1", "Player One", "one", "One");
  sqlite.prepare("INSERT INTO users (id, name, username, display_username) VALUES (?, ?, ?, ?)")
    .run("user-2", "Player Two", "two", "Two");
  sqlite.prepare("INSERT INTO characters (id, name) VALUES (?, ?)").run("char-1", "Master Thorn");

  const insert = sqlite.prepare(`
    INSERT INTO campaign_play_messages
      (id, campaign_id, channel, author_kind, author_user_id, private_user_id, character_id, content, created_at)
    VALUES (?, 'campaign-1', ?, ?, ?, ?, ?, ?, ?)
  `);
  insert.run("campaign-player", "campaign", "player", "user-1", null, "char-1", "Start the campaign.", 10);
  insert.run("campaign-dm", "campaign", "dm", null, null, null, "The academy gates open.", 11);
  insert.run("ooc-user-1", "ooc_dm", "player", "user-1", "user-1", null, "I want the story to begin before the academy is founded and eventually allow a path to godhood.", 12);
  insert.run("ooc-dm-1", "ooc_dm", "dm", null, "user-1", null, "I will keep those campaign goals in mind.", 13);
  insert.run("ooc-user-2", "ooc_dm", "player", "user-2", "user-2", null, "Secret preference belonging only to player two.", 14);

  return createSqliteD1(sqlite);
}

describe("AI DM conversation context", () => {
  it("shares campaign history with OOC while keeping each player's OOC private", async () => {
    const binding = setup();
    const context = await loadDmConversationText({
      binding,
      campaignId: "campaign-1",
      userId: "user-1",
    });

    expect(context).toContain("Shared campaign table:");
    expect(context).toContain("Master Thorn: Start the campaign.");
    expect(context).toContain("DM: The academy gates open.");
    expect(context).toContain("Private OOC · DM context for this player");
    expect(context).toContain("begin before the academy is founded");
    expect(context).toContain("path to godhood");
    expect(context).not.toContain("Secret preference belonging only to player two.");
  });
});
