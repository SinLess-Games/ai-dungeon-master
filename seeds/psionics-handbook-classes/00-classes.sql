-- D&D 3.0 Psionics Handbook classes.
-- Source mechanics include bundled official errata.
INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('ph3e-3.0','psionics-handbook-3-0','Psionics Handbook','PsiHB','Wizards of the Coast','dnd','3.0',
'D&D 3.0 Psionics Handbook, including the official errata appended to the supplied source PDF.',NULL,1,0,NULL);

WITH desired(slug,name,category,hit_die,skill_points,bab,fort,ref,will,max_level,source_page,description) AS (VALUES
('psion','Psion (3.0)','base',4,4,'half','poor','poor','good',20,'6-12','A D&D 3.0 psionic manifester whose chosen discipline determines the key ability used for powers in that discipline.'),
('psychic-warrior','Psychic Warrior (3.0)','base',8,2,'three_quarters','good','poor','poor',20,'13-16','A D&D 3.0 martial psionic class combining combat training, bonus feats, talents, powers, and psionic combat modes.'),
('metamind','Metamind (3.0)','prestige',4,4,'half','poor','poor','good',10,'109-110','A D&D 3.0 prestige class that expands a psionic character’s power-point reserve and develops trigger-style manifestation abilities.'),
('pyrokineticist','Pyrokineticist (3.0)','prestige',6,2,'three_quarters','good','poor','poor',10,'110-112','A D&D 3.0 prestige class that converts psionic potential into fire-based supernatural and spell-like abilities.'),
('slayer','Slayer (3.0)','prestige',10,4,'full','poor','poor','good',10,'112-113','A D&D 3.0 prestige class trained to hunt illithids and resist or disrupt hostile psionic effects.'),
('soulknife','Soulknife (3.0)','prestige',6,4,'three_quarters','poor','good','poor',10,'113-114','The D&D 3.0 soulknife prestige class, centered on a scaling mind-blade, sneak attack, and embedded psionic effects.'))
INSERT INTO dnd35_classes
(id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,hit_die,skill_points_per_level,bab_progression,fort_progression,ref_progression,will_progression)
SELECT 'ph3e-class-'||d.slug,'ph3e-3.0',d.source_page,'ph3e-'||d.slug,d.name,d.description,d.description,0,NULL,1,d.category,d.hit_die,d.skill_points,d.bab,d.fort,d.ref,d.will
FROM desired d
WHERE NOT EXISTS (SELECT 1 FROM dnd35_classes c WHERE c.slug='ph3e-'||d.slug AND c.owner_user_id IS NULL);

WITH RECURSIVE levels(level) AS (VALUES(1) UNION ALL SELECT level+1 FROM levels WHERE level<20),
desired(slug,max_level,bab,fort,ref,will) AS (VALUES
('psion',20,'half','poor','poor','good'),('psychic-warrior',20,'three_quarters','good','poor','poor'),
('metamind',10,'half','poor','poor','good'),('pyrokineticist',10,'three_quarters','good','poor','poor'),
('slayer',10,'full','poor','poor','good'),('soulknife',10,'three_quarters','poor','good','poor'))
INSERT OR IGNORE INTO dnd35_class_levels(id,class_id,level,base_attack_bonus,fort,ref,will)
SELECT printf('ph3e-class-level-%s-%02d',d.slug,l.level),'ph3e-class-'||d.slug,l.level,
 CASE d.bab WHEN 'full' THEN l.level WHEN 'three_quarters' THEN CAST((3*l.level)/4 AS INTEGER) ELSE CAST(l.level/2 AS INTEGER) END,
 CASE d.fort WHEN 'good' THEN 2+CAST(l.level/2 AS INTEGER) ELSE CAST(l.level/3 AS INTEGER) END,
 CASE d.ref WHEN 'good' THEN 2+CAST(l.level/2 AS INTEGER) ELSE CAST(l.level/3 AS INTEGER) END,
 CASE d.will WHEN 'good' THEN 2+CAST(l.level/2 AS INTEGER) ELSE CAST(l.level/3 AS INTEGER) END
FROM desired d JOIN levels l ON l.level<=d.max_level
WHERE EXISTS (SELECT 1 FROM dnd35_classes c WHERE c.id='ph3e-class-'||d.slug);

-- Prestige-class prerequisites are retained as source-text rule extensions.
WITH desired(slug,explanation) AS (VALUES
('ph3e-metamind','Ability to manifest two different powers, one of which must be 2nd level or higher; Psicraft 6 ranks; Knowledge (psionics) 6 ranks; Inner Strength.'),
('ph3e-pyrokineticist','Any chaotic alignment; Alchemy 1 rank; base power points/day 10+ excluding bonus points; Knowledge (psionics) 1 rank; know control flames; must have set fire to a structure just to watch it burn.'),
('ph3e-slayer','Base attack bonus +3; base power points/day 3+ excluding bonus points; Knowledge (illithid lore) 1 rank; Wilderness Lore 4 ranks; Track; must have killed an illithid alone or in a group of no more than six.'),
('ph3e-soulknife','Base attack bonus +3; Move Silently 3 ranks; base power points/day 9+ excluding bonus points; Knowledge (psionics) 3 ranks.'))
INSERT INTO dnd35_class_prerequisites(class_id,expression,explanation)
SELECT c.id,json_object('version',1,'condition',json_object('kind','custom','description',d.explanation,'extension',json_object('key','dnd35.prerequisite.source-text','version',1,'parameters',json_object('text',d.explanation)))),d.explanation
FROM desired d JOIN dnd35_classes c ON c.slug=d.slug AND c.owner_user_id IS NULL
ON CONFLICT(class_id) DO UPDATE SET expression=excluded.expression,explanation=excluded.explanation;
