import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const directory = fileURLToPath(new URL("../../drizzle/", import.meta.url));
const files = readdirSync(directory).filter((file) => file.endsWith(".sql")).sort();

function migration(name: string): string {
  return readFileSync(`${directory}/${name}`, "utf8");
}

function through(name: string): string {
  return files.filter((file) => file <= name).map(migration).join("\n");
}

let db: DatabaseSync | null = null;
afterEach(() => {
  db?.close();
  db = null;
});

describe("runtime D&D effect profile migration", () => {
  it("creates an application-runtime adapter without weakening source identity", () => {
    db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON");
    db.exec(through("0012_runtime_dnd35_effect_profiles.sql"));

    const columns = db
      .prepare("PRAGMA table_info('runtime_dnd35_effect_profiles')")
      .all() as Array<{ name: string; notnull: number }>;
    expect(columns.map((column) => column.name)).toEqual([
      "id",
      "source_kind",
      "spell_id",
      "power_id",
      "sequence",
      "effect",
      "created_at",
      "updated_at",
    ]);

    expect(() =>
      db?.prepare(
        `INSERT INTO runtime_dnd35_effect_profiles
          (id, source_kind, spell_id, power_id, sequence, effect)
         VALUES ('bad-source', 'spell', NULL, NULL, 0, '{}')`,
      ).run(),
    ).toThrow(/source_link_valid|CHECK constraint failed/i);

    expect(() =>
      db?.prepare(
        `INSERT INTO runtime_dnd35_effect_profiles
          (id, source_kind, spell_id, power_id, sequence, effect)
         VALUES ('bad-json', 'spell', NULL, NULL, 0, 'not-json')`,
      ).run(),
    ).toThrow(/CHECK constraint failed/i);

    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  });
});
