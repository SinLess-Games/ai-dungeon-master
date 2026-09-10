-- Expanded Psionics Handbook racial traits and named special abilities.
-- Mechanical text is concise source-backed paraphrase suitable for deterministic
-- rules integration without copying book prose.

WITH abilities(id,slug,name,description,rules_text,category,action_type) AS (VALUES
  ('xph-sa-dromite-energy-ray','dromite-energy-ray','Energy Ray',
   'A daily psi-like energy attack tied to the dromite energy affinity.',
   '1/day, manifest energy ray at manifester level 1st. The ray deals 1d6+1 damage of the dromite chosen energy type; that type matches its racial energy resistance. Save DC, when applicable, is Charisma-based.',
   'psi_like','standard'),

  ('xph-sa-duergar-psi-like','psionic-duergar-psi-like-abilities','Psionic Duergar Psi-Like Abilities',
   'The psionic duergar variant replaces the standard duergar spell-like abilities with psionic versions.',
   '1/day each: expansion and invisibility, affecting only the duergar and carried gear. Manifester level equals Hit Dice, minimum 3rd.',
   'psi_like','standard'),

  ('xph-sa-elan-repletion','elan-repletion','Repletion',
   'Psionic sustenance replaces ordinary food and drink for a day.',
   'Spend 1 power point to go without food and water for 24 hours.',
   'supernatural','none'),
  ('xph-sa-elan-resilience','elan-resilience','Resilience',
   'Power points can absorb incoming damage.',
   'As an immediate action, spend any number of power points to reduce incoming damage by 2 points per power point spent.',
   'supernatural','immediate'),
  ('xph-sa-elan-resistance','elan-resistance','Resistance',
   'A brief expenditure of psychic energy reinforces all saving throws.',
   'As an immediate action, spend 1 power point to gain a +4 racial bonus on saving throws until the beginning of the elan next turn.',
   'supernatural','immediate'),

  ('xph-sa-half-giant-stomp','half-giant-stomp','Stomp',
   'A daily psi-like shockwave.',
   '1/day, manifest stomp. Manifester level equals one-half Hit Dice, minimum 1st; save DC is Charisma-based.',
   'psi_like','standard'),
  ('xph-sa-half-giant-fire-acclimated','half-giant-fire-acclimated','Fire Acclimated',
   'Half-giants are unusually resistant to intense heat and fire effects.',
   '+2 racial bonus on saving throws against fire spells and fire effects.',
   'extraordinary','none'),
  ('xph-sa-half-giant-powerful-build','half-giant-powerful-build','Powerful Build',
   'A half-giant counts as one size larger whenever doing so is advantageous for size-based opposed checks, defenses against size-dependent attacks, and weapon use.',
   'Treat the half-giant as one size category larger when advantageous for opposed checks using size modifiers, determining whether size-dependent special attacks can affect it, and wielding weapons. Space and reach do not change. This stacks with effects that actually change size.',
   'extraordinary','none'),

  ('xph-sa-maenad-energy-ray','maenad-energy-ray','Sonic Energy Ray',
   'A daily psi-like sonic attack.',
   '1/day, manifest energy ray dealing sonic damage only. Manifester level equals one-half Hit Dice, minimum 1st; save DC is Charisma-based.',
   'psi_like','standard'),
  ('xph-sa-maenad-outburst','maenad-outburst','Outburst',
   'The maenad releases suppressed emotion as temporary physical force.',
   '1/day for up to 4 rounds, gain +2 Strength while taking -2 Intelligence and -2 Wisdom.',
   'extraordinary','none'),

  ('xph-sa-xeph-burst','xeph-burst','Burst',
   'A xeph can accelerate in short supernatural bursts.',
   '3/day for 3 rounds, gain a competence bonus to base speed: +10 ft. at 1st level, +20 ft. from 5th level, and +30 ft. from 9th level onward.',
   'supernatural','none'),

  ('xph-sa-unbodied-psionic-powers','unbodied-psionic-powers','Racial Psionic Powers',
   'Unbodied possess innate telepath manifesting from their racial Hit Dice.',
   'Manifest powers as a 4th-level psion (telepath). Psion (telepath) class levels stack with this racial manifesting for power points, manifester level, and powers known.',
   'other','none'),
  ('xph-sa-unbodied-telekinetic-force','unbodied-telekinetic-force','Telekinetic Force',
   'A supernatural telekinetic force effect.',
   'Use telekinetic force as a standard action without provoking attacks of opportunity; manifester level 4th and save DC is Charisma-based.',
   'supernatural','standard'),
  ('xph-sa-unbodied-assume-likeness','unbodied-assume-likeness','Assume Likeness',
   'The unbodied can visually imitate creatures while retaining its own statistics.',
   'As a standard action, assume the likeness of a Small, Medium, or Large creature. Statistics do not change; Bluff and Disguise determine how convincing the appearance is.',
   'supernatural','standard'),
  ('xph-sa-unbodied-hide-mind','unbodied-hide-mind','Hide Mind',
   'The unbodied masks its psionic nature from detection.',
   'Cannot be identified as psionic by divination spells or clairsentience powers.',
   'supernatural','none'),
  ('xph-sa-unbodied-incorporeal','unbodied-incorporeal-traits','Incorporeal Traits',
   'The unbodied follows the D&D 3.5 incorporeal creature rules.',
   'Uses the standard incorporeal traits: restricted interaction with corporeal attacks and objects, passage through solid matter subject to force effects, incorporeal attacks bypassing ordinary armor and natural armor, and silent movement.',
   'other','none'),
  ('xph-sa-unbodied-telepathy','unbodied-telepathy','Telepathy',
   'Mental communication without a spoken language.',
   'Telepathy out to 100 feet.',
   'supernatural','none')
)
INSERT INTO dnd35_special_abilities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,action_type,effects,parameters)
SELECT
  a.id,'xph-3.5',NULL,a.slug,a.name,a.description,a.rules_text,0,NULL,1,
  a.category,a.action_type,NULL,NULL
