-- Curated Monster Manual V playable race from the by-book source index.
-- Jaebrin mechanics are materialized from the source's "Jaebrins as Characters" block.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES
  ('mm5-3.5','monster-manual-v-3-5','Monster Manual V','MM5',
   'Wizards of the Coast','dnd','3.5',
   'D&D 3.5 Monster Manual V sourcebook.',NULL,1,0,NULL);

DELETE FROM dnd35_races
WHERE owner_user_id IS NULL AND is_enabled=0 AND slug='jaebrin';

INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,
   racial_hit_dice,racial_hit_die,natural_armor,bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'mm5-race-jaebrin','mm5-3.5','92-93','jaebrin','Jaebrin',
  'Exiled fey tricksters with needlelike teeth, strong enchantment magic, and a talent for deception.',
  'LA +1 Medium fey; -2 Strength, +2 Charisma; speed 30 ft.; low-light vision; enchantment immunity; bite, will sapper, feign enchantment, and social/Spellcraft bonuses.',
  0,NULL,1,
  (SELECT ct.id FROM dnd35_creature_types ct WHERE ct.slug='fey' AND ct.owner_user_id IS NULL LIMIT 1),
  (SELECT c.id FROM dnd35_classes c WHERE c.slug='beguiler' AND c.owner_user_id IS NULL LIMIT 1),
  CASE WHEN EXISTS (SELECT 1 FROM dnd35_classes c WHERE c.slug='beguiler' AND c.owner_user_id IS NULL) THEN 'specific' ELSE 'none' END,
  'medium',30,1,0,NULL,0,0,0
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_races r WHERE r.slug='jaebrin' AND r.owner_user_id IS NULL AND r.is_enabled=1 AND r.id<>'mm5-race-jaebrin'
)
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id,source_page=excluded.source_page,name=excluded.name,
  description=excluded.description,rules_text=excluded.rules_text,is_homebrew=0,owner_user_id=NULL,is_enabled=1,
  creature_type_id=excluded.creature_type_id,favored_class_id=excluded.favored_class_id,
  favored_class_rule=excluded.favored_class_rule,size=excluded.size,base_speed_feet=excluded.base_speed_feet,
  level_adjustment=excluded.level_adjustment,racial_hit_dice=0,racial_hit_die=NULL,natural_armor=0,
  bonus_skill_points_per_level=0,bonus_feats_at_first_level=0;

INSERT INTO dnd35_race_abilities (race_id,ability,modifier)
VALUES
  ('mm5-race-jaebrin','str',-2),
  ('mm5-race-jaebrin','cha',2)
ON CONFLICT(race_id,ability) DO UPDATE SET modifier=excluded.modifier;
