-- Minimum SRD-compatible catalog required by the level-1 character creator.
-- This migration intentionally stores names and mechanical facts only; it does not
-- copy descriptive/rules prose. INSERT OR IGNORE keeps existing reviewed catalog
-- records authoritative when this migration is applied to an already-populated D1.

INSERT OR IGNORE INTO `dnd35_sources`
  (`id`, `slug`, `name`, `abbreviation`, `publisher`, `system`, `edition`, `description`, `url`, `is_official`, `is_homebrew`, `owner_user_id`)
VALUES
  ('srd35-core', 'srd35-core', 'D&D 3.5 SRD Core', 'SRD 3.5', 'Wizards of the Coast', 'dnd', '3.5', 'Mechanical baseline used by the Endless Codex level-1 creator.', NULL, 1, 0, NULL);

INSERT OR IGNORE INTO `dnd35_races`
  (`id`, `source_id`, `slug`, `name`, `size`, `base_speed_feet`, `level_adjustment`, `racial_hit_dice`, `natural_armor`, `bonus_skill_points_per_level`, `bonus_feats_at_first_level`)
VALUES
  ('srd35-race-human',     'srd35-core', 'human',     'Human',     'medium', 30, 0, 0, 0, 1, 1),
  ('srd35-race-dwarf',     'srd35-core', 'dwarf',     'Dwarf',     'medium', 20, 0, 0, 0, 0, 0),
  ('srd35-race-elf',       'srd35-core', 'elf',       'Elf',       'medium', 30, 0, 0, 0, 0, 0),
  ('srd35-race-gnome',     'srd35-core', 'gnome',     'Gnome',     'small',  20, 0, 0, 0, 0, 0),
  ('srd35-race-half-elf',  'srd35-core', 'half-elf',  'Half-Elf',  'medium', 30, 0, 0, 0, 0, 0),
  ('srd35-race-half-orc',  'srd35-core', 'half-orc',  'Half-Orc',  'medium', 30, 0, 0, 0, 0, 0),
  ('srd35-race-halfling',  'srd35-core', 'halfling',  'Halfling',  'small',  20, 0, 0, 0, 0, 0);

INSERT OR IGNORE INTO `dnd35_race_abilities` (`race_id`, `ability`, `modifier`) VALUES
  ('srd35-race-dwarf',    'con',  2),
  ('srd35-race-dwarf',    'cha', -2),
  ('srd35-race-elf',      'dex',  2),
  ('srd35-race-elf',      'con', -2),
  ('srd35-race-gnome',    'con',  2),
  ('srd35-race-gnome',    'str', -2),
  ('srd35-race-half-orc', 'str',  2),
  ('srd35-race-half-orc', 'int', -2),
  ('srd35-race-half-orc', 'cha', -2),
  ('srd35-race-halfling', 'dex',  2),
  ('srd35-race-halfling', 'str', -2);

INSERT OR IGNORE INTO `dnd35_classes`
  (`id`, `source_id`, `slug`, `name`, `category`, `hit_die`, `skill_points_per_level`, `bab_progression`, `fort_progression`, `ref_progression`, `will_progression`)
VALUES
  ('srd35-class-barbarian', 'srd35-core', 'barbarian', 'Barbarian', 'base', 12, 4, 'full',           'good', 'poor', 'poor'),
  ('srd35-class-bard',      'srd35-core', 'bard',      'Bard',      'base',  6, 6, 'three_quarters', 'poor', 'good', 'good'),
  ('srd35-class-cleric',    'srd35-core', 'cleric',    'Cleric',    'base',  8, 2, 'three_quarters', 'good', 'poor', 'good'),
  ('srd35-class-druid',     'srd35-core', 'druid',     'Druid',     'base',  8, 4, 'three_quarters', 'good', 'poor', 'good'),
  ('srd35-class-fighter',   'srd35-core', 'fighter',   'Fighter',   'base', 10, 2, 'full',           'good', 'poor', 'poor'),
  ('srd35-class-monk',      'srd35-core', 'monk',      'Monk',      'base',  8, 4, 'three_quarters', 'good', 'good', 'good'),
  ('srd35-class-paladin',   'srd35-core', 'paladin',   'Paladin',   'base', 10, 2, 'full',           'good', 'poor', 'poor'),
  ('srd35-class-ranger',    'srd35-core', 'ranger',    'Ranger',    'base',  8, 6, 'full',           'good', 'good', 'poor'),
  ('srd35-class-rogue',     'srd35-core', 'rogue',     'Rogue',     'base',  6, 8, 'three_quarters', 'poor', 'good', 'poor'),
  ('srd35-class-sorcerer',  'srd35-core', 'sorcerer',  'Sorcerer',  'base',  4, 2, 'half',           'poor', 'poor', 'good'),
  ('srd35-class-wizard',    'srd35-core', 'wizard',    'Wizard',    'base',  4, 2, 'half',           'poor', 'poor', 'good');

INSERT OR IGNORE INTO `dnd35_class_levels`
  (`id`, `class_id`, `level`, `base_attack_bonus`, `fort`, `ref`, `will`)
VALUES
  ('srd35-class-barbarian-l1', 'srd35-class-barbarian', 1, 1, 2, 0, 0),
  ('srd35-class-bard-l1',      'srd35-class-bard',      1, 0, 0, 2, 2),
  ('srd35-class-cleric-l1',    'srd35-class-cleric',    1, 0, 2, 0, 2),
  ('srd35-class-druid-l1',     'srd35-class-druid',     1, 0, 2, 0, 2),
  ('srd35-class-fighter-l1',   'srd35-class-fighter',   1, 1, 2, 0, 0),
  ('srd35-class-monk-l1',      'srd35-class-monk',      1, 0, 2, 2, 2),
  ('srd35-class-paladin-l1',   'srd35-class-paladin',   1, 1, 2, 0, 0),
  ('srd35-class-ranger-l1',    'srd35-class-ranger',    1, 1, 2, 2, 0),
  ('srd35-class-rogue-l1',     'srd35-class-rogue',     1, 0, 0, 2, 0),
  ('srd35-class-sorcerer-l1',  'srd35-class-sorcerer',  1, 0, 0, 0, 2),
  ('srd35-class-wizard-l1',    'srd35-class-wizard',    1, 0, 0, 0, 2);
