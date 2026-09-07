import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabase } from "@/infrastructure/database/client";
import { getCampaignGameReadModel } from "@/modules/game/server/gameReadModelService";
import { createSqliteD1 } from "../helpers/sqliteD1";

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

function seed(database: DatabaseSync) {
  database.exec(`
    INSERT INTO worlds (id, status, generation_seed, settings, generated_at)
    VALUES ('world-1', 'ready', 'seed', '{}', 100);

    INSERT INTO campaigns (
      id, owner_user_id, world_id, ruleset_id, ruleset_version, name, slug,
      status, settings, started_at
    ) VALUES (
      'campaign-1', 'owner-1', 'world-1', 'dnd35', '3.5', 'Campaign', 'campaign',
      'active', '{}', 100
    );

    INSERT INTO game_sessions (id, campaign_id, world_id, ordinal, status, started_at)
    VALUES ('session-1', 'campaign-1', 'world-1', 1, 'active', 100);

    INSERT INTO game_actors (
      id, campaign_id, world_id, kind, character_id, controller_user_id,
      name, status, metadata, created_at, updated_at
    ) VALUES
      ('npc-1', 'campaign-1', 'world-1', 'npc', NULL, NULL, 'Guide', 'active', '{}', 101, 101),
      ('npc-2', 'campaign-1', 'world-1', 'npc', NULL, NULL, 'Bandit', 'active', '{}', 102, 102);

    INSERT INTO game_encounters (
      id, campaign_id, session_id, status, round_number, active_turn_index,
      started_at, created_at, updated_at
    ) VALUES ('encounter-1', 'campaign-1', 'session-1', 'active', 2, 1, 110, 110, 110);

    INSERT INTO game_encounter_participants (
      id, encounter_id, actor_id, character_id, status,
      initiative_roll, initiative_modifier, initiative_total, tie_breaker, turn_order
    ) VALUES
      ('participant-1', 'encounter-1', 'npc-1', NULL, 'active', 15, 1, 16, 1, 0),
      ('participant-2', 'encounter-1', 'npc-2', NULL, 'active', 12, 2, 14, 2, 1);

    INSERT INTO game_events (
      id, campaign_id, session_id, sequence, event_type, occurred_at,
      actor_id, source_id, target_ids, payload, deltas, created_at
    ) VALUES
      ('event-1', 'campaign-1', 'session-1', 1, 'encounter.started', 110,
       NULL, NULL, '["npc-1","npc-2"]', '{"encounterId":"encounter-1"}', '[]', 110),
      ('event-2', 'campaign-1', 'session-1', 2, 'encounter.turn_advanced', 120,
       'npc-1', NULL, '["npc-2"]', '{"roundNumber":2}', '[]', 120);
  `);
}

describe("campaign game read model", () => {
  it("reconstructs authoritative actors, encounter state, and ordered event catch-up from D1", async () => {
    sqlite = new DatabaseSync(":memory:");
    sqlite.exec("PRAGMA foreign_keys = ON");
    migrate(sqlite);
    seed(sqlite);

    const binding = createSqliteD1(sqlite);
    const model = await getCampaignGameReadModel(
      { db: createDatabase(binding), binding },
      { campaignId: "campaign-1", afterSequence: 1 },
    );

    expect(model.schemaVersion).toBe(1);
    expect(model.campaignId).toBe("campaign-1");
    expect(model.worldId).toBe("world-1");
    expect(model.sessionId).toBe("session-1");
    expect(model.ruleset).toEqual({ id: "dnd35", version: "3.5" });
    expect(model.sequence).toBe(2);
    expect(model.actors.map((actor) => actor.id)).toEqual(["npc-1", "npc-2"]);
    expect(model.encounter).toMatchObject({
      id: "encounter-1",
      roundNumber: 2,
      activeTurnIndex: 1,
      currentActorId: "npc-2",
    });
    expect(model.events).toHaveLength(1);
    expect(model.events[0]).toMatchObject({
      id: "event-2",
      sequence: 2,
      type: "encounter.turn_advanced",
      actorId: "npc-1",
      targetIds: ["npc-2"],
    });
  });
});
