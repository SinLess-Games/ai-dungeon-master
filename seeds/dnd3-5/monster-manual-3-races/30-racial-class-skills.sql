-- Data-driven class skills for retained Monster Manual III racial Hit Dice.
-- For monster racial HD, skills listed in the entry (including skills carrying a racial bonus)
-- are class skills for those racial Hit Dice.

WITH desired(race_slug,skill_slug) AS (VALUES
  ('armand','jump'),('armand','listen'),('armand','spot'),('armand','survival'),

  ('dracotaur','intimidate'),('dracotaur','jump'),('dracotaur','knowledge-arcana'),('dracotaur','listen'),
  ('dracotaur','sense-motive'),('dracotaur','spellcraft'),('dracotaur','spot'),('dracotaur','survival'),
  ('dracotaur','swim'),('dracotaur','use-magic-device'),

  ('sand-giant','hide'),('sand-giant','knowledge-nature'),('sand-giant','listen'),('sand-giant','spot'),('sand-giant','survival'),

  ('flind','listen'),('flind','spot'),

  ('goatfolk','intimidate'),('goatfolk','listen'),('goatfolk','spot'),('goatfolk','survival'),

  ('harssaf','climb'),('harssaf','hide'),('harssaf','jump'),('harssaf','knowledge-nature'),
  ('harssaf','listen'),('harssaf','move-silently'),('harssaf','spot'),

  ('blackscale-lizardfolk','balance'),('blackscale-lizardfolk','jump'),('blackscale-lizardfolk','spot'),('blackscale-lizardfolk','swim'),

  ('lumi','concentration'),('lumi','diplomacy'),('lumi','heal'),('lumi','knowledge-planes'),
  ('lumi','listen'),('lumi','search'),('lumi','sense-motive'),('lumi','spot'),

  ('nycter','craft'),('nycter','listen'),('nycter','spot'),('nycter','survival'),

  ('skullcrusher-ogre','craft'),('skullcrusher-ogre','handle-animal'),('skullcrusher-ogre','intimidate'),
  ('skullcrusher-ogre','knowledge-engineering'),('skullcrusher-ogre','ride'),

  ('quaraphon','intimidate'),('quaraphon','listen'),('quaraphon','spot'),('quaraphon','survival'),

  ('naztharune-rakshasa','balance'),('naztharune-rakshasa','bluff'),('naztharune-rakshasa','disguise'),
  ('naztharune-rakshasa','escape-artist'),('naztharune-rakshasa','hide'),('naztharune-rakshasa','listen'),
  ('naztharune-rakshasa','move-silently'),('naztharune-rakshasa','search'),('naztharune-rakshasa','spot'),
  ('naztharune-rakshasa','tumble'),

  ('crystalline-troll','listen'),('crystalline-troll','spot'),

  ('warforged-charger','jump'),

  ('witchknife','concentration'),('witchknife','hide'),('witchknife','sense-motive'),
  ('witchknife','speak-language'),('witchknife','spot')
)
INSERT OR IGNORE INTO dnd35_race_class_skills (race_id,skill_id)
SELECT r.id,s.id
FROM desired d
JOIN dnd35_races r ON r.id='mm3-race-'||d.race_slug AND r.is_enabled=1
JOIN dnd35_skills s ON s.slug=d.skill_slug AND s.owner_user_id IS NULL AND s.is_enabled=1;
