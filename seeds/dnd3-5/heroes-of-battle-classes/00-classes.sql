-- heroes-of-battle-classes
-- D&D 3.5 Heroes of Battle prestige classes and printed level progressions.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('hob-3.5','heroes-of-battle-3-5','Heroes of Battle','HoB','Wizards of the Coast','dnd','3.5',
        'D&D 3.5 supplement for battlefield adventures, military characters, command, morale, and mass-conflict procedures.',NULL,1,0,NULL);

WITH desired(slug,name,hit_die,skill_points,bab,fort,ref,will,source_page,description) AS (VALUES
  ('combat-medic','Combat Medic',6,2,'half','poor','good','poor','99-103','A battlefield healer who improves curative magic, defensive casting, emergency treatment, and spontaneous healing.'),
  ('dread-commando','Dread Commando',8,6,'full','poor','good','poor','103-107','A heavily armored infiltration and shock-troop specialist with sudden strike, team initiative, and stealth mobility.'),
  ('legendary-leader','Legendary Leader',8,4,'three_quarters','poor','poor','good','107-112','A prestige leader whose reputation, command ability, and Leadership followers become increasingly exceptional.'),
  ('war-weaver','War Weaver',4,2,'half','poor','poor','good','112-115','An arcane support specialist who links allies in an eldritch tapestry and distributes beneficial spells across the group.')
)
INSERT INTO dnd35_classes
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,hit_die,skill_points_per_level,bab_progression,fort_progression,ref_progression,will_progression)
SELECT 'hob-class-'||d.slug,'hob-3.5',d.source_page,d.slug,d.name,d.description,d.description,0,NULL,1,
       'prestige',d.hit_die,d.skill_points,d.bab,d.fort,d.ref,d.will
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_classes c WHERE c.slug=d.slug AND c.owner_user_id IS NULL
);

WITH desired(class_slug,level,bab,fort,ref,will) AS (VALUES
  ('combat-medic',1,0,0,2,0),('combat-medic',2,1,0,3,0),('combat-medic',3,1,1,3,1),('combat-medic',4,2,1,4,1),('combat-medic',5,2,1,4,1),
  ('dread-commando',1,1,0,2,0),('dread-commando',2,2,0,3,0),('dread-commando',3,3,1,3,1),('dread-commando',4,4,1,4,1),('dread-commando',5,5,1,4,1),
  ('legendary-leader',1,0,0,0,2),('legendary-leader',2,1,0,0,3),('legendary-leader',3,2,1,1,3),('legendary-leader',4,3,1,1,4),('legendary-leader',5,3,1,1,4),
  ('war-weaver',1,0,0,0,2),('war-weaver',2,1,0,0,3),('war-weaver',3,1,1,1,3),('war-weaver',4,2,1,1,4),('war-weaver',5,2,1,1,4)
)
INSERT OR IGNORE INTO dnd35_class_levels
  (id,class_id,level,base_attack_bonus,fort,ref,will)
SELECT 'hob-class-level-'||d.class_slug||'-'||printf('%02d',d.level),c.id,d.level,d.bab,d.fort,d.ref,d.will
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources s ON s.id=c.source_id
WHERE s.slug='heroes-of-battle-3-5' AND c.owner_user_id IS NULL;

WITH desired(class_slug,expression,explanation) AS (VALUES
  ('combat-medic','{"version":1,"condition":{"kind":"all","conditions":[{"kind":"alignment","allowed":["LG","NG","CG","LN","N","CN"]},{"kind":"skill_ranks","skillId":"phb-skill-concentration","minimum":4},{"kind":"skill_ranks","skillId":"phb-skill-heal","minimum":8},{"kind":"feat","featId":"phb-feat-combat-casting"},{"kind":"feat","featId":"phb-feat-dodge"},{"kind":"custom","description":"Ability to cast cure light wounds.","extension":{"key":"dnd35.hob.prerequisite.cast-cure-light-wounds","version":1,"parameters":{}}}]}}','Any nonevil alignment; Concentration 4 ranks; Heal 8 ranks; Combat Casting; Dodge; ability to cast cure light wounds.'),
  ('dread-commando','{"version":1,"condition":{"kind":"all","conditions":[{"kind":"base_attack_bonus","minimum":5},{"kind":"skill_ranks","skillId":"phb-skill-hide","minimum":6},{"kind":"skill_ranks","skillId":"phb-skill-move-silently","minimum":6},{"kind":"feat","featId":"phb-feat-dodge"},{"kind":"feat","featId":"phb-feat-mobility"}]}}','Base attack bonus +5; Hide 6 ranks; Move Silently 6 ranks; Dodge; Mobility.'),
  ('legendary-leader','{"version":1,"condition":{"kind":"all","conditions":[{"kind":"feat","featId":"phb-feat-iron-will"},{"kind":"feat","featId":"phb-feat-leadership"},{"kind":"custom","description":"Base Leadership score 7 or higher.","extension":{"key":"dnd35.hob.prerequisite.base-leadership-score","version":1,"parameters":{"minimum":7}}}]}}','Iron Will; Leadership; base Leadership score 7 or higher.'),
  ('war-weaver','{"version":1,"condition":{"kind":"all","conditions":[{"kind":"skill_ranks","skillId":"phb-skill-craft","minimum":6,"specialization":"weaving"},{"kind":"skill_ranks","skillId":"phb-skill-knowledge-arcana","minimum":6},{"kind":"feat","featId":"phb-feat-enlarge-spell"},{"kind":"spell_level_access","minimum":3,"tradition":"arcane"}]}}','Craft (weaving) 6 ranks; Knowledge (arcana) 6 ranks; Enlarge Spell; ability to cast 3rd-level arcane spells.')
)
INSERT INTO dnd35_class_prerequisites (class_id,expression,explanation)
SELECT c.id,d.expression,d.explanation
FROM desired d JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources s ON s.id=c.source_id
WHERE s.slug='heroes-of-battle-3-5' AND c.owner_user_id IS NULL
ON CONFLICT(class_id) DO UPDATE SET expression=excluded.expression,explanation=excluded.explanation;
