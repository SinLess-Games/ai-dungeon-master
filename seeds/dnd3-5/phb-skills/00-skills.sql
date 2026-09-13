-- Player's Handbook v3.5 Chapter 4 core skill catalog.
-- Mechanical columns are sufficient for creator rank allocation; the supplied PHB remains authoritative.
INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('phb-3.5','players-handbook-3-5','Player''s Handbook','PHB','Wizards of the Coast','dnd','3.5',
        'Core Rulebook I; source for D&D v3.5 player-facing character, skill, combat, adventuring, and spellcasting rules.',NULL,1,0,NULL);

WITH desired(slug,name,ability,trained_only,armor_check_multiplier,requires_specialization) AS (VALUES
  ('appraise','Appraise','int',0,0,0),
  ('balance','Balance','dex',0,1,0),
  ('bluff','Bluff','cha',0,0,0),
  ('climb','Climb','str',0,1,0),
  ('concentration','Concentration','con',0,0,0),
  ('craft','Craft','int',0,0,1),
  ('decipher-script','Decipher Script','int',1,0,0),
  ('diplomacy','Diplomacy','cha',0,0,0),
  ('disable-device','Disable Device','int',1,0,0),
  ('disguise','Disguise','cha',0,0,0),
  ('escape-artist','Escape Artist','dex',0,1,0),
  ('forgery','Forgery','int',0,0,0),
  ('gather-information','Gather Information','cha',0,0,0),
  ('handle-animal','Handle Animal','cha',1,0,0),
  ('heal','Heal','wis',0,0,0),
  ('hide','Hide','dex',0,1,0),
  ('intimidate','Intimidate','cha',0,0,0),
  ('jump','Jump','str',0,1,0),
  ('knowledge-arcana','Knowledge (arcana)','int',1,0,0),
  ('knowledge-dungeoneering','Knowledge (dungeoneering)','int',1,0,0),
  ('knowledge-engineering','Knowledge (architecture and engineering)','int',1,0,0),
  ('knowledge-geography','Knowledge (geography)','int',1,0,0),
  ('knowledge-history','Knowledge (history)','int',1,0,0),
  ('knowledge-local','Knowledge (local)','int',1,0,0),
  ('knowledge-nature','Knowledge (nature)','int',1,0,0),
  ('knowledge-nobility','Knowledge (nobility and royalty)','int',1,0,0),
  ('knowledge-religion','Knowledge (religion)','int',1,0,0),
  ('knowledge-planes','Knowledge (the planes)','int',1,0,0),
  ('listen','Listen','wis',0,0,0),
  ('move-silently','Move Silently','dex',0,1,0),
  ('open-lock','Open Lock','dex',1,0,0),
  ('perform','Perform','cha',0,0,1),
  ('profession','Profession','wis',1,0,1),
  ('ride','Ride','dex',0,0,0),
  ('search','Search','int',0,0,0),
  ('sense-motive','Sense Motive','wis',0,0,0),
  ('sleight-of-hand','Sleight of Hand','dex',1,1,0),
  ('speak-language','Speak Language',NULL,1,0,1),
  ('spellcraft','Spellcraft','int',1,0,0),
  ('spot','Spot','wis',0,0,0),
  ('survival','Survival','wis',0,0,0),
  ('swim','Swim','str',0,2,0),
  ('tumble','Tumble','dex',1,1,0),
  ('use-magic-device','Use Magic Device','cha',1,0,0),
  ('use-rope','Use Rope','dex',0,0,0)
)
INSERT INTO dnd35_skills
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   ability,trained_only,armor_check_multiplier,requires_specialization)
SELECT
  'phb-skill-'||d.slug,'phb-3.5','62-85',d.slug,d.name,'','',0,NULL,1,
  d.ability,d.trained_only,d.armor_check_multiplier,d.requires_specialization
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_skills s WHERE s.slug=d.slug AND s.owner_user_id IS NULL
);
