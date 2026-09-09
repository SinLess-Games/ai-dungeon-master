import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { expect, it } from "vitest";

const PSIHB_SEED_DIRS = [
  "seeds/psionics-handbook-classes",
  "seeds/psionics-handbook-feats",
  "seeds/psionics-handbook-powers",
] as const;

function listSqlFiles(path: string): string[] {
  return readdirSync(path)
    .sort((a, b) => a.localeCompare(b))
    .flatMap((name) => {
      const child = join(path, name);
      if (statSync(child).isDirectory()) return listSqlFiles(child);
      return name.endsWith(".sql") ? [child] : [];
    });
}

function execFile(db: DatabaseSync, path: string): void {
  db.exec(readFileSync(path, "utf8"));
}

function seedPsionicsHandbook(db: DatabaseSync): void {
  for (const directory of PSIHB_SEED_DIRS) {
    for (const file of listSqlFiles(directory)) execFile(db, file);
  }
}

function scalar(db: DatabaseSync, sql: string): number {
  return Number(db.prepare(sql).get()?.["n"] ?? 0);
}

it("seeds the current D&D 3.0 Psionics Handbook catalogs idempotently", () => {
  const db = new DatabaseSync(":memory:");

  try {
    db.exec("PRAGMA foreign_keys = ON");
    execFile(db, "drizzle/0000_dnd35_schema.sql");
    execFile(db, "drizzle/0015_psionics_seed_support.sql");
    execFile(db, "drizzle/0016_power_class_level_costs.sql");
    execFile(db, "drizzle/0017_power_discipline_assignments.sql");

    seedPsionicsHandbook(db);

    const firstCounts = {
      classes: scalar(db, "SELECT count(*) AS n FROM dnd35_classes WHERE source_id='ph3e-3.0'"),
      feats: scalar(db, "SELECT count(*) AS n FROM dnd35_feats WHERE source_id='ph3e-3.0'"),
      powers: scalar(db, "SELECT count(*) AS n FROM dnd35_powers WHERE source_id='ph3e-3.0'"),
      disciplineCatalog: scalar(
        db,
        "SELECT count(*) AS n FROM dnd35_power_disciplines WHERE source_id='ph3e-3.0'",
      ),
      descriptorCatalog: scalar(
        db,
        "SELECT count(*) AS n FROM dnd35_spell_descriptors WHERE source_id='ph3e-3.0'",
      ),
    };

    expect(firstCounts).toEqual({
      classes: 6,
      feats: 52,
      powers: 195,
      disciplineCatalog: 6,
      descriptorCatalog: 18,
    });

    seedPsionicsHandbook(db);

    expect({
      classes: scalar(db, "SELECT count(*) AS n FROM dnd35_classes WHERE source_id='ph3e-3.0'"),
      feats: scalar(db, "SELECT count(*) AS n FROM dnd35_feats WHERE source_id='ph3e-3.0'"),
      powers: scalar(db, "SELECT count(*) AS n FROM dnd35_powers WHERE source_id='ph3e-3.0'"),
      disciplineCatalog: scalar(
        db,
        "SELECT count(*) AS n FROM dnd35_power_disciplines WHERE source_id='ph3e-3.0'",
      ),
      descriptorCatalog: scalar(
        db,
        "SELECT count(*) AS n FROM dnd35_spell_descriptors WHERE source_id='ph3e-3.0'",
      ),
    }).toEqual(firstCounts);

    for (const table of ["dnd35_classes", "dnd35_feats", "dnd35_powers"]) {
      expect(
        db
          .prepare(
            `SELECT slug, count(*) AS n
             FROM ${table}
             WHERE owner_user_id IS NULL
             GROUP BY slug
             HAVING count(*) > 1`,
          )
          .all(),
      ).toEqual([]);
    }

    expect(
      db
        .prepare(
          `SELECT slug
           FROM dnd35_powers
           WHERE source_id='ph3e-3.0'
             AND (
               discipline_id IS NULL OR
               manifesting_time IS NULL OR manifesting_time='' OR
               range_text IS NULL OR range_text='' OR
               duration_text IS NULL OR duration_text='' OR
               power_resistance IS NULL OR power_points IS NULL
             )`,
        )
        .all(),
    ).toEqual([]);

    expect(
      db
        .prepare(
          `SELECT slug, discipline_id, power_points
           FROM dnd35_powers
           WHERE slug IN ('ph3e-ablating','ph3e-astral-construct-i')
           ORDER BY slug`,
        )
        .all(),
    ).toEqual([
      {
        slug: "ph3e-ablating",
        discipline_id: "ph3e-power-discipline-psychokinesis",
        power_points: 11,
      },
      {
        slug: "ph3e-astral-construct-i",
        discipline_id: "ph3e-power-discipline-metacreativity",
        power_points: 1,
      },
    ]);

    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  } finally {
    db.close();
  }
});
