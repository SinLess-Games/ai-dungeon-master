-- Heroes of Horror spellcasting tracks and prestige-class casting advancement.
-- Some HoH classes use special casting statistics that exceed the single-ability schema;
-- rules_text records the source rule while class features carry structured overrides.

WITH desired(class_slug,track_key,tradition,casting_mode,casting_ability,list_behavior,known_behavior,progression_key,rules_text) AS (VALUES
  ('archivist','primary','divine','prepared','int','own','spellbook','hoh-archivist',
   'Archivist divine casting: prepare spells from a prayerbook. Intelligence governs spell access and save DCs; bonus spells per day use Wisdom. The prayerbook begins with all 0-level cleric spells plus three chosen 1st-level cleric spells and one additional 1st-level cleric spell per Intelligence bonus; two cleric spells are added free at each new archivist level, while other divine spells can be learned from divine scrolls.'),
  ('dread-necromancer','primary','arcane','spontaneous','cha','own','all_list','hoh-dread-necromancer',
   'Dread necromancer arcane casting: spontaneous Charisma casting. On gaining access to a spell level, the dread necromancer automatically knows every spell of that level on the class list; Advanced Learning can expand the list.'),
  ('corrupt-avenger','primary','arcane','prepared','cha','own','spellbook','hoh-corrupt-avenger',
   'Corrupt avenger arcane casting: prepare from a spellbook as a wizard. Spell access requires corruption score at least equal to spell level; bonus spells use an effective ability value of 10 + corruption score; save DC is 10 + spell level + Charisma modifier. A 0 in the printed table grants only bonus spells. The starting spellbook contains two chosen 1st-level corrupt-avenger spells and two new castable spells are added at each new class level.'),
  ('death-delver','primary','divine','prepared','wis','own','all_list','hoh-death-delver',
   'Death delver divine casting: prepare Wisdom-based spells from the full death-delver list as a cleric after 1 hour of nightly contemplation. A 0 in the printed table grants only bonus spells.')
)
INSERT OR IGNORE INTO dnd35_class_spellcasting
  (id,class_id,spell_list_class_id,track_key,tradition,casting_mode,casting_ability,
   list_behavior,known_behavior,caster_level_numerator,caster_level_denominator,progression_key,rules_text)
SELECT 'hoh-class-spellcasting-'||d.class_slug,c.id,NULL,d.track_key,d.tradition,d.casting_mode,d.casting_ability,
       d.list_behavior,d.known_behavior,1,1,d.progression_key,d.rules_text
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources s ON s.id=c.source_id
WHERE s.slug='heroes-of-horror-3-5' AND c.owner_user_id IS NULL;

WITH slot_data(class_slug,rows_json) AS (VALUES
  ('archivist','[
    [1,[3,2]],[2,[4,3]],[3,[4,3,2]],[4,[4,4,3]],[5,[4,4,3,2]],
    [6,[4,4,4,3]],[7,[4,5,4,3,2]],[8,[4,5,4,4,3]],[9,[4,5,5,4,3,2]],[10,[4,5,5,4,4,3]],
    [11,[4,5,5,5,4,3,2]],[12,[4,5,5,5,4,4,3]],[13,[4,5,5,5,5,4,3,2]],[14,[4,5,5,5,5,4,4,3]],[15,[4,5,5,5,5,5,4,3,2]],
    [16,[4,5,5,5,5,5,4,4,3]],[17,[4,5,5,5,5,5,5,4,3,2]],[18,[4,5,5,5,5,5,5,4,4,3]],[19,[4,5,5,5,5,5,5,5,4,4]],[20,[4,5,5,5,5,5,5,5,5,5]]
  ]'),
  ('dread-necromancer','[
    [1,[3]],[2,[4]],[3,[5]],[4,[6,3]],[5,[6,4]],[6,[6,5,3]],[7,[6,6,4]],[8,[6,6,5,3]],[9,[6,6,6,4]],[10,[6,6,6,5,3]],
    [11,[6,6,6,6,4]],[12,[6,6,6,6,5,3]],[13,[6,6,6,6,6,4]],[14,[6,6,6,6,6,5,3]],[15,[6,6,6,6,6,6,4]],
    [16,[6,6,6,6,6,6,5,3]],[17,[6,6,6,6,6,6,6,4]],[18,[6,6,6,6,6,6,6,5,3]],[19,[6,6,6,6,6,6,6,6,4]],[20,[6,6,6,6,6,6,6,6,5]]
  ]'),
  ('corrupt-avenger','[
    [1,[0]],[2,[1]],[3,[1,0]],[4,[1,1]],[5,[1,1,0]],[6,[1,1,1]],[7,[2,1,1,0]],[8,[2,1,1,1]],[9,[2,2,1,1]],[10,[2,2,2,1]]
  ]'),
  ('death-delver','[
    [1,[0]],[2,[1]],[3,[1,0]],[4,[1,1]],[5,[1,1,0]],[6,[1,1,1]],[7,[2,1,1,0]],[8,[2,1,1,1]],[9,[2,2,1,1]],[10,[2,2,2,1]]
  ]')
),
level_rows AS (
  SELECT d.class_slug,CAST(json_extract(v.value,'$[0]') AS INTEGER) AS class_level,json_extract(v.value,'$[1]') AS slots_json
  FROM slot_data d,json_each(d.rows_json) v
),
expanded AS (
  SELECT l.class_slug,l.class_level,
         CASE WHEN l.class_slug IN ('corrupt-avenger','death-delver') THEN CAST(slot.key AS INTEGER)+1 ELSE CAST(slot.key AS INTEGER) END AS spell_level,
         CAST(slot.value AS INTEGER) AS slots_per_day
  FROM level_rows l,json_each(l.slots_json) slot
)
INSERT INTO dnd35_class_spellcasting_progression
  (class_id,track_key,class_level,spell_level,slots_per_day,spells_known)
