-- Player's Handbook v3.5 Ranger favored-enemy creature catalog.
-- These rows provide the creature-type and subtype choices referenced by the
-- 1st-level Ranger favored enemy feature. They intentionally avoid inventing
-- Monster Manual combat statistics; only creator-facing identity is seeded.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('phb-3.5','players-handbook-3-5','Player''s Handbook','PHB','Wizards of the Coast','dnd','3.5',
        'Core Rulebook I; source for D&D v3.5 player-facing character options.',NULL,1,0,NULL);

WITH desired(slug,name) AS (VALUES
  ('aberration','Aberration'),
  ('animal','Animal'),
  ('construct','Construct'),
  ('dragon','Dragon'),
  ('elemental','Elemental'),
  ('fey','Fey'),
  ('giant','Giant'),
  ('humanoid','Humanoid'),
  ('magical-beast','Magical Beast'),
  ('monstrous-humanoid','Monstrous Humanoid'),
  ('ooze','Ooze'),
  ('outsider','Outsider'),
  ('plant','Plant'),
  ('undead','Undead'),
  ('vermin','Vermin')
)
INSERT INTO dnd35_creature_types
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled)
SELECT
  'phb-creature-type-'||d.slug,
  'phb-3.5',
  '47',
  d.slug,
  d.name,
  'Creature type available to the Ranger favored enemy feature.',
  'Player''s Handbook Ranger favored-enemy option.',
  0,NULL,1
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_creature_types existing
  WHERE existing.slug=d.slug AND existing.owner_user_id IS NULL
);

-- Humanoid and outsider favored enemies require an associated subtype in the
-- PHB Ranger table. Keep these as canonical subtype rows so later monster seeds
-- can reuse the same identities.
WITH desired(slug,name) AS (VALUES
  ('aquatic','Aquatic'),
  ('dwarf','Dwarf'),
  ('elf','Elf'),
  ('goblinoid','Goblinoid'),
  ('gnoll','Gnoll'),
  ('gnome','Gnome'),
  ('halfling','Halfling'),
  ('human','Human'),
  ('orc','Orc'),
  ('reptilian','Reptilian'),
  ('air','Air'),
  ('chaotic','Chaotic'),
  ('earth','Earth'),
  ('evil','Evil'),
  ('fire','Fire'),
  ('good','Good'),
  ('lawful','Lawful'),
  ('native','Native'),
  ('water','Water')
)
INSERT INTO dnd35_creature_subtypes
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled)
SELECT
  'phb-creature-subtype-'||d.slug,
  'phb-3.5',
  '47',
  d.slug,
  d.name,
  'Creature subtype used by a Ranger favored enemy choice.',
  'Player''s Handbook Ranger favored-enemy subtype option.',
  0,NULL,1
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_creature_subtypes existing
  WHERE existing.slug=d.slug AND existing.owner_user_id IS NULL
);
