import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { expect, it } from "vitest";

const XPH_SEED_DIRS = [
  "seeds/expanded-psionics-handbook-classes",
  "seeds/expanded-psionics-handbook-feats",
  "seeds/expanded-psionics-handbook-powers",
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

function seedXph(db: DatabaseSync): void {
  for (const directory of XPH_SEED_DIRS) {
    for (const file of listSqlFiles(directory)) execFile(db, file);
  }
}

function scalar(db: DatabaseSync, sql: string): number {
  return Number(db.prepare(sql).get()?.["n"] ?? 0);
}

it("seeds the Expanded Psionics Handbook idempotently and preserves exact psionics data", () => {
  const db = new DatabaseSync(":memory:");

  try {
    db.exec("PRAGMA foreign_keys = ON");
    execFile(db, "drizzle/0000_dnd35_schema.sql");
    execFile(db, "drizzle/0015_psionics_seed_support.sql");
    execFile(db, "drizzle/0016_power_class_level_costs.sql");

    seedXph(db);

    const firstCounts = {
      classes: scalar(db, "SELECT count(*) AS n FROM dnd35_classes WHERE source_id='xph-3.5'"),
      feats: scalar(db, "SELECT count(*) AS n FROM dnd35_feats WHERE source_id='xph-3.5'"),
      powers: scalar(db, "SELECT count(*) AS n FROM dnd35_powers WHERE source_id='xph-3.5'"),
      powerLevels: scalar(db, "SELECT count(*) AS n FROM dnd35_power_class_levels"),
      displays: scalar(db, "SELECT count(*) AS n FROM dnd35_power_display_assignments"),
      descriptors: scalar(db, "SELECT count(*) AS n FROM dnd35_power_descriptor_assignments"),
    };

    expect(firstCounts.classes).toBe(13);
    expect(firstCounts.feats).toBe(80);
    // 3.5 SRD/XPH power-description inventory represented by the A-W seed batches.
    expect(firstCounts.powers).toBe(287);

    // Re-running the complete source must not create additional canonical content
    // or duplicate relationship rows.
    seedXph(db);
    expect({
      classes: scalar(db, "SELECT count(*) AS n FROM dnd35_classes WHERE source_id='xph-3.5'"),
      feats: scalar(db, "SELECT count(*) AS n FROM dnd35_feats WHERE source_id='xph-3.5'"),
      powers: scalar(db, "SELECT count(*) AS n FROM dnd35_powers WHERE source_id='xph-3.5'"),
      powerLevels: scalar(db, "SELECT count(*) AS n FROM dnd35_power_class_levels"),
      displays: scalar(db, "SELECT count(*) AS n FROM dnd35_power_display_assignments"),
      descriptors: scalar(db, "SELECT count(*) AS n FROM dnd35_power_descriptor_assignments"),
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
           WHERE source_id='xph-3.5'
             AND (
               discipline_id IS NULL OR
               manifesting_time IS NULL OR manifesting_time='' OR
               range_text IS NULL OR range_text='' OR
               duration_text IS NULL OR duration_text='' OR
               power_resistance IS NULL OR
               power_points IS NULL
             )`,
        )
        .all(),
    ).toEqual([]);

    // Biofeedback is the canonical example of why the list relation needs its
    // own power-point cost: Psion/Wilder 2nd-level (3 PP), Psychic Warrior
    // 1st-level (1 PP).
    expect(
      db
        .prepare(
          `SELECT c.slug AS class_slug, pcl.power_level, pcl.power_points
           FROM dnd35_power_class_levels pcl
           JOIN dnd35_powers p ON p.id=pcl.power_id
           JOIN dnd35_classes c ON c.id=pcl.class_id
           WHERE p.slug='biofeedback'
           ORDER BY c.slug`,
        )
        .all(),
    ).toEqual([
      { class_slug: "psion", power_level: 2, power_points: 3 },
      { class_slug: "psychic-warrior", power_level: 1, power_points: 1 },
      { class_slug: "wilder", power_level: 2, power_points: 3 },
    ]);

    // Another asymmetric list entry guards against accidentally deriving PP
    // solely from power level.
    expect(
      db
        .prepare(
          `SELECT c.slug AS class_slug, pcl.power_level, pcl.power_points
           FROM dnd35_power_class_levels pcl
           JOIN dnd35_powers p ON p.id=pcl.power_id
           JOIN dnd35_classes c ON c.id=pcl.class_id
           WHERE p.slug='oak-body'
           ORDER BY c.slug`,
        )
        .all(),
    ).toEqual([
      { class_slug: "psion", power_level: 7, power_points: 13 },
      { class_slug: "psychic-warrior", power_level: 5, power_points: 9 },
      { class_slug: "wilder", power_level: 7, power_points: 13 },
    ]);

    expect(
      db
        .prepare(
          `SELECT pcl.power_level, pcl.power_points, pd.slug AS specialist
           FROM dnd35_power_class_levels pcl
           JOIN dnd35_powers p ON p.id=pcl.power_id
           LEFT JOIN dnd35_power_disciplines pd ON pd.id=pcl.specialist_discipline_id
           WHERE p.slug='genesis'`,
        )
        .get(),
    ).toEqual({ power_level: 9, power_points: 17, specialist: "metacreativity" });

    // The older Psionics Handbook uses 0-level talents. Confirm the schema
    // support migration accepts a legal level-0 list relation without leaving
    // test data behind.
    db.exec("SAVEPOINT xph_zero_level_check");
    db.exec(
      `INSERT INTO dnd35_power_class_levels
         (power_id,class_id,power_level,power_points,specialist_discipline_id)
       SELECT p.id,c.id,0,0,NULL
       FROM dnd35_powers p
       JOIN dnd35_classes c ON c.slug='psychic-warrior' AND c.owner_user_id IS NULL
       WHERE p.slug='genesis' AND p.owner_user_id IS NULL`,
    );
    expect(
      db
        .prepare(
          `SELECT count(*) AS n
           FROM dnd35_power_class_levels pcl
           JOIN dnd35_powers p ON p.id=pcl.power_id
           JOIN dnd35_classes c ON c.id=pcl.class_id
           WHERE p.slug='genesis' AND c.slug='psychic-warrior' AND pcl.power_level=0`,
        )
        .get()?.["n"],
    ).toBe(1);
    db.exec("ROLLBACK TO xph_zero_level_check");
    db.exec("RELEASE xph_zero_level_check");

    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  } finally {
    db.close();
  }
});