FROM abilities a
WHERE 1
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id,
  source_page=excluded.source_page,
  slug=excluded.slug,
  name=excluded.name,
  description=excluded.description,
  rules_text=excluded.rules_text,
  is_homebrew=0,
  owner_user_id=NULL,
  is_enabled=1,
  category=excluded.category,
  action_type=excluded.action_type,
  effects=excluded.effects,
  parameters=excluded.parameters;

-- Keep creator-facing race summaries informative even before the API exposes the
-- normalized race-trait collection directly.
WITH summaries(slug,description,rules_text) AS (VALUES
  ('dromite',
   'Racial abilities: darkvision 60 ft., +3 natural armor, 1 racial power point, energy affinity/resistance, scent, +2 Spot, Blind-Fight, and energy ray 1/day.',
   'LA +1. Small; speed 20 ft.; +2 Charisma, -2 Strength, -2 Wisdom; +3 natural armor; darkvision 60 ft.; naturally psionic; choose fire/cold/electricity/sonic resistance 5 with a matching energy ray 1/day; scent; +2 Spot; Blind-Fight bonus feat.'),
  ('duergar-psionic',
   'Racial abilities: darkvision 120 ft., heavy-load speed, duergar immunities, spell resistance saves, stability, stonecunning, 3 racial power points, expansion/invisibility 1/day, combat/skill bonuses, and light sensitivity.',
   'LA +1 psionic duergar. +2 Constitution, -4 Charisma; speed 20 ft. even in medium/heavy armor or load; darkvision 120 ft.; immune to paralysis, phantasms, and poison; +2 racial saves vs spells and spell-like effects; stability; stonecunning; expansion and invisibility 1/day; naturally psionic 3 PP; +1 attacks vs orcs/goblinoids; +4 dodge AC vs giants; light sensitivity; racial skill bonuses.'),
  ('elan',
   'Racial abilities: 2 racial power points plus Repletion, Resilience, and Resistance.',
   'LA +0 aberration. -2 Charisma; speed 30 ft.; naturally psionic 2 PP; Repletion spends PP to ignore food/water, Resilience spends PP to reduce damage, and Resistance spends PP for a temporary +4 racial save bonus.'),
  ('half-giant',
   'Racial abilities: low-light vision, 2 racial power points, fire acclimation, powerful build, and stomp 1/day.',
   'LA +1 Giant. +2 Strength, -2 Dexterity, +2 Constitution; speed 30 ft.; low-light vision; naturally psionic 2 PP; +2 saves vs fire; powerful build; stomp 1/day.'),
  ('maenad',
   'Racial abilities: 2 racial power points, sonic energy ray 1/day, and Outburst 1/day.',
   'LA +0 humanoid. Speed 30 ft.; naturally psionic 2 PP; sonic energy ray 1/day; Outburst 1/day for up to 4 rounds grants +2 Strength and imposes -2 Intelligence/-2 Wisdom.'),
  ('xeph',
   'Racial abilities: darkvision 60 ft., 1 racial power point, +1 saves against powers/spells/spell-like effects, and Burst 3/day.',
   'LA +0 humanoid. -2 Strength, +2 Dexterity; speed 30 ft.; darkvision 60 ft.; naturally psionic 1 PP; +1 racial bonus on saves against powers, spells, and spell-like effects; Burst 3/day increases speed for 3 rounds.'),
  ('blue',
   'Racial abilities: Small, darkvision 60 ft., 1 racial power point, and +4 Move Silently/Ride.',
   'LA +1 psionic goblinoid. -2 Strength, +2 Intelligence, -2 Charisma; Small; speed 30 ft.; darkvision 60 ft.; naturally psionic 1 PP; +4 racial bonus on Move Silently and Ride.'),
  ('unbodied',
   'Racial abilities: 4d8 racial HD, no Strength score, fly 30 ft. (good), darkvision 60 ft., Charisma deflection AC, 1d6 incorporeal touch, 4th-level telepath manifesting, telekinetic force, assume likeness, hide mind, incorporeal traits, and telepathy 100 ft.',
   'LA +4 with 4d8 monstrous-humanoid racial HD. +2 Dex, +2 Con, +4 Int, +4 Wis, +4 Cha and no Strength score; fly 30 ft. (good); darkvision 60 ft.; deflection AC equal to Charisma modifier (minimum +1); 1d6 incorporeal touch; racial telepath manifesting; telekinetic force; assume likeness; hide mind; incorporeal traits; telepathy 100 ft. Runtime disabled until nonability and racial-manifesting creation support is complete.')
)
UPDATE dnd35_races
SET
  description=(SELECT s.description FROM summaries s WHERE s.slug=dnd35_races.slug),
  rules_text=(SELECT s.rules_text FROM summaries s WHERE s.slug=dnd35_races.slug)
