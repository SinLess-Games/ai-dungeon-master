-- heroes-of-horror-classes
-- D&D 3.5 Heroes of Horror base and prestige classes.
-- Level rows reproduce the printed BAB/save progressions; feature and spellcasting data live in companion seed files.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('hoh-3.5','heroes-of-horror-3-5','Heroes of Horror','HoH','Wizards of the Coast','dnd','3.5',
        'D&D 3.5 supplement for horror campaigns, taint, dread, dark character options, and dream/nightmare rules.',NULL,1,0,NULL);

WITH desired(slug,name,category,hit_die,skill_points,bab,fort,ref,will,source_page,description) AS (VALUES
  ('archivist','Archivist','base',6,4,'half','good','poor','good','82-84','A scholarly divine spellcaster who prepares spells from a prayerbook and uses dark knowledge to identify and exploit foes.'),
  ('dread-necromancer','Dread Necromancer','base',6,2,'half','poor','poor','good','84-88','A spontaneous arcane necromancer whose charnel powers, undead mastery, and bodily transformation culminate in lichdom.'),
  ('corrupt-avenger','Corrupt Avenger','prestige',12,2,'full','good','poor','poor','88-93','A vengeance-driven martial spellcaster who turns corruption into fury, tainted strikes, and power against a sworn foe.'),
  ('death-delver','Death Delver','prestige',8,2,'three_quarters','good','poor','good','93-98','A contemplative explorer of death who gains limited divine spellcasting and increasing resistance to fear and mortality.'),
  ('dread-witch','Dread Witch','prestige',4,2,'half','poor','poor','good','98-102','A spellcaster who absorbs, empowers, delays, reflects, and projects fear as a magical weapon.'),
  ('fiend-blooded','Fiend-Blooded','prestige',4,2,'half','poor','poor','good','102-108','A spontaneous spellcaster who awakens fiendish ancestry to improve spell selection, resistances, and physical traits.'),
  ('purifier-hallowed-doctrine','Purifier of the Hallowed Doctrine','prestige',8,2,'three_quarters','good','poor','good','108-113','A divine champion devoted to detecting, resisting, cleansing, and destroying taint.'),
  ('tainted-scholar','Tainted Scholar','prestige',6,2,'half','poor','poor','good','113-119','An arcane scholar who fuels spellcasting and forbidden lore with blood, corruption, and depravity.')
)
INSERT INTO dnd35_classes
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,hit_die,skill_points_per_level,bab_progression,fort_progression,ref_progression,will_progression)
SELECT 'hoh-class-'||d.slug,'hoh-3.5',d.source_page,d.slug,d.name,d.description,d.description,0,NULL,1,
       d.category,d.hit_die,d.skill_points,d.bab,d.fort,d.ref,d.will
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_classes c WHERE c.slug=d.slug AND c.owner_user_id IS NULL
);

