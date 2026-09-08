-- Core D&D 3.5 skill mechanics used by the level-1 character creator.
-- Mechanical facts only; descriptive rule text intentionally remains empty.

INSERT OR IGNORE INTO `dnd35_skills`
  (`id`, `source_id`, `slug`, `name`, `ability`, `trained_only`, `armor_check_multiplier`, `requires_specialization`)
VALUES
  ('ec-srd35-skill-appraise-v1',              'ec-srd35-core-v1', 'appraise',              'Appraise',                    'int', 0, 0, 0),
  ('ec-srd35-skill-balance-v1',               'ec-srd35-core-v1', 'balance',               'Balance',                     'dex', 0, 1, 0),
  ('ec-srd35-skill-bluff-v1',                 'ec-srd35-core-v1', 'bluff',                 'Bluff',                       'cha', 0, 0, 0),
  ('ec-srd35-skill-climb-v1',                 'ec-srd35-core-v1', 'climb',                 'Climb',                       'str', 0, 1, 0),
  ('ec-srd35-skill-concentration-v1',         'ec-srd35-core-v1', 'concentration',         'Concentration',               'con', 0, 0, 0),
  ('ec-srd35-skill-craft-v1',                 'ec-srd35-core-v1', 'craft',                 'Craft',                       'int', 0, 0, 1),
  ('ec-srd35-skill-decipher-script-v1',       'ec-srd35-core-v1', 'decipher-script',       'Decipher Script',             'int', 1, 0, 0),
  ('ec-srd35-skill-diplomacy-v1',             'ec-srd35-core-v1', 'diplomacy',             'Diplomacy',                   'cha', 0, 0, 0),
  ('ec-srd35-skill-disable-device-v1',        'ec-srd35-core-v1', 'disable-device',        'Disable Device',              'int', 1, 0, 0),
  ('ec-srd35-skill-disguise-v1',              'ec-srd35-core-v1', 'disguise',              'Disguise',                    'cha', 0, 0, 0),
  ('ec-srd35-skill-escape-artist-v1',         'ec-srd35-core-v1', 'escape-artist',         'Escape Artist',               'dex', 0, 1, 0),
  ('ec-srd35-skill-forgery-v1',               'ec-srd35-core-v1', 'forgery',               'Forgery',                     'int', 0, 0, 0),
  ('ec-srd35-skill-gather-information-v1',    'ec-srd35-core-v1', 'gather-information',    'Gather Information',          'cha', 0, 0, 0),
  ('ec-srd35-skill-handle-animal-v1',         'ec-srd35-core-v1', 'handle-animal',         'Handle Animal',               'cha', 1, 0, 0),
  ('ec-srd35-skill-heal-v1',                  'ec-srd35-core-v1', 'heal',                  'Heal',                        'wis', 0, 0, 0),
  ('ec-srd35-skill-hide-v1',                  'ec-srd35-core-v1', 'hide',                  'Hide',                        'dex', 0, 1, 0),
  ('ec-srd35-skill-intimidate-v1',            'ec-srd35-core-v1', 'intimidate',            'Intimidate',                  'cha', 0, 0, 0),
  ('ec-srd35-skill-jump-v1',                  'ec-srd35-core-v1', 'jump',                  'Jump',                        'str', 0, 1, 0),
  ('ec-srd35-skill-knowledge-arcana-v1',      'ec-srd35-core-v1', 'knowledge-arcana',      'Knowledge (arcana)',          'int', 1, 0, 0),
  ('ec-srd35-skill-knowledge-dungeoneering-v1','ec-srd35-core-v1', 'knowledge-dungeoneering','Knowledge (dungeoneering)',   'int', 1, 0, 0),
  ('ec-srd35-skill-knowledge-engineering-v1', 'ec-srd35-core-v1', 'knowledge-engineering', 'Knowledge (architecture and engineering)', 'int', 1, 0, 0),
  ('ec-srd35-skill-knowledge-geography-v1',   'ec-srd35-core-v1', 'knowledge-geography',   'Knowledge (geography)',       'int', 1, 0, 0),
  ('ec-srd35-skill-knowledge-history-v1',     'ec-srd35-core-v1', 'knowledge-history',     'Knowledge (history)',         'int', 1, 0, 0),
  ('ec-srd35-skill-knowledge-local-v1',       'ec-srd35-core-v1', 'knowledge-local',       'Knowledge (local)',           'int', 1, 0, 0),
  ('ec-srd35-skill-knowledge-nature-v1',      'ec-srd35-core-v1', 'knowledge-nature',      'Knowledge (nature)',          'int', 1, 0, 0),
  ('ec-srd35-skill-knowledge-nobility-v1',    'ec-srd35-core-v1', 'knowledge-nobility',    'Knowledge (nobility and royalty)', 'int', 1, 0, 0),
  ('ec-srd35-skill-knowledge-religion-v1',    'ec-srd35-core-v1', 'knowledge-religion',    'Knowledge (religion)',        'int', 1, 0, 0),
  ('ec-srd35-skill-knowledge-planes-v1',      'ec-srd35-core-v1', 'knowledge-planes',      'Knowledge (the planes)',      'int', 1, 0, 0),
  ('ec-srd35-skill-listen-v1',                'ec-srd35-core-v1', 'listen',                'Listen',                      'wis', 0, 0, 0),
  ('ec-srd35-skill-move-silently-v1',         'ec-srd35-core-v1', 'move-silently',         'Move Silently',               'dex', 0, 1, 0),
  ('ec-srd35-skill-open-lock-v1',             'ec-srd35-core-v1', 'open-lock',             'Open Lock',                   'dex', 1, 0, 0),
  ('ec-srd35-skill-perform-v1',               'ec-srd35-core-v1', 'perform',               'Perform',                     'cha', 0, 0, 1),
  ('ec-srd35-skill-profession-v1',            'ec-srd35-core-v1', 'profession',            'Profession',                  'wis', 1, 0, 1),
  ('ec-srd35-skill-ride-v1',                  'ec-srd35-core-v1', 'ride',                  'Ride',                        'dex', 0, 0, 0),
  ('ec-srd35-skill-search-v1',                'ec-srd35-core-v1', 'search',                'Search',                      'int', 0, 0, 0),
  ('ec-srd35-skill-sense-motive-v1',          'ec-srd35-core-v1', 'sense-motive',          'Sense Motive',                'wis', 0, 0, 0),
  ('ec-srd35-skill-sleight-of-hand-v1',       'ec-srd35-core-v1', 'sleight-of-hand',       'Sleight of Hand',             'dex', 1, 1, 0),
  ('ec-srd35-skill-speak-language-v1',        'ec-srd35-core-v1', 'speak-language',        'Speak Language',              NULL,  1, 0, 1),
  ('ec-srd35-skill-spellcraft-v1',            'ec-srd35-core-v1', 'spellcraft',            'Spellcraft',                  'int', 1, 0, 0),
  ('ec-srd35-skill-spot-v1',                  'ec-srd35-core-v1', 'spot',                  'Spot',                        'wis', 0, 0, 0),
  ('ec-srd35-skill-survival-v1',              'ec-srd35-core-v1', 'survival',              'Survival',                    'wis', 0, 0, 0),
  ('ec-srd35-skill-swim-v1',                  'ec-srd35-core-v1', 'swim',                  'Swim',                        'str', 0, 2, 0),
  ('ec-srd35-skill-tumble-v1',                'ec-srd35-core-v1', 'tumble',                'Tumble',                      'dex', 1, 1, 0),
  ('ec-srd35-skill-use-magic-device-v1',      'ec-srd35-core-v1', 'use-magic-device',      'Use Magic Device',            'cha', 1, 0, 0),
  ('ec-srd35-skill-use-rope-v1',              'ec-srd35-core-v1', 'use-rope',              'Use Rope',                    'dex', 0, 0, 0);

