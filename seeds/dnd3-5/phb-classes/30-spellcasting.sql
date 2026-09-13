-- phb-classes: spellcasting tracks and progressions
-- Source of truth: rendered PHB v3.5 Tables 3-4, 3-5, 3-6, 3-8, 3-12, 3-13,
-- 3-16, 3-17, and 3-18.
-- Requires 00-classes.sql. Safe to re-run.
--
-- slots_per_day stores the base class-table allotment. A value of 0 is preserved
-- exactly: the class has access to that spell level only through bonus spells.
-- Cleric domain slots are not folded into base slots; the cleric Domains feature
-- supplies the extra domain slot described by Table 3-6.

WITH desired(
  class_slug, track_key, tradition, casting_mode, casting_ability,
  list_behavior, known_behavior, caster_num, caster_den, progression_key, shared_list_slug, rules_text
) AS (VALUES
  ('bard','primary','arcane','spontaneous','cha','own','limited',1,1,'phb-bard',NULL,
   'PHB bard spellcasting. Spontaneous Charisma casting; limited spells known; every bard spell has a verbal component.'),
  ('cleric','primary','divine','prepared','wis','own','all_list',1,1,'phb-cleric',NULL,
   'PHB cleric spellcasting. Prepared Wisdom casting. Base slots exclude the additional domain slot at each available spell level from 1st through 9th.'),
  ('druid','primary','divine','prepared','wis','own','all_list',1,1,'phb-druid',NULL,
   'PHB druid spellcasting. Prepared Wisdom casting from the druid spell list.'),
  ('paladin','primary','divine','prepared','wis','own','all_list',1,2,'phb-paladin',NULL,
   'PHB paladin spellcasting begins at 4th level. Prepared Wisdom casting; caster level is one-half paladin level.'),
  ('ranger','primary','divine','prepared','wis','own','all_list',1,2,'phb-ranger',NULL,
   'PHB ranger spellcasting begins at 4th level. Prepared Wisdom casting; caster level is one-half ranger level.'),
  ('sorcerer','primary','arcane','spontaneous','cha','shared','limited',1,1,'phb-sorcerer','wizard',
   'PHB sorcerer spellcasting. Spontaneous Charisma casting with a limited repertoire from the shared sorcerer/wizard spell list.'),
  ('wizard','primary','arcane','prepared','int','own','spellbook',1,1,'phb-wizard',NULL,
   'PHB wizard spellcasting. Prepared Intelligence casting from a spellbook; school specialization is handled by the wizard class feature.')
)
INSERT OR IGNORE INTO dnd35_class_spellcasting
  (id,class_id,spell_list_class_id,track_key,tradition,casting_mode,casting_ability,
   list_behavior,known_behavior,caster_level_numerator,caster_level_denominator,
   progression_key,rules_text)
SELECT
  'phb-class-spellcasting-' || d.class_slug,
  c.id,
  shared.id,
  d.track_key,
  d.tradition,
  d.casting_mode,
  d.casting_ability,
  d.list_behavior,
  d.known_behavior,
  d.caster_num,
  d.caster_den,
  d.progression_key,
  d.rules_text
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources s ON s.id=c.source_id
LEFT JOIN dnd35_classes shared
  ON shared.slug=d.shared_list_slug AND shared.source_id=s.id AND shared.owner_user_id IS NULL
WHERE s.slug='players-handbook-3-5' AND c.owner_user_id IS NULL;