WITH desired(class_slug,level,bab,fort,ref,will) AS (VALUES
  -- Archivist: half BAB, good Fortitude/Will, poor Reflex.
  ('archivist',1,0,2,0,2),('archivist',2,1,3,0,3),('archivist',3,1,3,1,3),('archivist',4,2,4,1,4),
  ('archivist',5,2,4,1,4),('archivist',6,3,5,2,5),('archivist',7,3,5,2,5),('archivist',8,4,6,2,6),
  ('archivist',9,4,6,3,6),('archivist',10,5,7,3,7),('archivist',11,5,7,3,7),('archivist',12,6,8,4,8),
  ('archivist',13,6,8,4,8),('archivist',14,7,9,4,9),('archivist',15,7,9,5,9),('archivist',16,8,10,5,10),
  ('archivist',17,8,10,5,10),('archivist',18,9,11,6,11),('archivist',19,9,11,6,11),('archivist',20,10,12,6,12),
  -- Dread necromancer: half BAB, poor Fortitude/Reflex, good Will.
  ('dread-necromancer',1,0,0,0,2),('dread-necromancer',2,1,0,0,3),('dread-necromancer',3,1,1,1,3),('dread-necromancer',4,2,1,1,4),
  ('dread-necromancer',5,2,1,1,4),('dread-necromancer',6,3,2,2,5),('dread-necromancer',7,3,2,2,5),('dread-necromancer',8,4,2,2,6),
  ('dread-necromancer',9,4,3,3,6),('dread-necromancer',10,5,3,3,7),('dread-necromancer',11,5,3,3,7),('dread-necromancer',12,6,4,4,8),
  ('dread-necromancer',13,6,4,4,8),('dread-necromancer',14,7,4,4,9),('dread-necromancer',15,7,5,5,9),('dread-necromancer',16,8,5,5,10),
  ('dread-necromancer',17,8,5,5,10),('dread-necromancer',18,9,6,6,11),('dread-necromancer',19,9,6,6,11),('dread-necromancer',20,10,6,6,12),
  -- Corrupt avenger.
  ('corrupt-avenger',1,1,2,0,0),('corrupt-avenger',2,2,3,0,0),('corrupt-avenger',3,3,3,1,1),('corrupt-avenger',4,4,4,1,1),('corrupt-avenger',5,5,4,1,1),
  ('corrupt-avenger',6,6,5,2,2),('corrupt-avenger',7,7,5,2,2),('corrupt-avenger',8,8,6,2,2),('corrupt-avenger',9,9,6,3,3),('corrupt-avenger',10,10,7,3,3),
  -- Death delver.
  ('death-delver',1,0,2,0,2),('death-delver',2,1,3,0,3),('death-delver',3,2,3,1,3),('death-delver',4,3,4,1,4),('death-delver',5,3,4,1,4),
  ('death-delver',6,4,5,2,5),('death-delver',7,5,5,2,5),('death-delver',8,6,6,2,6),('death-delver',9,6,6,3,6),('death-delver',10,7,7,3,7),
  -- Dread witch.
  ('dread-witch',1,0,0,0,2),('dread-witch',2,1,0,0,3),('dread-witch',3,1,1,1,3),('dread-witch',4,2,1,1,4),('dread-witch',5,2,1,1,4),
  -- Fiend-blooded.
  ('fiend-blooded',1,0,0,0,2),('fiend-blooded',2,1,0,0,3),('fiend-blooded',3,1,1,1,3),('fiend-blooded',4,2,1,1,4),('fiend-blooded',5,2,1,1,4),
  ('fiend-blooded',6,3,2,2,5),('fiend-blooded',7,3,2,2,5),('fiend-blooded',8,4,2,2,6),('fiend-blooded',9,4,3,3,6),('fiend-blooded',10,5,3,3,7),
  -- Purifier of the Hallowed Doctrine.
  ('purifier-hallowed-doctrine',1,0,2,0,2),('purifier-hallowed-doctrine',2,1,3,0,3),('purifier-hallowed-doctrine',3,2,3,1,3),('purifier-hallowed-doctrine',4,3,4,1,4),('purifier-hallowed-doctrine',5,3,4,1,4),
  ('purifier-hallowed-doctrine',6,4,5,2,5),('purifier-hallowed-doctrine',7,5,5,2,5),('purifier-hallowed-doctrine',8,6,6,2,6),('purifier-hallowed-doctrine',9,6,6,3,6),('purifier-hallowed-doctrine',10,7,7,3,7),
  -- Tainted scholar.
  ('tainted-scholar',1,0,0,0,2),('tainted-scholar',2,1,0,0,3),('tainted-scholar',3,1,1,1,3),('tainted-scholar',4,2,1,1,4),('tainted-scholar',5,2,1,1,4),
  ('tainted-scholar',6,3,2,2,5),('tainted-scholar',7,3,2,2,5),('tainted-scholar',8,4,2,2,6),('tainted-scholar',9,4,3,3,6),('tainted-scholar',10,5,3,3,7)
)
INSERT OR IGNORE INTO dnd35_class_levels
  (id,class_id,level,base_attack_bonus,fort,ref,will)
SELECT 'hoh-class-level-'||d.class_slug||'-'||printf('%02d',d.level),c.id,d.level,d.bab,d.fort,d.ref,d.will
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources s ON s.id=c.source_id
WHERE s.slug='heroes-of-horror-3-5' AND c.owner_user_id IS NULL;

