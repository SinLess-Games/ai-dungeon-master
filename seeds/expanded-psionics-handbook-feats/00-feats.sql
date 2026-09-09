-- expanded-psionics-handbook-feats
-- D&D 3.5 Expanded Psionics Handbook feat catalog.
-- Mechanical text is intentionally concise; the attached sourcebook remains authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id, slug, name, abbreviation, publisher, system, edition, description, url, is_official, is_homebrew, owner_user_id)
VALUES
  ('xph-3.5', 'expanded-psionics-handbook-3-5', 'Expanded Psionics Handbook', 'XPH',
   'Wizards of the Coast', 'dnd', '3.5',
   'D&D 3.5 revised psionics sourcebook: psionic races, classes, feats, powers, prestige classes, items, and monsters.',
   NULL, 1, 0, NULL);

WITH desired(slug, name, summary) AS (VALUES
  ('antipsionic-magic', 'Antipsionic Magic', 'Gain improved caster-level checks when spells interact with psionic power resistance; this feat is for nonpsionic characters.'),
  ('autonomous', 'Autonomous', 'Gain bonuses on Autohypnosis and Knowledge (psionics) checks.'),
  ('chaotic-mind', 'Chaotic Mind', 'Psionically derived insight bonuses do not apply against you; this feat is for eligible nonpsionic chaotic characters.'),
  ('cloak-dance', 'Cloak Dance', 'Use movement and performance to gain concealment, or total concealment with a greater action commitment.'),
  ('closed-mind', 'Closed Mind', 'Gain a bonus on saving throws against psionic powers and psi-like abilities; this feat is for nonpsionic characters.'),
  ('deadly-precision', 'Deadly Precision', 'Improve the reliability of extra damage dice from precision-based attacks.'),
  ('force-of-will', 'Force of Will', 'Use mental resolve to improve resistance to hostile psionic effects; this feat is for nonpsionic characters.'),
  ('greater-manyshot', 'Greater Manyshot', 'Apply precision-based damage and other qualifying effects to multiple arrows fired with Manyshot.'),
  ('hostile-mind', 'Hostile Mind', 'Hostile psionic contact can backlash against a manifester who targets you; this feat is for nonpsionic characters.'),
  ('mental-resistance', 'Mental Resistance', 'Gain stronger defenses against mind-affecting psionic powers; this feat is for nonpsionic characters.'),
  ('mind-over-body', 'Mind Over Body', 'Recover ability damage more quickly through disciplined mental control.'),
  ('open-minded', 'Open Minded', 'Immediately gain 5 skill points to spend normally.'),
  ('psionic-affinity', 'Psionic Affinity', 'Gain bonuses on Psicraft and Use Psionic Device checks.'),
  ('psionic-hole', 'Psionic Hole', 'Your presence disrupts psionic focus and makes hostile psionic interaction with you more difficult.'),
  ('rapid-metabolism', 'Rapid Metabolism', 'Recover hit point and ability damage faster through psionically enhanced metabolism.'),
  ('reckless-offense', 'Reckless Offense', 'Trade Armor Class for an attack-roll bonus during your turn.'),
  ('sidestep-charge', 'Sidestep Charge', 'Improve your defense against charging opponents and create an opening when a charge misses.'),
  ('stand-still', 'Stand Still', 'Use an attack of opportunity to stop an opponent from moving farther.'),
  ('wild-talent', 'Wild Talent', 'Gain a small power-point reserve and become psionic.'),
  ('aligned-attack', 'Aligned Attack', 'Expend psionic focus to add damage and make one attack count as a chosen alignment for overcoming damage reduction.'),
  ('boost-construct', 'Boost Construct', 'Astral constructs you create gain one additional menu ability.'),
  ('combat-manifestation', 'Combat Manifestation', 'Gain a bonus on Concentration checks made to manifest defensively or while grappling.'),
  ('expanded-knowledge', 'Expanded Knowledge', 'Learn one additional power from any power list, subject to the feat''s power-level limit.'),
  ('focused-sunder', 'Focused Sunder', 'Expend psionic focus to improve a sunder attack and deal more effective damage to objects.'),
  ('ghost-attack', 'Ghost Attack', 'Expend psionic focus to make an attack fully effective against incorporeal creatures.'),
  ('inquisitor', 'Inquisitor', 'Expend psionic focus to gain a major bonus on a Sense Motive check.'),
  ('mental-leap', 'Mental Leap', 'Expend psionic focus to gain a major bonus on a Jump check.'),
  ('metamorphic-transfer', 'Metamorphic Transfer', 'While assuming another form through a qualifying psionic effect, gain limited use of one supernatural ability of that form.'),
  ('narrow-mind', 'Narrow Mind', 'Gain a bonus on Concentration checks made to become psionically focused.'),
  ('overchannel', 'Overchannel', 'Increase manifester level for a power at the cost of self-inflicted damage; the safe increase grows with character level.'),
  ('talented', 'Talented', 'Use Overchannel on lower-level powers without taking its normal self-inflicted damage.'),
  ('body-fuel', 'Body Fuel', 'Recover power points by accepting ability burn to Strength, Dexterity, and Constitution.'),
  ('power-penetration', 'Power Penetration', 'Expend psionic focus to gain a bonus on a manifester-level check to overcome power resistance.'),
  ('greater-power-penetration', 'Greater Power Penetration', 'Further improve Power Penetration''s bonus against power resistance.'),
  ('power-specialization', 'Power Specialization', 'Choose a damaging power and increase the damage it deals.'),
  ('greater-power-specialization', 'Greater Power Specialization', 'Further increase damage dealt by a power selected with Power Specialization.'),
  ('psicrystal-affinity', 'Psicrystal Affinity', 'Gain a psicrystal companion.'),
  ('improved-psicrystal', 'Improved Psicrystal', 'Improve your psicrystal as though your effective psionic class level were higher; may be selected repeatedly.'),
  ('psicrystal-containment', 'Psicrystal Containment', 'Your psicrystal can hold a psionic focus independently from your own.'),
  ('psionic-body', 'Psionic Body', 'Gain bonus hit points based on the number of psionic feats you possess.'),
  ('psionic-dodge', 'Psionic Dodge', 'While psionically focused, gain a dodge bonus to Armor Class against a designated opponent.'),
  ('psionic-endowment', 'Psionic Endowment', 'Expend psionic focus to increase the saving-throw DC of a power.'),
  ('greater-psionic-endowment', 'Greater Psionic Endowment', 'Further increase the save-DC benefit of Psionic Endowment.'),
  ('psionic-fist', 'Psionic Fist', 'Expend psionic focus to add psionic damage to an unarmed strike.'),
  ('greater-psionic-fist', 'Greater Psionic Fist', 'Increase the bonus damage delivered by Psionic Fist.'),
  ('unavoidable-strike', 'Unavoidable Strike', 'Expend psionic focus to resolve a qualifying unarmed attack as a touch attack.'),
  ('psionic-meditation', 'Psionic Meditation', 'Become psionically focused as a move action instead of a full-round action.'),
  ('psionic-shot', 'Psionic Shot', 'Expend psionic focus to add psionic damage to a ranged attack.'),
  ('greater-psionic-shot', 'Greater Psionic Shot', 'Increase the bonus damage delivered by Psionic Shot.'),
  ('fell-shot', 'Fell Shot', 'Expend psionic focus to resolve a qualifying ranged attack as a touch attack.'),
  ('return-shot', 'Return Shot', 'Expend psionic focus to redirect a missed qualifying ranged weapon back toward its attacker.'),
  ('psionic-talent', 'Psionic Talent', 'Gain additional power points; this feat may be selected repeatedly.'),
  ('psionic-weapon', 'Psionic Weapon', 'Expend psionic focus to add psionic damage to a melee weapon attack.'),
  ('greater-psionic-weapon', 'Greater Psionic Weapon', 'Increase the bonus damage delivered by Psionic Weapon.'),
  ('deep-impact', 'Deep Impact', 'Expend psionic focus to resolve a qualifying melee weapon attack as a touch attack.'),
  ('speed-of-thought', 'Speed of Thought', 'While psionically focused and lightly armored, gain an insight bonus to land speed.'),
  ('psionic-charge', 'Psionic Charge', 'While psionically focused, change direction during a charge.'),
  ('up-the-walls', 'Up the Walls', 'While psionically focused, move across walls and similar surfaces as part of normal movement.'),
  ('wounding-attack', 'Wounding Attack', 'Expend psionic focus to make a weapon attack deal Constitution damage in addition to normal damage.'),
  ('craft-cognizance-crystal', 'Craft Cognizance Crystal', 'Create cognizance crystals that store power points.'),
  ('craft-dorje', 'Craft Dorje', 'Create charged dorjes containing psionic powers.'),
  ('craft-psicrown', 'Craft Psicrown', 'Create psicrowns that provide multiple psionic effects.'),
  ('craft-psionic-arms-and-armor', 'Craft Psionic Arms and Armor', 'Create and enhance psionic weapons, armor, and shields.'),
  ('craft-psionic-construct', 'Craft Psionic Construct', 'Create psionic constructs whose prerequisites you meet.'),
  ('craft-universal-item', 'Craft Universal Item', 'Create universal psionic items.'),
  ('imprint-stone', 'Imprint Stone', 'Create power stones containing powers you know.'),
  ('scribe-tattoo', 'Scribe Tattoo', 'Create psionic tattoos containing eligible powers.'),
  ('burrowing-power', 'Burrowing Power', 'Expend psionic focus and extra power points to manifest a power through an intervening barrier when the feat''s conditions are met.'),
  ('chain-power', 'Chain Power', 'Expend psionic focus and extra power points to arc an eligible single-target energy power to secondary targets.'),
  ('delay-power', 'Delay Power', 'Expend psionic focus and extra power points to delay an eligible power''s onset.'),
  ('empower-power', 'Empower Power', 'Expend psionic focus and extra power points to increase variable numeric effects of a power by one-half.'),
  ('enlarge-power', 'Enlarge Power', 'Expend psionic focus and extra power points to double the range of an eligible power.'),
  ('extend-power', 'Extend Power', 'Expend psionic focus and extra power points to double the duration of an eligible power.'),
  ('maximize-power', 'Maximize Power', 'Expend psionic focus and extra power points to maximize variable numeric effects of a power.'),
  ('opportunity-power', 'Opportunity Power', 'Expend psionic focus and extra power points to manifest an eligible touch power as an attack of opportunity.'),
  ('quicken-power', 'Quicken Power', 'Expend psionic focus and extra power points to manifest an eligible power as a swift action.'),
  ('split-psionic-ray', 'Split Psionic Ray', 'Expend psionic focus and extra power points so an eligible ray can affect a second target.'),
  ('twin-power', 'Twin Power', 'Expend psionic focus and extra power points so an eligible power takes effect twice.'),
  ('unconditional-power', 'Unconditional Power', 'Expend psionic focus and extra power points to manifest a qualifying power despite conditions that normally prevent mental actions.'),
  ('widen-power', 'Widen Power', 'Expend psionic focus and extra power points to increase the area of an eligible burst, emanation, line, or spread.')
)
INSERT INTO dnd35_feats
  (id, source_id, source_page, slug, name, description, rules_text,
   is_homebrew, owner_user_id, is_enabled, repeatable, choice_kind, repeatability_text, normal_text, special_text)
SELECT
  'xph-feat-' || d.slug,
  s.id,
  'Chapter 3',
  d.slug,
  d.name,
  d.summary,
  d.summary,
  0, NULL, 1,
  CASE WHEN d.slug IN ('improved-psicrystal', 'psionic-talent') THEN 1 ELSE 0 END,
  CASE
    WHEN d.slug = 'aligned-attack' THEN 'other'
    WHEN d.slug IN ('expanded-knowledge', 'power-specialization', 'greater-power-specialization') THEN 'other'
    ELSE 'none'
  END,
  CASE
    WHEN d.slug = 'improved-psicrystal' THEN 'May be selected multiple times; each selection further increases effective master level for psicrystal abilities.'
    WHEN d.slug = 'psionic-talent' THEN 'May be selected multiple times; its power-point benefit stacks.'
    ELSE NULL
  END,
  NULL,
  NULL
FROM desired d
CROSS JOIN dnd35_sources s
WHERE s.slug = 'expanded-psionics-handbook-3-5'
  AND s.owner_user_id IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM dnd35_feats existing
    WHERE existing.slug = d.slug
      AND existing.owner_user_id IS NULL
  );
