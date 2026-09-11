-- Epic Level Handbook Chapter 2 epic spell seeds (pp. 92-102).
-- Seed rows are kept in dnd35_rules because epic spells have no fixed spell level and are developed from seeds/factors.
-- Summaries intentionally stay at the seed's primary mechanical role; detailed factors/alternate uses are seeded separately.

WITH desired(slug,name,dc,summary) AS (VALUES
  ('afflict','Afflict',14,'Impose a morale penalty or develop stronger afflictions by increasing the seed Spellcraft DC.'),
  ('animate','Animate',25,'Animate nonliving matter and direct the resulting animated object under the seed rules.'),
  ('animate-dead','Animate Dead',23,'Create and control undead from corpses, with additional Hit Dice increasing the Spellcraft DC.'),
  ('armor','Armor',14,'Grant an armor bonus to Armor Class, with larger bonuses increasing the Spellcraft DC.'),
  ('banish','Banish',27,'Force extraplanar creatures away from the current plane, subject to the seed saving throw and resistance rules.'),
  ('compel','Compel',19,'Compel a target to follow a course of action, with stronger control requiring additional development factors.'),
  ('conceal','Conceal',17,'Conceal a creature or object from detection, with stronger forms of concealment increasing the Spellcraft DC.'),
  ('conjure','Conjure',21,'Create nonmagical matter; permanent or more extensive creations require additional factors or related seeds.'),
  ('contact','Contact',23,'Forge telepathic communication with a familiar creature; additional subjects and broader communication increase the Spellcraft DC.'),
  ('delude','Delude',14,'Create a visual figment; additional sensory components, scripted behavior, or broader scene changes increase the Spellcraft DC.'),
  ('destroy','Destroy',29,'Deal 20d6 untyped destructive damage to a creature or limited volume of nonliving matter; additional damage increases the Spellcraft DC.'),
  ('dispel','Dispel',19,'End or suppress magic with a base dispel check of 1d20 + 10 against DC 11 + the target effect caster level.'),
  ('energy','Energy',19,'Create damaging acid, cold, electricity, fire, or sonic energy in the seed''s supported forms.'),
  ('foresee','Foresee',17,'Foretell the immediate future or obtain limited information; deeper questions use the seed''s higher-DC alternate mode.'),
  ('fortify','Fortify',17,'Grant a +1 enhancement bonus to a supported statistic or a small resistance or temporary-hit-point benefit; greater benefits increase the Spellcraft DC.'),
  ('heal','Heal',25,'Channel positive energy to remove disease and injury and restore a living subject under the seed rules.'),
  ('life','Life',27,'Restore a dead creature to life and full vigor when some portion of the body remains, within the seed''s time limits.'),
  ('reflect','Reflect',27,'Reflect one category of incoming attack back on its originator until the seed''s protection is expended or expires.'),
  ('reveal','Reveal',19,'Create a magical sensor for distant seeing or hearing; additional sensing capabilities increase the Spellcraft DC.'),
  ('slay','Slay',25,'Attack a living creature''s life force with an instantaneous death effect under the seed rules.'),
  ('summon','Summon',14,'Summon a creature to appear and act for the spell''s duration; stronger or unusual creatures increase the Spellcraft DC.'),
  ('transform','Transform',21,'Transform a creature or nonmagical object into another form, with type, size, or special-form changes increasing the Spellcraft DC.'),
  ('transport','Transport',27,'Transport creatures or objects across distance, planes, or special time streams according to the seed''s factors.'),
  ('ward','Ward',14,'Protect a creature, object, or area against specified damage, magic, or creatures; broader protection increases the Spellcraft DC.')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'elh-rule-epic-seed-'||d.slug,
  'elh-3.0',
  '92-102',
  'elh-epic-seed-'||d.slug,
  'Epic Seed: '||d.name,
  '',
  d.summary,
  0,NULL,1,
  'epic-spellcasting','subsystem',0,1,
  'elh-epic-spell-seed-development',NULL,
  '["epic","spellcasting","seed"]',
  json_object('seedName',d.name,'baseSpellcraftDc',d.dc)
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r
  WHERE r.source_id='elh-3.0'
    AND r.slug='elh-epic-seed-'||d.slug
    AND r.owner_user_id IS NULL
);