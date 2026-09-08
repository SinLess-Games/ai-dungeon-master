-- phb2-classes: Beguiler and Duskblade spellcasting tracks.
-- Source of truth: Player's Handbook II Table 1-1 (Beguiler, p. 7) and Table 1-3 (Duskblade, p. 21),
-- plus the class spellcasting text on pp. 7 and 19-20.
-- Requires 00-classes.sql. Safe to re-run.

WITH desired(
  class_slug,track_key,tradition,casting_mode,casting_ability,
  list_behavior,known_behavior,caster_num,caster_den,progression_key,rules_text
) AS (VALUES
  ('beguiler','primary','arcane','spontaneous','int','own','all_list',1,1,'phb2-beguiler',
   'PHB II beguiler spellcasting. Spontaneous Intelligence casting. A beguiler automatically knows every spell on the beguiler spell list that she can cast; Advanced Learning can add eligible sorcerer/wizard enchantment or illusion spells.'),
  ('duskblade','primary','arcane','spontaneous','int','own','limited',1,1,'phb2-duskblade',
   'PHB II duskblade spellcasting. Spontaneous Intelligence casting. A 1st-level duskblade knows two 0-level and two 1st-level spells, plus one additional 0-level spell per point of Intelligence bonus. Each new duskblade level adds one spell known of any spell level the character can cast. Beginning at 5th level and every subsequent odd-numbered duskblade level, one known spell can be exchanged under the class rules. Because distribution among spell levels is player-chosen, progression rows intentionally leave spells_known NULL.')
)
INSERT OR IGNORE INTO dnd35_class_spellcasting
  (id,class_id,spell_list_class_id,track_key,tradition,casting_mode,casting_ability,
   list_behavior,known_behavior,caster_level_numerator,caster_level_denominator,progression_key,rules_text)
SELECT
  'phb2-class-spellcasting-'||d.class_slug,
  c.id,NULL,d.track_key,d.tradition,d.casting_mode,d.casting_ability,
  d.list_behavior,d.known_behavior,d.caster_num,d.caster_den,d.progression_key,d.rules_text
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources s ON s.id=c.source_id
WHERE s.slug='players-handbook-ii-3-5' AND c.owner_user_id IS NULL;

-- Base spells per day from the printed class tables. Arrays begin at spell level 0.
WITH slot_data(class_slug,rows_json) AS (VALUES
  ('beguiler','[
    [1,[5,3]],
    [2,[6,4]],
    [3,[6,5]],
    [4,[6,6,3]],
    [5,[6,6,4]],
    [6,[6,6,5,3]],
    [7,[6,6,6,4]],
    [8,[6,6,6,5,3]],
    [9,[6,6,6,6,4]],
    [10,[6,6,6,6,5,3]],
    [11,[6,6,6,6,6,4]],
    [12,[6,6,6,6,6,5,3]],
    [13,[6,6,6,6,6,6,4]],
    [14,[6,6,6,6,6,6,5,3]],
    [15,[6,6,6,6,6,6,6,4]],
    [16,[6,6,6,6,6,6,6,5,3]],
    [17,[6,6,6,6,6,6,6,6,4]],
    [18,[6,6,6,6,6,6,6,6,5,3]],
    [19,[6,6,6,6,6,6,6,6,6,4]],
    [20,[6,6,6,6,6,6,6,6,6,5]]
  ]'),
  ('duskblade','[
    [1,[3,2]],
    [2,[4,3]],
    [3,[5,4]],
    [4,[6,5]],
    [5,[6,5,2]],
    [6,[6,6,3]],
    [7,[6,6,5]],
    [8,[6,7,6]],
    [9,[6,7,6,2]],
    [10,[6,8,7,3]],
    [11,[6,8,7,5]],
    [12,[6,8,8,6]],
    [13,[6,9,8,6,2]],
    [14,[6,9,8,7,3]],
    [15,[6,9,8,7,5]],
    [16,[6,9,9,8,6]],
    [17,[6,10,9,8,6,2]],
    [18,[6,10,9,8,7,3]],
    [19,[6,10,10,9,7,5]],
    [20,[6,10,10,10,8,6]]
  ]')
),
level_rows AS (
  SELECT
    d.class_slug,
    CAST(json_extract(level_value.value,'$[0]') AS INTEGER) AS class_level,
    json_extract(level_value.value,'$[1]') AS slots_json
  FROM slot_data d, json_each(d.rows_json) AS level_value
),
expanded AS (
  SELECT
    l.class_slug,
    l.class_level,
    CAST(slot.key AS INTEGER) AS spell_level,
    CAST(slot.value AS INTEGER) AS slots_per_day
  FROM level_rows l, json_each(l.slots_json) AS slot
)
INSERT INTO dnd35_class_spellcasting_progression
  (class_id,track_key,class_level,spell_level,slots_per_day,spells_known)
SELECT c.id,'primary',e.class_level,e.spell_level,e.slots_per_day,NULL
FROM expanded e
JOIN dnd35_classes c ON c.slug=e.class_slug
JOIN dnd35_sources s ON s.id=c.source_id
WHERE s.slug='players-handbook-ii-3-5' AND c.owner_user_id IS NULL
ON CONFLICT(class_id,track_key,class_level,spell_level) DO UPDATE SET
  slots_per_day=excluded.slots_per_day,
  spells_known=excluded.spells_known;