-- Barbarian
INSERT OR IGNORE INTO `dnd35_class_skills` (`class_id`, `skill_id`) VALUES
  ('ec-srd35-class-barbarian-v1','ec-srd35-skill-climb-v1'),
  ('ec-srd35-class-barbarian-v1','ec-srd35-skill-craft-v1'),
  ('ec-srd35-class-barbarian-v1','ec-srd35-skill-handle-animal-v1'),
  ('ec-srd35-class-barbarian-v1','ec-srd35-skill-intimidate-v1'),
  ('ec-srd35-class-barbarian-v1','ec-srd35-skill-jump-v1'),
  ('ec-srd35-class-barbarian-v1','ec-srd35-skill-listen-v1'),
  ('ec-srd35-class-barbarian-v1','ec-srd35-skill-ride-v1'),
  ('ec-srd35-class-barbarian-v1','ec-srd35-skill-survival-v1'),
  ('ec-srd35-class-barbarian-v1','ec-srd35-skill-swim-v1');

-- Bard
INSERT OR IGNORE INTO `dnd35_class_skills` (`class_id`, `skill_id`) VALUES
  ('ec-srd35-class-bard-v1','ec-srd35-skill-appraise-v1'), ('ec-srd35-class-bard-v1','ec-srd35-skill-balance-v1'),
  ('ec-srd35-class-bard-v1','ec-srd35-skill-bluff-v1'), ('ec-srd35-class-bard-v1','ec-srd35-skill-climb-v1'),
  ('ec-srd35-class-bard-v1','ec-srd35-skill-concentration-v1'), ('ec-srd35-class-bard-v1','ec-srd35-skill-craft-v1'),
  ('ec-srd35-class-bard-v1','ec-srd35-skill-decipher-script-v1'), ('ec-srd35-class-bard-v1','ec-srd35-skill-diplomacy-v1'),
  ('ec-srd35-class-bard-v1','ec-srd35-skill-disguise-v1'), ('ec-srd35-class-bard-v1','ec-srd35-skill-escape-artist-v1'),
  ('ec-srd35-class-bard-v1','ec-srd35-skill-gather-information-v1'), ('ec-srd35-class-bard-v1','ec-srd35-skill-hide-v1'),
  ('ec-srd35-class-bard-v1','ec-srd35-skill-jump-v1'), ('ec-srd35-class-bard-v1','ec-srd35-skill-listen-v1'),
  ('ec-srd35-class-bard-v1','ec-srd35-skill-move-silently-v1'), ('ec-srd35-class-bard-v1','ec-srd35-skill-perform-v1'),
  ('ec-srd35-class-bard-v1','ec-srd35-skill-profession-v1'), ('ec-srd35-class-bard-v1','ec-srd35-skill-sense-motive-v1'),
  ('ec-srd35-class-bard-v1','ec-srd35-skill-sleight-of-hand-v1'), ('ec-srd35-class-bard-v1','ec-srd35-skill-speak-language-v1'),
  ('ec-srd35-class-bard-v1','ec-srd35-skill-spellcraft-v1'), ('ec-srd35-class-bard-v1','ec-srd35-skill-swim-v1'),
  ('ec-srd35-class-bard-v1','ec-srd35-skill-tumble-v1'), ('ec-srd35-class-bard-v1','ec-srd35-skill-use-magic-device-v1'),
  ('ec-srd35-class-bard-v1','ec-srd35-skill-knowledge-arcana-v1'), ('ec-srd35-class-bard-v1','ec-srd35-skill-knowledge-dungeoneering-v1'),
  ('ec-srd35-class-bard-v1','ec-srd35-skill-knowledge-engineering-v1'), ('ec-srd35-class-bard-v1','ec-srd35-skill-knowledge-geography-v1'),
  ('ec-srd35-class-bard-v1','ec-srd35-skill-knowledge-history-v1'), ('ec-srd35-class-bard-v1','ec-srd35-skill-knowledge-local-v1'),
  ('ec-srd35-class-bard-v1','ec-srd35-skill-knowledge-nature-v1'), ('ec-srd35-class-bard-v1','ec-srd35-skill-knowledge-nobility-v1'),
  ('ec-srd35-class-bard-v1','ec-srd35-skill-knowledge-religion-v1'), ('ec-srd35-class-bard-v1','ec-srd35-skill-knowledge-planes-v1');

