-- Deities and Demigods prestige-class spellcasting tracks.
-- Both classes use their own prepared Wisdom-based divine lists. A printed 0 means bonus slots only.

WITH desired(class_slug,progression_key,rules_text) AS (VALUES
  ('justiciar-of-taiia','dd-justiciar-of-taiia',
   'Prepare Wisdom-based divine spells from the justiciar of Taiia list as a cleric. A printed 0 grants only bonus-spell access. Justiciars cannot spontaneously convert prepared spells to cure or inflict spells.'),
  ('soldier-of-light','dd-soldier-of-light',
   'Prepare Wisdom-based divine spells from the soldier of light list as a cleric. A printed 0 grants only bonus-spell access. A separate class feature permits prepared divine spells to be converted to cure spells of the same level.')
)
INSERT OR IGNORE INTO dnd35_class_spellcasting
  (id,class_id,spell_list_class_id,track_key,tradition,casting_mode,casting_ability,
   list_behavior,known_behavior,caster_level_numerator,caster_level_denominator,progression_key,rules_text)
SELECT 'dd-class-spellcasting-'||d.class_slug,c.id,NULL,'primary','divine','prepared','wis',
       'own','all_list',1,1,d.progression_key,d.rules_text
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug AND c.owner_user_id IS NULL
JOIN dnd35_sources src ON src.id=c.source_id
WHERE src.slug='deities-and-demigods-3-0';

WITH slot_data(class_slug,rows_json) AS (VALUES
  ('justiciar-of-taiia','[
    [1,[0]],[2,[1]],[3,[1,0]],[4,[1,1]],[5,[1,1,0]],
    [6,[1,1,1]],[7,[2,1,1,0]],[8,[2,1,1,1]],[9,[2,2,1,1]],[10,[2,2,2,1]]
  ]'),
  ('soldier-of-light','[
    [1,[0]],[2,[1]],[3,[1,0]],[4,[1,1]],[5,[1,1,0]],
    [6,[1,1,1]],[7,[2,1,1,0]],[8,[2,1,1,1]],[9,[2,2,1,1]],[10,[2,2,2,1]]
  ]')
),
level_rows AS (
  SELECT d.class_slug,
         CAST(json_extract(v.value,'$[0]') AS INTEGER) AS class_level,
         json_extract(v.value,'$[1]') AS slots_json
  FROM slot_data d,json_each(d.rows_json) v
),
expanded AS (
  SELECT l.class_slug,l.class_level,
         CAST(slot.key AS INTEGER)+1 AS spell_level,
         CAST(slot.value AS INTEGER) AS slots_per_day
  FROM level_rows l,json_each(l.slots_json) slot
)
INSERT INTO dnd35_class_spellcasting_progression
  (class_id,track_key,class_level,spell_level,slots_per_day,spells_known)
SELECT c.id,'primary',e.class_level,e.spell_level,e.slots_per_day,NULL
FROM expanded e
JOIN dnd35_classes c ON c.slug=e.class_slug AND c.owner_user_id IS NULL
JOIN dnd35_sources src ON src.id=c.source_id
WHERE src.slug='deities-and-demigods-3-0'
ON CONFLICT(class_id,track_key,class_level,spell_level) DO UPDATE SET
  slots_per_day=excluded.slots_per_day,
  spells_known=excluded.spells_known;
