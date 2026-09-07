import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const migrationDirectory = fileURLToPath(new URL("../../drizzle/", import.meta.url));
const migrationFiles = readdirSync(migrationDirectory)
  .filter((file) => file.endsWith(".sql"))
  .sort();

function migration(name: string): string {
  return readFileSync(`${migrationDirectory}/${name}`, "utf8");
}

function migrationsThrough(maximumName: string): string {
  return migrationFiles
    .filter((file) => file <= maximumName)
    .map(migration)
    .join("\n");
}

let db: DatabaseSync | null = null;

afterEach(() => {
  db?.close();
  db = null;
});

function openMigratedDatabase(): DatabaseSync {
  const database = new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys = ON");
  database.exec(migrationFiles.map(migration).join("\n"));
  return database;
}

function createStartedCampaign(database: DatabaseSync) {
  database.prepare(
    `INSERT INTO worlds (id, status, generation_seed, settings, generated_at)
     VALUES ('world-1', 'ready', 'seed-1', '{}', 200)`,
  ).run();
  database.prepare(
    `INSERT INTO campaigns (
      id, owner_user_id, world_id, ruleset_id, ruleset_version, name, slug,
      status, settings, started_at
    ) VALUES (
      'campaign-1', 'user-1', 'world-1', 'dnd35', '3.5', 'Campaign', 'campaign',
      'active', '{}', 200
    )`,
  ).run();
}