-- Cleric
INSERT OR IGNORE INTO `dnd35_class_skills` (`class_id`, `skill_id`) VALUES
  ('ec-srd35-class-cleric-v1','ec-srd35-skill-concentration-v1'), ('ec-srd35-class-cleric-v1','ec-srd35-skill-craft-v1'),
  ('ec-srd35-class-cleric-v1','ec-srd35-skill-diplomacy-v1'), ('ec-srd35-class-cleric-v1','ec-srd35-skill-heal-v1'),
  ('ec-srd35-class-cleric-v1','ec-srd35-skill-knowledge-arcana-v1'), ('ec-srd35-class-cleric-v1','ec-srd35-skill-knowledge-history-v1'),
  ('ec-srd35-class-cleric-v1','ec-srd35-skill-knowledge-religion-v1'), ('ec-srd35-class-cleric-v1','ec-srd35-skill-knowledge-planes-v1'),
  ('ec-srd35-class-cleric-v1','ec-srd35-skill-profession-v1'), ('ec-srd35-class-cleric-v1','ec-srd35-skill-spellcraft-v1');

-- Druid
INSERT OR IGNORE INTO `dnd35_class_skills` (`class_id`, `skill_id`) VALUES
  ('ec-srd35-class-druid-v1','ec-srd35-skill-concentration-v1'), ('ec-srd35-class-druid-v1','ec-srd35-skill-craft-v1'),
  ('ec-srd35-class-druid-v1','ec-srd35-skill-diplomacy-v1'), ('ec-srd35-class-druid-v1','ec-srd35-skill-handle-animal-v1'),
  ('ec-srd35-class-druid-v1','ec-srd35-skill-heal-v1'), ('ec-srd35-class-druid-v1','ec-srd35-skill-knowledge-nature-v1'),
  ('ec-srd35-class-druid-v1','ec-srd35-skill-listen-v1'), ('ec-srd35-class-druid-v1','ec-srd35-skill-profession-v1'),
  ('ec-srd35-class-druid-v1','ec-srd35-skill-ride-v1'), ('ec-srd35-class-druid-v1','ec-srd35-skill-spellcraft-v1'),
  ('ec-srd35-class-druid-v1','ec-srd35-skill-spot-v1'), ('ec-srd35-class-druid-v1','ec-srd35-skill-survival-v1'),
  ('ec-srd35-class-druid-v1','ec-srd35-skill-swim-v1');

