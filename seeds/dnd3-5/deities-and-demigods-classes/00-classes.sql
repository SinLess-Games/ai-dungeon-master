-- Deities and Demigods prestige classes, with source progressions preserved.
-- Primary source is the 2002 book; class text is summarized for the revised 3.5 ruleset.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES
  ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0',
   'Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL),
  ('dd-3.5-update','deities-and-demigods-3-5-update','Deities and Demigods - D&D v.3.5 Accessory Update','DD 3.5 Update','Wizards of the Coast','dnd','3.5',
   'Official revision notes that update Deities and Demigods to the revised 3.5 core rules.',NULL,1,0,NULL);

WITH desired(slug,name,hit_die,skill_points,bab,fort,ref,will,source_page,description) AS (VALUES
  ('berserk','Berserk',12,2,'three_quarters','good','poor','poor','201-202',
   'An Asgardian prestige warrior who enters an uncontrollable battle fury, moves faster, shrugs off damage, and assumes animal or hybrid forms.'),
  ('justiciar-of-taiia','Justiciar of Taiia',6,6,'three_quarters','poor','good','good','205-206',
   'An agent of Taiia’s Purifying Flame who combines divine spellcasting, sneak attack, combat insight, and divinatory powers.'),
  ('soldier-of-light','Soldier of Light',10,2,'full','good','poor','poor','208-210',
   'A neutral-good champion of Elishar who turns undead, channels positive energy, gains limited divine spellcasting, and develops regenerative holy power.')
)
INSERT INTO dnd35_classes
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,hit_die,skill_points_per_level,bab_progression,fort_progression,ref_progression,will_progression)
SELECT 'dd-class-'||d.slug,'dd-3.0',d.source_page,d.slug,d.name,d.description,d.description,
       0,NULL,1,'prestige',d.hit_die,d.skill_points,d.bab,d.fort,d.ref,d.will
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_classes c WHERE c.slug=d.slug AND c.owner_user_id IS NULL
);

WITH desired(class_slug,level,bab,fort,ref,will) AS (VALUES
  ('berserk',1,0,2,0,0),('berserk',2,1,3,0,0),('berserk',3,2,3,1,1),('berserk',4,3,4,1,1),('berserk',5,3,4,1,1),
  ('berserk',6,4,5,2,2),('berserk',7,5,5,2,2),('berserk',8,6,6,2,2),('berserk',9,6,6,3,3),('berserk',10,7,7,3,3),
  ('justiciar-of-taiia',1,0,0,2,2),('justiciar-of-taiia',2,1,0,3,3),('justiciar-of-taiia',3,2,1,3,3),('justiciar-of-taiia',4,3,1,4,4),('justiciar-of-taiia',5,3,1,4,4),
  ('justiciar-of-taiia',6,4,2,5,5),('justiciar-of-taiia',7,5,2,5,5),('justiciar-of-taiia',8,6,2,6,6),('justiciar-of-taiia',9,6,3,6,6),('justiciar-of-taiia',10,7,3,7,7),
  ('soldier-of-light',1,1,2,0,0),('soldier-of-light',2,2,3,0,0),('soldier-of-light',3,3,3,1,1),('soldier-of-light',4,4,4,1,1),('soldier-of-light',5,5,4,1,1),
  ('soldier-of-light',6,6,5,2,2),('soldier-of-light',7,7,5,2,2),('soldier-of-light',8,8,6,2,2),('soldier-of-light',9,9,6,3,3),('soldier-of-light',10,10,7,3,3)
)
INSERT OR IGNORE INTO dnd35_class_levels
  (id,class_id,level,base_attack_bonus,fort,ref,will)
SELECT 'dd-class-level-'||d.class_slug||'-'||printf('%02d',d.level),c.id,d.level,d.bab,d.fort,d.ref,d.will
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources src ON src.id=c.source_id
WHERE src.slug='deities-and-demigods-3-0' AND c.owner_user_id IS NULL;

WITH desired(class_slug,expression,explanation) AS (VALUES
  ('berserk',
   '{"version":1,"condition":{"kind":"all","conditions":[{"kind":"alignment","allowed":["NG","CG","N","CN","NE","CE"]},{"kind":"base_attack_bonus","minimum":5},{"kind":"custom","description":"Armor Proficiency (medium), Shield Proficiency, and Martial Weapon Proficiency with battleaxe, longsword, or warhammer.","extension":{"key":"dnd35.dd.prerequisite.berserk-proficiencies","version":1,"parameters":{"armor":"medium","shield":true,"martialWeaponOneOf":["battleaxe","longsword","warhammer"]}}}]}}',
   'Any nonlawful alignment; base attack bonus +5; medium armor, shield, and qualifying martial-weapon proficiency.'),
  ('justiciar-of-taiia',
   '{"version":1,"condition":{"kind":"all","conditions":[{"kind":"alignment","allowed":["LN","N","CN","LE","NE","CE"]},{"kind":"base_attack_bonus","minimum":4},{"kind":"skill_ranks","skillId":"phb-skill-knowledge-religion","minimum":6},{"kind":"custom","description":"Patron deity must be Taiia.","extension":{"key":"dnd35.prerequisite.patron-deity","version":1,"parameters":{"deitySlug":"taiia"}}}]}}',
   'Any nongood alignment; patron deity Taiia; base attack bonus +4; Knowledge (religion) 6 ranks.'),
  ('soldier-of-light',
   '{"version":1,"condition":{"kind":"all","conditions":[{"kind":"alignment","allowed":["NG"]},{"kind":"base_attack_bonus","minimum":5},{"kind":"skill_ranks","skillId":"phb-skill-knowledge-religion","minimum":4},{"kind":"custom","description":"Patron deity must be Elishar.","extension":{"key":"dnd35.prerequisite.patron-deity","version":1,"parameters":{"deitySlug":"elishar"}}}]}}',
   'Neutral good alignment; patron deity Elishar; base attack bonus +5; Knowledge (religion) 4 ranks.')
)
INSERT INTO dnd35_class_prerequisites (class_id,expression,explanation)
SELECT c.id,d.expression,d.explanation
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources src ON src.id=c.source_id
WHERE src.slug='deities-and-demigods-3-0' AND c.owner_user_id IS NULL
ON CONFLICT(class_id) DO UPDATE SET expression=excluded.expression,explanation=excluded.explanation;
