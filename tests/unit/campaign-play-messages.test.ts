import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const migrationDirectory = fileURLToPath(new URL("../../drizzle/", import.meta.url));
const migrationFiles = readdirSync(migrationDirectory)
  .filter((file) => file.endsWith(".sql"))
  .sort();

let sqlite: DatabaseSync | null = null;

afterEach(() => {
  sqlite?.close();
  sqlite = null;
});

function migrate(database: DatabaseSync) {
  for (const file of migrationFiles) {
    database.exec(readFileSync(`${migrationDirectory}/${file}`, "utf8"));
  }
}

function seedCampaign(database: DatabaseSync) {
  database.exec(`
    INSERT INTO users (id, name, email)
    VALUES ('user-1', 'Player One', 'player-one@example.test');

    INSERT INTO worlds (id, status, generation_seed, settings, generated_at)
    VALUES ('world-1', 'ready', 'seed', '{}', 100);

    INSERT INTO campaigns (
      id, owner_user_id, world_id, ruleset_id, ruleset_version, name, slug,
      status, game_master_mode, settings, started_at
    ) VALUES (
      'campaign-1', 'user-1', 'world-1', 'dnd35', '3.5', 'Campaign', 'campaign',
      'active', 'ai', '{}', 100
    );
  `);
}

describe("campaign play message persistence", () => {
  it("stores public campaign and private OOC DM messages with enforced privacy", () => {
    sqlite = new DatabaseSync(":memory:");
    sqlite.exec("PRAGMA foreign_keys = ON");
    migrate(sqlite);
    seedCampaign(sqlite);

    sqlite.exec(`
      INSERT INTO campaign_play_messages (
        id, campaign_id, channel, author_kind, author_user_id, private_user_id, content, created_at
      ) VALUES
        ('public-1', 'campaign-1', 'campaign', 'player', 'user-1', NULL, 'I open the door.', 101),
        ('private-1', 'campaign-1', 'ooc_dm', 'player', 'user-1', 'user-1', 'What do I roll?', 102),
        ('private-2', 'campaign-1', 'ooc_dm', 'dm', NULL, 'user-1', 'Make a Search check.', 103);
    `);

    const publicCount = sqlite
      .prepare("SELECT count(*) AS count FROM campaign_play_messages WHERE channel = 'campaign'")
      .get() as { count: number };
    const privateCount = sqlite
      .prepare("SELECT count(*) AS count FROM campaign_play_messages WHERE channel = 'ooc_dm' AND private_user_id = 'user-1'")
      .get() as { count: number };

    expect(publicCount.count).toBe(1);
    expect(privateCount.count).toBe(2);

    expect(() =>
      sqlite!.exec(`
        INSERT INTO campaign_play_messages (
          id, campaign_id, channel, author_kind, author_user_id, private_user_id, content
        ) VALUES ('bad-public', 'campaign-1', 'campaign', 'player', 'user-1', 'user-1', 'bad');
      `),
    ).toThrow();

    expect(() =>
      sqlite!.exec(`
        INSERT INTO campaign_play_messages (
          id, campaign_id, channel, author_kind, author_user_id, private_user_id, content
        ) VALUES ('bad-private', 'campaign-1', 'ooc_dm', 'player', 'user-1', NULL, 'bad');
      `),
    ).toThrow();

    expect(() =>
      sqlite!.exec(`
        INSERT INTO campaign_play_messages (
          id, campaign_id, channel, author_kind, author_user_id, private_user_id, content
        ) VALUES ('bad-empty', 'campaign-1', 'campaign', 'player', 'user-1', NULL, '   ');
      `),
    ).toThrow();
  });

  it("removes campaign messages when the campaign is deleted", () => {
    sqlite = new DatabaseSync(":memory:");
    sqlite.exec("PRAGMA foreign_keys = ON");
    migrate(sqlite);
    seedCampaign(sqlite);

    sqlite.exec(`
      INSERT INTO campaign_play_messages (
        id, campaign_id, channel, author_kind, author_user_id, private_user_id, content
      ) VALUES ('message-1', 'campaign-1', 'campaign', 'player', 'user-1', NULL, 'Hello');
      DELETE FROM campaigns WHERE id = 'campaign-1';
    `);

    const row = sqlite
      .prepare("SELECT count(*) AS count FROM campaign_play_messages WHERE campaign_id = 'campaign-1'")
      .get() as { count: number };
    expect(row.count).toBe(0);
  });
});