-- Fighter
INSERT OR IGNORE INTO `dnd35_class_skills` (`class_id`, `skill_id`) VALUES
  ('ec-srd35-class-fighter-v1','ec-srd35-skill-climb-v1'), ('ec-srd35-class-fighter-v1','ec-srd35-skill-craft-v1'),
  ('ec-srd35-class-fighter-v1','ec-srd35-skill-handle-animal-v1'), ('ec-srd35-class-fighter-v1','ec-srd35-skill-intimidate-v1'),
  ('ec-srd35-class-fighter-v1','ec-srd35-skill-jump-v1'), ('ec-srd35-class-fighter-v1','ec-srd35-skill-ride-v1'),
  ('ec-srd35-class-fighter-v1','ec-srd35-skill-swim-v1');

-- Monk
INSERT OR IGNORE INTO `dnd35_class_skills` (`class_id`, `skill_id`) VALUES
  ('ec-srd35-class-monk-v1','ec-srd35-skill-balance-v1'), ('ec-srd35-class-monk-v1','ec-srd35-skill-climb-v1'),
  ('ec-srd35-class-monk-v1','ec-srd35-skill-concentration-v1'), ('ec-srd35-class-monk-v1','ec-srd35-skill-craft-v1'),
  ('ec-srd35-class-monk-v1','ec-srd35-skill-diplomacy-v1'), ('ec-srd35-class-monk-v1','ec-srd35-skill-escape-artist-v1'),
  ('ec-srd35-class-monk-v1','ec-srd35-skill-hide-v1'), ('ec-srd35-class-monk-v1','ec-srd35-skill-jump-v1'),
  ('ec-srd35-class-monk-v1','ec-srd35-skill-knowledge-arcana-v1'), ('ec-srd35-class-monk-v1','ec-srd35-skill-knowledge-religion-v1'),
  ('ec-srd35-class-monk-v1','ec-srd35-skill-listen-v1'), ('ec-srd35-class-monk-v1','ec-srd35-skill-move-silently-v1'),
  ('ec-srd35-class-monk-v1','ec-srd35-skill-perform-v1'), ('ec-srd35-class-monk-v1','ec-srd35-skill-profession-v1'),
  ('ec-srd35-class-monk-v1','ec-srd35-skill-sense-motive-v1'), ('ec-srd35-class-monk-v1','ec-srd35-skill-spot-v1'),
  ('ec-srd35-class-monk-v1','ec-srd35-skill-swim-v1'), ('ec-srd35-class-monk-v1','ec-srd35-skill-tumble-v1');

