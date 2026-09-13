-- Shared yuan-ti psionic abilities referenced by pureblood, halfblood, and abomination race traits.
-- Concise mechanical paraphrases of Monster Manual v3.5, Yuan-ti entry.

WITH abilities(id,slug,name,description,rules_text,category,action_type) AS (VALUES
  ('mm1-sa-yuan-pureblood-alternate-form','yuan-ti-alternate-form','Alternate Form','Assume the form of a viper through innate psionic transformation.','May assume the form of a Tiny through Large viper as a psionic ability similar to polymorph (caster level 19th), except changing form does not restore hit points and only viper forms are available. The yuan-ti loses its own natural weapons and gains those of the assumed viper; if either form has a poisonous bite, use the more potent poison.','psi_like','standard'),
  ('mm1-sa-yuan-pureblood-detect-poison','yuan-ti-detect-poison','Detect Poison','Psionically sense poison.','May detect poison as the spell as a psionic ability at caster level 6th.','psi_like','standard')
)
INSERT INTO dnd35_special_abilities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,action_type,effects,parameters)
SELECT id,'mm1-3.5',NULL,slug,name,description,rules_text,0,NULL,1,category,action_type,NULL,NULL
FROM abilities
WHERE 1
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id,
  slug=excluded.slug,
  name=excluded.name,
  description=excluded.description,
  rules_text=excluded.rules_text,
  is_homebrew=0,
  owner_user_id=NULL,
  is_enabled=1,
  category=excluded.category,
  action_type=excluded.action_type,
  effects=NULL,
  parameters=NULL;
