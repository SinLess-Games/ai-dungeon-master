-- Epic Level Handbook pp. 73-74: Epic Spells by Spellcraft DC, second catalog batch.
-- Source spelling "Momento Mori" is preserved exactly here rather than silently correcting it.
WITH desired(slug,name,dc,is_ritual,summary) AS (VALUES
  ('time-duplicate','Time Duplicate',71,0,'You and your future self exist together for 1 round.'),
  ('soul-dominion','Soul Dominion',72,0,'Achieve remote control of the target.'),
  ('summon-behemoth','Summon Behemoth',72,0,'A behemoth appears and attacks your enemies.'),
  ('animus-blizzard','Animus Blizzard',78,0,'Victims of a 20d6 cold blast animate as wights and serve you.'),
  ('eidolon','Eidolon',79,0,'Create a duplicate that shares your soul.'),
  ('enslave','Enslave',80,1,'Subject becomes a permanent thrall.'),
  ('demise-unseen','Demise Unseen',82,0,'The animated ghoul of a slain victim fools its companions into believing all is well.'),
  ('momento-mori','Momento Mori',85,0,'A thought that kills.'),
  ('hellball','Hellball',90,0,'Deal 10d6 each of acid, fire, electricity, and sonic damage; the caster takes 10d6 damage.'),
  ('damnation','Damnation',97,0,'Send your foe to hell.'),
  ('kinetic-control','Kinetic Control',103,0,'Store and redirect damage.'),
  ('pestilence','Pestilence',104,1,'Inflict slimy doom on all creatures and plants in a half-mile-diameter area.'),
  ('living-lightning','Living Lightning',140,0,'The spell can cast itself, dealing 10d6 electricity damage to a foe.'),
  ('eternal-freedom','Eternal Freedom',150,1,'Grant permanent immunity to many hold, stun, stasis, and related spells and effects.'),
  ('verdigris-tsunami','Verdigris Tsunami',170,1,'A 1,000-foot-radius area is overrun by permanent plant growth dealing 40d6 damage.'),
  ('dire-winter','Dire Winter',319,0,'A 1,000-foot-radius emanation deals 2d6 cold damage for 20 hours.'),
  ('vengeful-gaze-of-god','Vengeful Gaze of God',419,0,'Target takes 305d6 damage and the caster takes 200d6 damage.')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'elh-rule-epic-spell-'||d.slug,'elh-3.0','74','elh-epic-spell-'||d.slug,d.name,'',d.summary,0,NULL,1,
  'epic-spellcasting','rule',0,1,'elh-epic-spell-development',NULL,
  '["epic","spellcasting","epic-spell","catalog"]',
  json_object('spellcraftDc',d.dc,'ritual',CASE WHEN d.is_ritual=1 THEN json('true') ELSE json('false') END,'summary',d.summary)
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r
  WHERE r.source_id='elh-3.0' AND r.slug='elh-epic-spell-'||d.slug AND r.owner_user_id IS NULL
);