-- Base spells per day. Each inner array is [class level, [spell-level slots...]],
-- beginning at spell level 0 for full casters/Bard/Sorcerer and at spell level 1
-- for Paladin and Ranger.
WITH slot_data(class_slug, first_spell_level, rows_json) AS (VALUES
  ('bard',0,'[
    [1,[2]],[2,[3,0]],[3,[3,1]],[4,[3,2,0]],[5,[3,3,1]],
    [6,[3,3,2]],[7,[3,3,2,0]],[8,[3,3,3,1]],[9,[3,3,3,2]],[10,[3,3,3,2,0]],
    [11,[3,3,3,3,1]],[12,[3,3,3,3,2]],[13,[3,3,3,3,2,0]],[14,[4,3,3,3,3,1]],
    [15,[4,4,3,3,3,2]],[16,[4,4,4,3,3,2,0]],[17,[4,4,4,4,3,3,1]],
    [18,[4,4,4,4,4,3,2]],[19,[4,4,4,4,4,4,3]],[20,[4,4,4,4,4,4,4]]
  ]'),
  ('cleric',0,'[
    [1,[3,1]],[2,[4,2]],[3,[4,2,1]],[4,[5,3,2]],[5,[5,3,2,1]],
    [6,[5,3,3,2]],[7,[6,4,3,2,1]],[8,[6,4,3,3,2]],[9,[6,4,4,3,2,1]],
    [10,[6,4,4,3,3,2]],[11,[6,5,4,4,3,2,1]],[12,[6,5,4,4,3,3,2]],
    [13,[6,5,5,4,4,3,2,1]],[14,[6,5,5,4,4,3,3,2]],[15,[6,5,5,5,4,4,3,2,1]],
    [16,[6,5,5,5,4,4,3,3,2]],[17,[6,5,5,5,5,4,4,3,2,1]],
    [18,[6,5,5,5,5,4,4,3,3,2]],[19,[6,5,5,5,5,5,4,4,3,3]],[20,[6,5,5,5,5,5,4,4,4,4]]
  ]'),
  ('druid',0,'[
    [1,[3,1]],[2,[4,2]],[3,[4,2,1]],[4,[5,3,2]],[5,[5,3,2,1]],
    [6,[5,3,3,2]],[7,[6,4,3,2,1]],[8,[6,4,3,3,2]],[9,[6,4,4,3,2,1]],
    [10,[6,4,4,3,3,2]],[11,[6,5,4,4,3,2,1]],[12,[6,5,4,4,3,3,2]],
    [13,[6,5,5,4,4,3,2,1]],[14,[6,5,5,4,4,3,3,2]],[15,[6,5,5,5,4,4,3,2,1]],
    [16,[6,5,5,5,4,4,3,3,2]],[17,[6,5,5,5,5,4,4,3,2,1]],
    [18,[6,5,5,5,5,4,4,3,3,2]],[19,[6,5,5,5,5,5,4,4,3,3]],[20,[6,5,5,5,5,5,4,4,4,4]]
  ]'),
  ('paladin',1,'[
    [4,[0]],[5,[0]],[6,[1]],[7,[1]],[8,[1,0]],[9,[1,0]],[10,[1,1]],
    [11,[1,1,0]],[12,[1,1,1]],[13,[1,1,1]],[14,[2,1,1,0]],[15,[2,1,1,1]],
    [16,[2,2,1,1]],[17,[2,2,2,1]],[18,[3,2,2,1]],[19,[3,3,3,2]],[20,[3,3,3,3]]
  ]'),
  ('ranger',1,'[
    [4,[0]],[5,[0]],[6,[1]],[7,[1]],[8,[1,0]],[9,[1,0]],[10,[1,1]],
    [11,[1,1,0]],[12,[1,1,1]],[13,[1,1,1]],[14,[2,1,1,0]],[15,[2,1,1,1]],
    [16,[2,2,1,1]],[17,[2,2,2,1]],[18,[3,2,2,1]],[19,[3,3,3,2]],[20,[3,3,3,3]]
  ]'),
  ('sorcerer',0,'[
    [1,[5,3]],[2,[6,4]],[3,[6,5]],[4,[6,6,3]],[5,[6,6,4]],
    [6,[6,6,5,3]],[7,[6,6,6,4]],[8,[6,6,6,5,3]],[9,[6,6,6,6,4]],
    [10,[6,6,6,6,5,3]],[11,[6,6,6,6,6,4]],[12,[6,6,6,6,6,5,3]],
    [13,[6,6,6,6,6,6,4]],[14,[6,6,6,6,6,6,5,3]],[15,[6,6,6,6,6,6,6,4]],
    [16,[6,6,6,6,6,6,6,5,3]],[17,[6,6,6,6,6,6,6,6,4]],
    [18,[6,6,6,6,6,6,6,6,5,3]],[19,[6,6,6,6,6,6,6,6,6,4]],
    [20,[6,6,6,6,6,6,6,6,6,6]]
  ]'),
  ('wizard',0,'[
    [1,[3,1]],[2,[4,2]],[3,[4,2,1]],[4,[4,3,2]],[5,[4,3,2,1]],
    [6,[4,3,3,2]],[7,[4,4,3,2,1]],[8,[4,4,3,3,2]],[9,[4,4,4,3,2,1]],
    [10,[4,4,4,3,3,2]],[11,[4,4,4,4,3,2,1]],[12,[4,4,4,4,3,3,2]],
    [13,[4,4,4,4,4,3,2,1]],[14,[4,4,4,4,4,3,3,2]],[15,[4,4,4,4,4,4,3,2,1]],
    [16,[4,4,4,4,4,4,3,3,2]],[17,[4,4,4,4,4,4,4,3,2,1]],
    [18,[4,4,4,4,4,4,4,3,3,2]],[19,[4,4,4,4,4,4,4,4,3,3]],[20,[4,4,4,4,4,4,4,4,4,4]]
  ]')
),
level_rows AS (
  SELECT
    d.class_slug,
    d.first_spell_level,
    CAST(json_extract(level_value.value,'$[0]') AS INTEGER) AS class_level,
    json_extract(level_value.value,'$[1]') AS slots_json
  FROM slot_data d, json_each(d.rows_json) AS level_value
),
expanded AS (
  SELECT
    l.class_slug,
    l.class_level,
    l.first_spell_level + CAST(slot.key AS INTEGER) AS spell_level,
    CAST(slot.value AS INTEGER) AS slots_per_day
  FROM level_rows l, json_each(l.slots_json) AS slot
)
INSERT INTO dnd35_class_spellcasting_progression
  (class_id,track_key,class_level,spell_level,slots_per_day,spells_known)
