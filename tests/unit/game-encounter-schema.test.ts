import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const migrationDirectory = fileURLToPath(new URL("../../drizzle/", import.meta.url));
const migrationFiles = readdirSync(migrationDirectory)
  .filter((file) => file.endsWith(".sql"))
  .sort();

let db: DatabaseSync | null = null;

afterEach(() => {
  db?.close();
  db = null;
});

function migratedDatabase(): DatabaseSync {
  const database = new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys = ON");
  for (const file of migrationFiles) {
    database.exec(readFileSync(`${migrationDirectory}/${file}`, "utf8"));
  }
  return database;
}

function createActiveGame(database: DatabaseSync): void {
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
    `INSERT INTO game_sessions (id, campaign_id, world_id, ordinal, status, started_at)
     VALUES ('session-1', 'campaign-1', 'world-1', 1, 'active', 100)`,
  ).run();
  for (const id of ["hero", "enemy"]) {
    database.prepare(
      `INSERT INTO characters (
        id, campaign_id, owner_user_id, ruleset_id, ruleset_version, name,
        status, metadata, ready_at
      ) VALUES (?, 'campaign-1', 'user-1', 'dnd35', '3.5', ?, 'active', '{}', 90)`,
    ).run(id, id);
    database.prepare(
      `INSERT INTO game_actors (
        id, campaign_id, world_id, kind, character_id, controller_user_id,
        name, status, metadata
      ) VALUES (?, 'campaign-1', 'world-1', 'character', ?, 'user-1', ?, 'active', '{}')`,
    ).run(id, id, id);
  }
}

function createEncounter(database: DatabaseSync, id = "encounter-1"): void {
  database.prepare(
    `INSERT INTO game_encounters (
      id, campaign_id, session_id, status, round_number, active_turn_index, started_at
    ) VALUES (?, 'campaign-1', 'session-1', 'active', 1, 0, 110)`,
  ).run(id);
}

function participantIdentity(id: string): string {
  return id;
}

describe("game encounter persistence", () => {
  it("persists ordered initiative and D&D action economy by runtime actor", () => {
    db = migratedDatabase();
    createActiveGame(db);
    createEncounter(db);

    db.prepare(
      `INSERT INTO game_encounter_participants (
        id, encounter_id, actor_id, character_id, initiative_roll, initiative_modifier,
        initiative_total, tie_breaker, turn_order,
        standard_available, move_available, swift_available, swift_debt_next_turn,
        attacks_of_opportunity_per_round, attacks_of_opportunity_remaining, last_turn_round
      ) VALUES (
        'participant-1', 'encounter-1', 'hero', 'hero', 17, 3, 20, 3, 0,
        1, 1, 1, 0, 2, 2, 1
      )`,
    ).run();

    expect(
      db.prepare(
        `SELECT actor_id, character_id, initiative_total, turn_order, standard_available,
                attacks_of_opportunity_remaining
         FROM game_encounter_participants WHERE id = 'participant-1'`,
      ).get(),
    ).toMatchObject({
      actor_id: "hero",
      character_id: "hero",
      initiative_total: 20,
      turn_order: 0,
      standard_available: 1,
      attacks_of_opportunity_remaining: 2,
    });
    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  });

  it("allows monster actors without fake character rows", () => {
    db = migratedDatabase();
    createActiveGame(db);
    createEncounter(db);

    db.prepare(
      `INSERT INTO game_actors (
        id, campaign_id, world_id, kind, character_id, name, status, metadata
      ) VALUES ('monster-1', 'campaign-1', 'world-1', 'monster', NULL, 'Monster', 'active', '{}')`,
    ).run();
    db.prepare(
      `INSERT INTO game_encounter_participants (
        id, encounter_id, actor_id, character_id, initiative_roll, initiative_modifier,
        initiative_total, tie_breaker, turn_order
      ) VALUES ('monster-turn', 'encounter-1', 'monster-1', NULL, 12, 1, 13, 1, 0)`,
    ).run();

    expect(
      db.prepare(
        `SELECT actor_id, character_id FROM game_encounter_participants
         WHERE id = 'monster-turn'`,
      ).get(),
    ).toMatchObject({ actor_id: "monster-1", character_id: null });
    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  });

  it("allows only one active encounter per session", () => {
    db = migratedDatabase();
    createActiveGame(db);
    createEncounter(db);

    expect(() => createEncounter(db as DatabaseSync, "encounter-2")).toThrow(
      /game_encounters_one_active_per_session_uidx|UNIQUE constraint failed/i,
    );

    db.prepare(
      `UPDATE game_encounters
       SET status = 'completed', ended_at = 120
       WHERE id = 'encounter-1'`,
    ).run();
    expect(() => createEncounter(db as DatabaseSync, "encounter-2")).not.toThrow();
  });

  it("enforces initiative arithmetic and unique turn positions", () => {
    db = migratedDatabase();
    createActiveGame(db);
    createEncounter(db);

    expect(() =>
      db?.prepare(
        `INSERT INTO game_encounter_participants (
          id, encounter_id, actor_id, character_id, initiative_roll, initiative_modifier,
          initiative_total, tie_breaker, turn_order
        ) VALUES ('bad-total', 'encounter-1', 'hero', 'hero', 10, 2, 99, 2, 0)`,
      ).run(),
    ).toThrow(/game_encounter_participants_initiative_total_valid|CHECK constraint failed/i);

    db.prepare(
      `INSERT INTO game_encounter_participants (
        id, encounter_id, actor_id, character_id, initiative_roll, initiative_modifier,
        initiative_total, tie_breaker, turn_order
      ) VALUES ('hero-turn', 'encounter-1', 'hero', 'hero', 10, 2, 12, 2, 0)`,
    ).run();

    expect(() =>
      db?.prepare(
        `INSERT INTO game_encounter_participants (
          id, encounter_id, actor_id, character_id, initiative_roll, initiative_modifier,
          initiative_total, tie_breaker, turn_order
        ) VALUES ('enemy-turn', 'encounter-1', 'enemy', 'enemy', 15, 1, 16, 1, 0)`,
      ).run(),
    ).toThrow(/game_encounter_participants_turn_order_uidx|UNIQUE constraint failed/i);
  });

  it("requires an end timestamp for completed or abandoned encounters", () => {
    db = migratedDatabase();
    createActiveGame(db);

    expect(() =>
      db?.prepare(
        `INSERT INTO game_encounters (
          id, campaign_id, session_id, status, round_number, active_turn_index, started_at
        ) VALUES ('bad-ended', 'campaign-1', 'session-1', 'completed', 1, 0, 110)`,
      ).run(),
    ).toThrow(/game_encounters_end_timestamp_valid|CHECK constraint failed/i);
  });

  it("cascades participants when an encounter is deleted", () => {
    db = migratedDatabase();
    createActiveGame(db);
    createEncounter(db);
    const hero = participantIdentity("hero");
    db.prepare(
      `INSERT INTO game_encounter_participants (
        id, encounter_id, actor_id, character_id, initiative_roll, initiative_modifier,
        initiative_total, tie_breaker, turn_order
      ) VALUES ('participant-1', 'encounter-1', ?, ?, 10, 2, 12, 2, 0)`,
    ).run(hero, hero);

    db.prepare("DELETE FROM game_encounters WHERE id = 'encounter-1'").run();
    expect(
      db.prepare("SELECT COUNT(*) AS count FROM game_encounter_participants").get(),
    ).toMatchObject({ count: 0 });
    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  });
});
