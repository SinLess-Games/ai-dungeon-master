-- Epic Level Handbook prestige classes that advance an existing spellcasting track.
-- These rows advance only spells per day/spells known/caster level as the source specifies;
-- they do not grant unrelated class features from the advanced class.

WITH RECURSIVE ten(level) AS (
  SELECT 1
  UNION ALL
  SELECT level+1 FROM ten WHERE level < 10
), desired(class_slug,class_level,selection_key,tradition,rules_text) AS (
  SELECT 'agent-retriever',level,'existing-spellcasting-class','any','Advance one spellcasting class possessed before entering agent retriever.' FROM ten
  UNION ALL
  SELECT 'divine-emissary',level,'existing-spellcasting-class','any','Advance one spellcasting class possessed before entering divine emissary.' FROM ten
  UNION ALL
  SELECT 'cosmic-descryer',level,'existing-spellcasting-class','any','Advance one prior spellcasting class at every even cosmic descryer level.' FROM ten WHERE level IN (2,4,6,8,10)
  UNION ALL
  SELECT 'high-proselytizer',level,'existing-divine-class','divine','Advance one prior divine spellcasting class at every even high proselytizer level.' FROM ten WHERE level IN (2,4,6,8,10)
)
INSERT OR IGNORE INTO dnd35_class_casting_advancements
  (id,class_level_id,selection_key,tradition,levels_advanced,rules_text)
SELECT 'elh-casting-advancement-'||d.class_slug||'-'||printf('%02d',d.class_level),
       cl.id,d.selection_key,d.tradition,1,d.rules_text
FROM desired d
JOIN dnd35_classes c ON c.source_id='elh-3.0' AND c.slug=d.class_slug AND c.owner_user_id IS NULL
JOIN dnd35_class_levels cl ON cl.class_id=c.id AND cl.level=d.class_level;