-- Paladin
INSERT OR IGNORE INTO `dnd35_class_skills` (`class_id`, `skill_id`) VALUES
  ('ec-srd35-class-paladin-v1','ec-srd35-skill-concentration-v1'), ('ec-srd35-class-paladin-v1','ec-srd35-skill-craft-v1'),
  ('ec-srd35-class-paladin-v1','ec-srd35-skill-diplomacy-v1'), ('ec-srd35-class-paladin-v1','ec-srd35-skill-handle-animal-v1'),
  ('ec-srd35-class-paladin-v1','ec-srd35-skill-heal-v1'), ('ec-srd35-class-paladin-v1','ec-srd35-skill-knowledge-nobility-v1'),
  ('ec-srd35-class-paladin-v1','ec-srd35-skill-knowledge-religion-v1'), ('ec-srd35-class-paladin-v1','ec-srd35-skill-profession-v1'),
  ('ec-srd35-class-paladin-v1','ec-srd35-skill-ride-v1'), ('ec-srd35-class-paladin-v1','ec-srd35-skill-sense-motive-v1');

-- Ranger
INSERT OR IGNORE INTO `dnd35_class_skills` (`class_id`, `skill_id`) VALUES
  ('ec-srd35-class-ranger-v1','ec-srd35-skill-climb-v1'), ('ec-srd35-class-ranger-v1','ec-srd35-skill-concentration-v1'),
  ('ec-srd35-class-ranger-v1','ec-srd35-skill-craft-v1'), ('ec-srd35-class-ranger-v1','ec-srd35-skill-handle-animal-v1'),
  ('ec-srd35-class-ranger-v1','ec-srd35-skill-heal-v1'), ('ec-srd35-class-ranger-v1','ec-srd35-skill-hide-v1'),
  ('ec-srd35-class-ranger-v1','ec-srd35-skill-jump-v1'), ('ec-srd35-class-ranger-v1','ec-srd35-skill-knowledge-dungeoneering-v1'),
  ('ec-srd35-class-ranger-v1','ec-srd35-skill-knowledge-geography-v1'), ('ec-srd35-class-ranger-v1','ec-srd35-skill-knowledge-nature-v1'),
  ('ec-srd35-class-ranger-v1','ec-srd35-skill-listen-v1'), ('ec-srd35-class-ranger-v1','ec-srd35-skill-move-silently-v1'),
  ('ec-srd35-class-ranger-v1','ec-srd35-skill-profession-v1'), ('ec-srd35-class-ranger-v1','ec-srd35-skill-ride-v1'),
  ('ec-srd35-class-ranger-v1','ec-srd35-skill-search-v1'), ('ec-srd35-class-ranger-v1','ec-srd35-skill-spot-v1'),
  ('ec-srd35-class-ranger-v1','ec-srd35-skill-survival-v1'), ('ec-srd35-class-ranger-v1','ec-srd35-skill-swim-v1'),
  ('ec-srd35-class-ranger-v1','ec-srd35-skill-use-rope-v1');

