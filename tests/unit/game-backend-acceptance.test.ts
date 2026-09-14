import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabase } from "@/infrastructure/database/client";
import { performActorAttack } from "@/modules/game/server/actorCombatService";
import { D1ActorHealthStore } from "@/modules/game/server/d1ActorHealthStore";
import { startActorEncounter } from "@/modules/game/server/actorEncounterService";
import { endEncounterTurn, finishEncounter } from "@/modules/game/server/encounterService";
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
  database.exec("PRAGMA foreign_keys = ON");
  for (const file of migrationFiles) {
    database.exec(readFileSync(`${migrationDirectory}/${file}`, "utf8"));
  }
}

function seedActiveMonsterEncounterWorld(database: DatabaseSync) {
  database.exec(`
    INSERT INTO dnd35_sources (id, slug, name, is_official, is_homebrew)
    VALUES ('source-test', 'acceptance', 'Acceptance Test Source', 0, 1);

    INSERT INTO dnd35_creature_types (
      id, source_id, slug, name, description, rules_text, is_homebrew, is_enabled,
      hit_die, skill_points_per_hit_die, bab_progression,
      fort_progression, ref_progression, will_progression
    ) VALUES (
      'type-humanoid', 'source-test', 'humanoid-test', 'Humanoid Test', '', '', 1, 1,
      8, 2, 'three_quarters', 'poor', 'poor', 'poor'
    );

    INSERT INTO dnd35_monsters (
      id, source_id, slug, name, description, rules_text, is_homebrew, is_enabled,
      creature_type_id, challenge_rating_numerator, challenge_rating_denominator,
      hit_dice_numerator, hit_dice_denominator, hit_die, hit_point_bonus,
      size, space_feet, reach_feet, natural_armor, armor_bonus, shield_bonus,
      deflection_bonus, base_attack_bonus, grapple_modifier, fort, ref, will,
      str, dex, con, int, wis, cha
    ) VALUES
      (
        'monster-a-def', 'source-test', 'monster-a', 'Monster A', '', '', 1, 1,
        'type-humanoid', 1, 1, 2, 1, 8, 0,
        'medium', 5, 5, 0, 0, 0, 0, 2, 2, 2, 2, 0,
        10, 10, 10, 10, 10, 10
      ),
      (
        'monster-b-def', 'source-test', 'monster-b', 'Monster B', '', '', 1, 1,
        'type-humanoid', 1, 1, 2, 1, 8, 0,
        'medium', 5, 5, 0, 0, 0, 0, 2, 2, 2, 2, 0,
        10, 10, 10, 10, 10, 10
      );

    INSERT INTO dnd35_monster_attacks (
      id, monster_id, name, kind, attack_mode, routine_key, sequence,
      attack_count, can_use_as_standard, attack_bonus, damage_dice,
      damage_bonus, critical_threat_minimum, critical_multiplier
    ) VALUES
      ('attack-a', 'monster-a-def', 'Claw', 'natural', 'melee', 'primary', 0, 1, 1, 6, '1d6', 0, 20, 2),
      ('attack-b', 'monster-b-def', 'Bite', 'natural', 'melee', 'primary', 0, 1, 1, 5, '1d6', 0, 20, 2);

    INSERT INTO worlds (id, status, generation_seed, settings, generated_at)
    VALUES ('world-1', 'ready', 'acceptance-seed', '{}', 100);

    INSERT INTO campaigns (
      id, owner_user_id, world_id, ruleset_id, ruleset_version, name, slug,
      status, settings, started_at
    ) VALUES (
      'campaign-1', 'owner-1', 'world-1', 'dnd35', '3.5',
      'Acceptance Campaign', 'acceptance-campaign', 'active', '{}', 100
    );

    INSERT INTO game_sessions (id, campaign_id, world_id, ordinal, status, started_at)
    VALUES ('session-1', 'campaign-1', 'world-1', 1, 'active', 100);

    INSERT INTO game_actors (
      id, campaign_id, world_id, kind, character_id, controller_user_id,
      name, status, metadata, created_at, updated_at
    ) VALUES
      ('monster-a', 'campaign-1', 'world-1', 'monster', NULL, NULL, 'Monster A', 'active', '{}', 101, 101),
      ('monster-b', 'campaign-1', 'world-1', 'monster', NULL, NULL, 'Monster B', 'active', '{}', 102, 102);

    INSERT INTO runtime_dnd35_monster_instances (
      actor_id, monster_id, maximum_hit_points, current_hit_points,
      temporary_hit_points, nonlethal_damage, stable, metadata, created_at, updated_at
    ) VALUES
      ('monster-a', 'monster-a-def', 12, 12, 0, 0, 1, '{}', 101, 101),
      ('monster-b', 'monster-b-def', 12, 12, 0, 0, 1, '{}', 102, 102);
  `);
}

function ids(prefix: string) {
  let sequence = 0;
  return () => `${prefix}-${++sequence}`;
}

