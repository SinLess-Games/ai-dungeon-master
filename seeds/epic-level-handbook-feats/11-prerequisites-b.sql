-- Epic Level Handbook Table 1-36 prerequisites, part B (pp. 48-49).
-- Source wording is retained; 3.0 names that changed in D&D 3.5 are annotated instead of silently rewritten.
WITH desired(slug, explanation) AS (VALUES
  ('improved-spell-capacity','Ability to cast spells of the normal maximum spell level in at least one spellcasting class.'),
  ('improved-spell-resistance','Must have spell resistance from a feat, class feature, or other permanent effect.'),
  ('improved-stunning-fist','Dexterity 19; Wisdom 19; Improved Unarmed Strike; Stunning Fist.'),
  ('improved-whirlwind-attack','Intelligence 13; Dexterity 23; Dodge; Expertise (3.5: Combat Expertise); Mobility; Spring Attack; Whirlwind Attack.'),
  ('incite-rage','Charisma 25; greater rage class feature.'),
  ('infinite-deflection','Dexterity 25; Combat Reflexes; Deflect Arrows; Improved Unarmed Strike.'),
  ('inspire-excellence','Perform 30 ranks; bardic music class feature.'),
  ('instant-reload','Quick Draw; Rapid Reload; Weapon Focus with the selected crossbow type.'),
  ('intensify-spell','Empower Spell; Maximize Spell; Spellcraft 30 ranks; ability to cast 9th-level arcane or divine spells.'),
  ('keen-strike','Strength 23; Wisdom 23; Improved Critical (unarmed strike); ki strike +3.'),
  ('vorpal-strike','Strength 25; Wisdom 25; Improved Critical (unarmed strike); Improved Unarmed Strike; Keen Strike; Stunning Fist; ki strike +3.'),
  ('lasting-inspiration','Perform 25 ranks; bardic music class feature.'),
  ('legendary-climber','Dexterity 21; Balance 12 ranks; Climb 24 ranks.'),
  ('legendary-leaper','Jump 24 ranks.'),
  ('legendary-rider','Ride 24 ranks.'),
  ('legendary-tracker','Wisdom 25; Track; Knowledge (nature) 30 ranks; Wilderness Lore 30 ranks (3.5: Survival 30 ranks).'),
  ('legendary-wrestler','Strength 21; Dexterity 21; Improved Unarmed Strike; Escape Artist 15 ranks.'),
  ('lingering-damage','Sneak attack +8d6; crippling strike class feature.'),
  ('master-staff','Craft Staff; Spellcraft 15 ranks.'),
  ('master-wand','Craft Wand; Spellcraft 15 ranks.'),
  ('mighty-rage','Strength 21; Constitution 21; greater rage class feature.'),
  ('mobile-defense','Dexterity 15; Dodge; Mobility; Spring Attack; defensive stance 5/day class feature.'),
  ('multispell','Quicken Spell; ability to cast 9th-level arcane or divine spells.'),
  ('multiweapon-rend','Dexterity 15; base attack bonus +9; three or more hands; Multidexterity; Multiweapon Fighting. Multidexterity is a 3.0 prerequisite retained from the source.'),
  ('music-of-the-gods','Charisma 25; Perform 30 ranks; bardic music class feature.'),
  ('negative-energy-burst','Charisma 25; ability to rebuke or command undead; ability to cast inflict critical wounds; any evil alignment.'),
  ('overwhelming-critical','Strength 23; Cleave; Great Cleave; Improved Critical with the selected weapon; Power Attack; Weapon Focus with the selected weapon.'),
  ('devastating-critical','Strength 25; Cleave; Great Cleave; Improved Critical with the selected weapon; Overwhelming Critical with the selected weapon; Power Attack; Weapon Focus with the selected weapon.'),
  ('perfect-health','Constitution 25; Great Fortitude.'),
  ('perfect-multiweapon-fighting','Dexterity 25; three or more hands; Greater Multiweapon Fighting; Multidexterity; Multiweapon Fighting. Multidexterity is a 3.0 prerequisite retained from the source.'),
  ('perfect-two-weapon-fighting','Dexterity 25; Ambidexterity; Greater Two-Weapon Fighting; Improved Two-Weapon Fighting; Two-Weapon Fighting. Ambidexterity is a 3.0 prerequisite retained from the source; D&D 3.5 folded its function into Two-Weapon Fighting.'),
  ('permanent-emanation','Spellcraft 25 ranks; ability to cast the spell selected to be made permanent.'),
  ('planar-turning','Wisdom 25; Charisma 25; ability to turn or rebuke undead.'),
  ('polyglot','Intelligence 25; Speak Language (five languages).'),
  ('positive-energy-aura','Charisma 25; ability to turn undead; ability to cast dispel evil.'),
  ('ranged-inspiration','Perform 25 ranks; bardic music class feature.'),
  ('rapid-inspiration','Perform 30 ranks; bardic music class feature. Table 1-36 value; the detailed feat text elsewhere in the source prints Perform 25 ranks, preserved separately as a source discrepancy.'),
  ('reactive-countersong','Combat Reflexes; Perform 30 ranks; bardic music class feature.'),
  ('reflect-arrows','Dexterity 25; Deflect Arrows; Improved Unarmed Strike.'),
  ('righteous-strike','Wisdom 19; Improved Unarmed Strike; Stunning Fist; any lawful alignment.'),
  ('ruinous-rage','Strength 25; Power Attack; Sunder (3.5: Improved Sunder); rage 5/day.'),
  ('scribe-epic-scroll','Scribe Scroll; Knowledge (arcana) 24 ranks; Spellcraft 24 ranks.'),
  ('self-concealment','Dexterity 30; Hide 30 ranks; Tumble 30 ranks; improved evasion.'),
  ('shattering-strike','Epic Weapon Focus (unarmed strike); Weapon Focus (unarmed strike); Concentration 25 ranks; ki strike +3.'),
  ('sneak-attack-of-opportunity','Sneak attack +8d6; opportunist class feature.'),
  ('spectral-strike','Wisdom 19; ability to turn or rebuke undead.'),
  ('spell-knowledge','Ability to cast the maximum spell level of an arcane spellcasting class.'),
  ('spell-opportunity','Combat Casting; Combat Reflexes; Quicken Spell; Spellcraft 25 ranks.'),
  ('spell-stowaway','Spellcraft 24 ranks; caster level 12th.'),
  ('spellcasting-harrier','Combat Reflexes.'),
  ('spontaneous-domain-access','Wisdom 25; Spellcraft 30 ranks; ability to cast 9th-level divine spells.'),
  ('spontaneous-spell','Spellcraft 25 ranks; ability to cast the maximum normal spell level of at least one spellcasting class.'),
  ('storm-of-throws','Dexterity 23; Point Blank Shot; Quick Draw; Rapid Shot.'),
  ('superior-initiative','Improved Initiative.'),
  ('swarm-of-arrows','Dexterity 23; Point Blank Shot; Rapid Shot; Weapon Focus with the selected bow type.'),
  ('tenacious-magic','Spellcraft 15 ranks; ability to cast the spell selected to be made tenacious.'),
  ('terrifying-rage','Intimidate 25 ranks; rage 5/day.'),
  ('thundering-rage','Strength 25; rage 5/day.'),
  ('trap-sense','Search 25 ranks; Spot 25 ranks; ability to find traps as a rogue.'),
  ('two-weapon-rend','Dexterity 15; base attack bonus +9; Ambidexterity; Improved Two-Weapon Fighting; Two-Weapon Fighting. Ambidexterity is a 3.0 prerequisite retained from the source.'),
  ('uncanny-accuracy','Dexterity 21; Point Blank Shot; Precise Shot; Spot 20 ranks.'),
  ('undead-mastery','Charisma 21; ability to rebuke or command undead.'),
  ('zone-of-animation','Charisma 25; Undead Mastery; ability to rebuke or command undead.'),
  ('unholy-strike','Smite good class feature; any evil alignment.'),
  ('widen-aura-of-courage','Charisma 25; aura of courage class feature.'),
  ('widen-aura-of-despair','Charisma 25; aura of despair class feature.')
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