-- Rogue
INSERT OR IGNORE INTO `dnd35_class_skills` (`class_id`, `skill_id`) VALUES
  ('ec-srd35-class-rogue-v1','ec-srd35-skill-appraise-v1'), ('ec-srd35-class-rogue-v1','ec-srd35-skill-balance-v1'),
  ('ec-srd35-class-rogue-v1','ec-srd35-skill-bluff-v1'), ('ec-srd35-class-rogue-v1','ec-srd35-skill-climb-v1'),
  ('ec-srd35-class-rogue-v1','ec-srd35-skill-craft-v1'), ('ec-srd35-class-rogue-v1','ec-srd35-skill-decipher-script-v1'),
  ('ec-srd35-class-rogue-v1','ec-srd35-skill-diplomacy-v1'), ('ec-srd35-class-rogue-v1','ec-srd35-skill-disable-device-v1'),
  ('ec-srd35-class-rogue-v1','ec-srd35-skill-disguise-v1'), ('ec-srd35-class-rogue-v1','ec-srd35-skill-escape-artist-v1'),
  ('ec-srd35-class-rogue-v1','ec-srd35-skill-forgery-v1'), ('ec-srd35-class-rogue-v1','ec-srd35-skill-gather-information-v1'),
  ('ec-srd35-class-rogue-v1','ec-srd35-skill-hide-v1'), ('ec-srd35-class-rogue-v1','ec-srd35-skill-intimidate-v1'),
  ('ec-srd35-class-rogue-v1','ec-srd35-skill-jump-v1'), ('ec-srd35-class-rogue-v1','ec-srd35-skill-knowledge-local-v1'),
  ('ec-srd35-class-rogue-v1','ec-srd35-skill-listen-v1'), ('ec-srd35-class-rogue-v1','ec-srd35-skill-move-silently-v1'),
  ('ec-srd35-class-rogue-v1','ec-srd35-skill-open-lock-v1'), ('ec-srd35-class-rogue-v1','ec-srd35-skill-perform-v1'),
  ('ec-srd35-class-rogue-v1','ec-srd35-skill-profession-v1'), ('ec-srd35-class-rogue-v1','ec-srd35-skill-search-v1'),
  ('ec-srd35-class-rogue-v1','ec-srd35-skill-sense-motive-v1'), ('ec-srd35-class-rogue-v1','ec-srd35-skill-sleight-of-hand-v1'),
  ('ec-srd35-class-rogue-v1','ec-srd35-skill-spot-v1'), ('ec-srd35-class-rogue-v1','ec-srd35-skill-swim-v1'),
  ('ec-srd35-class-rogue-v1','ec-srd35-skill-tumble-v1'), ('ec-srd35-class-rogue-v1','ec-srd35-skill-use-magic-device-v1'),
  ('ec-srd35-class-rogue-v1','ec-srd35-skill-use-rope-v1');

-- Sorcerer
INSERT OR IGNORE INTO `dnd35_class_skills` (`class_id`, `skill_id`) VALUES
  ('ec-srd35-class-sorcerer-v1','ec-srd35-skill-bluff-v1'), ('ec-srd35-class-sorcerer-v1','ec-srd35-skill-concentration-v1'),
  ('ec-srd35-class-sorcerer-v1','ec-srd35-skill-craft-v1'), ('ec-srd35-class-sorcerer-v1','ec-srd35-skill-knowledge-arcana-v1'),
  ('ec-srd35-class-sorcerer-v1','ec-srd35-skill-profession-v1'), ('ec-srd35-class-sorcerer-v1','ec-srd35-skill-spellcraft-v1');

-- Wizard
INSERT OR IGNORE INTO `dnd35_class_skills` (`class_id`, `skill_id`) VALUES
  ('ec-srd35-class-wizard-v1','ec-srd35-skill-concentration-v1'), ('ec-srd35-class-wizard-v1','ec-srd35-skill-craft-v1'),
  ('ec-srd35-class-wizard-v1','ec-srd35-skill-decipher-script-v1'), ('ec-srd35-class-wizard-v1','ec-srd35-skill-profession-v1'),
  ('ec-srd35-class-wizard-v1','ec-srd35-skill-spellcraft-v1'),
  ('ec-srd35-class-wizard-v1','ec-srd35-skill-knowledge-arcana-v1'), ('ec-srd35-class-wizard-v1','ec-srd35-skill-knowledge-dungeoneering-v1'),
  ('ec-srd35-class-wizard-v1','ec-srd35-skill-knowledge-engineering-v1'), ('ec-srd35-class-wizard-v1','ec-srd35-skill-knowledge-geography-v1'),
  ('ec-srd35-class-wizard-v1','ec-srd35-skill-knowledge-history-v1'), ('ec-srd35-class-wizard-v1','ec-srd35-skill-knowledge-local-v1'),
  ('ec-srd35-class-wizard-v1','ec-srd35-skill-knowledge-nature-v1'), ('ec-srd35-class-wizard-v1','ec-srd35-skill-knowledge-nobility-v1'),
  ('ec-srd35-class-wizard-v1','ec-srd35-skill-knowledge-religion-v1'), ('ec-srd35-class-wizard-v1','ec-srd35-skill-knowledge-planes-v1');