describe("backend gameplay acceptance", () => {
  it("persists an encounter, mixed actor combat, turn progression, completion, and reload from D1", async () => {
    sqlite = new DatabaseSync(":memory:");
    migrate(sqlite);
    seedActiveMonsterEncounterWorld(sqlite);

    const binding = createSqliteD1(sqlite);
    const db = createDatabase(binding);
    const initiative = [18, 10];

    const encounter = await startActorEncounter(
      {
        db,
        binding,
        createId: ids("encounter"),
        now: () => new Date("2026-09-07T20:00:00Z"),
        rollInitiative: () => initiative.shift() ?? 1,
      },
      { campaignId: "campaign-1", participantIds: ["monster-a", "monster-b"] },
    );

    expect(encounter.eventId).toBe("encounter-2");
    expect(encounter.currentCharacterId).toBe("monster-a");

    const firstAttack = await performActorAttack(
      {
        db,
        binding,
        createId: () => "attack-event-1",
        now: () => new Date("2026-09-07T20:00:01Z"),
      },
      {
        campaignId: "campaign-1",
        attackerId: "monster-a",
        targetId: "monster-b",
        kind: "melee",
        monsterAttackId: "attack-a",
        attackRoll: 15,
        damageRolls: [4],
      },
    );

    expect(firstAttack.attack.hit).toBe(true);
    expect(firstAttack.damage?.total).toBe(4);
    expect(
      sqlite
        .prepare(
          "SELECT current_hit_points FROM runtime_dnd35_monster_instances WHERE actor_id = 'monster-b'",
        )
        .get(),
    ).toMatchObject({ current_hit_points: 8 });
    expect(
      sqlite
        .prepare(
          "SELECT standard_available FROM game_encounter_participants WHERE encounter_id = ? AND actor_id = 'monster-a'",
        )
        .get(encounter.id),
    ).toMatchObject({ standard_available: 0 });

    const turn = await endEncounterTurn(
      {
        db,
        binding,
        createId: () => "turn-event-1",
        now: () => new Date("2026-09-07T20:00:02Z"),
      },
      { campaignId: "campaign-1", encounterId: encounter.id, actorId: "monster-a" },
    );
    expect(turn.currentCharacterId).toBe("monster-b");
    expect(turn.eventId).toBe("turn-event-1");

    const retaliation = await performActorAttack(
      {
        db,
        binding,
        createId: () => "attack-event-2",
        now: () => new Date("2026-09-07T20:00:03Z"),
      },
      {
        campaignId: "campaign-1",
        attackerId: "monster-b",
        targetId: "monster-a",
        kind: "melee",
        monsterAttackId: "attack-b",
        attackRoll: 15,
        damageRolls: [2],
      },
    );
    expect(retaliation.damage?.total).toBe(2);

    const finished = await finishEncounter(
      {
        db,
        binding,
        createId: () => "finish-event-1",
        now: () => new Date("2026-09-07T20:00:04Z"),
      },
      { campaignId: "campaign-1", encounterId: encounter.id, status: "completed" },
    );

    expect(finished.eventId).toBe("finish-event-1");
    expect(finished.sessionId).toBe("session-1");

    // Simulate a cold request/reconnect: create a fresh Drizzle client and
    // reconstruct state from D1 only. No Durable Object state is consulted.
    const reloadedDb = createDatabase(binding);
    const reloaded = await getCampaignGameReadModel(
      { db: reloadedDb, binding },
      { campaignId: "campaign-1", eventLimit: 100 },
    );

    expect(reloaded.encounter).toBeNull();
    expect(reloaded.sequence).toBe(5);
    expect(reloaded.events.map((event) => event.type)).toEqual([
      "encounter.started",
      "combat.attack",
      "encounter.turn_advanced",
      "combat.attack",
      "encounter.completed",
    ]);
    expect(reloaded.actors.find((actor) => actor.id === "monster-a")?.health).toMatchObject({
      maximumHitPoints: 12,
      currentHitPoints: 10,
      stable: true,
    });
    expect(reloaded.actors.find((actor) => actor.id === "monster-b")?.health).toMatchObject({
      maximumHitPoints: 12,
      currentHitPoints: 8,
      stable: true,
    });
    expect(sqlite.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  });
  it.each(["health", "action"])("does not partially commit when %s is stale", async (stale) => {
    sqlite = new DatabaseSync(":memory:");
    migrate(sqlite);
    seedActiveMonsterEncounterWorld(sqlite);
    const binding = createSqliteD1(sqlite);
    const encounter = await startActorEncounter(
      { db: createDatabase(binding), binding, createId: ids("guard"), rollInitiative: () => 10 },
      { campaignId: "campaign-1", participantIds: ["monster-a", "monster-b"] },
    );
    const participant = encounter.participants[0]!;
    const before = {
      health: sqlite.prepare("SELECT * FROM runtime_dnd35_monster_instances").all(),
      participants: sqlite.prepare("SELECT * FROM game_encounter_participants").all(),
      events: sqlite.prepare("SELECT * FROM game_events").all(),
    };
    const committed = await new D1ActorHealthStore(binding).commit({
      event: {
        id: "rejected",
        campaignId: "campaign-1",
        sessionId: "session-1",
        eventType: "combat.attack",
        occurredAt: new Date(),
      },
      health: {
        actorId: "monster-b",
        kind: "monster",
        expected: {
          currentHitPoints: stale === "health" ? 11 : 12,
          temporaryHitPoints: 0,
          nonlethalDamage: 0,
          stable: true,
        },
        next: { currentHitPoints: 8, temporaryHitPoints: 0, nonlethalDamage: 0, stable: true },
      },
      action: {
        encounterId: encounter.id,
        characterId: participant.characterId,
        roundNumber: encounter.roundNumber,
        activeTurnIndex: encounter.activeTurnIndex,
        turnOrder: participant.turnOrder,
        expected: { ...participant, standardAvailable: stale !== "action" },
        next: { ...participant, standardAvailable: false },
      },
    });
    expect(committed).toBe(false);
    expect(sqlite.prepare("SELECT * FROM runtime_dnd35_monster_instances").all()).toEqual(
      before.health,
    );
    expect(sqlite.prepare("SELECT * FROM game_encounter_participants").all()).toEqual(
      before.participants,
    );
    expect(sqlite.prepare("SELECT * FROM game_events").all()).toEqual(before.events);
  });
});