WITH desired(class_slug,expression,explanation) AS (VALUES
  ('corrupt-avenger','{"version":1,"condition":{"kind":"all","conditions":[{"kind":"alignment","allowed":["LG","NG","CG","LN","N","CN"]},{"kind":"base_attack_bonus","minimum":6},{"kind":"custom","description":"Moderate corruption.","extension":{"key":"dnd35.hoh.prerequisite.taint","version":1,"parameters":{"score":"corruption","minimumDegree":"moderate"}}}]}}','Non-evil alignment; base attack bonus +6; moderate corruption.'),
  ('death-delver','{"version":1,"condition":{"kind":"all","conditions":[{"kind":"save","save":"will","minimum":2},{"kind":"skill_ranks","skillId":"phb-skill-concentration","minimum":8},{"kind":"skill_ranks","skillId":"phb-skill-heal","minimum":2},{"kind":"skill_ranks","skillId":"phb-skill-knowledge-religion","minimum":4},{"kind":"custom","description":"Must have fallen below 0 hit points and lived.","extension":{"key":"dnd35.hoh.prerequisite.near-death-experience","version":1,"parameters":{}}}]}}','Base Will save +2; Concentration 8 ranks; Heal 2 ranks; Knowledge (religion) 4 ranks; must have survived falling below 0 hit points.'),
  ('dread-witch','{"version":1,"condition":{"kind":"all","conditions":[{"kind":"save","save":"will","minimum":4},{"kind":"skill_ranks","skillId":"phb-skill-knowledge-arcana","minimum":3},{"kind":"custom","description":"Ability to cast cause fear and scare.","extension":{"key":"dnd35.hoh.prerequisite.cast-specific-spells","version":1,"parameters":{"spells":["cause fear","scare"]}}},{"kind":"custom","description":"Must have suffered at least one fear effect and failed the saving throw.","extension":{"key":"dnd35.hoh.prerequisite.failed-fear-save","version":1,"parameters":{}}}]}}','Base Will save +4; Knowledge (arcana) 3 ranks; ability to cast cause fear and scare; must have failed a save against a fear effect.'),
  ('fiend-blooded','{"version":1,"condition":{"kind":"all","conditions":[{"kind":"custom","description":"Any humanoid race, but not already a half-fiend.","extension":{"key":"dnd35.hoh.prerequisite.humanoid-not-half-fiend","version":1,"parameters":{}}},{"kind":"alignment","allowed":["LE","NE","CE","LN","N","CN"]},{"kind":"skill_ranks","skillId":"phb-skill-concentration","minimum":8},{"kind":"skill_ranks","skillId":"phb-skill-knowledge-arcana","minimum":8},{"kind":"skill_ranks","skillId":"phb-skill-knowledge-planes","minimum":8},{"kind":"feat","featId":"hoh-feat-blood-calls-to-blood"},{"kind":"feat","featId":"phb-feat-eschew-materials"},{"kind":"custom","description":"Must be able to cast 2nd-level arcane spells without preparation.","extension":{"key":"dnd35.hoh.prerequisite.spontaneous-arcane-spell-level","version":1,"parameters":{"minimum":2}}}]}}','Any humanoid race except half-fiend; nongood alignment; Concentration 8 ranks; Knowledge (arcana) 8 ranks; Knowledge (the planes) 8 ranks; Blood Calls to Blood; Eschew Materials; spontaneous 2nd-level arcane spellcasting.'),
  ('purifier-hallowed-doctrine','{"version":1,"condition":{"kind":"all","conditions":[{"kind":"alignment","allowed":["LG","NG","CG","N"]},{"kind":"skill_ranks","skillId":"phb-skill-knowledge-arcana","minimum":4},{"kind":"skill_ranks","skillId":"phb-skill-knowledge-religion","minimum":8},{"kind":"feat","featId":"hoh-feat-pure-soul"},{"kind":"custom","description":"Ability to turn undead.","extension":{"key":"dnd35.prerequisite.turn-or-rebuke","version":1,"parameters":{"mode":"turn"}}}]}}','Any good alignment or true neutral; Knowledge (arcana) 4 ranks; Knowledge (religion) 8 ranks; Pure Soul; ability to turn undead.'),
  ('tainted-scholar','{"version":1,"condition":{"kind":"all","conditions":[{"kind":"skill_ranks","skillId":"phb-skill-concentration","minimum":8},{"kind":"skill_ranks","skillId":"phb-skill-knowledge-arcana","minimum":4},{"kind":"custom","description":"Ability to cast 1st-level arcane spells or use least invocations.","extension":{"key":"dnd35.hoh.prerequisite.arcane-or-least-invocation","version":1,"parameters":{"spellLevel":1,"invocationGrade":"least"}}},{"kind":"custom","description":"Moderate or greater depravity.","extension":{"key":"dnd35.hoh.prerequisite.taint","version":1,"parameters":{"score":"depravity","minimumDegree":"moderate"}}}]}}','Concentration 8 ranks; Knowledge (arcana) 4 ranks; ability to cast 1st-level arcane spells or use least invocations; moderate or greater depravity.')
)
INSERT INTO dnd35_class_prerequisites (class_id,expression,explanation)
SELECT c.id,d.expression,d.explanation
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources s ON s.id=c.source_id
WHERE s.slug='heroes-of-horror-3-5' AND c.owner_user_id IS NULL
ON CONFLICT(class_id) DO UPDATE SET expression=excluded.expression,explanation=excluded.explanation;
