-- Data-driven racial-HD class skills for materialized Monster Manual / SRD monster PCs.
-- The DMG states that skills named in a monster entry are class skills for its racial Hit Dice.
-- This table replaces runtime dependence on a hard-coded race-slug map.

WITH desired(race_slug,skill_slug) AS (VALUES
  ('minotaur','intimidate'),('minotaur','jump'),('minotaur','listen'),('minotaur','search'),('minotaur','spot'),
  ('doppelganger','bluff'),('doppelganger','diplomacy'),('doppelganger','disguise'),('doppelganger','intimidate'),('doppelganger','listen'),('doppelganger','sense-motive'),('doppelganger','spot'),
  ('hound-archon','concentration'),('hound-archon','hide'),('hound-archon','jump'),('hound-archon','listen'),('hound-archon','move-silently'),('hound-archon','sense-motive'),('hound-archon','spot'),('hound-archon','survival'),
  ('ogre-mage','concentration'),('ogre-mage','listen'),('ogre-mage','spellcraft'),('ogre-mage','spot'),
  ('centaur','listen'),('centaur','move-silently'),('centaur','spot'),('centaur','survival'),
  ('gargoyle','hide'),('gargoyle','listen'),('gargoyle','spot'),
  ('janni','appraise'),('janni','concentration'),('janni','craft'),('janni','escape-artist'),('janni','listen'),('janni','move-silently'),('janni','ride'),('janni','sense-motive'),('janni','spot'),
  ('yuan-ti-pureblood','concentration'),('yuan-ti-pureblood','disguise'),('yuan-ti-pureblood','hide'),('yuan-ti-pureblood','listen'),('yuan-ti-pureblood','spot'),
  ('azer','appraise'),('azer','climb'),('azer','craft'),('azer','hide'),('azer','jump'),('azer','listen'),('azer','search'),('azer','spot'),
  ('satyr','bluff'),('satyr','hide'),('satyr','knowledge-nature'),('satyr','listen'),('satyr','move-silently'),('satyr','perform'),('satyr','spot'),
  ('ogre','climb'),('ogre','listen'),('ogre','spot'),
  ('hill-giant','climb'),('hill-giant','jump'),('hill-giant','listen'),('hill-giant','spot'),
  ('stone-giant','climb'),('stone-giant','hide'),('stone-giant','listen'),('stone-giant','spot'),
  ('troll','listen'),('troll','spot'),
  ('bugbear','climb'),('bugbear','hide'),('bugbear','listen'),('bugbear','move-silently'),('bugbear','search'),('bugbear','spot'),
  ('gnoll','listen'),('gnoll','spot'),
  ('lizardfolk','balance'),('lizardfolk','jump'),('lizardfolk','swim'),
  ('troglodyte','hide'),('troglodyte','listen'),
  ('kuo-toa','craft'),('kuo-toa','escape-artist'),('kuo-toa','listen'),('kuo-toa','move-silently'),('kuo-toa','search'),('kuo-toa','spot'),('kuo-toa','swim'),
  ('drider','climb'),('drider','concentration'),('drider','hide'),('drider','listen'),('drider','move-silently'),('drider','spot'),
  ('mind-flayer','bluff'),('mind-flayer','concentration'),('mind-flayer','hide'),('mind-flayer','intimidate'),('mind-flayer','listen'),('mind-flayer','move-silently'),('mind-flayer','spot'),
  ('yuan-ti-halfblood','concentration'),('yuan-ti-halfblood','craft'),('yuan-ti-halfblood','hide'),('yuan-ti-halfblood','listen'),('yuan-ti-halfblood','spot'),
  ('yuan-ti-abomination','concentration'),('yuan-ti-abomination','craft'),('yuan-ti-abomination','hide'),('yuan-ti-abomination','listen'),('yuan-ti-abomination','move-silently'),('yuan-ti-abomination','spot'),
  ('aranea','climb'),('aranea','concentration'),('aranea','escape-artist'),('aranea','jump'),('aranea','listen'),('aranea','spot'),
  ('locathah','craft'),('locathah','listen'),('locathah','spot'),('locathah','swim'),
  ('lamia','bluff'),('lamia','concentration'),('lamia','diplomacy'),('lamia','disguise'),('lamia','hide'),('lamia','intimidate'),('lamia','spot'),
  ('couatl','concentration'),('couatl','diplomacy'),('couatl','jump'),('couatl','listen'),('couatl','search'),('couatl','sense-motive'),('couatl','spellcraft'),('couatl','spot'),('couatl','survival'),('couatl','tumble'),('couatl','use-magic-device'),
  ('lillend','appraise'),('lillend','concentration'),('lillend','diplomacy'),('lillend','knowledge-arcana'),('lillend','listen'),('lillend','perform'),('lillend','sense-motive'),('lillend','spellcraft'),('lillend','spot'),('lillend','survival'),
  ('triton','craft'),('triton','diplomacy'),('triton','hide'),('triton','listen'),('triton','move-silently'),('triton','ride'),('triton','search'),('triton','sense-motive'),('triton','spot'),('triton','survival'),('triton','swim'),
  ('xill','balance'),('xill','climb'),('xill','diplomacy'),('xill','escape-artist'),('xill','intimidate'),('xill','listen'),('xill','move-silently'),('xill','sense-motive'),('xill','spot'),('xill','tumble'),('xill','use-rope'),
  ('trumpet-archon','concentration'),('trumpet-archon','diplomacy'),('trumpet-archon','escape-artist'),('trumpet-archon','handle-animal'),('trumpet-archon','knowledge-planes'),('trumpet-archon','listen'),('trumpet-archon','move-silently'),('trumpet-archon','perform'),('trumpet-archon','ride'),('trumpet-archon','sense-motive'),('trumpet-archon','spot'),('trumpet-archon','use-rope'),
  ('astral-deva','concentration'),('astral-deva','diplomacy'),('astral-deva','escape-artist'),('astral-deva','hide'),('astral-deva','intimidate'),('astral-deva','listen'),('astral-deva','move-silently'),('astral-deva','sense-motive'),('astral-deva','spot'),('astral-deva','use-rope'),
  ('bralani','concentration'),('bralani','diplomacy'),('bralani','escape-artist'),('bralani','handle-animal'),('bralani','hide'),('bralani','jump'),('bralani','listen'),('bralani','move-silently'),('bralani','ride'),('bralani','sense-motive'),('bralani','spot'),('bralani','tumble'),('bralani','use-rope'),
  ('djinni','appraise'),('djinni','concentration'),('djinni','craft'),('djinni','diplomacy'),('djinni','escape-artist'),('djinni','listen'),('djinni','move-silently'),('djinni','sense-motive'),('djinni','spellcraft'),('djinni','spot'),('djinni','use-rope'),
  ('erinyes','concentration'),('erinyes','diplomacy'),('erinyes','escape-artist'),('erinyes','hide'),('erinyes','listen'),('erinyes','move-silently'),('erinyes','search'),('erinyes','sense-motive'),('erinyes','spot'),('erinyes','survival'),('erinyes','use-rope')
)
INSERT OR IGNORE INTO dnd35_race_class_skills (race_id,skill_id)
SELECT r.id,s.id
FROM desired d
JOIN dnd35_races r ON r.slug=d.race_slug AND r.owner_user_id IS NULL AND r.is_enabled=1
JOIN dnd35_skills s ON s.slug=d.skill_slug AND s.owner_user_id IS NULL AND s.is_enabled=1;

-- Entries whose stat blocks say Knowledge (any/any two/any three) treat each
-- Knowledge specialty as a racial-HD class skill.
WITH knowledge_races(race_slug) AS (VALUES
  ('yuan-ti-pureblood'),('kuo-toa'),('mind-flayer'),('yuan-ti-halfblood'),
  ('yuan-ti-abomination'),('couatl'),('astral-deva'),('djinni'),('erinyes')
)
INSERT OR IGNORE INTO dnd35_race_class_skills (race_id,skill_id)
SELECT r.id,s.id
FROM knowledge_races d
JOIN dnd35_races r ON r.slug=d.race_slug AND r.owner_user_id IS NULL AND r.is_enabled=1
JOIN dnd35_skills s ON s.slug LIKE 'knowledge-%' AND s.owner_user_id IS NULL AND s.is_enabled=1;
