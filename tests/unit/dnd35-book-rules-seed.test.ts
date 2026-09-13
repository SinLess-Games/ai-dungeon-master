import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { expect, it } from "vitest";

const RULE_SEED_DIRS = [
  "seeds/dnd3-5/phb-rules",
  "seeds/dnd3-5/phb2-rules",
  "seeds/dnd3-5/expanded-psionics-handbook-rules",
  "seeds/dnd3-5/psionics-handbook-rules",
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
  db.exec(readFileSync(path, "utf8").replaceAll("--> statement-breakpoint", ""));
}

function seedRules(db: DatabaseSync): void {
  for (const directory of RULE_SEED_DIRS) {
    for (const file of listSqlFiles(directory)) execFile(db, file);
  }
}

function scalar(db: DatabaseSync, sql: string): number {
  return Number(db.prepare(sql).get()?.["n"] ?? 0);
}

function mechanics(db: DatabaseSync, slug: string): Record<string, unknown> {
  const row = db.prepare("SELECT mechanics FROM dnd35_rules WHERE slug=?").get(slug) as
    { mechanics: string } | undefined;
  return JSON.parse(row?.mechanics ?? "{}");
}

it("seeds PHB, PHB II, XPH, and legacy Psionics Handbook rules idempotently", () => {
  const db = new DatabaseSync(":memory:");

  try {
    db.exec("PRAGMA foreign_keys = ON");
    execFile(db, "drizzle/0000_dnd35_schema.sql");
    execFile(db, "drizzle/0018_rules_catalog.sql");

    seedRules(db);

    expect(
      scalar(db, "SELECT count(*) AS n FROM dnd35_rules WHERE source_id='phb-3.5'"),
    ).toBeGreaterThanOrEqual(40);
    expect(
      scalar(db, "SELECT count(*) AS n FROM dnd35_rules WHERE source_id='phb2-3.5'"),
    ).toBeGreaterThanOrEqual(20);
    expect(
      scalar(db, "SELECT count(*) AS n FROM dnd35_rules WHERE source_id='xph-3.5'"),
    ).toBeGreaterThanOrEqual(30);
    expect(
      scalar(db, "SELECT count(*) AS n FROM dnd35_rules WHERE source_id='ph3e-3.0'"),
    ).toBeGreaterThanOrEqual(20);

    const firstCount = scalar(db, "SELECT count(*) AS n FROM dnd35_rules");
    seedRules(db);
    expect(scalar(db, "SELECT count(*) AS n FROM dnd35_rules")).toBe(firstCount);

    expect(
      db
        .prepare(
          `SELECT slug, count(*) AS n
           FROM dnd35_rules
           WHERE owner_user_id IS NULL
           GROUP BY slug
           HAVING count(*) > 1`,
        )
        .all(),
    ).toEqual([]);

    expect(
      scalar(
        db,
        `SELECT count(*) AS n
         FROM dnd35_rules
         WHERE source_id IN ('phb-3.5','phb2-3.5','xph-3.5','ph3e-3.0')
           AND is_variant=1 AND default_enabled<>0`,
      ),
    ).toBe(0);

    expect(
      scalar(
        db,
        `SELECT count(*) AS n
         FROM dnd35_rules
         WHERE source_id IN ('phb-3.5','phb2-3.5','xph-3.5','ph3e-3.0')
           AND (tags IS NULL OR json_valid(tags)=0 OR mechanics IS NULL OR json_valid(mechanics)=0)`,
      ),
    ).toBe(0);

    expect(mechanics(db, "phb-combat-round")).toMatchObject({ seconds_per_round: 6 });
    expect(mechanics(db, "phb-initiative")).toMatchObject({
      check: "1d20 + Dexterity modifier",
      order: "descending",
    });
    expect(mechanics(db, "phb-disabled")).toMatchObject({
      normal_hp: 0,
      speed_multiplier: 0.5,
      strenuous_action_damage: 1,
    });
    expect(mechanics(db, "phb-primary-source-precedence")).toMatchObject({
      text_over_table: true,
    });

    expect(mechanics(db, "phb2-immediate-action")).toMatchObject({
      usable_out_of_turn: true,
      out_of_turn_consumes_next_swift: true,
      usable_while_flat_footed: false,
    });
    expect(mechanics(db, "phb2-teamwork-training")).toMatchObject({
      initial_training_weeks: 2,
      maintenance_training_periods_per_year: 4,
      new_member_training_weeks: 2,
    });
    expect(mechanics(db, "phb2-class-level-rebuilding")).toMatchObject({
      levels_replaceable: "ceil(character level / 5)",
    });

    expect(mechanics(db, "xph-power-point-limit")).toMatchObject({
      maximum_points_spent: "manifester level",
    });
    expect(mechanics(db, "xph-power-save-dc")).toMatchObject({
      formula: "10 + power level + key ability modifier",
    });
    expect(mechanics(db, "xph-psionic-focus")).toMatchObject({
      minimum_power_points_available: 1,
      gain_action: "full-round",
      gain_concentration_dc: 20,
    });
    expect(mechanics(db, "xph-power-resistance")).toMatchObject({
      check: "1d20 + manifester level",
      success: "result >= power resistance",
    });

    expect(mechanics(db, "ph3e-power-save-dc")).toMatchObject({
      formula: "d20 + power level + key ability modifier",
    });
    expect(mechanics(db, "ph3e-zero-level-talents")).toMatchObject({
      free_uses_per_day: "psion level + 3",
      cost_after_free_uses: 1,
    });
    expect(mechanics(db, "ph3e-psionic-combat-actions")).toMatchObject({
      attack_mode_provokes_aoo: true,
      defense_mode_provokes_aoo: false,
    });

    expect(
      db
        .prepare(
          `SELECT default_enabled
           FROM dnd35_rules
           WHERE slug IN ('phb2-retraining','xph-saving-throw-d20-variant','xph-psionics-are-different','ph3e-psionic-combat')
           ORDER BY slug`,
        )
        .all(),
    ).toEqual([
      { default_enabled: 0 },
      { default_enabled: 0 },
      { default_enabled: 0 },
      { default_enabled: 0 },
    ]);

    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  } finally {
    db.close();
  }
});
