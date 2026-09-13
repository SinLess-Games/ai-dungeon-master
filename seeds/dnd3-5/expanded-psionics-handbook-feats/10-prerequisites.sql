-- Expanded Psionics Handbook feat prerequisites.
-- The current rules schema does not yet have canonical IDs for every psionic skill or
-- every selected-weapon relation, so source prerequisite text is preserved through a
-- namespaced custom rule extension instead of inventing placeholder IDs.

WITH desired(slug, explanation) AS (VALUES
  ('aligned-attack','Base attack bonus +6.'),
  ('antipsionic-magic','Spellcraft 5 ranks.'),
  ('chaotic-mind','Chaotic alignment, Charisma 15.'),
  ('cloak-dance','Hide 10 ranks, Perform (dance) 2 ranks.'),
  ('craft-cognizance-crystal','Manifester level 3rd.'),
  ('craft-dorje','Manifester level 5th.'),
  ('craft-psicrown','Manifester level 12th.'),
  ('craft-psionic-arms-and-armor','Manifester level 5th.'),
  ('craft-psionic-construct','Craft Psionic Arms and Armor, Craft Universal Item.'),
  ('craft-universal-item','Manifester level 3rd.'),
  ('deadly-precision','Dexterity 15, base attack bonus +5.'),
  ('deep-impact','Strength 13, Psionic Weapon, base attack bonus +5.'),
  ('expanded-knowledge','Manifester level 3rd.'),
  ('fell-shot','Dexterity 13, Point Blank Shot, Psionic Shot, base attack bonus +5.'),
  ('focused-sunder','Strength 13, Power Attack, Improved Sunder.'),
  ('ghost-attack','Base attack bonus +3.'),
  ('greater-manyshot','Dexterity 17, Manyshot, Point Blank Shot, Rapid Shot, base attack bonus +6.'),
  ('greater-power-penetration','Power Penetration.'),
  ('greater-power-specialization','Power Specialization, Weapon Focus (ray), manifester level 12th.'),
  ('greater-psionic-endowment','Psionic Endowment.'),
  ('greater-psionic-fist','Strength 13, Psionic Fist, base attack bonus +5.'),
  ('greater-psionic-shot','Point Blank Shot, Psionic Shot, base attack bonus +5.'),
  ('greater-psionic-weapon','Strength 13, Psionic Weapon, base attack bonus +5.'),
  ('hostile-mind','Charisma 15.'),
  ('imprint-stone','Manifester level 1st.'),
  ('improved-psicrystal','Psicrystal Affinity.'),
  ('inquisitor','Wisdom 13.'),
  ('mental-leap','Strength 13, Jump 5 ranks.'),
  ('mental-resistance','Base Will save bonus +2.'),
  ('metamorphic-transfer','Wisdom 13, manifester level 5th.'),
  ('mind-over-body','Constitution 13.'),
  ('narrow-mind','Wisdom 13.'),
  ('power-specialization','Weapon Focus (ray), manifester level 4th.'),
  ('psicrystal-affinity','Manifester level 1st.'),
  ('psicrystal-containment','Psicrystal Affinity, manifester level 3rd.'),
  ('psionic-charge','Dexterity 13, Speed of Thought.'),
  ('psionic-dodge','Dexterity 13, Dodge.'),
  ('psionic-fist','Strength 13.'),
  ('psionic-hole','Constitution 15.'),
  ('psionic-meditation','Wisdom 13, Concentration 7 ranks.'),
  ('psionic-shot','Point Blank Shot.'),
  ('psionic-talent','Having a power point reserve.'),
  ('psionic-weapon','Strength 13.'),
  ('rapid-metabolism','Constitution 13.'),
  ('reckless-offense','Base attack bonus +1.'),
  ('return-shot','Point Blank Shot, Psionic Shot, Fell Shot, base attack bonus +3.'),
  ('scribe-tattoo','Manifester level 3rd.'),
  ('sidestep-charge','Dexterity 13, Dodge.'),
  ('speed-of-thought','Wisdom 13.'),
  ('split-psionic-ray','Any other metapsionic feat.'),
  ('stand-still','Strength 13.'),
  ('unavoidable-strike','Strength 13, Psionic Fist, base attack bonus +5.'),
  ('up-the-walls','Wisdom 13.'),
  ('wounding-attack','Base attack bonus +8.')
)
INSERT INTO dnd35_feat_prerequisites (feat_id, expression, explanation)
SELECT
  f.id,
  json_object(
    'version', 1,
    'condition', json_object(
      'kind', 'custom',
      'description', d.explanation,
      'extension', json_object(
        'key', 'dnd35.prerequisite.source-text',
        'version', 1,
        'parameters', json_object('text', d.explanation)
      )
    )
  ),
  d.explanation
FROM desired d
JOIN dnd35_feats f
  ON f.slug = d.slug
 AND f.owner_user_id IS NULL
ON CONFLICT(feat_id) DO UPDATE
SET expression = excluded.expression,
    explanation = excluded.explanation;
