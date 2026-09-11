-- Epic Level Handbook's nine new epic prestige classes.
-- Epic prestige classes do not advance ordinary base attack or base saves. Their class-level
-- rows therefore retain zero conventional BAB/save contribution; the universal epic attack
-- and epic save formulas from epic-level-handbook-rules apply by total character level.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(slug,name,hit_die,skill_points,page,description) AS (VALUES
  ('agent-retriever','Agent Retriever',6,6,'24-25','An epic planar bounty hunter who locates elusive creatures and objects, crosses planes in pursuit, and traps quarry inside force effects.'),
  ('cosmic-descryer','Cosmic Descryer',4,2,'26-27','An epic planar spellcaster who strengthens summoning magic, acclimates to foreign planes, prolongs gates, and draws power from the multiverse.'),
  ('divine-emissary','Divine Emissary',10,4,'27-28','A deity’s handpicked epic champion who gains a domain, divine inspiration, stronger smiting, divine allies, and the favor of a patron deity.'),
  ('epic-infiltrator','Epic Infiltrator',6,8,'28-30','An epic spy and undercover operative who masters cover identities, specialist espionage skills, remote senses, thought reading, and mental concealment.'),
  ('guardian-paramount','Guardian Paramount',10,4,'30-31','An epic bodyguard who extends defensive class features to a ward, manipulates probability, shields allies, and can restore a protected creature to life.'),
  ('high-proselytizer','High Proselytizer',8,2,'31-33','An epic divine preacher who can enrapture crowds, channel increasingly forceful manifestations of a deity, heal allies, and continue divine spellcasting.'),
  ('legendary-dreadnought','Legendary Dreadnought',12,2,'33-34','An epic warrior built around overwhelming physical force, immovability, exceptional durability, and steady combat-focused bonus feats.'),
  ('perfect-wight','Perfect Wight',6,8,'34-35','An epic stealth master who progresses from supernatural invisibility to remote legerdemain, incorporeality, and a powerful shadow form.'),
  ('union-sentinel','Union Sentinel',10,2,'35-36','An epic lawful guardian of Union trained to control portals, restrain interplanar movement, imprison offenders, and invoke powerful defensive spell-like abilities.')
)
INSERT INTO dnd35_classes
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,hit_die,skill_points_per_level,bab_progression,fort_progression,ref_progression,will_progression)
SELECT 'elh-class-'||d.slug,'elh-3.0',d.page,d.slug,d.name,d.description,d.description,
       0,NULL,1,'prestige',d.hit_die,d.skill_points,'custom','custom','custom','custom'
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_classes c WHERE c.source_id='elh-3.0' AND c.slug=d.slug AND c.owner_user_id IS NULL
);

WITH RECURSIVE levels(level) AS (
  SELECT 1
  UNION ALL
  SELECT level+1 FROM levels WHERE level < 10
), classes(slug) AS (VALUES
  ('agent-retriever'),('cosmic-descryer'),('divine-emissary'),('epic-infiltrator'),('guardian-paramount'),
  ('high-proselytizer'),('legendary-dreadnought'),('perfect-wight'),('union-sentinel')
)
INSERT OR IGNORE INTO dnd35_class_levels
  (id,class_id,level,base_attack_bonus,fort,ref,will)
SELECT 'elh-class-level-'||c.slug||'-'||printf('%02d',l.level),cls.id,l.level,0,0,0,0
FROM classes c
CROSS JOIN levels l
JOIN dnd35_classes cls ON cls.source_id='elh-3.0' AND cls.slug=c.slug AND cls.owner_user_id IS NULL;

WITH desired(class_slug,explanation) AS (VALUES
  ('agent-retriever','Any lawful alignment; Gather Information 24 ranks; Knowledge (the planes) 15 ranks; Track.'),
  ('cosmic-descryer','Knowledge (the planes) 24 ranks; Spell Focus (Conjuration); Energy Resistance epic feat; ability to cast gate and any planar ally or planar binding spell; must have traveled to another plane.'),
  ('divine-emissary','Base attack bonus +23; Weapon Focus with the patron deity''s favored weapon; Great Smiting epic feat; Knowledge (religion) 10 ranks; must have a patron deity and be chosen after completing a quest that significantly furthers the deity''s goals.'),
  ('epic-infiltrator','Any nonchaotic alignment; Bluff 24 ranks; Diplomacy 10 ranks; Disguise 24 ranks; Read Lips 10 ranks; Alertness; Polyglot epic feat; must have successfully spent one month using Disguise to pose as someone else.'),
  ('guardian-paramount','Base attack bonus +15; Spot 13 ranks; Alertness; Lightning Reflexes; Blinding Speed epic feat; Superior Initiative epic feat; uncanny dodge; evasion.'),
  ('high-proselytizer','Diplomacy 12 ranks; either Knowledge (religion) 24 ranks or Knowledge (nature) 24 ranks; Leadership; Epic Leadership epic feat; ability to cast 5th-level divine spells; must have a patron deity.'),
  ('legendary-dreadnought','Base attack bonus +23; Intimidate 15 ranks; Combat Reflexes; Great Cleave; Improved Bull Rush; Improved Critical.'),
  ('perfect-wight','Hide 24 ranks; Move Silently 24 ranks; Self-Concealment epic feat; sneak attack +10d6.'),
  ('union-sentinel','Any lawful alignment; base attack bonus +21; Diplomacy 8 ranks; Knowledge (local) 3 ranks; Alertness; Improved Disarm; Armor Skin epic feat; must reside in the demiplane-city of Union.')
)
INSERT INTO dnd35_class_prerequisites (class_id,expression,explanation)
SELECT
  c.id,
  json_object(
    'version',1,
    'condition',json_object(
      'kind','custom',
      'description',d.explanation,
      'extension',json_object(
        'key','dnd35.prerequisite.source-text',
        'version',1,
        'parameters',json_object('text',d.explanation)
      )
    )
  ),
  d.explanation
FROM desired d
JOIN dnd35_classes c ON c.source_id='elh-3.0' AND c.slug=d.class_slug AND c.owner_user_id IS NULL
ON CONFLICT(class_id) DO UPDATE SET expression=excluded.expression,explanation=excluded.explanation;