SELECT c.id,'primary',e.class_level,e.spell_level,e.slots_per_day,NULL
FROM expanded e
JOIN dnd35_classes c ON c.slug=e.class_slug
JOIN dnd35_sources s ON s.id=c.source_id
WHERE s.slug='players-handbook-3-5' AND c.owner_user_id IS NULL
ON CONFLICT(class_id,track_key,class_level,spell_level)
DO UPDATE SET slots_per_day=excluded.slots_per_day;

-- Fixed spells-known progressions for spontaneous PHB casters.
-- Bard Table 3-5 footnoted entries are retained as fixed known counts while the
-- corresponding slots_per_day=0 row records that casting requires a bonus slot.
WITH known_data(class_slug, rows_json) AS (VALUES
  ('bard','[
    [1,[4]],[2,[5,2]],[3,[6,3]],[4,[6,3,2]],[5,[6,4,3]],[6,[6,4,3]],
    [7,[6,4,4,2]],[8,[6,4,4,3]],[9,[6,4,4,3]],[10,[6,4,4,4,2]],
    [11,[6,4,4,4,3]],[12,[6,4,4,4,3]],[13,[6,4,4,4,4,2]],
    [14,[6,4,4,4,4,3]],[15,[6,4,4,4,4,3]],[16,[6,5,4,4,4,4,2]],
    [17,[6,5,5,4,4,4,3]],[18,[6,5,5,5,4,4,3]],[19,[6,5,5,5,5,4,4]],
    [20,[6,5,5,5,5,5,4]]
  ]'),
  ('sorcerer','[
    [1,[4,2]],[2,[5,2]],[3,[5,3]],[4,[6,3,1]],[5,[6,4,2]],
    [6,[7,4,2,1]],[7,[7,5,3,2]],[8,[8,5,3,2,1]],[9,[8,5,4,3,2]],
    [10,[9,5,4,3,2,1]],[11,[9,5,5,4,3,2]],[12,[9,5,5,4,3,2,1]],
    [13,[9,5,5,4,4,3,2]],[14,[9,5,5,4,4,3,2,1]],[15,[9,5,5,4,4,4,3,2]],
    [16,[9,5,5,4,4,4,3,2,1]],[17,[9,5,5,4,4,4,3,3,2]],
    [18,[9,5,5,4,4,4,3,3,2,1]],[19,[9,5,5,4,4,4,3,3,3,2]],
    [20,[9,5,5,4,4,4,3,3,3,3]]
  ]')
),
known_levels AS (
  SELECT
    d.class_slug,
    CAST(json_extract(level_value.value,'$[0]') AS INTEGER) AS class_level,
    json_extract(level_value.value,'$[1]') AS known_json
  FROM known_data d, json_each(d.rows_json) AS level_value
),
known_expanded AS (
  SELECT
    k.class_slug,
    k.class_level,
    CAST(known.key AS INTEGER) AS spell_level,
    CAST(known.value AS INTEGER) AS spells_known
  FROM known_levels k, json_each(k.known_json) AS known
)
INSERT INTO dnd35_class_spellcasting_progression
  (class_id,track_key,class_level,spell_level,slots_per_day,spells_known)
SELECT c.id,'primary',k.class_level,k.spell_level,NULL,k.spells_known
FROM known_expanded k
JOIN dnd35_classes c ON c.slug=k.class_slug
JOIN dnd35_sources s ON s.id=c.source_id
WHERE s.slug='players-handbook-3-5' AND c.owner_user_id IS NULL
ON CONFLICT(class_id,track_key,class_level,spell_level)
DO UPDATE SET spells_known=excluded.spells_known;
