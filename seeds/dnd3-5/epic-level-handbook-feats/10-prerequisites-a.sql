-- Epic Level Handbook Table 1-36 prerequisites, part A (pp. 46-47).
-- Source wording is preserved in a namespaced prerequisite extension. Where 3.0 skill/feat names changed in 3.5,
-- the explanation records the 3.5 canonical name without pretending the original table used it.
WITH desired(slug, explanation) AS (VALUES
  ('augmented-alchemy','Intelligence 21; Alchemy 24 ranks (3.5: Craft [alchemy] 24 ranks).'),
  ('automatic-quicken-spell','Quicken Spell; Spellcraft 30 ranks; ability to cast 9th-level arcane or divine spells.'),
  ('automatic-silent-spell','Silent Spell; Spellcraft 24 ranks; ability to cast 9th-level arcane or divine spells.'),
  ('automatic-still-spell','Still Spell; Spellcraft 27 ranks; ability to cast 9th-level arcane or divine spells.'),
  ('bane-of-enemies','Wilderness Lore 24 ranks (3.5: Survival 24 ranks); five or more favored enemies.'),
  ('death-of-enemies','Bane of Enemies; Wilderness Lore 30 ranks (3.5: Survival 30 ranks).'),
  ('beast-companion','Beast Wild Shape; Knowledge (nature) 24 ranks; wild shape 6/day.'),
  ('beast-wild-shape','Knowledge (nature) 24 ranks; wild shape 6/day.'),
  ('dragon-wild-shape','Wisdom 30; Beast Wild Shape; Knowledge (nature) 30 ranks; wild shape 6/day.'),
  ('magical-beast-wild-shape','Wisdom 25; Beast Wild Shape; Knowledge (nature) 27 ranks; wild shape 6/day.'),
  ('plant-wild-shape','Beast Wild Shape; Knowledge (nature) 24 ranks; wild shape 6/day.'),
  ('vermin-wild-shape','Beast Wild Shape; Knowledge (nature) 24 ranks; wild shape 6/day.'),
  ('blinding-speed','Dexterity 25.'),
  ('bonus-domain','Wisdom 21; ability to cast 9th-level divine spells.'),
  ('bulwark-of-defense','Constitution 25; defensive stance 3/day.'),
  ('chaotic-rage','Rage 5/day; chaotic alignment.'),
  ('combat-archery','Dodge; Mobility; Point Blank Shot.'),
  ('craft-epic-magic-arms-and-armor','Craft Magic Arms and Armor; Knowledge (arcana) 28 ranks; Spellcraft 28 ranks.'),
  ('craft-epic-rod','Craft Rod; Knowledge (arcana) 32 ranks; Spellcraft 32 ranks.'),
  ('craft-epic-staff','Craft Staff; Knowledge (arcana) 35 ranks; Spellcraft 35 ranks.'),
  ('craft-epic-wondrous-item','Craft Wondrous Item; Knowledge (arcana) 26 ranks; Spellcraft 26 ranks.'),
  ('damage-reduction','Constitution 21.'),
  ('deafening-song','Perform 24 ranks; bardic music class feature.'),
  ('hindering-song','Deafening Song; Perform 27 ranks; bardic music class feature.'),
  ('dexterous-fortitude','Dexterity 25; slippery mind class feature.'),
  ('dexterous-will','Dexterity 25; slippery mind class feature.'),
  ('diminutive-wild-shape','Ability to wild shape into a Huge animal.'),
  ('fine-wild-shape','Ability to wild shape into a Diminutive creature.'),
  ('dire-charge','Improved Initiative.'),
  ('distant-shot','Dexterity 25; Far Shot; Point Blank Shot; Spot 20 ranks.'),
  ('efficient-item-creation','Selected item creation feat; Knowledge (arcana) 24 ranks; Spellcraft 24 ranks.'),
  ('enhance-spell','Maximize Spell.'),
  ('epic-dodge','Dexterity 25; Dodge; Tumble 30 ranks; improved evasion; defensive roll class feature.'),
  ('epic-endurance','Constitution 25; Endurance.'),
  ('epic-inspiration','Charisma 25; Perform 30 ranks; bardic music class feature.'),
  ('epic-leadership','Charisma 25; Leadership; Leadership score 25.'),
  ('legendary-commander','Charisma 25; Epic Leadership; Leadership; Diplomacy 30 ranks.'),
  ('epic-skill-focus','20 ranks in the selected skill.'),
  ('epic-speed','Dexterity 21; Run.'),
  ('epic-spell-focus','Greater Spell Focus and Spell Focus in the selected school; ability to cast at least one 9th-level spell of that school.'),
  ('epic-spell-penetration','Greater Spell Penetration; Spell Penetration.'),
  ('epic-spellcasting','Spellcraft 24 ranks and Knowledge (arcana) 24 ranks and ability to cast 9th-level arcane spells; OR Spellcraft 24 ranks and Knowledge (religion) 24 ranks and ability to cast 9th-level divine spells; OR Spellcraft 24 ranks and Knowledge (nature) 24 ranks and ability to cast 9th-level divine spells.'),
  ('epic-weapon-focus','Weapon Focus with the selected weapon.'),
  ('epic-weapon-specialization','Epic Weapon Focus, Weapon Focus, and Weapon Specialization with the selected weapon.'),
  ('exceptional-deflection','Dexterity 21; Wisdom 19; Deflect Arrows; Improved Unarmed Strike.'),
  ('familiar-spell','Intelligence 25 if spellcasting is controlled by Intelligence, OR Charisma 25 if spellcasting is controlled by Charisma.'),
  ('fast-healing','Constitution 25.'),
  ('forge-epic-ring','Forge Ring; Knowledge (arcana) 35 ranks; Spellcraft 35 ranks.'),
  ('gargantuan-wild-shape','Ability to wild shape into a Huge animal.'),
  ('colossal-wild-shape','Ability to wild shape into a Gargantuan creature.'),
  ('great-smiting','Charisma 25; smite ability from a class feature or domain granted power.'),
  ('group-inspiration','Perform 30 ranks; bardic music class feature.'),
  ('holy-strike','Smite evil class feature; any good alignment.'),
  ('ignore-material-components','Eschew Materials; Spellcraft 25 ranks; ability to cast 9th-level arcane or divine spells.'),
  ('improved-alignment-based-casting','Access to the Chaos, Evil, Good, or Law domain; alignment must match the selected domain; ability to cast 9th-level divine spells.'),
  ('improved-arrow-of-death','Dexterity 19; Wisdom 19; Point Blank Shot; Precise Shot; arrow of death class feature.'),
  ('improved-aura-of-courage','Charisma 25; aura of courage class feature.'),
  ('improved-aura-of-despair','Charisma 25; aura of despair class feature.'),
  ('improved-combat-casting','Combat Casting; Concentration 25 ranks.'),
  ('improved-combat-reflexes','Dexterity 21; Combat Reflexes.'),
  ('improved-darkvision','Darkvision.'),
  ('improved-death-attack','Death attack class feature; sneak attack +5d6.'),
  ('improved-elemental-wild-shape','Wisdom 25; ability to wild shape into an elemental.'),
  ('improved-favored-enemy','Five or more favored enemies.'),
  ('improved-heighten-spell','Heighten Spell; Spellcraft 20 ranks.'),
  ('improved-ki-strike','Wisdom 21; ki strike +3.'),
  ('improved-low-light-vision','Low-light vision.'),
  ('improved-manifestation','Ability to manifest powers of the normal maximum level in at least one psionic class.'),
  ('improved-metamagic','Four metamagic feats; Spellcraft 30 ranks.'),
  ('improved-manyshot','Dexterity 19; base attack bonus +21; Manyshot; Point Blank Shot; Rapid Shot.'),
  ('improved-sneak-attack','Sneak attack +8d6.')
)
INSERT INTO dnd35_feat_prerequisites (feat_id, expression, explanation)
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
        'parameters',json_object('text',d.explanation,'source','Epic Level Handbook Table 1-36')
      )
    )
  ),
  d.explanation
FROM desired d
JOIN dnd35_feats f ON f.slug=d.slug AND f.owner_user_id IS NULL
JOIN dnd35_sources s ON s.id=f.source_id
WHERE s.slug='epic-level-handbook-3-0'
ON CONFLICT(feat_id) DO UPDATE SET expression=excluded.expression, explanation=excluded.explanation;