SELECT c.id,'primary',e.class_level,e.spell_level,e.slots_per_day,NULL
FROM expanded e
JOIN dnd35_classes c ON c.slug=e.class_slug
JOIN dnd35_sources s ON s.id=c.source_id
WHERE s.slug='heroes-of-horror-3-5' AND c.owner_user_id IS NULL
ON CONFLICT(class_id,track_key,class_level,spell_level) DO UPDATE SET
  slots_per_day=excluded.slots_per_day,spells_known=excluded.spells_known;

-- Prestige classes that advance an existing casting track.
WITH desired(class_slug,class_level,selection_key,tradition,rules_text) AS (VALUES
  ('dread-witch',2,'existing-spellcasting-class','any','Advance one spellcasting class possessed before entering dread witch.'),
  ('dread-witch',3,'existing-spellcasting-class','any','Advance one spellcasting class possessed before entering dread witch.'),
  ('dread-witch',4,'existing-spellcasting-class','any','Advance one spellcasting class possessed before entering dread witch.'),
  ('dread-witch',5,'existing-spellcasting-class','any','Advance one spellcasting class possessed before entering dread witch.'),
  ('fiend-blooded',1,'existing-spellcasting-class','any','Advance one prior spellcasting class.'),
  ('fiend-blooded',2,'existing-spellcasting-class','any','Advance one prior spellcasting class.'),
  ('fiend-blooded',3,'existing-spellcasting-class','any','Advance one prior spellcasting class.'),
  ('fiend-blooded',4,'existing-spellcasting-class','any','Advance one prior spellcasting class.'),
  ('fiend-blooded',5,'existing-spellcasting-class','any','Advance one prior spellcasting class.'),
  ('fiend-blooded',6,'existing-spellcasting-class','any','Advance one prior spellcasting class.'),
  ('fiend-blooded',7,'existing-spellcasting-class','any','Advance one prior spellcasting class.'),
  ('fiend-blooded',8,'existing-spellcasting-class','any','Advance one prior spellcasting class.'),
  ('fiend-blooded',9,'existing-spellcasting-class','any','Advance one prior spellcasting class.'),
  ('purifier-hallowed-doctrine',1,'existing-divine-class','divine','Advance one prior divine spellcasting class.'),
  ('purifier-hallowed-doctrine',3,'existing-divine-class','divine','Advance one prior divine spellcasting class.'),
  ('purifier-hallowed-doctrine',5,'existing-divine-class','divine','Advance one prior divine spellcasting class.'),
  ('purifier-hallowed-doctrine',7,'existing-divine-class','divine','Advance one prior divine spellcasting class.'),
  ('purifier-hallowed-doctrine',9,'existing-divine-class','divine','Advance one prior divine spellcasting class.'),
  ('tainted-scholar',1,'existing-arcane-class','arcane','Advance one prior arcane spellcasting class.'),
  ('tainted-scholar',2,'existing-arcane-class','arcane','Advance one prior arcane spellcasting class.'),
  ('tainted-scholar',3,'existing-arcane-class','arcane','Advance one prior arcane spellcasting class.'),
  ('tainted-scholar',4,'existing-arcane-class','arcane','Advance one prior arcane spellcasting class.'),
  ('tainted-scholar',5,'existing-arcane-class','arcane','Advance one prior arcane spellcasting class.'),
  ('tainted-scholar',6,'existing-arcane-class','arcane','Advance one prior arcane spellcasting class.'),
  ('tainted-scholar',7,'existing-arcane-class','arcane','Advance one prior arcane spellcasting class.'),
  ('tainted-scholar',8,'existing-arcane-class','arcane','Advance one prior arcane spellcasting class.'),
  ('tainted-scholar',9,'existing-arcane-class','arcane','Advance one prior arcane spellcasting class.'),
  ('tainted-scholar',10,'existing-arcane-class','arcane','Advance one prior arcane spellcasting class.')
)
INSERT OR IGNORE INTO dnd35_class_casting_advancements
  (id,class_level_id,selection_key,tradition,levels_advanced,rules_text)
SELECT 'hoh-casting-advancement-'||d.class_slug||'-'||printf('%02d',d.class_level),
       cl.id,d.selection_key,d.tradition,1,d.rules_text
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources s ON s.id=c.source_id
JOIN dnd35_class_levels cl ON cl.class_id=c.id AND cl.level=d.class_level
WHERE s.slug='heroes-of-horror-3-5' AND c.owner_user_id IS NULL;
