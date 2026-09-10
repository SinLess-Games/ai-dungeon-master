import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import type { SQLInputValue } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { is } from "drizzle-orm";
import { SQLiteTable, getTableConfig } from "drizzle-orm/sqlite-core";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "@/infrastructure/database/schema";
import type { PrerequisiteExpression } from "@/infrastructure/database/schema/dnd35";

const migrationDirectory = fileURLToPath(new URL("../../drizzle/", import.meta.url));
const migration = readdirSync(migrationDirectory)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(`${migrationDirectory}/${file}`, "utf8"))
  .join("\n");
let db: DatabaseSync;

/** Fixture identifiers are local constants; values always use bound parameters. */
function insert(table: string, row: Record<string, SQLInputValue>) {
  const columns = Object.keys(row);
  return db
    .prepare(
      `INSERT INTO "dnd35_${table}" (${columns.map((key) => `"${key}"`).join(",")}) VALUES (${columns.map(() => "?").join(",")})`,
    )
    .run(...Object.values(row));
}
function content(table: string, id: string, extra: Record<string, SQLInputValue> = {}) {
  return insert(table, { id, source_id: "source", slug: id, name: id, ...extra });
}
function character(id = "character") {
  insert("characters", { character_id: id });
}
function classDefinition(id: string, category = "base") {
  content("classes", id, {
    category,
    hit_die: 6,
    skill_points_per_level: 2,
    bab_progression: "half",
    fort_progression: "poor",
    ref_progression: "poor",
    will_progression: "good",
  });
}
function classLevel(id: string, classId: string, level = 1) {
  insert("class_levels", {
    id,
    class_id: classId,
    level,
    base_attack_bonus: 0,
    fort: 0,
    ref: 0,
    will: 2,
  });
}
function castingTrack(id = "track", owner = "character", tradition = "arcane") {
  classDefinition(`${id}-class`);
  insert("class_spellcasting", {
    id: `${id}-definition`,
    class_id: `${id}-class`,
    tradition,
    casting_mode: tradition === "psionic" ? "psionic" : "prepared",
    casting_ability: "int",
    known_behavior: tradition === "psionic" ? "limited" : "spellbook",
    progression_key: id,
  });
  insert("character_casting_tracks", {
    id,
    character_id: owner,
    class_spellcasting_id: `${id}-definition`,
  });
}
function spell(id = "spell") {
  content("spell_schools", `${id}-school`);
  content("spells", id, {
    school_id: `${id}-school`,
    casting_time: "1 standard action",
    range_text: "Touch",
    duration_text: "Instantaneous",
    spell_resistance: "no",
  });
}

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(migration);
  insert("sources", { id: "source", slug: "fixture", name: "Test source" });
});
afterEach(() => {
  expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  db.close();
});

