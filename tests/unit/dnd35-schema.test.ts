import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { getTableConfig, SQLiteTable } from "drizzle-orm/sqlite-core";
import { is } from "drizzle-orm";
import * as schema from "@/infrastructure/database/schema/dnd35";
import migration from "../../drizzle/0000_dnd35_schema.sql?raw";

let db: Database.Database;

function sql(): string {
  return migration.replaceAll("--> statement-breakpoint", "");
}

function insert(table: string, values: Record<string, unknown>) {
  const columns = Object.keys(values);
  const placeholders = columns.map(() => "?").join(", ");
  db.prepare(
    `INSERT INTO dnd35_${table} (${columns.join(", ")}) VALUES (${placeholders})`,
  ).run(...Object.values(values));
}

function source(id = "source") {
  insert("sources", {
    id,
    name: id,
    abbreviation: id.slice(0, 8),
    source_type: "rulebook",
    publication_status: "official",
    is_enabled: 1,
  });
}

function content(table: string, id: string, extra: Record<string, unknown> = {}) {
  insert(table, {
    id,
    source_id: "source",
    slug: id,
    name: id,
    description: "",
    rules_text: "",
    is_homebrew: 0,
    is_enabled: 1,
    ...extra,
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
    will: 0,
  });
}

function castingTrack(id = "casting", characterId = "character", classId = "track-class") {
  content("classes", classId, {
    class_kind: "base",
    hit_die: 6,
    skill_points_per_level: 2,
    bab_progression: "half",
    fort_progression: "poor",
    ref_progression: "poor",
    will_progression: "good",
  });
  insert("class_spellcasting", {
    id: `${id}-definition`,
    class_id: classId,
    track_key: "primary",
    tradition: "arcane",
    casting_mode: "prepared",
    casting_ability: "int",
    list_behavior: "own",
    known_behavior: "spellbook",
    progression_key: "default",
  });
  insert("character_casting_tracks", {
    id,
    character_id: characterId,
    class_spellcasting_id: `${id}-definition`,
  });
}

function spell(id = "spell") {
  content("spell_schools", `${id}-school`);
  content("spells", id, {
    school_id: `${id}-school`,
    casting_time: "1 standard action",
    action_type: "standard",
    range_text: "Close",
    duration_text: "Instantaneous",
    spell_resistance: "no",
  });
}