WHERE owner_user_id IS NULL
  AND slug IN (SELECT slug FROM summaries);

DELETE FROM dnd35_race_traits
WHERE id LIKE 'xph-rt-%'
  AND race_id IN (
    SELECT id FROM dnd35_races
    WHERE owner_user_id IS NULL
      AND slug IN ('dromite','duergar-psionic','elan','half-giant','maenad','xeph','blue','unbodied')
  );

WITH traits(id,race_slug,special_ability_id,name,rules_text,position) AS (VALUES
  -- Dromite
  ('xph-rt-dromite-darkvision','dromite',NULL,'Darkvision','Darkvision 60 ft.',10),
  ('xph-rt-dromite-natural-armor','dromite',NULL,'Natural Armor','+3 natural armor bonus.',20),
  ('xph-rt-dromite-psionic','dromite',NULL,'Naturally Psionic','Gain 1 bonus power point at 1st level.',30),
  ('xph-rt-dromite-energy-affinity','dromite',NULL,'Energy Affinity','Choose fire, cold, electricity, or sonic resistance 5; the daily energy ray uses the same energy type.',40),
  ('xph-rt-dromite-ray','dromite','xph-sa-dromite-energy-ray','Energy Ray','Energy ray 1/day using the chosen energy affinity.',50),
  ('xph-rt-dromite-scent','dromite',NULL,'Scent','Has the scent special quality.',60),
  ('xph-rt-dromite-spot','dromite',NULL,'Compound Eyes','+2 racial bonus on Spot checks.',70),
  ('xph-rt-dromite-blind-fight','dromite',NULL,'Blind-Fight','Blind-Fight as a racial bonus feat.',80),

  -- Psionic Duergar
  ('xph-rt-duergar-speed','duergar-psionic',NULL,'Steady Speed','Base speed 20 ft. and this speed is not reduced by medium/heavy armor or a medium/heavy load.',10),
  ('xph-rt-duergar-darkvision','duergar-psionic',NULL,'Darkvision','Darkvision 120 ft.',20),
  ('xph-rt-duergar-immunities','duergar-psionic',NULL,'Duergar Immunities','Immune to paralysis, phantasms, and poison.',30),
  ('xph-rt-duergar-saves','duergar-psionic',NULL,'Magic Resilience','+2 racial bonus on saving throws against spells and spell-like effects.',40),
  ('xph-rt-duergar-stability','duergar-psionic',NULL,'Stability','+4 on ability checks to resist bull rush or trip while standing firmly on the ground.',50),
  ('xph-rt-duergar-stonecunning','duergar-psionic',NULL,'Stonecunning','+2 racial bonus on Search checks involving unusual stonework, passive checks within 10 ft., stonework-trap searching, and intuitive depth underground.',60),
  ('xph-rt-duergar-psi-like','duergar-psionic','xph-sa-duergar-psi-like','Psi-Like Abilities','Expansion and invisibility 1/day each.',70),
  ('xph-rt-duergar-psionic','duergar-psionic',NULL,'Naturally Psionic','Gain 3 bonus power points at 1st level.',80),
  ('xph-rt-duergar-orcs','duergar-psionic',NULL,'Orc and Goblinoid Combat Training','+1 racial bonus on attack rolls against orcs, half-orcs, and goblinoids.',90),
  ('xph-rt-duergar-giants','duergar-psionic',NULL,'Giant Dodging','+4 dodge bonus to Armor Class against creatures of the giant type.',100),
  ('xph-rt-duergar-light','duergar-psionic',NULL,'Light Sensitivity','Dazzled in sunlight or within a daylight effect.',110),
  ('xph-rt-duergar-skills','duergar-psionic',NULL,'Duergar Skill Bonuses','+4 Move Silently; +1 Listen and Spot; +2 Appraise and Craft checks related to stone or metal.',120),

  -- Elan
  ('xph-rt-elan-psionic','elan',NULL,'Naturally Psionic','Gain 2 bonus power points at 1st level.',10),
  ('xph-rt-elan-repletion','elan','xph-sa-elan-repletion','Repletion','Spend power points for psionic sustenance.',20),
  ('xph-rt-elan-resilience','elan','xph-sa-elan-resilience','Resilience','Spend power points as an immediate action to reduce incoming damage.',30),
  ('xph-rt-elan-resistance','elan','xph-sa-elan-resistance','Resistance','Spend 1 power point as an immediate action for a temporary +4 racial bonus on saves.',40),

  -- Half-Giant
  ('xph-rt-halfgiant-lowlight','half-giant',NULL,'Low-Light Vision','Has low-light vision.',10),
  ('xph-rt-halfgiant-psionic','half-giant',NULL,'Naturally Psionic','Gain 2 bonus power points at 1st level.',20),
  ('xph-rt-halfgiant-fire','half-giant','xph-sa-half-giant-fire-acclimated','Fire Acclimated','+2 racial bonus on saves against fire spells and effects.',30),
  ('xph-rt-halfgiant-powerful','half-giant','xph-sa-half-giant-powerful-build','Powerful Build','Counts as one size larger when advantageous for specified size-based rules and weapon use.',40),
  ('xph-rt-halfgiant-stomp','half-giant','xph-sa-half-giant-stomp','Stomp','Stomp 1/day.',50),

  -- Maenad
  ('xph-rt-maenad-psionic','maenad',NULL,'Naturally Psionic','Gain 2 bonus power points at 1st level.',10),
  ('xph-rt-maenad-ray','maenad','xph-sa-maenad-energy-ray','Sonic Energy Ray','Sonic energy ray 1/day.',20),
  ('xph-rt-maenad-outburst','maenad','xph-sa-maenad-outburst','Outburst','Once per day, trade mental ability penalties for temporary Strength for up to 4 rounds.',30),

  -- Xeph
  ('xph-rt-xeph-darkvision','xeph',NULL,'Darkvision','Darkvision 60 ft.',10),
  ('xph-rt-xeph-psionic','xeph',NULL,'Naturally Psionic','Gain 1 bonus power point at 1st level.',20),
  ('xph-rt-xeph-saves','xeph',NULL,'Psionic and Magic Resistance','+1 racial bonus on saves against powers, spells, and spell-like effects.',30),
  ('xph-rt-xeph-burst','xeph','xph-sa-xeph-burst','Burst','Burst of speed 3/day for 3 rounds, scaling with character level.',40),

  -- Blue
  ('xph-rt-blue-darkvision','blue',NULL,'Darkvision','Darkvision 60 ft.',10),
  ('xph-rt-blue-psionic','blue',NULL,'Naturally Psionic','Gain 1 bonus power point at 1st level.',20),
  ('xph-rt-blue-skills','blue',NULL,'Goblin Rider','+4 racial bonus on Move Silently and Ride checks.',30),

  -- Unbodied
  ('xph-rt-unbodied-no-strength','unbodied',NULL,'No Strength Score','As an incorporeal creature, an unbodied has no Strength score.',10),
  ('xph-rt-unbodied-darkvision','unbodied',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('xph-rt-unbodied-deflection','unbodied',NULL,'Deflection Armor Class','Deflection bonus to Armor Class equal to Charisma modifier, minimum +1.',30),
  ('xph-rt-unbodied-touch','unbodied',NULL,'Incorporeal Touch','Melee touch attack dealing 1d6 damage.',40),
  ('xph-rt-unbodied-powers','unbodied','xph-sa-unbodied-psionic-powers','Racial Psionic Powers','Manifest as a 4th-level telepath; matching psion levels stack.',50),
  ('xph-rt-unbodied-force','unbodied','xph-sa-unbodied-telekinetic-force','Telekinetic Force','Use telekinetic force as a supernatural standard action.',60),
  ('xph-rt-unbodied-likeness','unbodied','xph-sa-unbodied-assume-likeness','Assume Likeness','Assume the visual likeness of a Small, Medium, or Large creature.',70),
  ('xph-rt-unbodied-hide-mind','unbodied','xph-sa-unbodied-hide-mind','Hide Mind','Psionic nature is concealed from specified divination and clairsentience detection.',80),
  ('xph-rt-unbodied-incorporeal','unbodied','xph-sa-unbodied-incorporeal','Incorporeal Traits','Uses the standard incorporeal creature traits.',90),
  ('xph-rt-unbodied-telepathy','unbodied','xph-sa-unbodied-telepathy','Telepathy','Telepathy 100 ft.',100),
  ('xph-rt-unbodied-skills','unbodied',NULL,'Racial Skills','4 racial Hit Dice provide 7 × (2 + Int modifier) skill points; class skills are Bluff, Diplomacy, Disguise, Intimidate, Listen, Sense Motive, and Spot; +4 racial Bluff/Disguise with additional situational bonuses.',110),
  ('xph-rt-unbodied-feats','unbodied',NULL,'Racial Feats','Four racial Hit Dice provide two feats.',120)
)
INSERT INTO dnd35_race_traits
  (id,race_id,special_ability_id,name,rules_text,position,parameters,effects)
SELECT
  t.id,
  (SELECT r.id FROM dnd35_races r
    WHERE r.slug=t.race_slug AND r.owner_user_id IS NULL
    ORDER BY r.is_enabled DESC, CASE WHEN r.source_id='xph-3.5' THEN 1 ELSE 0 END DESC
    LIMIT 1),
  t.special_ability_id,
  t.name,
  t.rules_text,
  t.position,
  NULL,
  NULL
FROM traits t
WHERE EXISTS (
  SELECT 1 FROM dnd35_races r
  WHERE r.slug=t.race_slug AND r.owner_user_id IS NULL
)
ON CONFLICT(id) DO UPDATE SET
  race_id=excluded.race_id,
  special_ability_id=excluded.special_ability_id,
  name=excluded.name,
  rules_text=excluded.rules_text,
  position=excluded.position,
  parameters=excluded.parameters,
  effects=excluded.effects;