describe("D&D 3.5 SQLite migration", () => {
  it("applies every exported table and compiles all foreign-key relationships", () => {
    const exported = Object.values(schema)
      .filter((value) => is(value, SQLiteTable))
      .map((table) => getTableConfig(table).name)
      .sort();
    const actual = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all()
      .map((row) => row["name"]);
    expect(actual).toEqual(exported);
    expect(exported.filter((name) => name.startsWith("dnd35_")).length).toBe(102);
    for (const name of exported) {
      // SQLite detects invalid composite FK targets when preparing DML, not CREATE TABLE.
      expect(() => db.prepare(`DELETE FROM "${name}" WHERE 0`).run()).not.toThrow();
    }
    expect(db.prepare("PRAGMA integrity_check").get()?.["integrity_check"]).toBe("ok");
  });

  it("round-trips Drizzle UUID, boolean, timestamp and typed JSON values", async () => {
    const orm = drizzle(
      async (query, params, method) => {
        const statement = db.prepare(query);
        if (method === "run") {
          statement.run(...params);
          return { rows: [] };
        }
        statement.setReturnArrays(true);
        return { rows: statement.all(...params) };
      },
      { schema },
    );
    const expression: PrerequisiteExpression = {
      version: 1,
      condition: {
        kind: "all",
        conditions: [
          { kind: "ability", ability: "str", minimum: 13 },
          {
            kind: "any",
            conditions: [
              { kind: "character_level", minimum: 6 },
              {
                kind: "custom",
                description: "Test rule",
                extension: { key: "test:permission", version: 1, parameters: { permitted: true } },
              },
            ],
          },
        ],
      },
    };
    const [feat] = await orm
      .insert(schema.feats)
      .values({ sourceId: "source", slug: "test", name: "Test", isHomebrew: true })
      .returning();
    expect(feat?.id).toMatch(/^[a-f0-9-]{36}$/);
    expect(feat?.createdAt).toBeInstanceOf(Date);
    expect(feat?.isHomebrew).toBe(true);
    if (!feat) throw new Error("Expected inserted feat");
    await orm.insert(schema.featPrerequisites).values({ featId: feat.id, expression });
    const [prerequisite] = await orm.select().from(schema.featPrerequisites);
    expect(prerequisite?.expression).toEqual(expression);
  });

  it("keeps official/shared and owner-scoped slugs unique, including NULL ownership", () => {
    content("feats", "shared", { slug: "same" });
    expect(() => content("feats", "duplicate", { slug: "same" })).toThrow(/UNIQUE/);
    content("feats", "alice", { slug: "same", owner_user_id: "alice", is_homebrew: 1 });
    content("feats", "bob", { slug: "same", owner_user_id: "bob", is_homebrew: 1 });
    expect(() =>
      content("feats", "alice-duplicate", { slug: "same", owner_user_id: "alice" }),
    ).toThrow(/UNIQUE/);
    expect(() => content("feats", "blank", { name: " " })).toThrow(/CHECK/);
    expect(() => content("feats", "owner", { owner_user_id: "" })).toThrow(/CHECK/);
    expect(() => content("feats", "missing", { source_id: "missing" })).toThrow(/FOREIGN KEY/);
    expect(() => db.prepare("DELETE FROM dnd35_sources WHERE id = 'source'").run()).toThrow(
      /FOREIGN KEY/,
    );
    expect(() =>
      insert("sources", { id: "duplicate", slug: "fixture", name: "Duplicate" }),
    ).toThrow(/UNIQUE/);
  });

  it("constrains all six ability keys, nonabilities, integers and damage/drain", () => {
    character();
    for (const ability of schema.abilityKeys) {
      insert("character_ability_scores", { character_id: "character", ability, base_score: 10 });
    }
    expect(() =>
      insert("character_ability_scores", {
        character_id: "character",
        ability: "str",
        base_score: 10,
      }),
    ).toThrow(/UNIQUE/);
    expect(() =>
      insert("character_ability_scores", {
        character_id: "character",
        ability: "luck",
        base_score: 10,
      }),
    ).toThrow(/CHECK/);
    for (const value of [-1, 10.5]) {
      expect(() =>
        db
          .prepare("UPDATE dnd35_character_ability_scores SET base_score = ? WHERE ability = 'str'")
          .run(value),
      ).toThrow(/CHECK/);
    }
    db.exec("UPDATE dnd35_character_ability_scores SET base_score = NULL WHERE ability = 'con'");
    expect(() =>
      db.exec("UPDATE dnd35_character_ability_scores SET ability_damage = 1 WHERE ability = 'con'"),
    ).toThrow(/CHECK/);
    db.exec(
      "UPDATE dnd35_character_ability_scores SET ability_damage = 2, ability_drain = 1, temporary_adjustment = -2 WHERE ability = 'str'",
    );
  });

  it("stores fractional cross-class ranks and independent skill specializations", () => {
    character();
    content("skills", "craft", { ability: "int", requires_specialization: 1 });
    insert("character_skills", {
      character_id: "character",
      skill_id: "craft",
      specialization: "alchemy",
      ranks: 2.5,
    });
    insert("character_skills", {
      character_id: "character",
      skill_id: "craft",
      specialization: "weapons",
      ranks: 3,
    });
    for (const ranks of [-1, 0.25]) {
      expect(() =>
        insert("character_skills", {
          character_id: "character",
          skill_id: "craft",
          specialization: "bad",
          ranks,
        }),
      ).toThrow(/CHECK/);
    }
  });

  it("stores ordered base/prestige/NPC multiclassing and a second gestalt track", () => {
    character();
    for (const [id, category] of [
      ["base", "base"],
      ["prestige", "prestige"],
      ["npc", "npc"],
    ]) {
      classDefinition(id!, category!);
      classLevel(`${id}-1`, id!);
    }
    ["base", "npc", "prestige"].forEach((id, i) =>
      insert("character_class_levels", {
        id,
        character_id: "character",
        class_level_id: `${id}-1`,
        character_level: i + 1,
        hit_points_gained: 4,
      }),
    );
    insert("character_class_levels", {
      id: "parallel",
      character_id: "character",
      class_level_id: "npc-1",
      character_level: 1,
      track: 2,
      hit_points_gained: 4,
    });
    expect(() =>
      insert("character_class_levels", {
        id: "duplicate",
        character_id: "character",
        class_level_id: "base-1",
        character_level: 4,
        hit_points_gained: 4,
      }),
    ).toThrow(/UNIQUE/);
    expect(() => classLevel("fractional", "base", 1.5)).toThrow(/CHECK/);
    expect(() => classLevel("zero", "base", 0)).toThrow(/CHECK/);
  });

  it("allows repeated feat choices while rejecting duplicate occurrences and malformed prerequisites", () => {
    character();
    content("feats", "repeatable", { repeatable: 1, choice_kind: "skill" });
    for (const occurrence of [1, 2]) {
      insert("character_feats", {
        id: `feat-${occurrence}`,
        character_id: "character",
        feat_id: "repeatable",
        occurrence,
        grant_kind: "level",
        choices: '[{"key":"skill","contentId":"craft"}]',
      });
    }
    expect(() =>
      insert("character_feats", {
        id: "duplicate",
        character_id: "character",
        feat_id: "repeatable",
        grant_kind: "level",
      }),
    ).toThrow(/UNIQUE/);
    for (const expression of ["bad json", "[]", "null", "1"]) {
      expect(() => insert("feat_prerequisites", { feat_id: "repeatable", expression })).toThrow(
        /CHECK/,
      );
    }
    insert("feat_prerequisites", {
      feat_id: "repeatable",
      expression: '{"version":1,"condition":{"kind":"all","conditions":[]}}',
    });
    expect(() =>
      insert("feat_benefits", {
        id: "bad",
        feat_id: "repeatable",
        kind: "ability_bonus",
        description: "Missing numeric modifier",
      }),
    ).toThrow(/CHECK/);
    insert("feat_benefits", {
      id: "valid",
      feat_id: "repeatable",
      kind: "ability_bonus",
      ability: "str",
      amount: 2,
      bonus_type: "enhancement",
      description: "Test modifier",
    });
  });

  it("keeps class spell lists and per-level progression relational, including bonus-only slots", () => {
    character();
    castingTrack();
    spell();
    classLevel("level-1", "track-class");
    insert("spell_class_levels", { spell_id: "spell", class_id: "track-class", spell_level: 0 });
    expect(() =>
      insert("spell_class_levels", { spell_id: "spell", class_id: "track-class", spell_level: 1 }),
    ).toThrow(/UNIQUE/);
    insert("class_spellcasting_progression", {
      class_id: "track-class",
      track_key: "primary",
      class_level: 1,
      spell_level: 1,
      slots_per_day: 0,
    });
    expect(() =>
      insert("class_spellcasting_progression", {
        class_id: "track-class",
        track_key: "missing",
        class_level: 1,
        spell_level: 1,
      }),
    ).toThrow(/FOREIGN KEY/);
    insert("spell_components", {
      id: "material",
      spell_id: "spell",
      code: "M",
      alternative_group: "focus",
      cost_copper: 50,
      is_consumed: 1,
    });
    insert("spell_components", {
      id: "focus",
      spell_id: "spell",
      code: "DF",
      alternative_group: "focus",
    });
    expect(() =>
      insert("spell_components", { id: "bad", spell_id: "spell", code: "V", xp_cost: 10 }),
    ).toThrow(/CHECK/);
  });

  it("separates known spells, multiple books, preparations and metamagic", () => {
    character();
    castingTrack();
    spell();
    insert("character_spells", { casting_track_id: "track", spell_id: "spell" });
    for (const id of ["book-a", "book-b"]) {
      insert("character_spellbooks", { id, character_id: "character", name: id });
      insert("character_spellbook_spells", { spellbook_id: id, spell_id: "spell", pages: 1 });
    }
    insert("character_spell_preparations", {
      id: "prepared",
      casting_track_id: "track",
      spell_id: "spell",
      slot_level: 2,
      prepared_count: 2,
      expended_count: 1,
    });
    content("feats", "metamagic");
    insert("character_preparation_metamagic", { preparation_id: "prepared", feat_id: "metamagic" });
    expect(() =>
      db.exec("UPDATE dnd35_character_spell_preparations SET expended_count = 3"),
    ).toThrow(/CHECK/);
    db.exec("DELETE FROM dnd35_character_spellbooks WHERE id = 'book-a'");
    expect(
      db.prepare("SELECT count(*) AS count FROM dnd35_character_spellbook_spells").get()?.["count"],
    ).toBe(1);
    expect(
      db.prepare("SELECT count(*) AS count FROM dnd35_character_spells").get()?.["count"],
    ).toBe(1);
  });

  it("rejects cross-character spellbook and casting-advancement links", () => {
    character();
    character("other");
    castingTrack();
    castingTrack("other-track", "other");
    classDefinition("prestige", "prestige");
    classLevel("prestige-1", "prestige");
    insert("class_casting_advancements", {
      id: "advance",
      class_level_id: "prestige-1",
      selection_key: "arcane",
      tradition: "arcane",
    });
    insert("character_class_levels", {
      id: "gain",
      character_id: "character",
      class_level_id: "prestige-1",
      character_level: 5,
      hit_points_gained: 4,
    });
    expect(() =>
      insert("character_casting_advancements", {
        character_id: "character",
        advancement_id: "advance",
        character_class_level_id: "gain",
        casting_track_id: "other-track",
      }),
    ).toThrow(/FOREIGN KEY/);
    insert("character_casting_advancements", {
      character_id: "character",
      advancement_id: "advance",
      character_class_level_id: "gain",
      casting_track_id: "track",
    });
    content("items", "book", { category: "gear" });
    insert("character_inventory", { id: "other-book", character_id: "other", item_id: "book" });
    expect(() =>
      insert("character_spellbooks", {
        id: "stolen",
        character_id: "character",
        name: "Wrong owner",
        inventory_id: "other-book",
      }),
    ).toThrow(/FOREIGN KEY/);
  });

  it("supports psionic discipline access, display, augmentation and known powers", () => {
    character();
    castingTrack("psionic", "character", "psionic");
    content("power_disciplines", "discipline");
    content("powers", "power", {
      discipline_id: "discipline",
      manifesting_time: "1 standard action",
      range_text: "Personal",
      duration_text: "1 round",
      power_resistance: "no",
      power_points: 1,
      augmentation:
        '[{"additionalPowerPoints":2,"repeatable":true,"description":"Test augmentation"}]',
    });
    insert("power_class_levels", {
      power_id: "power",
      class_id: "psionic-class",
      power_level: 1,
      specialist_discipline_id: "discipline",
    });
    insert("power_display_assignments", { power_id: "power", display: "mental" });
    insert("character_powers", { casting_track_id: "psionic", power_id: "power" });
    expect(() => db.exec("UPDATE dnd35_power_class_levels SET power_level = -1")).toThrow(/CHECK/);
    expect(() => db.exec("UPDATE dnd35_powers SET power_points = -1")).toThrow(/CHECK/);
  });

  it("supports feat and innate casting access without requiring a class", () => {
    character();
    content("feats", "grant");
    content("special_abilities", "innate", { category: "spell_like" });
    insert("character_casting_tracks", {
      id: "feat-track",
      character_id: "character",
      granted_feat_id: "grant",
    });
    insert("character_casting_tracks", {
      id: "innate-track",
      character_id: "character",
      granted_special_ability_id: "innate",
    });
    expect(() =>
      insert("character_casting_tracks", { id: "no-source", character_id: "character" }),
    ).toThrow(/CHECK/);
    expect(() =>
      insert("character_casting_tracks", {
        id: "two-sources",
        character_id: "character",
        granted_feat_id: "grant",
        granted_special_ability_id: "innate",
      }),
    ).toThrow();
    spell();
    insert("character_spells", {
      casting_track_id: "innate-track",
      spell_id: "spell",
      access_kind: "granted",
    });
  });

  it("keeps ordinary stacks separate from unique instances and enforces container ownership", () => {
    character();
    character("other");
    content("items", "sword", { category: "weapon" });
    content("items", "bag", { category: "container" });
    insert("item_instances", { id: "unique-sword", item_id: "sword", remaining_charges: 3 });
    insert("character_inventory", {
      id: "stack",
      character_id: "character",
      item_id: "sword",
      quantity: 3,
    });
    insert("character_inventory", {
      id: "unique",
      character_id: "character",
      item_id: "sword",
      instance_id: "unique-sword",
      equipped: 1,
      equipped_slot: "main_hand",
    });
    expect(() =>
      insert("character_inventory", {
        id: "second-owner",
        character_id: "other",
        item_id: "sword",
        instance_id: "unique-sword",
      }),
    ).toThrow(/UNIQUE/);
    expect(() =>
      db.exec("UPDATE dnd35_character_inventory SET quantity = 2 WHERE id = 'unique'"),
    ).toThrow(/CHECK/);
    expect(() =>
      insert("character_inventory", {
        id: "wrong-definition",
        character_id: "other",
        item_id: "bag",
        instance_id: "unique-sword",
      }),
    ).toThrow();
    insert("character_inventory", { id: "container", character_id: "character", item_id: "bag" });
    insert("character_inventory", {
      id: "contained",
      character_id: "character",
      item_id: "sword",
      container_inventory_id: "container",
    });
    expect(() =>
      insert("character_inventory", {
        id: "wrong-owner",
        character_id: "other",
        item_id: "sword",
        container_inventory_id: "container",
      }),
    ).toThrow(/FOREIGN KEY/);
    expect(() =>
      db.exec(
        "UPDATE dnd35_character_inventory SET container_inventory_id = id WHERE id = 'container'",
      ),
    ).toThrow(/CHECK/);
    expect(() =>
      db.exec("UPDATE dnd35_character_inventory SET quantity = 1.5 WHERE id = 'stack'"),
    ).toThrow(/CHECK/);
    expect(() => db.exec("DELETE FROM dnd35_character_inventory WHERE id = 'container'")).toThrow(
      /FOREIGN KEY/,
    );
    // Deleting the extension can remove a whole nested inventory in one cascade.
    db.exec("DELETE FROM dnd35_characters WHERE character_id = 'character'");
    expect(
      db.prepare("SELECT count(*) AS count FROM dnd35_character_inventory").get()?.["count"],
    ).toBe(0);
    expect(db.prepare("SELECT count(*) AS count FROM dnd35_item_instances").get()?.["count"]).toBe(
      1,
    );
  });

  it("models weapon size/end damage and prevents invalid armor percentages", () => {
    content("items", "weapon", { category: "weapon" });
    insert("weapons", {
      item_id: "weapon",
      proficiency: "martial",
      handedness: "two_handed",
      attack_kind: "melee",
    });
    for (const size of ["small", "medium"])
      for (const weaponEnd of [1, 2]) {
        insert("weapon_damage", { weapon_id: "weapon", size, weapon_end: weaponEnd, dice: "1d6" });
      }
    content("items", "armor", { category: "armor" });
    insert("armors", {
      item_id: "armor",
      category: "heavy",
      ac_bonus: 8,
      armor_check_penalty: -6,
      arcane_spell_failure_percent: 35,
    });
    for (const percent of [-1, 101, 0.5]) {
      expect(() =>
        db.prepare("UPDATE dnd35_armors SET arcane_spell_failure_percent = ?").run(percent),
      ).toThrow(/CHECK/);
    }
    expect(() => db.exec("UPDATE dnd35_weapons SET critical_multiplier = 1")).toThrow(/CHECK/);
  });

  it("stores fractional monster CR, nonabilities, subtypes, attacks and templates", () => {
    content("creature_types", "type");
    content("creature_subtypes", "subtype");
    content("monsters", "stat-block", {
      creature_type_id: "type",
      challenge_rating_numerator: 1,
      challenge_rating_denominator: 3,
      hit_dice_numerator: 1,
      hit_die: 8,
      size: "small",
      space_feet: 5,
      reach_feet: 5,
      base_attack_bonus: 0,
      fort: 0,
      ref: 0,
      will: 2,
      con: null,
    });
    insert("monster_subtypes", { monster_id: "stat-block", subtype_id: "subtype" });
    insert("monster_movements", {
      monster_id: "stat-block",
      mode: "fly",
      feet: 30,
      maneuverability: "good",
    });
    content("templates", "template", { kind: "acquired" });
    insert("monster_templates", {
      monster_id: "stat-block",
      template_id: "template",
      application_order: 0,
    });
    insert("monster_attacks", {
      id: "attack",
      monster_id: "stat-block",
      name: "Test attack",
      kind: "natural",
      attack_mode: "melee",
      attack_bonus: 1,
      damage_dice: "1d4",
      attack_count: 2,
    });
    expect(() => db.exec("UPDATE dnd35_monsters SET challenge_rating_denominator = 0")).toThrow(
      /CHECK/,
    );
    expect(() => db.exec("UPDATE dnd35_monsters SET con = -1")).toThrow(/CHECK/);
    db.exec("DELETE FROM dnd35_monsters WHERE id = 'stat-block'");
    expect(db.prepare("SELECT count(*) AS count FROM dnd35_monster_attacks").get()?.["count"]).toBe(
      0,
    );
    expect(db.prepare("SELECT count(*) AS count FROM dnd35_templates").get()?.["count"]).toBe(1);
  });

  it("preserves separate active condition instances and validates duration state", () => {
    character();
    content("conditions", "condition");
    insert("character_conditions", {
      id: "first",
      character_id: "character",
      condition_id: "condition",
      duration_kind: "rounds",
      remaining_rounds: 3,
    });
    insert("character_conditions", {
      id: "second",
      character_id: "character",
      condition_id: "condition",
      duration_kind: "permanent",
    });
    expect(() =>
      insert("character_conditions", {
        id: "invalid",
        character_id: "character",
        condition_id: "condition",
        duration_kind: "until_time",
      }),
    ).toThrow(/CHECK/);
    expect(() => db.exec("DELETE FROM dnd35_conditions WHERE id = 'condition'")).toThrow(
      /FOREIGN KEY/,
    );
    db.exec("DELETE FROM dnd35_characters WHERE character_id = 'character'");
    expect(
      db.prepare("SELECT count(*) AS count FROM dnd35_character_conditions").get()?.["count"],
    ).toBe(0);
    expect(db.prepare("SELECT count(*) AS count FROM dnd35_conditions").get()?.["count"]).toBe(1);
  });
});
