-- Minimum SRD-compatible catalog required by the level-1 character creator.
-- This migration intentionally stores names and mechanical facts only; it does not
-- copy descriptive/rules prose. IDs and the source slug are Endless Codex namespaced
-- so this baseline can coexist with a separately imported or reviewed SRD catalog.

INSERT OR IGNORE INTO `dnd35_sources`
  (`id`, `slug`, `name`, `abbreviation`, `publisher`, `system`, `edition`, `description`, `url`, `is_official`, `is_homebrew`, `owner_user_id`)
VALUES
  ('ec-srd35-core-v1', 'endless-codex-srd35-core-v1', 'Endless Codex SRD 3.5 Core Baseline', 'EC SRD 3.5', NULL, 'dnd', '3.5', 'SRD-compatible mechanical baseline used by the Endless Codex level-1 creator.', NULL, 0, 0, NULL);

INSERT OR IGNORE INTO `dnd35_races`
  (`id`, `source_id`, `slug`, `name`, `size`, `base_speed_feet`, `level_adjustment`, `racial_hit_dice`, `natural_armor`, `bonus_skill_points_per_level`, `bonus_feats_at_first_level`)
VALUES
  ('ec-srd35-race-human-v1',     'ec-srd35-core-v1', 'human',     'Human',     'medium', 30, 0, 0, 0, 1, 1),
  ('ec-srd35-race-dwarf-v1',     'ec-srd35-core-v1', 'dwarf',     'Dwarf',     'medium', 20, 0, 0, 0, 0, 0),
  ('ec-srd35-race-elf-v1',       'ec-srd35-core-v1', 'elf',       'Elf',       'medium', 30, 0, 0, 0, 0, 0),
  ('ec-srd35-race-gnome-v1',     'ec-srd35-core-v1', 'gnome',     'Gnome',     'small',  20, 0, 0, 0, 0, 0),
  ('ec-srd35-race-half-elf-v1',  'ec-srd35-core-v1', 'half-elf',  'Half-Elf',  'medium', 30, 0, 0, 0, 0, 0),
  ('ec-srd35-race-half-orc-v1',  'ec-srd35-core-v1', 'half-orc',  'Half-Orc',  'medium', 30, 0, 0, 0, 0, 0),
  ('ec-srd35-race-halfling-v1',  'ec-srd35-core-v1', 'halfling',  'Halfling',  'small',  20, 0, 0, 0, 0, 0);

INSERT OR IGNORE INTO `dnd35_race_abilities` (`race_id`, `ability`, `modifier`) VALUES
  ('ec-srd35-race-dwarf-v1',    'con',  2),
  ('ec-srd35-race-dwarf-v1',    'cha', -2),
  ('ec-srd35-race-elf-v1',      'dex',  2),
  ('ec-srd35-race-elf-v1',      'con', -2),
  ('ec-srd35-race-gnome-v1',    'con',  2),
  ('ec-srd35-race-gnome-v1',    'str', -2),
  ('ec-srd35-race-half-orc-v1', 'str',  2),
  ('ec-srd35-race-half-orc-v1', 'int', -2),
  ('ec-srd35-race-half-orc-v1', 'cha', -2),
  ('ec-srd35-race-halfling-v1', 'dex',  2),
  ('ec-srd35-race-halfling-v1', 'str', -2);

INSERT OR IGNORE INTO `dnd35_classes`
  (`id`, `source_id`, `slug`, `name`, `category`, `hit_die`, `skill_points_per_level`, `bab_progression`, `fort_progression`, `ref_progression`, `will_progression`)
VALUES
  ('ec-srd35-class-barbarian-v1', 'ec-srd35-core-v1', 'barbarian', 'Barbarian', 'base', 12, 4, 'full',           'good', 'poor', 'poor'),
  ('ec-srd35-class-bard-v1',      'ec-srd35-core-v1', 'bard',      'Bard',      'base',  6, 6, 'three_quarters', 'poor', 'good', 'good'),
  ('ec-srd35-class-cleric-v1',    'ec-srd35-core-v1', 'cleric',    'Cleric',    'base',  8, 2, 'three_quarters', 'good', 'poor', 'good'),
  ('ec-srd35-class-druid-v1',     'ec-srd35-core-v1', 'druid',     'Druid',     'base',  8, 4, 'three_quarters', 'good', 'poor', 'good'),
  ('ec-srd35-class-fighter-v1',   'ec-srd35-core-v1', 'fighter',   'Fighter',   'base', 10, 2, 'full',           'good', 'poor', 'poor'),
  ('ec-srd35-class-monk-v1',      'ec-srd35-core-v1', 'monk',      'Monk',      'base',  8, 4, 'three_quarters', 'good', 'good', 'good'),
  ('ec-srd35-class-paladin-v1',   'ec-srd35-core-v1', 'paladin',   'Paladin',   'base', 10, 2, 'full',           'good', 'poor', 'poor'),
  ('ec-srd35-class-ranger-v1',    'ec-srd35-core-v1', 'ranger',    'Ranger',    'base',  8, 6, 'full',           'good', 'good', 'poor'),
  ('ec-srd35-class-rogue-v1',     'ec-srd35-core-v1', 'rogue',     'Rogue',     'base',  6, 8, 'three_quarters', 'poor', 'good', 'poor'),
  ('ec-srd35-class-sorcerer-v1',  'ec-srd35-core-v1', 'sorcerer',  'Sorcerer',  'base',  4, 2, 'half',           'poor', 'poor', 'good'),
  ('ec-srd35-class-wizard-v1',    'ec-srd35-core-v1', 'wizard',    'Wizard',    'base',  4, 2, 'half',           'poor', 'poor', 'good');

INSERT OR IGNORE INTO `dnd35_class_levels`
  (`id`, `class_id`, `level`, `base_attack_bonus`, `fort`, `ref`, `will`)
VALUES
  ('ec-srd35-class-barbarian-l1-v1', 'ec-srd35-class-barbarian-v1', 1, 1, 2, 0, 0),
  ('ec-srd35-class-bard-l1-v1',      'ec-srd35-class-bard-v1',      1, 0, 0, 2, 2),
  ('ec-srd35-class-cleric-l1-v1',    'ec-srd35-class-cleric-v1',    1, 0, 2, 0, 2),
  ('ec-srd35-class-druid-l1-v1',     'ec-srd35-class-druid-v1',     1, 0, 2, 0, 2),
  ('ec-srd35-class-fighter-l1-v1',   'ec-srd35-class-fighter-v1',   1, 1, 2, 0, 0),
  ('ec-srd35-class-monk-l1-v1',      'ec-srd35-class-monk-v1',      1, 0, 2, 2, 2),
  ('ec-srd35-class-paladin-l1-v1',   'ec-srd35-class-paladin-v1',   1, 1, 2, 0, 0),
  ('ec-srd35-class-ranger-l1-v1',    'ec-srd35-class-ranger-v1',    1, 1, 2, 2, 0),
  ('ec-srd35-class-rogue-l1-v1',     'ec-srd35-class-rogue-v1',     1, 0, 0, 2, 0),
  ('ec-srd35-class-sorcerer-l1-v1',  'ec-srd35-class-sorcerer-v1',  1, 0, 0, 0, 2),
  ('ec-srd35-class-wizard-l1-v1',    'ec-srd35-class-wizard-v1',    1, 0, 0, 0, 2);