beforeEach(() => {
  db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(sql());
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
    expect(exported.filter((name) => name.startsWith("dnd35_")).length).toBe(95);
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
        if (method === "run") return statement.run(...params);
        if (method === "all") return statement.all(...params);
        if (method === "get") return statement.get(...params);
        return statement.values(...params);
      },
      { schema },
    );
    source();
    content("races", "race", {
      size: "medium",
      creature_type_id: null,
      base_land_speed: 30,
      racial_hit_dice: 0,
      racial_hit_die: 8,
      racial_bab_progression: "full",
      racial_fort_progression: "poor",
      racial_ref_progression: "poor",
      racial_will_progression: "poor",
      level_adjustment: 0,
      natural_armor: 0,
    });
    insert("characters", {
      character_id: "character",
      race_id: "race",
      alignment: "N",
      current_hit_points: 1,
      progression_mode: "standard",
      encumbrance_enabled: 1,
    });
    const row = await orm.select().from(schema.dnd35Characters).get();
    expect(row?.characterId).toBe("character");
    expect(row?.encumbranceEnabled).toBe(true);
    expect(row?.createdAt).toBeInstanceOf(Date);
  });

  it("keeps official/shared and owner-scoped slugs unique, including NULL ownership", () => {
    source();
    content("skills", "skill", { ability: "dex" });
    expect(() => content("skills", "skill-2", { slug: "skill", ability: "dex" })).toThrow(/UNIQUE/);
    content("skills", "homebrew-a", { slug: "custom", is_homebrew: 1, owner_user_id: "u1", ability: "dex" });
    content("skills", "homebrew-b", { slug: "custom", is_homebrew: 1, owner_user_id: "u2", ability: "dex" });
    expect(() =>
      content("skills", "homebrew-c", { slug: "custom", is_homebrew: 1, owner_user_id: "u1", ability: "dex" }),
    ).toThrow(/UNIQUE/);
  });

  it("constrains all six ability keys, nonabilities, integers and damage/drain", () => {
    source();
    content("creature_types", "type");
    content("races", "race", {
      size: "medium",
      creature_type_id: "type",
      base_land_speed: 30,
      racial_hit_dice: 0,
      racial_hit_die: 8,
      racial_bab_progression: "full",
      racial_fort_progression: "poor",
      racial_ref_progression: "poor",
      racial_will_progression: "poor",
      level_adjustment: 0,
      natural_armor: 0,
    });
    insert("characters", { character_id: "character", race_id: "race", alignment: "N" });
    for (const ability of ["str", "dex", "con", "int", "wis", "cha"]) {
      insert("character_ability_scores", {
        character_id: "character",
        ability,
        base_score: 10,
        inherent_bonus: 0,
        temporary_adjustment: 0,
        ability_damage: 0,
        ability_drain: 0,
      });
    }
    expect(() =>
      insert("character_ability_scores", {
        character_id: "character",
        ability: "luck",
        base_score: 10,
      }),
    ).toThrow(/CHECK/);
    expect(() =>
      db.exec("UPDATE dnd35_character_ability_scores SET ability_damage = -1 WHERE ability = 'str'"),
    ).toThrow(/CHECK/);
  });

  it("stores fractional cross-class ranks and independent skill specializations", () => {
    source();
    content("skills", "knowledge", { ability: "int", requires_specialization: 1 });
    insert("characters", { character_id: "character", alignment: "N" });
    insert("character_skills", {
      character_id: "character",
      skill_id: "knowledge",
      specialization: "arcana",
      ranks: 1.5,
    });
    insert("character_skills", {
      character_id: "character",
      skill_id: "knowledge",
      specialization: "planes",
      ranks: 0.5,
    });
    expect(
      db.prepare("SELECT COUNT(*) AS count FROM dnd35_character_skills").get()?.["count"],
    ).toBe(2);
  });

  it("stores ordered base/prestige/NPC multiclassing and a second gestalt track", () => {
    source();
    content("classes", "fighter", {
      class_kind: "base",
      hit_die: 10,
      skill_points_per_level: 2,
      bab_progression: "full",
      fort_progression: "good",
      ref_progression: "poor",
      will_progression: "poor",
    });
    classLevel("fighter-1", "fighter");
    insert("characters", { character_id: "character", alignment: "N", progression_mode: "gestalt" });
    insert("character_class_levels", {
      id: "c1",
      character_id: "character",
      class_level_id: "fighter-1",
      character_level: 1,
      track: 1,
      hit_points_gained: 10,
    });
    insert("character_class_levels", {
      id: "c2",
      character_id: "character",
      class_level_id: "fighter-1",
      character_level: 1,
      track: 2,
      hit_points_gained: 10,
    });
    expect(() =>
      insert("character_class_levels", {
        id: "c3",
        character_id: "character",
        class_level_id: "fighter-1",
        character_level: 1,
        track: 1,
        hit_points_gained: 10,
      }),
    ).toThrow(/UNIQUE/);
  });

  it("allows repeated feat choices while rejecting duplicate occurrences and malformed prerequisites", () => {
    source();
    content("feats", "weapon-focus", { repeatable: 1, choice_kind: "weapon" });
    insert("characters", { character_id: "character", alignment: "N" });
    insert("character_feats", {
      id: "cf1",
      character_id: "character",
      feat_id: "weapon-focus",
      gained_at_level: 1,
      choice_key: "longsword",
      occurrence: 1,
    });
    insert("character_feats", {
      id: "cf2",
      character_id: "character",
      feat_id: "weapon-focus",
      gained_at_level: 3,
      choice_key: "longbow",
      occurrence: 2,
    });
    expect(() =>
      insert("character_feats", {
        id: "cf3",
        character_id: "character",
        feat_id: "weapon-focus",
        gained_at_level: 6,
        choice_key: "dagger",
        occurrence: 2,
      }),
    ).toThrow(/UNIQUE/);
  });

  it("keeps class spell lists and per-level progression relational, including bonus-only slots", () => {
    source();
    content("classes", "wizard", {
      class_kind: "base",
      hit_die: 4,
      skill_points_per_level: 2,
      bab_progression: "half",
      fort_progression: "poor",
      ref_progression: "poor",
      will_progression: "good",
    });
    classLevel("wizard-1", "wizard");
    insert("class_spellcasting", {
      id: "wizard-primary",
      class_id: "wizard",
      track_key: "primary",
      tradition: "arcane",
      casting_mode: "prepared",
      casting_ability: "int",
      list_behavior: "own",
      known_behavior: "spellbook",
      progression_key: "wizard",
    });
    insert("class_spellcasting_progression", {
      class_id: "wizard",
      track_key: "primary",
      class_level: 1,
      spell_level: 1,
      slots_per_day: 0,
    });
    expect(
      db.prepare("SELECT slots_per_day FROM dnd35_class_spellcasting_progression").get()?.["slots_per_day"],
    ).toBe(0);
  });

  it("separates known spells, multiple books, preparations and metamagic", () => {
    source();
    insert("characters", { character_id: "character", alignment: "N" });
    castingTrack();
    spell();
    insert("character_spells", { casting_track_id: "casting", spell_id: "spell" });
    insert("character_spellbooks", { id: "book-a", character_id: "character", name: "A" });
    insert("character_spellbooks", { id: "book-b", character_id: "character", name: "B" });
    insert("character_spellbook_spells", { spellbook_id: "book-a", spell_id: "spell" });
    insert("character_spellbook_spells", { spellbook_id: "book-b", spell_id: "spell" });
    insert("character_spell_preparations", {
      id: "prep",
      casting_track_id: "casting",
      spell_id: "spell",
      slot_level: 1,
      prepared_count: 2,
      expended_count: 1,
    });
    expect(
      db.prepare("SELECT COUNT(*) AS count FROM dnd35_character_spellbook_spells").get()?.["count"],
    ).toBe(2);
  });

  it("rejects cross-character spellbook and casting-advancement links", () => {
    source();
    insert("characters", { character_id: "character", alignment: "N" });
    insert("characters", { character_id: "other", alignment: "N" });
    castingTrack();
    content("classes", "prestige", {
      class_kind: "prestige",
      hit_die: 4,
      skill_points_per_level: 2,
      bab_progression: "half",
      fort_progression: "poor",
      ref_progression: "poor",
      will_progression: "good",
    });
    classLevel("prestige-1", "prestige");
    insert("character_class_levels", {
      id: "prestige-gained",
      character_id: "other",
      class_level_id: "prestige-1",
      character_level: 1,
      track: 1,
      hit_points_gained: 4,
    });
    insert("class_casting_advancements", {
      id: "advance",
      class_level_id: "prestige-1",
      selection_key: "arcane",
      tradition: "arcane",
      levels_advanced: 1,
    });
    expect(() =>
      insert("character_casting_advancements", {
        character_id: "character",
        advancement_id: "advance",
        character_class_level_id: "prestige-gained",
        casting_track_id: "casting",
      }),
    ).toThrow(/FOREIGN KEY/);
  });

  it("supports psionic discipline access, display, augmentation and known powers", () => {
    source();
    insert("characters", { character_id: "character", alignment: "N" });
    content("classes", "psion", {
      class_kind: "base",
      hit_die: 4,
      skill_points_per_level: 2,
      bab_progression: "half",
      fort_progression: "poor",
      ref_progression: "poor",
      will_progression: "good",
    });
    insert("class_spellcasting", {
      id: "psionic-definition",
      class_id: "psion",
      track_key: "primary",
      tradition: "psionic",
      casting_mode: "psionic",
      casting_ability: "int",
      list_behavior: "own",
      known_behavior: "limited",
      progression_key: "psion",
    });
    insert("character_casting_tracks", {
      id: "psionic",
      character_id: "character",
      class_spellcasting_id: "psionic-definition",
    });
    content("power_disciplines", "discipline");
    content("powers", "power", {
      discipline_id: "discipline",
      manifesting_time: "1 standard action",
      action_type: "standard",
      range_text: "Personal",
      duration_text: "1 round",
      power_resistance: "no",
      power_points: 1,
      augmentation: JSON.stringify([{ additionalPowerPoints: 2, repeatable: true, description: "+1" }]),
    });
    insert("power_class_levels", {
      power_id: "power",
      class_id: "psion",
      power_level: 1,
      specialist_discipline_id: "discipline",
    });
    insert("power_display_assignments", { power_id: "power", display: "mental" });
    insert("character_powers", { casting_track_id: "psionic", power_id: "power" });
    expect(() => db.exec("UPDATE dnd35_power_class_levels SET power_level = 0")).toThrow(/CHECK/);
    expect(() => db.exec("UPDATE dnd35_powers SET power_points = -1")).toThrow(/CHECK/);
  });

  it("supports feat and innate casting access without requiring a class", () => {
    source();
    insert("characters", { character_id: "character", alignment: "N" });
    content("feats", "feat", { repeatable: 0 });
    content("special_abilities", "ability", { category: "spell_like" });
    insert("character_casting_tracks", {
      id: "feat-track",
      character_id: "character",
      granted_feat_id: "feat",
    });
    insert("character_casting_tracks", {
      id: "ability-track",
      character_id: "character",
      granted_special_ability_id: "ability",
    });
    expect(
      db.prepare("SELECT COUNT(*) AS count FROM dnd35_character_casting_tracks").get()?.["count"],
    ).toBe(2);
  });

  it("keeps ordinary stacks separate from unique instances and enforces container ownership", () => {
    source();
    content("items", "item", { item_type: "other", weight_lb: 1 });
    insert("characters", { character_id: "character", alignment: "N" });
    insert("character_inventory", {
      id: "stack",
      character_id: "character",
      item_id: "item",
      quantity: 2,
      location: "carried",
    });
    insert("item_instances", { id: "unique", item_id: "item" });
    insert("character_inventory", {
      id: "unique-row",
      character_id: "character",
      item_id: "item",
      item_instance_id: "unique",
      quantity: 1,
      location: "carried",
    });
    expect(() =>
      insert("character_inventory", {
        id: "bad-unique",
        character_id: "character",
        item_id: "item",
        item_instance_id: "unique",
        quantity: 2,
        location: "carried",
      }),
    ).toThrow(/CHECK/);
  });

  it("models weapon size/end damage and prevents invalid armor percentages", () => {
    source();
    content("items", "weapon-item", { item_type: "weapon", weight_lb: 4 });
    insert("weapons", {
      item_id: "weapon-item",
      proficiency: "martial",
      attack_kind: "melee",
      handedness: "one_handed",
      critical_threat_minimum: 19,
      critical_multiplier: 2,
    });
    insert("weapon_damage", {
      weapon_id: "weapon-item",
      size: "medium",
      weapon_end: 1,
      dice: "1d8",
    });
    content("items", "armor-item", { item_type: "armor", weight_lb: 30 });
    insert("armors", {
      item_id: "armor-item",
      armor_category: "medium",
      ac_bonus: 5,
      armor_check_penalty: -4,
      arcane_spell_failure_percent: 25,
    });
    expect(() => db.exec("UPDATE dnd35_armors SET arcane_spell_failure_percent = 101")).toThrow(/CHECK/);
  });

  it("stores fractional monster CR, nonabilities, subtypes, attacks and templates", () => {
    source();
    content("creature_types", "type");
    content("creature_subtypes", "subtype");
    content("monsters", "monster", {
      creature_type_id: "type",
      size: "medium",
      challenge_rating: 0.5,
      hit_dice: 1,
      hit_die: 8,
      base_attack_bonus: 0,
      fort: 0,
      ref: 2,
      will: 0,
      natural_armor: 0,
      base_land_speed: 30,
    });
    insert("monster_subtypes", { monster_id: "monster", subtype_id: "subtype" });
    insert("monster_ability_scores", {
      monster_id: "monster",
      ability: "str",
      score: 10,
    });
    insert("monster_ability_scores", {
      monster_id: "monster",
      ability: "int",
      score: null,
    });
    insert("monster_attacks", {
      id: "bite",
      monster_id: "monster",
      name: "Bite",
      attack_kind: "melee",
      attack_bonus: 1,
      damage_dice: "1d4",
      critical_threat_minimum: 20,
      critical_multiplier: 2,
    });
    content("templates", "template");
    insert("monster_templates", { monster_id: "monster", template_id: "template" });
    expect(
      db.prepare("SELECT challenge_rating FROM dnd35_monsters WHERE id = 'monster'").get()?.["challenge_rating"],
    ).toBe(0.5);
  });

  it("preserves separate active condition instances and validates duration state", () => {
    source();
    content("conditions", "stunned");
    insert("characters", { character_id: "character", alignment: "N" });
    insert("character_conditions", {
      id: "a",
      character_id: "character",
      condition_id: "stunned",
      duration_kind: "rounds",
      remaining_rounds: 1,
    });
    insert("character_conditions", {
      id: "b",
      character_id: "character",
      condition_id: "stunned",
      duration_kind: "permanent",
    });
    expect(
      db.prepare("SELECT COUNT(*) AS count FROM dnd35_character_conditions").get()?.["count"],
    ).toBe(2);
    expect(() =>
      insert("character_conditions", {
        id: "bad",
        character_id: "character",
        condition_id: "stunned",
        duration_kind: "rounds",
        remaining_rounds: null,
      }),
    ).toThrow(/CHECK/);
  });
});
