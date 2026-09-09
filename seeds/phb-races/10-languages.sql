-- Player's Handbook v3.5 Chapter 2 language catalog used by core races/classes.
WITH desired(slug,name,script,is_secret) AS (VALUES
  ('common','Common','Common',0),
  ('dwarven','Dwarven','Dwarven',0),
  ('elven','Elven','Elven',0),
  ('gnome','Gnome','Dwarven',0),
  ('goblin','Goblin','Dwarven',0),
  ('halfling','Halfling','Common',0),
  ('orc','Orc','Dwarven',0),
  ('abyssal','Abyssal','Infernal',0),
  ('aquan','Aquan','Elven',0),
  ('auran','Auran','Draconic',0),
  ('celestial','Celestial','Celestial',0),
  ('draconic','Draconic','Draconic',0),
  ('giant','Giant','Dwarven',0),
  ('gnoll','Gnoll','Common',0),
  ('ignan','Ignan','Draconic',0),
  ('infernal','Infernal','Infernal',0),
  ('sylvan','Sylvan','Elven',0),
  ('terran','Terran','Dwarven',0),
  ('undercommon','Undercommon','Elven',0),
  ('druidic','Druidic','Druidic',1)
)
INSERT INTO dnd35_languages
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   script,typical_speakers,is_secret)
SELECT
  'phb-language-'||d.slug,'phb-3.5','12,82',d.slug,d.name,'','',0,NULL,1,
  d.script,NULL,d.is_secret
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_languages l WHERE l.slug=d.slug AND l.owner_user_id IS NULL
);
