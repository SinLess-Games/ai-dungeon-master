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

function openMigratedDatabase(): DatabaseSync {
  const database = new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys = ON");
  for (const file of migrationFiles) {
    database.exec(readFileSync(`${migrationDirectory}/${file}`, "utf8"));
  }
  return database;
}

describe("level-one character creator baseline", () => {
  it("seeds a collision-resistant core race and class catalog", () => {
    db = openMigratedDatabase();

    expect(
      db
        .prepare(
          `SELECT id, slug, is_official, is_homebrew
           FROM dnd35_sources
           WHERE id = 'ec-srd35-core-v1'`,
        )
        .get(),
    ).toMatchObject({
      id: "ec-srd35-core-v1",
      slug: "endless-codex-srd35-core-v1",
      is_official: 0,
      is_homebrew: 0,
    });

    const races = db
      .prepare(
        `SELECT name, size, base_speed_feet
         FROM dnd35_races
         WHERE source_id = 'ec-srd35-core-v1'
         ORDER BY name`,
      )
      .all();
    expect(races).toHaveLength(7);
    expect(races.map((race) => race.name)).toEqual([
      "Dwarf",
      "Elf",
      "Gnome",
      "Half-Elf",
      "Half-Orc",
      "Halfling",
      "Human",
    ]);

    const classes = db
      .prepare(
        `SELECT c.name, c.hit_die, l.id AS level_one_id
         FROM dnd35_classes c
         JOIN dnd35_class_levels l ON l.class_id = c.id AND l.level = 1
         WHERE c.source_id = 'ec-srd35-core-v1' AND c.category = 'base'
         ORDER BY c.name`,
      )
      .all();
    expect(classes).toHaveLength(11);
    expect(classes.map((characterClass) => characterClass.name)).toContain("Fighter");
    expect(classes.map((characterClass) => characterClass.name)).toContain("Wizard");
    expect(classes.every((characterClass) => Boolean(characterClass.level_one_id))).toBe(true);

    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  });

  it("stores the core racial ability adjustments used by creator previews and HP", () => {
    db = openMigratedDatabase();

    const dwarf = db
      .prepare(
        `SELECT ability, modifier
         FROM dnd35_race_abilities
         WHERE race_id = 'ec-srd35-race-dwarf-v1'
         ORDER BY ability`,
      )
      .all();
    expect(dwarf).toEqual([
      { ability: "cha", modifier: -2 },
      { ability: "con", modifier: 2 },
    ]);

    const elfCon = db
      .prepare(
        `SELECT modifier
         FROM dnd35_race_abilities
         WHERE race_id = 'ec-srd35-race-elf-v1' AND ability = 'con'`,
      )
      .get();
    expect(elfCon).toMatchObject({ modifier: -2 });
  });
});
