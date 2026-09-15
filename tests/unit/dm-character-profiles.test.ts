import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  loadDmCampaignCharacterProfiles,
  serializeDmCampaignCharacterProfiles,
  type DmCampaignCharacterProfile,
} from "@/modules/campaigns/server/dmCharacterProfiles";
import { composeDmConversationContext } from "@/modules/campaigns/server/dmTurnRuntime";

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

/** Minimal D1 compatibility layer for the profile loader's raw read queries. */
function d1(database: DatabaseSync): D1Database {
  return {
    prepare(sql: string) {
      let bindings: unknown[] = [];
      const prepared = {
        bind(...values: unknown[]) {
          bindings = values;
          return prepared;
        },
        async first<T>(column?: string): Promise<T | null> {
          const row = database.prepare(sql).get(...bindings) as Record<string, unknown> | undefined;
          if (!row) return null;
          return (column ? row[column] : row) as T;
        },
        async all<T>() {
          return {
            results: database.prepare(sql).all(...bindings) as T[],
            success: true,
            meta: {},
          };
        },
      };
      return prepared;
    },
  } as unknown as D1Database;
}

function seedCampaigns(database: DatabaseSync) {
  database.exec(`
    INSERT INTO users (id, name, email)
    VALUES ('user-1', 'Player One', 'player-one@example.test');

    INSERT INTO worlds (id, status, generation_seed, settings, generated_at)
    VALUES
      ('world-1', 'ready', 'seed-1', '{}', 100),
      ('world-2', 'ready', 'seed-2', '{}', 100);

    INSERT INTO campaigns (
      id, owner_user_id, world_id, ruleset_id, ruleset_version, name, slug,
      status, game_master_mode, settings, started_at
    ) VALUES
      ('campaign-1', 'user-1', 'world-1', 'dnd35', '3.5', 'Campaign One', 'campaign-one',
       'active', 'ai', '{}', 100),
      ('campaign-2', 'user-1', 'world-2', 'dnd35', '3.5', 'Campaign Two', 'campaign-two',
       'active', 'ai', '{}', 100);

    INSERT INTO characters (
      id, campaign_id, owner_user_id, ruleset_id, ruleset_version, name, status,
      metadata, ready_at, created_at, updated_at
    ) VALUES
      ('hero-1', 'campaign-1', 'user-1', 'dnd35', '3.5', 'Ari', 'ready',
       '{"pronouns":"they/them","playerNotes":"Protect the old shrine.","extensions":{"goal":"ascension"}}',
       101, 101, 101),
      ('hero-2', 'campaign-1', 'user-1', 'dnd35', '3.5', 'Bram', 'ready',
       '{"pronouns":"he/him","playerNotes":"Distrusts dragons."}',
       102, 102, 102),
      ('other-hero', 'campaign-2', 'user-1', 'dnd35', '3.5', 'Other', 'ready',
       '{}', 103, 103, 103);

    INSERT INTO dnd35_characters (character_id, experience_points, alignment)
    VALUES
      ('hero-1', 3200, 'CG'),
      ('hero-2', 1250, 'LN'),
      ('other-hero', 999999, 'CE');

    INSERT INTO dnd35_character_ability_scores (character_id, ability, base_score)
    VALUES
      ('hero-1', 'str', 10), ('hero-1', 'dex', 14), ('hero-1', 'con', 12),
      ('hero-1', 'int', 16), ('hero-1', 'wis', 13), ('hero-1', 'cha', 8),
      ('hero-2', 'str', 16), ('hero-2', 'dex', 10), ('hero-2', 'con', 14),
      ('hero-2', 'int', 9), ('hero-2', 'wis', 12), ('hero-2', 'cha', 11);
  `);
}

describe("AI DM campaign character profiles", () => {
  it("loads every character in the requested campaign and excludes other campaigns", async () => {
    sqlite = new DatabaseSync(":memory:");
    sqlite.exec("PRAGMA foreign_keys = ON");
    migrate(sqlite);
    seedCampaigns(sqlite);

    const profiles = await loadDmCampaignCharacterProfiles(d1(sqlite), "campaign-1");

    expect(profiles.map((profile) => profile.character.id)).toEqual(["hero-1", "hero-2"]);
    expect(profiles.some((profile) => profile.character.id === "other-hero")).toBe(false);

    expect(profiles[0]).toMatchObject({
      character: {
        name: "Ari",
        pronouns: "they/them",
        playerNotes: "Protect the old shrine.",
        metadata: { extensions: { goal: "ascension" } },
      },
      dnd35: {
        alignment: "CG",
        experiencePoints: 3200,
        progressionMode: "standard",
      },
    });
    expect(profiles[0]?.abilityBreakdown).toHaveLength(6);
    expect(profiles[1]).toMatchObject({
      character: { name: "Bram", playerNotes: "Distrusts dragons." },
      dnd35: { alignment: "LN", experiencePoints: 1250 },
    });
  });

  it("serializes all supplied party profiles without silently dropping a later character", () => {
    const profiles = [
      { character: { id: "hero-1", name: "Ari" }, feats: [{ name: "Alertness" }] },
      {
        character: { id: "hero-2", name: "Bram" },
        inventory: [{ name: "Silvered sword" }],
        knownSpells: [{ name: "Light" }],
      },
    ] as unknown as DmCampaignCharacterProfile[];

    const serialized = serializeDmCampaignCharacterProfiles(profiles);
    expect(serialized).toContain('"id":"hero-1"');
    expect(serialized).toContain("Alertness");
    expect(serialized).toContain('"id":"hero-2"');
    expect(serialized).toContain("Silvered sword");
    expect(serialized).toContain("Light");
  });

  it("keeps full character sheets separate from private OOC and public campaign dialogue", () => {
    const context = composeDmConversationContext({
      characterProfilesJson: '[{"character":{"id":"hero-1","name":"Ari"}}]',
      privateOoc: "Player: I want the story to lean into political intrigue.",
      campaign: "Ari: I greet the ambassador.",
    });

    expect(context).toContain("Authoritative current campaign character sheets");
    expect(context).toContain("Knowing another character's sheet does NOT grant permission");
    expect(context).toContain("Private OOC · DM context for this player");
    expect(context).toContain("Shared campaign table");
    expect(context.indexOf("Authoritative current campaign character sheets")).toBeLessThan(
      context.indexOf("Private OOC · DM context for this player"),
    );
    expect(context.indexOf("Private OOC · DM context for this player")).toBeLessThan(
      context.indexOf("Shared campaign table"),
    );
  });
});
