import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabase } from "@/infrastructure/database/client";
import { configureCharacterInventory } from "@/modules/game/server/inventoryConfigurationService";
import { createSqliteD1 } from "../helpers/sqliteD1";

const databases: DatabaseSync[] = [];
afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function harness() {
  const sqlite = new DatabaseSync(":memory:");
  databases.push(sqlite);
  sqlite.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE campaigns (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      world_id TEXT,
      ruleset_id TEXT NOT NULL,
      ruleset_version TEXT NOT NULL
    );
    CREATE TABLE game_sessions (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      world_id TEXT NOT NULL,
      status TEXT NOT NULL,
      ordinal INTEGER NOT NULL
    );
    CREATE TABLE game_actors (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      character_id TEXT,
      status TEXT NOT NULL
    );
    CREATE TABLE dnd35_items (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL
    );
    CREATE TABLE dnd35_magic_items (
      item_id TEXT PRIMARY KEY,
      slot TEXT
    );
    CREATE TABLE dnd35_character_inventory (
      id TEXT PRIMARY KEY,
      character_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      location TEXT NOT NULL,
      equipped INTEGER NOT NULL DEFAULT 0,
      equipped_slot TEXT,
      notes TEXT,
      updated_at INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE game_events (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      occurred_at INTEGER NOT NULL,
      actor_id TEXT,
      source_id TEXT,
      target_ids TEXT NOT NULL,
      payload TEXT NOT NULL,
      deltas TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(campaign_id, sequence)
    );

    INSERT INTO campaigns (id, status, world_id, ruleset_id, ruleset_version)
    VALUES ('campaign-1', 'active', 'world-1', 'dnd35', '3.5');
    INSERT INTO game_sessions (id, campaign_id, world_id, status, ordinal)
    VALUES ('session-1', 'campaign-1', 'world-1', 'active', 1);
    INSERT INTO game_actors (id, campaign_id, kind, character_id, status)
    VALUES ('hero-1', 'campaign-1', 'character', 'hero-1', 'active');
    INSERT INTO dnd35_items (id, slug, name, category)
    VALUES ('longsword', 'longsword', 'Longsword', 'weapon'),
           ('chain-shirt', 'chain-shirt', 'Chain Shirt', 'armor'),
           ('cloak', 'cloak-of-resistance', 'Cloak of Resistance', 'magic'),
           ('ring-protection', 'ring-of-protection-1', 'Ring of Protection +1', 'magic'),
           ('ring-invisibility', 'ring-of-invisibility', 'Ring of Invisibility', 'magic');
    INSERT INTO dnd35_magic_items (item_id, slot)
    VALUES ('cloak', 'shoulders'),
           ('ring-protection', 'other'),
           ('ring-invisibility', 'other');
    INSERT INTO dnd35_character_inventory
      (id, character_id, item_id, location, equipped, equipped_slot, notes)
    VALUES
      ('longsword-stack', 'hero-1', 'longsword', 'carried', 0, NULL, NULL),
      ('armor-stack', 'hero-1', 'chain-shirt', 'carried', 0, NULL, NULL),
      ('cloak-stack', 'hero-1', 'cloak', 'carried', 0, NULL, NULL),
      ('ring-protection-stack', 'hero-1', 'ring-protection', 'carried', 0, NULL, NULL),
      ('ring-invisibility-stack', 'hero-1', 'ring-invisibility', 'carried', 0, NULL, NULL);
  `);
  const binding = createSqliteD1(sqlite);
  return { sqlite, binding, db: createDatabase(binding) };
}

describe("authoritative inventory configuration", () => {
  it("equips a valid item, emits an event, and persists the new placement", async () => {
    const { sqlite, binding, db } = harness();
    const result = await configureCharacterInventory(
      { db, binding, createId: () => "event-1", now: () => new Date("2026-09-15T02:00:00Z") },
      {
        campaignId: "campaign-1",
        actorId: "hero-1",
        inventoryId: "longsword-stack",
        equippedSlot: "main_hand",
        notes: "Primary weapon",
        reason: "The player equips the longsword.",
      },
    );

    expect(result).toMatchObject({
      changed: true,
      eventId: "event-1",
      sessionId: "session-1",
      inventoryId: "longsword-stack",
      after: {
        location: "carried",
        equipped: true,
        equippedSlot: "main_hand",
        notes: "Primary weapon",
      },
    });
    expect(
      sqlite
        .prepare(
          "SELECT location, equipped, equipped_slot AS equippedSlot, notes FROM dnd35_character_inventory WHERE id = ?",
        )
        .get("longsword-stack"),
    ).toMatchObject({
      location: "carried",
      equipped: 1,
      equippedSlot: "main_hand",
      notes: "Primary weapon",
    });
    expect(
      sqlite.prepare("SELECT event_type AS eventType FROM game_events WHERE id = ?").get("event-1"),
    ).toEqual({ eventType: "inventory.item.configured" });
  });

  it("automatically unequips an item moved out of carried inventory", async () => {
    const { sqlite, binding, db } = harness();
    sqlite.exec(
      "UPDATE dnd35_character_inventory SET equipped = 1, equipped_slot = 'body' WHERE id = 'armor-stack'",
    );

    const result = await configureCharacterInventory(
      { db, binding, createId: () => "event-store", now: () => new Date("2026-09-15T02:01:00Z") },
      {
        campaignId: "campaign-1",
        actorId: "hero-1",
        inventoryId: "armor-stack",
        location: "stored",
        reason: "The player stores the armor.",
      },
    );

    expect(result.after).toMatchObject({
      location: "stored",
      equipped: false,
      equippedSlot: null,
    });
  });

  it("keeps inventory arrangement auditable while campaign play is paused", async () => {
    const { sqlite, binding, db } = harness();
    sqlite.exec("UPDATE campaigns SET status = 'paused' WHERE id = 'campaign-1'");

    const result = await configureCharacterInventory(
      { db, binding, createId: () => "event-paused", now: () => new Date("2026-09-15T02:02:00Z") },
      {
        campaignId: "campaign-1",
        actorId: "hero-1",
        inventoryId: "longsword-stack",
        equippedSlot: "main_hand",
        reason: "The player organizes equipment between sessions.",
      },
    );

    expect(result).toMatchObject({
      changed: true,
      eventId: "event-paused",
      sessionId: "session-1",
      after: { equipped: true, equippedSlot: "main_hand" },
    });
    expect(
      sqlite.prepare("SELECT event_type AS eventType FROM game_events WHERE id = ?").get("event-paused"),
    ).toEqual({ eventType: "inventory.item.configured" });
  });

  it("maps standard ring catalog entries to the two exclusive ring slots", async () => {
    const { binding, db } = harness();

    const first = await configureCharacterInventory(
      { db, binding, createId: () => "event-ring-left" },
      {
        campaignId: "campaign-1",
        actorId: "hero-1",
        inventoryId: "ring-protection-stack",
        equippedSlot: "ring_left",
        reason: "The player equips a ring.",
      },
    );
    expect(first.after.equippedSlot).toBe("ring_left");

    await expect(
      configureCharacterInventory(
        { db, binding, createId: () => "event-ring-conflict" },
        {
          campaignId: "campaign-1",
          actorId: "hero-1",
          inventoryId: "ring-invisibility-stack",
          equippedSlot: "ring_left",
          reason: "The player tries to reuse the occupied ring slot.",
        },
      ),
    ).rejects.toThrow("GAME_INVENTORY_SLOT_OCCUPIED");

    const second = await configureCharacterInventory(
      { db, binding, createId: () => "event-ring-right" },
      {
        campaignId: "campaign-1",
        actorId: "hero-1",
        inventoryId: "ring-invisibility-stack",
        equippedSlot: "ring_right",
        reason: "The player equips a second ring.",
      },
    );
    expect(second.after.equippedSlot).toBe("ring_right");
  });

  it("rejects item categories placed into impossible equipment slots", async () => {
    const { binding, db } = harness();
    await expect(
      configureCharacterInventory(
        { db, binding },
        {
          campaignId: "campaign-1",
          actorId: "hero-1",
          inventoryId: "longsword-stack",
          equippedSlot: "body",
          reason: "Invalid test placement.",
        },
      ),
    ).rejects.toThrow("GAME_INVENTORY_SLOT_INVALID");

    await expect(
      configureCharacterInventory(
        { db, binding },
        {
          campaignId: "campaign-1",
          actorId: "hero-1",
          inventoryId: "cloak-stack",
          equippedSlot: "ring_left",
          reason: "Invalid test placement.",
        },
      ),
    ).rejects.toThrow("GAME_INVENTORY_SLOT_INVALID");
  });

  it("prevents mutually exclusive hand slots", async () => {
    const { sqlite, binding, db } = harness();
    sqlite.exec(
      "UPDATE dnd35_character_inventory SET equipped = 1, equipped_slot = 'both_hands' WHERE id = 'longsword-stack'",
    );
    sqlite.exec(`
      INSERT INTO dnd35_items (id, slug, name, category)
      VALUES ('dagger', 'dagger', 'Dagger', 'weapon');
      INSERT INTO dnd35_character_inventory
        (id, character_id, item_id, location, equipped, equipped_slot, notes)
      VALUES ('dagger-stack', 'hero-1', 'dagger', 'carried', 0, NULL, NULL);
    `);

    await expect(
      configureCharacterInventory(
        { db, binding },
        {
          campaignId: "campaign-1",
          actorId: "hero-1",
          inventoryId: "dagger-stack",
          equippedSlot: "main_hand",
          reason: "The player tries to equip another weapon.",
        },
      ),
    ).rejects.toThrow("GAME_INVENTORY_SLOT_OCCUPIED");
  });
});
