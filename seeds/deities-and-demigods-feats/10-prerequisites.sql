-- Deities and Demigods feat prerequisites.
-- Requirements are preserved as source text through the existing prerequisite extension
-- rather than inventing relationships for selected weapons, bardic music, body plans,
-- or specific spell-access requirements that are not first-class prerequisite nodes yet.

WITH desired(slug, explanation) AS (VALUES
  ('blindsight-5-ft-radius','Base attack bonus +4; Blind-Fight; Wisdom 19.'),
  ('disguise-spell','Bardic music; Perform 12 ranks.'),
  ('divine-might','Ability to turn or rebuke undead; Charisma 13; Strength 13; Power Attack.'),
  ('divine-vengeance','Ability to turn undead; Extra Turning.'),
  ('energy-substitution','Any other metamagic feat; Knowledge (arcana) 5 ranks.'),
  ('extra-music','Bardic music.'),
  ('eyes-in-the-back-of-your-head','Base attack bonus +3; Wisdom 19.'),
  ('fleet-of-foot','Dexterity 15; Run.'),
  ('greater-multiweapon-fighting','Dexterity 19; three or more hands; Improved Multiweapon Fighting; Multiweapon Fighting; Multidexterity; base attack bonus +15.'),
  ('hold-the-line','Base attack bonus +2; Combat Reflexes.'),
  ('improved-multiweapon-fighting','Dexterity 15; three or more hands; Multiweapon Fighting; Multidexterity; base attack bonus +9.'),
  ('jack-of-all-trades','Character level 6th.'),
  ('knock-down','Base attack bonus +2; Improved Trip; Strength 15.'),
  ('persistent-spell','Extend Spell.'),
  ('plant-control','Plant Defiance; ability to cast speak with plants.'),
  ('plant-defiance','Ability to cast detect animals or plants.'),
  ('power-critical','Proficiency with selected weapon; base attack bonus +12; Improved Critical with selected weapon.'),
  ('repeat-spell','Any other metamagic feat.'),
  ('sharp-shooting','Base attack bonus +3; Point Blank Shot; Precise Shot.'),
  ('subdual-substitution','Any other metamagic feat; Knowledge (arcana) 5 ranks.'),
  ('superior-expertise','Intelligence 13; Combat Expertise (revised name of Expertise); base attack bonus +6.')
)
INSERT INTO dnd35_feat_prerequisites (feat_id,expression,explanation)
SELECT
  f.id,
  json_object(
    'version',1,
    'condition',json_object(
      'kind','custom',
      'description',d.explanation,
      'extension',json_object(
        'key','dnd35.prerequisite.source-text',
        'version',1,
        'parameters',json_object('text',d.explanation)
      )
    )
  ),
  d.explanation
FROM desired d
JOIN dnd35_feats f
  ON f.source_id='dd-3.0'
 AND f.slug=d.slug
 AND f.owner_user_id IS NULL
ON CONFLICT(feat_id) DO UPDATE SET
  expression=excluded.expression,
  explanation=excluded.explanation;
