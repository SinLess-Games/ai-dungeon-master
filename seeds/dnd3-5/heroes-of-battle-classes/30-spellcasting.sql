-- Heroes of Battle prestige-class spellcasting advancement.
-- Combat Medic may advance only a prior spellcasting class whose list includes cure light wounds.
-- War Weaver advances only a prior arcane spellcasting class and gains no advancement at 1st level.

WITH desired(class_slug,class_level,selection_key,tradition,rules_text) AS (VALUES
  ('combat-medic',1,'eligible-healing-class','any','Advance one prior spellcasting class that includes cure light wounds on its spell list.'),
  ('combat-medic',2,'eligible-healing-class','any','Advance one prior spellcasting class that includes cure light wounds on its spell list.'),
  ('combat-medic',3,'eligible-healing-class','any','Advance one prior spellcasting class that includes cure light wounds on its spell list.'),
  ('combat-medic',4,'eligible-healing-class','any','Advance one prior spellcasting class that includes cure light wounds on its spell list.'),
  ('combat-medic',5,'eligible-healing-class','any','Advance one prior spellcasting class that includes cure light wounds on its spell list.'),
  ('war-weaver',2,'arcane-class','arcane','Advance one prior arcane spellcasting class by one level.'),
  ('war-weaver',3,'arcane-class','arcane','Advance one prior arcane spellcasting class by one level.'),
  ('war-weaver',4,'arcane-class','arcane','Advance one prior arcane spellcasting class by one level.'),
  ('war-weaver',5,'arcane-class','arcane','Advance one prior arcane spellcasting class by one level.')
)
INSERT OR IGNORE INTO dnd35_class_casting_advancements
  (id,class_level_id,selection_key,tradition,levels_advanced,rules_text)
SELECT 'hob-casting-advancement-'||d.class_slug||'-'||printf('%02d',d.class_level),
       cl.id,d.selection_key,d.tradition,1,d.rules_text
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources s ON s.id=c.source_id
JOIN dnd35_class_levels cl ON cl.class_id=c.id AND cl.level=d.class_level
WHERE s.slug='heroes-of-battle-3-5' AND c.owner_user_id IS NULL;
