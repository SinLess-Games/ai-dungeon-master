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

function seedPreActorRuntime(database: DatabaseSync): void {
  database.prepare(
    `INSERT INTO worlds (id, status, generation_seed, settings, generated_at)
     VALUES ('world-1', 'ready', 'seed', '{}', 100)`,
  ).run();
  database.prepare(
    `INSERT INTO campaigns (
      id, owner_user_id, world_id, ruleset_id, ruleset_version, name, slug,
      status, settings, started_at
    ) VALUES (
      'campaign-1', 'user-1', 'world-1', 'dnd35', '3.5', 'Campaign', 'campaign',
      'active', '{}', 100
    )`,
  ).run();
  database.prepare(
    `INSERT INTO characters (
      id, campaign_id, owner_user_id, ruleset_id, ruleset_version, name,
      status, metadata, ready_at
    ) VALUES ('hero', 'campaign-1', 'user-1', 'dnd35', '3.5', 'Hero', 'active', '{}', 90)`,
  ).run();
  database.prepare(
    `INSERT INTO game_sessions (id, campaign_id, world_id, ordinal, status, started_at)
     VALUES ('session-1', 'campaign-1', 'world-1', 1, 'active', 100)`,
  ).run();
  database.prepare(
    `INSERT INTO game_encounters (
      id, campaign_id, session_id, status, round_number, active_turn_index, started_at
    ) VALUES ('encounter-1', 'campaign-1', 'session-1', 'active', 1, 0, 110)`,
  ).run();
  database.prepare(
    `INSERT INTO game_encounter_participants (
      id, encounter_id, character_id, initiative_roll, initiative_modifier,
      initiative_total, tie_breaker, turn_order
    ) VALUES ('participant-1', 'encounter-1', 'hero', 12, 2, 14, 2, 0)`,
  ).run();
}

describe("runtime game actor migration", () => {
  it("backfills active characters and preserves existing encounter identity", () => {
    db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON");
    db.exec(migrationsThrough("0010_authoritative_health_lifecycle.sql"));
    seedPreActorRuntime(db);

    db.exec(migration("0011_runtime_game_actors.sql"));

    expect(
      db.prepare(
        `SELECT id, campaign_id, world_id, kind, character_id, controller_user_id, status
         FROM game_actors WHERE id = 'hero'`,
      ).get(),
    ).toMatchObject({
      id: "hero",
      campaign_id: "campaign-1",
      world_id: "world-1",
      kind: "character",
      character_id: "hero",
      controller_user_id: "user-1",
      status: "active",
    });
    expect(
      db.prepare(
        `SELECT actor_id, character_id, turn_order
         FROM game_encounter_participants WHERE id = 'participant-1'`,
      ).get(),
    ).toMatchObject({ actor_id: "hero", character_id: "hero", turn_order: 0 });
    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  });

  it("allows monster actors without manufacturing character records", () => {
    db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON");
    db.exec(migrationsThrough("0010_authoritative_health_lifecycle.sql"));
    seedPreActorRuntime(db);
    db.exec(migration("0011_runtime_game_actors.sql"));

    db.prepare(
      `INSERT INTO game_actors (
        id, campaign_id, world_id, kind, character_id, name, status, metadata
      ) VALUES ('monster-1', 'campaign-1', 'world-1', 'monster', NULL, 'Goblin', 'active', '{}')`,
    ).run();

    expect(
      db.prepare("SELECT kind, character_id FROM game_actors WHERE id = 'monster-1'").get(),
    ).toMatchObject({ kind: "monster", character_id: null });
    expect(() =>
      db?.prepare(
        `INSERT INTO game_actors (
          id, campaign_id, world_id, kind, character_id, name, status, metadata
        ) VALUES ('bad-character', 'campaign-1', 'world-1', 'character', NULL, 'Bad', 'active', '{}')`,
      ).run(),
    ).toThrow(/game_actors_character_link_valid|CHECK constraint failed/i);
    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  });
});
