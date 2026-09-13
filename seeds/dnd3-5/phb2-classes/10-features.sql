-- PHB II class feature definitions.
-- Feature text is a concise mechanical summary; detailed rules remain source-cited by source_page.

WITH desired(class_slug,slug,name,source_page,description,choice_kind) AS (VALUES
  ('beguiler', 'weapon-armor-proficiency', 'Weapon and Armor Proficiency', '7', 'Proficient with simple weapons plus selected martial weapons, light armor, and no shields as defined by the class.', NULL),
  ('beguiler', 'spells', 'Spells', '7-8', 'Casts arcane beguiler spells spontaneously using Intelligence and knows the class spell list automatically.', NULL),
  ('beguiler', 'armored-mage', 'Armored Mage', '8', 'Ignore arcane spell failure from the armor types allowed by this class feature.', NULL),
  ('beguiler', 'trapfinding', 'Trapfinding', '8', 'Find and disable difficult and magical traps using Search and Disable Device.', NULL),
  ('beguiler', 'cloaked-casting', 'Cloaked Casting', '8', 'Gain scaling spell benefits against foes denied Dexterity to AC, culminating in automatically overcoming spell resistance.', NULL),
  ('beguiler', 'surprise-casting', 'Surprise Casting', '8', 'Use Bluff to feint in order to deny a target Dexterity against the beguiler''s next spell; action cost improves at 6th level.', NULL),
  ('beguiler', 'advanced-learning', 'Advanced Learning', '8', 'Add an eligible sorcerer/wizard enchantment or illusion spell to the beguiler spell list.', 'spell'),
  ('beguiler', 'silent-spell', 'Silent Spell', '8', 'Gain Silent Spell as a bonus feat.', NULL),
  ('beguiler', 'still-spell', 'Still Spell', '8', 'Gain Still Spell as a bonus feat.', NULL),
  ('dragon-shaman', 'weapon-armor-proficiency', 'Weapon and Armor Proficiency', '13', 'Proficient with simple weapons, light and medium armor, and shields except tower shields.', NULL),
  ('dragon-shaman', 'draconic-aura', 'Draconic Aura', '13-14', 'Project one known draconic aura at a time; aura bonus and number of auras known increase with level.', 'other'),
  ('dragon-shaman', 'totem-dragon', 'Totem Dragon', '13-14', 'Choose a dragon variety; the choice controls alignment compatibility, added class skills, breath energy/shape, and adaptations.', 'other'),
  ('dragon-shaman', 'skill-focus', 'Skill Focus', '14', 'Gain Skill Focus in a class skill associated with the chosen totem dragon.', 'skill'),
  ('dragon-shaman', 'draconic-adaptation', 'Draconic Adaptation', '14', 'Gain the extraordinary adaptation of the chosen totem dragon; later share it with nearby allies.', NULL),
  ('dragon-shaman', 'breath-weapon', 'Breath Weapon', '14-15', 'Use the totem dragon''s energy as a scaling cone or line breath weapon.', NULL),
  ('dragon-shaman', 'draconic-resolve', 'Draconic Resolve', '15', 'Gain immunity to paralysis and sleep effects and become immune to frightful presence while conscious.', NULL),
  ('dragon-shaman', 'touch-of-vitality', 'Touch of Vitality', '15', 'Use a daily pool to heal damage; at higher level spend the pool to remove conditions.', NULL),
  ('dragon-shaman', 'natural-armor', 'Natural Armor', '15', 'Gain a scaling natural armor bonus.', NULL),
  ('dragon-shaman', 'energy-immunity', 'Energy Immunity', '15', 'Gain immunity to the energy type used by the chosen totem dragon''s breath weapon.', NULL),
  ('dragon-shaman', 'commune-dragon-spirit', 'Commune with Dragon Spirit', '15', 'Contact the spirit of the totem dragon for divinatory guidance on a limited schedule.', NULL),
  ('dragon-shaman', 'draconic-wings', 'Draconic Wings', '15', 'Grow draconic wings and gain a fly speed based on land speed with the class-defined maneuverability.', NULL),
  ('duskblade', 'weapon-armor-proficiency', 'Weapon and Armor Proficiency', '19', 'Proficient with all simple and martial weapons, all armor, and shields except tower shields.', NULL),
  ('duskblade', 'spells', 'Spells', '19-20', 'Casts arcane duskblade spells spontaneously using Intelligence from a limited spells-known progression.', NULL),
  ('duskblade', 'arcane-attunement', 'Arcane Attunement', '20', 'Use a small selection of utility cantrips as spell-like abilities a limited number of times per day.', NULL),
  ('duskblade', 'armored-mage', 'Armored Mage', '20-21', 'Ignore arcane spell failure from progressively heavier armor and eventually heavy shields.', NULL),
  ('duskblade', 'combat-casting', 'Combat Casting', '21', 'Gain Combat Casting as a bonus feat.', NULL),
  ('duskblade', 'arcane-channeling', 'Arcane Channeling', '21', 'Deliver eligible touch spells through weapon attacks; at 13th level channel through a full attack.', NULL),
  ('duskblade', 'quick-cast', 'Quick Cast', '21', 'Cast a spell that normally takes a standard action as a swift action a limited number of times per day.', NULL),
  ('duskblade', 'spell-power', 'Spell Power', '21', 'After damaging a foe in melee, gain a scaling bonus on caster-level checks to overcome that foe''s spell resistance.', NULL),
  ('knight', 'weapon-armor-proficiency', 'Weapon and Armor Proficiency', '25', 'Proficient with all simple and martial weapons, all armor, and all shields including tower shields.', NULL),
  ('knight', 'knights-challenge', 'Knight''s Challenge', '25-27', 'Use challenge abilities a number of times per day based on class level and Charisma; individual challenge options unlock by level.', NULL),
  ('knight', 'fighting-challenge', 'Fighting Challenge', '26-27', 'Challenge a foe to gain scaling morale bonuses on attacks, damage, and Will saves against that foe.', NULL),
  ('knight', 'knights-code', 'Knight''s Code', '27-28', 'Follow the class''s combat code; violations reduce available knight''s challenge uses.', NULL),
  ('knight', 'mounted-combat', 'Mounted Combat', '28', 'Gain Mounted Combat as a bonus feat.', NULL),
  ('knight', 'shield-block', 'Shield Block', '28-29', 'Designate an adjacent opponent and gain a scaling shield AC bonus against that opponent.', NULL),
  ('knight', 'bulwark-defense', 'Bulwark of Defense', '29', 'Enemies you threaten treat their squares as difficult terrain.', NULL),
  ('knight', 'armor-mastery', 'Armor Mastery', '29', 'Reduce speed penalties from medium armor, later heavy armor.', NULL),
  ('knight', 'test-of-mettle', 'Test of Mettle', '27', 'Challenge qualifying enemies to focus their attacks on you if they fail a Will save.', NULL),
  ('knight', 'bonus-feat', 'Bonus Feat', '29-30', 'Choose a bonus feat from the knight''s allowed list, meeting its prerequisites.', 'feat'),
  ('knight', 'vigilant-defender', 'Vigilant Defender', '29', 'Increase the Tumble DC for enemies attempting to move through your threatened area without provoking.', NULL),
  ('knight', 'shield-ally', 'Shield Ally', '29', 'Use your shield and position to absorb part of the physical damage dealt to an adjacent ally.', NULL),
  ('knight', 'call-to-battle', 'Call to Battle', '27', 'Spend a knight''s challenge use to grant an ally another save against a fear effect.', NULL),
  ('knight', 'daunting-challenge', 'Daunting Challenge', '27', 'Spend a knight''s challenge use to shake qualifying nearby enemies that fail a Will save.', NULL),
  ('knight', 'improved-shield-ally', 'Improved Shield Ally', '29', 'Improve Shield Ally so you can absorb all damage from a qualifying physical attack.', NULL),
  ('knight', 'bond-of-loyalty', 'Bond of Loyalty', '28', 'Spend a knight''s challenge use to gain another save against an ongoing mind-affecting effect.', NULL),
  ('knight', 'impetuous-endurance', 'Impetuous Endurance', '29', 'A natural 1 on a saving throw is no longer an automatic failure.', NULL),
  ('knight', 'loyal-beyond-death', 'Loyal Beyond Death', '29', 'Spend knight''s challenge uses to remain alive and fighting when damage would otherwise kill you.', NULL)
)
INSERT OR IGNORE INTO dnd35_class_features
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,special_ability_id,choice_kind)
SELECT 'phb2-class-feature-'||d.class_slug||'-'||d.slug,s.id,d.source_page,
       d.class_slug||'-'||d.slug,d.name,d.description,d.description,0,NULL,1,NULL,d.choice_kind
FROM desired d CROSS JOIN dnd35_sources s
WHERE s.slug='players-handbook-ii-3-5' AND s.owner_user_id IS NULL;