describe("campaign-first game persistence", () => {
  it("enforces world creation only after campaign start begins", () => {
    db = openMigratedDatabase();

    db.prepare(
      `INSERT INTO campaigns (
        id, owner_user_id, world_id, ruleset_id, ruleset_version, name, slug, status, settings
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, 'draft', '{}')`,
    ).run("campaign-1", "user-1", "dnd35", "3.5", "Campaign", "campaign");

    expect(
      db.prepare("UPDATE campaigns SET status = 'ready' WHERE id = 'campaign-1'").run().changes,
    ).toBe(1);

    expect(() =>
      db?.prepare("UPDATE campaigns SET status = 'active' WHERE id = 'campaign-1'").run(),
    ).toThrow(/campaigns_world_lifecycle_valid|CHECK constraint failed/i);

    expect(() =>
      db
        ?.prepare(
          `INSERT INTO worlds (id, status, generation_seed, settings)
           VALUES ('bad-ready-world', 'ready', 'seed', '{}')`,
        )
        .run(),
    ).toThrow(/worlds_ready_has_generated_at|CHECK constraint failed/i);

    db.prepare(
      `INSERT INTO worlds (id, status, generation_seed, settings)
       VALUES ('world-1', 'generating', 'seed-1', '{}')`,
    ).run();
    db.prepare(
      `UPDATE campaigns
       SET status = 'starting', world_id = 'world-1', start_requested_at = 100
       WHERE id = 'campaign-1'`,
    ).run();

    expect(
      db.prepare("SELECT status, world_id FROM campaigns WHERE id = 'campaign-1'").get(),
    ).toMatchObject({ status: "starting", world_id: "world-1" });

    db.prepare(
      `UPDATE worlds SET status = 'ready', generated_at = 200 WHERE id = 'world-1'`,
    ).run();
    db.prepare(
      `UPDATE campaigns SET status = 'active', started_at = 200 WHERE id = 'campaign-1'`,
    ).run();

    expect(
      db.prepare("SELECT status, world_id, started_at FROM campaigns WHERE id = 'campaign-1'").get(),
    ).toMatchObject({ status: "active", world_id: "world-1", started_at: 200 });
    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  });

  it("requires a ready character to have campaign ownership fields and readiness time", () => {
    db = openMigratedDatabase();
    db.prepare(
      `INSERT INTO campaigns (
        id, owner_user_id, world_id, ruleset_id, ruleset_version, name, slug, status, settings
      ) VALUES ('campaign-1', 'user-1', NULL, 'dnd35', '3.5', 'Campaign', 'campaign', 'draft', '{}')`,
    ).run();

    db.prepare(
      `INSERT INTO characters (
        id, campaign_id, owner_user_id, ruleset_id, ruleset_version, name, status, metadata
      ) VALUES ('draft-character', NULL, NULL, 'dnd35', '3.5', 'Legacy Draft', 'draft', '{}')`,
    ).run();

    expect(() =>
      db
        ?.prepare(
          `INSERT INTO characters (
            id, campaign_id, owner_user_id, ruleset_id, ruleset_version, name, status, metadata
          ) VALUES ('bad-ready', NULL, NULL, 'dnd35', '3.5', 'Bad Ready', 'ready', '{}')`,
        )
        .run(),
    ).toThrow(/characters_ready_requires_campaign_owner|CHECK constraint failed/i);

    db.prepare(
      `INSERT INTO characters (
        id, campaign_id, owner_user_id, ruleset_id, ruleset_version, name, status, metadata, ready_at
      ) VALUES ('ready-character', 'campaign-1', 'user-1', 'dnd35', '3.5', 'Ready Hero', 'ready', '{}', 100)`,
    ).run();

    expect(
      db.prepare("SELECT campaign_id, owner_user_id, status FROM characters WHERE id = 'ready-character'").get(),
    ).toMatchObject({ campaign_id: "campaign-1", owner_user_id: "user-1", status: "ready" });
    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  });

  it("persists the first session and ordered campaign event history", () => {
    db = openMigratedDatabase();
    createStartedCampaign(db);

    db.prepare(
      `INSERT INTO game_sessions (
        id, campaign_id, world_id, ordinal, status, started_at
      ) VALUES ('session-1', 'campaign-1', 'world-1', 1, 'active', 200)`,
    ).run();
    db.prepare(
      `INSERT INTO game_events (
        id, campaign_id, session_id, sequence, event_type, occurred_at,
        target_ids, payload, deltas
      ) VALUES (
        'event-1', 'campaign-1', 'session-1', 1, 'campaign.started', 200,
        '["hero-1"]', '{"worldId":"world-1"}', '[]'
      )`,
    ).run();

    expect(
      db.prepare("SELECT ordinal, status FROM game_sessions WHERE id = 'session-1'").get(),
    ).toMatchObject({ ordinal: 1, status: "active" });
    expect(
      db.prepare("SELECT sequence, event_type FROM game_events WHERE id = 'event-1'").get(),
    ).toMatchObject({ sequence: 1, event_type: "campaign.started" });
    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  });

  it("enforces session ordinal and campaign event sequence uniqueness", () => {
    db = openMigratedDatabase();
    createStartedCampaign(db);
    db.prepare(
      `INSERT INTO game_sessions (
        id, campaign_id, world_id, ordinal, status, started_at
      ) VALUES ('session-1', 'campaign-1', 'world-1', 1, 'active', 200)`,
    ).run();

    expect(() =>
      db
        ?.prepare(
          `INSERT INTO game_sessions (
            id, campaign_id, world_id, ordinal, status, started_at
          ) VALUES ('session-duplicate', 'campaign-1', 'world-1', 1, 'active', 300)`,
        )
        .run(),
    ).toThrow(/UNIQUE constraint failed/i);

    db.prepare(
      `INSERT INTO game_events (
        id, campaign_id, session_id, sequence, event_type, occurred_at,
        target_ids, payload, deltas
      ) VALUES ('event-1', 'campaign-1', 'session-1', 1, 'campaign.started', 200, '[]', '{}', '[]')`,
    ).run();

    expect(() =>
      db
        ?.prepare(
          `INSERT INTO game_events (
            id, campaign_id, session_id, sequence, event_type, occurred_at,
            target_ids, payload, deltas
          ) VALUES ('event-2', 'campaign-1', 'session-1', 1, 'duplicate', 201, '[]', '{}', '[]')`,
        )
        .run(),
    ).toThrow(/UNIQUE constraint failed/i);
  });

  it("rejects invalid ended sessions and orphan game events", () => {
    db = openMigratedDatabase();
    createStartedCampaign(db);

    expect(() =>
      db
        ?.prepare(
          `INSERT INTO game_sessions (
            id, campaign_id, world_id, ordinal, status, started_at
          ) VALUES ('bad-ended', 'campaign-1', 'world-1', 1, 'ended', 200)`,
        )
        .run(),
    ).toThrow(/game_sessions_end_timestamp_valid|CHECK constraint failed/i);

    expect(() =>
      db
        ?.prepare(
          `INSERT INTO game_events (
            id, campaign_id, session_id, sequence, event_type, occurred_at,
            target_ids, payload, deltas
          ) VALUES ('orphan', 'campaign-1', 'missing-session', 1, 'test', 200, '[]', '{}', '[]')`,
        )
        .run(),
    ).toThrow(/FOREIGN KEY constraint failed/i);
  });

  it("converts legacy started campaigns into one generated world and owner membership", () => {
    db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON");
    db.exec(migrationsThrough("0004_devblog.sql"));

    db.prepare(
      `INSERT INTO campaigns (
        id, owner_user_id, world_id, ruleset_id, ruleset_version, name, slug,
        status, generation_seed, settings, created_at, updated_at
      ) VALUES (
        'legacy-campaign', 'legacy-owner', 'placeholder-world', 'dnd35', '3.5',
        'Legacy Campaign', 'legacy-campaign', 'active', 'campaign-seed', '{}', 10, 20
      )`,
    ).run();

    db.exec(migration("0005_campaign_first_game_core.sql"));

    expect(
      db.prepare("SELECT status, world_id, started_at FROM campaigns WHERE id = 'legacy-campaign'").get(),
    ).toMatchObject({
      status: "active",
      world_id: "legacy-world:legacy-campaign",
      started_at: 10,
    });
    expect(
      db.prepare("SELECT status, generation_seed, generated_at FROM worlds WHERE id = 'legacy-world:legacy-campaign'").get(),
    ).toMatchObject({ status: "ready", generation_seed: "campaign-seed", generated_at: 10 });
    expect(
      db.prepare("SELECT role, status, joined_at FROM campaign_memberships WHERE campaign_id = 'legacy-campaign'").get(),
    ).toMatchObject({ role: "owner", status: "active", joined_at: 10 });
    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  });
});
