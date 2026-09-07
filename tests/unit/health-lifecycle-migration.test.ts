import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const migrationDirectory = fileURLToPath(new URL("../../drizzle/", import.meta.url));
const migrations = readdirSync(migrationDirectory)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(`${migrationDirectory}/${file}`, "utf8"))
  .join("\n");

describe("health lifecycle migration", () => {
  it("persists stable state and enforces lethal/healing transitions", () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON");
    db.exec(migrations);

    db.prepare(
      `INSERT INTO dnd35_characters
       (character_id, current_hit_points, temporary_hit_points, nonlethal_damage, stable)
       VALUES (?, ?, 0, 0, ?)`,
    ).run("hero", -4, 1);

    db.prepare("UPDATE dnd35_characters SET current_hit_points = ? WHERE character_id = ?").run(
      -5,
      "hero",
    );
    expect(
      db.prepare("SELECT stable FROM dnd35_characters WHERE character_id = ?").get("hero")?.[
        "stable"
      ],
    ).toBe(0);

    db.prepare("UPDATE dnd35_characters SET stable = 1 WHERE character_id = ?").run("hero");
    db.prepare("UPDATE dnd35_characters SET current_hit_points = ? WHERE character_id = ?").run(
      -3,
      "hero",
    );
    expect(
      db.prepare("SELECT stable FROM dnd35_characters WHERE character_id = ?").get("hero")?.[
        "stable"
      ],
    ).toBe(1);

    db.prepare("UPDATE dnd35_characters SET stable = 0 WHERE character_id = ?").run("hero");
    db.prepare("UPDATE dnd35_characters SET current_hit_points = ? WHERE character_id = ?").run(
      0,
      "hero",
    );
    expect(
      db.prepare("SELECT stable FROM dnd35_characters WHERE character_id = ?").get("hero")?.[
        "stable"
      ],
    ).toBe(1);

    expect(() =>
      db.prepare("UPDATE dnd35_characters SET stable = 2 WHERE character_id = ?").run("hero"),
    ).toThrow(/CHECK/);

    db.close();
  });
});
