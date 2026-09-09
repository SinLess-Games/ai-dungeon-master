import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { expect, it } from "vitest";

const RULE_SEED_DIRS = ["seeds/dmg-rules", "seeds/dmg2-rules"] as const;

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
    | { mechanics: string }
    | undefined;
  return JSON.parse(row?.mechanics ?? "{}");
}

it("seeds DMG and DMG II rules idempotently without duplicate canonical slugs", () => {
  const db = new DatabaseSync(":memory:");

  try {
    db.exec("PRAGMA foreign_keys = ON");
    execFile(db, "drizzle/0000_dnd35_schema.sql");
    execFile(db, "drizzle/0018_rules_catalog.sql");

    seedRules(db);

    expect({
      dmg: scalar(db, "SELECT count(*) AS n FROM dnd35_rules WHERE source_id='dmg-3.5'"),
      dmg2: scalar(db, "SELECT count(*) AS n FROM dnd35_rules WHERE source_id='dmg2-3.5'"),
    }).toEqual({ dmg: 195, dmg2: 146 });

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
        "SELECT count(*) AS n FROM dnd35_rules WHERE is_variant=1 AND default_enabled<>0",
      ),
    ).toBe(0);

    expect(
      scalar(
        db,
        "SELECT count(*) AS n FROM dnd35_rules WHERE tags IS NULL OR json_valid(tags)=0 OR mechanics IS NULL OR json_valid(mechanics)=0",
      ),
    ).toBe(0);

    expect(mechanics(db, "dmg-best-friend")).toMatchObject({
      favorable_modifier: 2,
      unfavorable_modifier: -2,
    });
    expect(mechanics(db, "dmg-evasion-pursuit-short")).toMatchObject({
      check: "dexterity",
      opposed: true,
    });
    expect(mechanics(db, "dmg-drowning")).toMatchObject({
      initial_check_dc: 10,
      dc_increase_per_round: 1,
    });
    expect(mechanics(db, "dmg-defense-roll-variant")).toMatchObject({
      defense_roll: "1d20 + (AC - 10)",
      round_reuse_option: true,
    });
    expect(mechanics(db, "dmg-save-dc-formulas")).toMatchObject({
      misc_dc_min: 10,
      misc_dc_max: 20,
      misc_default_dc: 15,
    });
    expect(mechanics(db, "dmg-encounter-difficulty-mix")).toMatchObject({
      recommended_percent: {
        easy: 10,
        easy_if_handled_properly: 20,
        challenging: 50,
        very_difficult: 15,
        overpowering: 5,
      },
    });

    expect(mechanics(db, "dmg2-mob-trample")).toMatchObject({
      damage: "2d6 + 1.5 * Strength modifier",
      reflex_dc: "25 + Strength modifier",
    });
    expect(mechanics(db, "dmg2-team-benefit-rate")).toMatchObject({
      hit_dice_per_benefit: 4,
    });
    expect(mechanics(db, "dmg2-companion-spirit-acquisition")).toMatchObject({
      min_members: 2,
      max_members: 8,
      min_hd: 4,
      min_int: 3,
      ritual_hours: 1,
      spellcraft_dc: 15,
      reagent_gp_per_member: 300,
      xp_per_member: 300,
      take_10: true,
    });
    expect(mechanics(db, "dmg2-business-profit-check")).toMatchObject({
      term: "month",
      take_10_min_primary_skill_ranks: 1,
      take_20: false,
      profit_rating: "profit check result - 25",
    });
    expect(mechanics(db, "dmg2-mentor-favor-check")).toMatchObject({
      dc: { small: 15, large: 25, huge: 40 },
      mentor_score_change_per_request: -1,
    });
    expect(mechanics(db, "dmg2-pitspawned-template")).toMatchObject({
      weapon: { added_cost_gp: 1000, critical_confirmation_bonus: 2 },
    });

    expect(
      db
        .prepare(
          `SELECT default_enabled
           FROM dnd35_rules
           WHERE slug IN ('dmg2-mobs','dmg2-running-business','dmg2-teamwork-benefits','dmg2-companion-spirits')
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
