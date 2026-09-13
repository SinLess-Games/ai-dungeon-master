-- Epic Level Handbook p. 73: Epic Spells by Spellcraft DC, first catalog batch.
-- Epic spells are stored as rule-catalog definitions, not ordinary dnd35_spells rows, because they have no fixed spell level.
WITH desired(slug,name,dc,is_ritual,summary) AS (VALUES
  ('peripety','Peripety',27,0,'Ranged attacks against you are reflected back on the attacker.'),
  ('ruin','Ruin',27,0,'One object or target takes 20d6 damage.'),
  ('dreamscape','Dreamscape',29,0,'Physically travel the region of dreams.'),
  ('mummy-dust','Mummy Dust',35,0,'Create two Large 18 HD mummies.'),
  ('dragon-knight','Dragon Knight',38,1,'An adult red dragon appears and attacks your enemies.'),
  ('origin-of-species-achaierai','Origin of Species: Achaierai',38,1,'Create a true-breeding creature.'),
  ('raise-island','Raise Island',38,1,'Create a small island in the sea.'),
  ('eclipse','Eclipse',42,0,'A solar eclipse follows you.'),
  ('let-go-of-me','Let Go of Me',43,0,'A grappler takes 20d6 damage and you take 10d6 damage.'),
  ('greater-spell-resistance','Greater Spell Resistance',45,1,'Subject gains spell resistance 35 for 20 hours.'),
  ('spell-worm','Spell Worm',45,0,'Subject abandons all her spells.'),
  ('epic-mage-armor','Epic Mage Armor',46,0,'Subject gains a +20 Armor Class bonus.'),
  ('animus-blast','Animus Blast',50,0,'Victims of a 10d6 cold blast animate as skeletons and serve you.'),
  ('dragon-strike','Dragon Strike',50,1,'Ten adult red dragons appear and attack your enemies.'),
  ('lord-of-nightmares','Lord of Nightmares',50,0,'You are possessed by a dream larva for 20 rounds and take 12d6 damage.'),
  ('rain-of-fire','Rain of Fire',50,0,'Create a 2-mile-radius fire storm dealing 1 point of fire damage per round.'),
  ('contingent-resurrection','Contingent Resurrection',52,0,'Subject is automatically resurrected if slain.'),
  ('epic-repulsion','Epic Repulsion',52,0,'One creature or object is warded against one type of creature.'),
  ('mass-frog','Mass Frog',55,0,'All creatures in a 40-foot radius are transformed into frogs.'),
  ('soul-scry','Soul Scry',55,0,'Experience everything the target experiences.'),
  ('crown-of-vermin','Crown of Vermin',56,0,'Gain an aura of one thousand venomous vermin.'),
  ('create-living-vault','Create Living Vault',58,0,'Fashion a living vault attuned to you.'),
  ('verdigris','Verdigris',58,0,'A 100-foot area is overrun by a tsunami of plant growth dealing 10d6 damage.'),
  ('greater-ruin','Greater Ruin',59,0,'One object or target takes 35d6 damage.'),
  ('superb-dispelling','Superb Dispelling',59,0,'Functions as greater dispelling with a +40 modifier on the dispel check.'),
  ('nailed-to-the-sky','Nailed to the Sky',62,0,'Affix a foe to the heavens.'),
  ('safe-time','Safe Time',64,0,'Contingently avoid damage by entering a static time stream for 1 round.'),
  ('epic-spell-reflection','Epic Spell Reflection',68,1,'Permanently ward a creature or object against spells.'),
  ('epic-counterspell','Epic Counterspell',69,0,'Cancel another caster''s epic spell.')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'elh-rule-epic-spell-'||d.slug,'elh-3.0','73','elh-epic-spell-'||d.slug,d.name,'',d.summary,0,NULL,1,
  'epic-spellcasting','rule',0,1,'elh-epic-spell-development',NULL,
  '["epic","spellcasting","epic-spell","catalog"]',
  json_object('spellcraftDc',d.dc,'ritual',CASE WHEN d.is_ritual=1 THEN json('true') ELSE json('false') END,'summary',d.summary)
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r
  WHERE r.source_id='elh-3.0' AND r.slug='elh-epic-spell-'||d.slug AND r.owner_user_id IS NULL
);