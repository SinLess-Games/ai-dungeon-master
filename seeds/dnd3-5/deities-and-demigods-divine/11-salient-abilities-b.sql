-- Deities and Demigods salient divine abilities, part 2.
-- Primary source: Deities and Demigods pp. 42-48.
-- Where the official v.3.5 accessory update changes an ability, the revised row is canonical.
-- Mechanical text is summarized; source pages remain authoritative.

WITH desired(slug,name,summary,prerequisites,updated) AS (VALUES
  ('divine-spell-focus','Divine Spell Focus','Increase saving throw DCs for one school of spells. Under the 3.5 update the increase is one-half the deity''s divine rank rather than the full divine rank.','Divine rank 1.',1),
  ('divine-spellcasting','Divine Spellcasting','Gain spellcasting capability beyond ordinary mortal limits, including access to spell slots whose level exceeds 9th when the deity has a sufficient key ability score.','Divine rank 1; spellcaster level 20th.',0),
  ('divine-splendor','Divine Splendor','The deity''s overwhelming divine presence can be fatal to nearby mortals that cannot withstand it.','Divine rank 16; Charisma 26.',0),
  ('divine-storm','Divine Storm','Create a rank-scaled vortex of force around the deity that protects it and damages creatures of differing alignment.','Divine rank 11.',0),
  ('divine-water-mastery','Divine Water Mastery','Exercise supernatural mastery over water and aquatic movement, creatures, and combat under the source-defined benefits.','Divine rank 1; Water domain.',0),
  ('divine-weapon-focus','Divine Weapon Focus','Gain an exceptional divine attack bonus with one selected weapon. Under the 3.5 update this stacks with Greater Weapon Focus.','Divine rank 1; selected weapon.',1),
  ('divine-weapon-specialization','Divine Weapon Specialization','Deal exceptional divine bonus damage with one selected weapon. Under the 3.5 update this stacks with Greater Weapon Specialization.','Divine rank 1; base attack bonus +20; Divine Weapon Focus with the selected weapon.',1),
  ('divine-weapon-mastery','Divine Weapon Mastery','Gain unmatched mastery of weapons associated with the deity''s War domain and combine multiple high-level weapon techniques.','Divine rank 1; fighter level 20th; War domain.',0),
  ('energy-burst','Energy Burst','Release a burst of one selected energy type centered on the deity, dealing rank-scaled damage in the surrounding area.','Divine rank 1.',0),
  ('energy-storm','Energy Storm','Create a swirling shield of selected energy that protects the deity and damages creatures that contact or approach it.','Divine rank 11.',0),
  ('extra-sense-enhancement','Extra Sense Enhancement','Enhance one of the deity''s senses beyond the normal divine range and acuity.','Divine rank 1; Wisdom 29.',0),
  ('extra-domain','Extra Domain','Add another cleric domain to the deity, granting the associated domain access and divine spell-like abilities as provided by the source.','Divine rank 6.',0),
  ('extra-energy-immunity','Extra Energy Immunity','Become immune to one selected energy type for which the deity already has the required resistance.','Divine rank 6; resistance to the selected energy type.',0),
  ('footsore','Footsore','Cause living creatures to become supernaturally tired and unable to travel effectively.','Divine rank 1; Travel domain.',0),
  ('frightful-presence','Frightful Presence','Cause opponents to become shaken or panicked when the deity attacks or otherwise displays its power.','Divine rank 1; Charisma 24.',0),
  ('gift-of-life','Gift of Life','Restore a previously living mortal creature to life, subject to the divine ability''s range and use limits.','Divine rank 1.',0),
  ('life-and-death','Life and Death','Kill a mortal or restore a dead mortal to life across great distance using divine authority.','Divine rank 6; Gift of Life or Hand of Death.',0),
  ('mass-life-and-death','Mass Life and Death','Extend Life and Death to large numbers of mortals within the divine ability''s broad area of influence.','Divine rank 16; Life and Death; Gift of Life or Hand of Death.',0),
  ('grow-creature','Grow Creature','Increase the size and physical power of a selected kind of creature under the source-defined duration and limits.','Divine rank 1.',0),
  ('hand-of-death','Hand of Death','Slay a living mortal creature with a divine death effect if it fails the required saving throw.','Divine rank 1.',0),
  ('increased-energy-resistance','Increased Energy Resistance','Increase resistance to one energy type. Under the 3.5 update, apply divine-rank resistance where appropriate or add +10 to an existing resistance.','Divine rank 1.',1),
  ('increased-damage-reduction','Increased Damage Reduction','Increase the deity''s damage reduction by 5 and add an alignment requirement opposed to the deity''s alignment for bypassing it; the 3.5 update forbids selecting this ability more than once.','Divine rank 1; Constitution 29.',1),
  ('increased-spell-resistance','Increased Spell Resistance','Increase the deity''s spell resistance beyond its normal divine value.','Divine rank 1.',0),
  ('indomitable-strength','Indomitable Strength','Gain overwhelming advantage in opposed Strength checks and other direct contests of physical power.','Divine rank 1; Strength 40; Strength domain.',0),
  ('instant-counterspell','Instant Counterspell','Counter a spell as a free action under the source-defined conditions without consuming the deity''s ordinary action.','Divine rank 1.',0),
  ('instant-move','Instant Move','Move instantaneously to a destination within the ability''s range as a free-action divine movement effect.','Divine rank 6; Dexterity 29.',0),
  ('irresistible-blows','Irresistible Blows','Make attacks with one selected melee weapon exceptionally difficult to avoid; under the 3.5 update those attacks also count as adamantine for bypassing hardness and damage reduction.','Divine rank 1; Weapon Focus with selected weapon; Improved Critical with selected weapon.',1),
  ('irresistible-performance','Irresistible Performance','Use a Perform skill to produce supernatural effects far beyond ordinary bardic music, including source-defined emotional or compulsive results.','Divine rank 1; Perform 40 ranks.',0),
  ('know-death','Know Death','Know whether and under what circumstances a creature is destined to die as defined by the divine ability.','Divine rank 1.',0),
  ('know-secrets','Know Secrets','Reveal hidden facts and secrets with divine insight, subject to the source-defined limits on what can be learned.','Divine rank 1.',0),
  ('lay-curse','Lay Curse','Place a powerful divine curse on a creature, with effects selected from the source''s curse options or a comparable adjudicated effect.','Divine rank 1.',0),
  ('lay-quest','Lay Quest','Compel a creature to undertake a service or course of action with a divine geas-like effect.','Divine rank 1.',0),
  ('life-drain','Life Drain','Create an area of negative energy that drains life from creatures and transfers vitality to the deity as described by the source.','Divine rank 1; Death domain.',0),
  ('master-crafter','Master Crafter','Perform Craft work and create items with supernatural speed and quality beyond mortal artisans.','Divine rank 1; 23 ranks in at least two Craft skills.',0),
  ('mind-of-the-beast','Mind of the Beast','Grant sentience to plants or animals and reduce sentient creatures to animal or plant mentality/forms as defined by the ability.','Divine rank 1.',0),
  ('possess-mortal','Possess Mortal','Project the deity''s consciousness into a sensed mortal creature and control the host, with unwilling subjects receiving the source-defined saving throw.','Divine rank 1; Charisma 29.',0),
  ('power-of-luck','Power of Luck','Bestow extraordinary good fortune or misfortune by modifying or replacing die results under the source-defined limits.','Divine rank 1; Luck domain.',0),
  ('power-of-nature','Power of Nature','Command natural conditions such as winds, temperature, and weather across a divine-rank-scaled area.','Divine rank 1.',0),
  ('power-of-truth','Power of Truth','Discern falsehoods and compel truthful speech through divine authority.','Divine rank 1.',0),
  ('see-magic','See Magic','Continuously perceive magical auras and effects. Under the 3.5 update this functions as constant greater arcane sight.','Divine rank 1; Magic domain.',1),
  ('speak-with-creatures','Speak with Creatures','Communicate with a selected category of creatures regardless of ordinary language barriers, as specified when the ability is chosen.','Divine rank 1.',0),
  ('stride','Stride','Travel extraordinary distances, enhance overland travel for others, and make exceptional jumps using divine movement.','Divine rank 1; Travel domain.',0),
  ('sunder-and-disjoin','Sunder and Disjoin','Destroy weapons and magic items used against the deity, including source-defined disjoining effects against magical equipment.','Divine rank 1.',0),
  ('supreme-initiative','Supreme Initiative','Act first in initiative except when opposed by a deity whose relevant precedence is superior under the divine rules.','Divine rank 1; Dexterity 29; Improved Initiative.',0),
  ('true-knowledge','True Knowledge','Possess nearly complete lore and knowledge, with extraordinary access to bardic knowledge/lore and Knowledge checks.','Divine rank 11; Intelligence 40; bardic knowledge or lore; bard or loremaster level 10th; Knowledge domain.',0),
  ('undead-mastery','Undead Mastery','Exercise absolute control over undead on a divine scale and command substantially more undead than ordinary turning or rebuking permits.','Divine rank 16; cleric level 17th.',0),
  ('undead-qualities','Undead Qualities','Gain the traits and immunities of undead while retaining divine identity; under the 3.5 update use the revised Monster Manual undead qualities.','Divine rank 1.',1),
  ('wave-of-chaos','Wave of Chaos','Release chaotic divine energy that causes nearby creatures to behave unpredictably or suffer chaos-themed effects.','Divine rank 1; Chaos domain.',0),
  ('wound-enemy','Wound Enemy','A weapon wielded by the deity inflicts a continuing bleeding wound in addition to its normal damage.','Divine rank 1; base attack bonus +20.',0)
)
INSERT INTO dnd35_special_abilities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,action_type,effects,parameters)
SELECT 'dd-sda-'||d.slug,
       CASE WHEN d.updated=1 THEN 'dd-3.5-update' ELSE 'dd-3.0' END,
       CASE WHEN d.updated=1 THEN 'update 5-6' ELSE '32-48' END,
       d.slug,d.name,d.summary,d.summary,0,NULL,1,'other',NULL,NULL,
       json_object('divineSystem','salient','minimumDivineRank',1,'prerequisitesText',d.prerequisites,'uses35Revision',d.updated)
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_special_abilities a WHERE a.slug=d.slug AND a.owner_user_id IS NULL
);
