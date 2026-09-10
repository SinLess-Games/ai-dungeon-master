-- Normalized racial traits and named abilities for Astral Deva, Bralani, Djinni, and Erinyes.
-- Rules text is concise source-backed paraphrase for character creator display and lookup.

WITH abilities(id,source_page,slug,name,description,rules_text,category,action_type) AS (VALUES
  ('mm1-sa-angel-protective-aura','10-11','angel-protective-aura','Protective Aura','An angel radiates powerful defenses against evil.','Against attacks and effects created by evil creatures, allies within 20 feet gain the source-listed deflection bonus to AC and resistance bonus on saves. The aura otherwise functions like magic circle against evil plus lesser globe of invulnerability at a caster level equal to the angel''s Hit Dice; if dispelled, it can be recreated as a free action.','supernatural','none'),
  ('mm1-sa-angel-tongues','10-11','angel-tongues','Tongues','An angel can communicate with any creature that has a language.','Always active; functions as tongues at a caster level equal to the angel''s Hit Dice.','supernatural','none'),
  ('mm1-sa-astral-deva-spell-like','11','astral-deva-spell-like-abilities','Spell-Like Abilities','Extensive celestial spell-like magic.','At will: aid, continual flame, detect evil, discern lies, dispel evil, dispel magic, holy aura, holy smite, holy word, self-only invisibility, plane shift, self-only polymorph, remove curse, remove disease, and remove fear. Seven times per day: cure light wounds and see invisibility. Once per day: blade barrier and heal. Caster level 12th; save DCs are Charisma-based.','spell_like','standard'),
  ('mm1-sa-astral-deva-stun','11','astral-deva-stun','Stun','Repeated mace strikes can stun a foe.','If the astral deva strikes an opponent twice in one round with its mace, the target must succeed on the source-listed Strength-based Fortitude save or be stunned for 1d6 rounds.','supernatural','none'),
  ('mm1-sa-astral-deva-uncanny-dodge','11','astral-deva-uncanny-dodge','Uncanny Dodge','Retain Dexterity defenses when surprised and resist flanking.','Retains Dexterity bonus to AC while flat-footed and cannot be flanked except by a sufficiently high-level rogue, following the source entry.','extraordinary','none'),

  ('mm1-sa-eladrin-tongues','93','eladrin-tongues','Tongues','Eladrins communicate across language barriers.','Always active; functions as tongues at the caster level given by the shared eladrin traits.','supernatural','none'),
  ('mm1-sa-bralani-spell-like','94','bralani-spell-like-abilities','Spell-Like Abilities','Innate wind, illusion, healing, and enchantment magic.','At will: blur, charm person, gust of wind, mirror image, and wind wall. Twice per day: lightning bolt and cure serious wounds. Caster level 6th; save DCs are Charisma-based.','spell_like','standard'),
  ('mm1-sa-bralani-whirlwind-blast','94','bralani-whirlwind-blast','Whirlwind Blast','A whirlwind-form bralani releases a scouring line of wind.','While in whirlwind form, deal 3d6 damage in a 20-foot line; Reflex half using the source-listed Constitution-based save DC.','supernatural','standard'),
  ('mm1-sa-bralani-alternate-form','94','bralani-alternate-form','Alternate Form','Shift between humanoid and whirlwind forms.','As a standard action, switch between humanoid and whirlwind forms. Humanoid form cannot fly or use whirlwind blast; whirlwind form can fly, make slam attacks, use whirlwind blast, and use spell-like abilities. The change is not dispellable.','supernatural','standard'),

  ('mm1-sa-genie-plane-shift','114','genie-plane-shift','Plane Shift','Genies travel between the elemental, Astral, and Material planes.','Transport the genie and up to eight linked creatures to an elemental plane, the Astral Plane, or the Material Plane; otherwise functions like plane shift at caster level 13th.','spell_like','standard'),
  ('mm1-sa-djinni-air-mastery','114','djinni-air-mastery','Air Mastery','A djinni dominates airborne foes.','Airborne creatures take the source-listed penalty on attack and damage rolls against the djinni.','extraordinary','none'),
  ('mm1-sa-djinni-spell-like','114','djinni-spell-like-abilities','Spell-Like Abilities','Innate creation, illusion, invisibility, and wind magic.','At will: self-only invisibility. Once per day: create food and water, create wine, major creation, persistent image, wind walk, and up to 1 hour of gaseous form. Caster level 20th; save DCs are Charisma-based.','spell_like','standard'),
  ('mm1-sa-djinni-whirlwind','114-115','djinni-whirlwind','Whirlwind','Transform into a damaging whirlwind.','Once every 10 minutes, assume whirlwind form for up to 7 rounds, moving at fly speed. Smaller creatures contacted by the whirlwind can take damage and be picked up according to the source-entry Reflex saves and size limits.','supernatural','standard'),
  ('mm1-sa-djinni-telepathy','114','djinni-telepathy','Telepathy 100 ft.','Mental communication at range.','Telepathy out to 100 feet.','supernatural','none'),

  ('mm1-sa-erinyes-entangle','54','erinyes-entangle','Entangle','An erinyes wields a supernatural-quality entangling rope.','The erinyes''s 50-foot rope entangles creatures as animate rope at caster level 16th and can be hurled 30 feet without a range penalty.','extraordinary','standard'),
  ('mm1-sa-erinyes-spell-like','54','erinyes-spell-like-abilities','Spell-Like Abilities','At-will infernal teleportation, enchantment, illusion, and evil magic.','At will: greater teleport for self plus carried objects, charm monster, minor image, and unholy blight. Caster level 12th; save DCs are Charisma-based.','spell_like','standard'),
  ('mm1-sa-erinyes-summon','54','erinyes-summon-baatezu','Summon Baatezu','Attempt to summon lesser devils once per day.','Once per day, attempt the source-listed 50% chance to summon either a group of lemures or several bearded devils. This is equivalent to a 3rd-level spell.','spell_like','standard'),
  ('mm1-sa-erinyes-true-seeing','54','erinyes-true-seeing','True Seeing','Continuous supernatural true sight.','Continuously uses true seeing as the spell at caster level 14th.','supernatural','none'),
  ('mm1-sa-erinyes-telepathy','54','erinyes-telepathy','Telepathy 100 ft.','Mental communication at range.','Telepathy out to 100 feet.','supernatural','none')
)
INSERT INTO dnd35_special_abilities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,action_type,effects,parameters)
SELECT id,'mm1-3.5',source_page,slug,name,description,rules_text,0,NULL,1,category,action_type,NULL,NULL
FROM abilities
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
  effects=NULL,
  parameters=NULL;

WITH traits(id,race_slug,special_ability_id,name,rules_text,position) AS (VALUES
  ('mm1-rt-astral-deva-rhd','astral-deva',NULL,'Racial Hit Dice','12d8 outsider racial Hit Dice; racial BAB +12 and base saves Fort +8, Ref +8, Will +8.',10),
  ('mm1-rt-astral-deva-flight','astral-deva',NULL,'Flight','Fly speed 100 ft. with good maneuverability.',20),
  ('mm1-rt-astral-deva-darkvision','astral-deva',NULL,'Darkvision','Darkvision 60 ft.',30),
  ('mm1-rt-astral-deva-low-light','astral-deva',NULL,'Low-Light Vision','Low-light vision.',40),
  ('mm1-rt-astral-deva-natural-armor','astral-deva',NULL,'Natural Armor','+15 natural armor bonus.',50),
  ('mm1-rt-astral-deva-dr','astral-deva',NULL,'Damage Reduction','Damage reduction 10/evil.',60),
  ('mm1-rt-astral-deva-immunities','astral-deva',NULL,'Angel Immunities','Immune to acid, cold, and petrification; also gains the shared angel racial bonus on saves against poison.',70),
  ('mm1-rt-astral-deva-resistances','astral-deva',NULL,'Angel Resistances','Resistance to electricity 10 and fire 10.',80),
  ('mm1-rt-astral-deva-sr','astral-deva',NULL,'Spell Resistance','Spell resistance 30.',90),
  ('mm1-rt-astral-deva-aura','astral-deva','mm1-sa-angel-protective-aura','Protective Aura','20-foot protective aura against evil attacks and magic.',100),
  ('mm1-rt-astral-deva-tongues','astral-deva','mm1-sa-angel-tongues','Tongues','Always-active tongues at caster level equal to racial Hit Dice.',110),
  ('mm1-rt-astral-deva-spell-like','astral-deva','mm1-sa-astral-deva-spell-like','Spell-Like Abilities','Celestial spell-like abilities at caster level 12th.',120),
  ('mm1-rt-astral-deva-stun','astral-deva','mm1-sa-astral-deva-stun','Stun','Two mace hits in one round can stun the opponent.',130),
  ('mm1-rt-astral-deva-uncanny','astral-deva','mm1-sa-astral-deva-uncanny-dodge','Uncanny Dodge','Retains Dexterity to AC while flat-footed and resists flanking.',140),
  ('mm1-rt-astral-deva-aligned','astral-deva',NULL,'Good-Aligned Weapons','Natural weapons and wielded weapons count as good-aligned for overcoming damage reduction.',150),
  ('mm1-rt-astral-deva-skills','astral-deva',NULL,'Racial Skills','Monster-entry racial-HD class skills are Concentration, Craft or Knowledge, Diplomacy, Escape Artist, Hide, Intimidate, Listen, Move Silently, Sense Motive, Spot, and Use Rope.',160),

  ('mm1-rt-bralani-rhd','bralani',NULL,'Racial Hit Dice','6d8 outsider racial Hit Dice; racial BAB +6 and base saves Fort +5, Ref +5, Will +5.',10),
  ('mm1-rt-bralani-flight','bralani',NULL,'Flight','Fly speed 100 ft. with perfect maneuverability while in whirlwind form as allowed by alternate form.',20),
  ('mm1-rt-bralani-darkvision','bralani',NULL,'Darkvision','Darkvision 60 ft.',30),
  ('mm1-rt-bralani-low-light','bralani',NULL,'Low-Light Vision','Low-light vision.',40),
  ('mm1-rt-bralani-natural-armor','bralani',NULL,'Natural Armor','+6 natural armor bonus.',50),
  ('mm1-rt-bralani-dr','bralani',NULL,'Damage Reduction','Damage reduction 10/cold iron or evil.',60),
  ('mm1-rt-bralani-immunities','bralani',NULL,'Eladrin Immunities','Immune to electricity and petrification.',70),
  ('mm1-rt-bralani-resistances','bralani',NULL,'Eladrin Resistances','Resistance to cold 10 and fire 10.',80),
  ('mm1-rt-bralani-sr','bralani',NULL,'Spell Resistance','Spell resistance 17.',90),
  ('mm1-rt-bralani-tongues','bralani','mm1-sa-eladrin-tongues','Tongues','Always-active eladrin tongues.',100),
  ('mm1-rt-bralani-spell-like','bralani','mm1-sa-bralani-spell-like','Spell-Like Abilities','Wind, illusion, enchantment, and healing spell-like abilities.',110),
  ('mm1-rt-bralani-blast','bralani','mm1-sa-bralani-whirlwind-blast','Whirlwind Blast','Whirlwind form can emit a damaging line of wind.',120),
  ('mm1-rt-bralani-form','bralani','mm1-sa-bralani-alternate-form','Alternate Form','Switch between humanoid and whirlwind forms.',130),
  ('mm1-rt-bralani-aligned','bralani',NULL,'Aligned Weapons','Natural weapons and wielded weapons count as chaotic-aligned and good-aligned for overcoming damage reduction.',140),
  ('mm1-rt-bralani-skills','bralani',NULL,'Racial Skills','Monster-entry racial-HD class skills are Concentration, Diplomacy, Escape Artist, Handle Animal, Hide, Jump, Listen, Move Silently, Ride, Sense Motive, Spot, Tumble, and Use Rope.',150),

  ('mm1-rt-djinni-large','djinni',NULL,'Large Build','Large size with the normal Large combat, Hide, grapple, lifting, carrying, space, and reach adjustments.',10),
  ('mm1-rt-djinni-rhd','djinni',NULL,'Racial Hit Dice','7d8 outsider racial Hit Dice; racial BAB +7 and base saves Fort +5, Ref +5, Will +5.',20),
  ('mm1-rt-djinni-flight','djinni',NULL,'Flight','Fly speed 60 ft. with perfect maneuverability.',30),
  ('mm1-rt-djinni-darkvision','djinni',NULL,'Darkvision','Darkvision 60 ft.',40),
  ('mm1-rt-djinni-natural-armor','djinni',NULL,'Natural Armor','+3 natural armor bonus.',50),
  ('mm1-rt-djinni-acid','djinni',NULL,'Acid Immunity','Immune to acid.',60),
  ('mm1-rt-djinni-air','djinni','mm1-sa-djinni-air-mastery','Air Mastery','Airborne creatures suffer penalties when attacking the djinni.',70),
  ('mm1-rt-djinni-spell-like','djinni','mm1-sa-djinni-spell-like','Spell-Like Abilities','Innate creation, invisibility, illusion, and wind magic.',80),
  ('mm1-rt-djinni-whirlwind','djinni','mm1-sa-djinni-whirlwind','Whirlwind','Transform into a whirlwind once every 10 minutes.',90),
  ('mm1-rt-djinni-plane-shift','djinni','mm1-sa-genie-plane-shift','Plane Shift','Genie planar travel for itself and companions.',100),
  ('mm1-rt-djinni-telepathy','djinni','mm1-sa-djinni-telepathy','Telepathy','Telepathy 100 ft.',110),
  ('mm1-rt-djinni-initiative','djinni',NULL,'Bonus Feat: Improved Initiative','Improved Initiative is marked as a racial bonus feat in the source entry. It is recorded as a trait until fixed race-feat grants are modeled explicitly.',120),
  ('mm1-rt-djinni-skills','djinni',NULL,'Racial Skills','Monster-entry racial-HD class skills are Appraise, Concentration, Craft, Diplomacy, Escape Artist, Knowledge, Listen, Move Silently, Sense Motive, Spellcraft, Spot, and Use Rope.',130),

  ('mm1-rt-erinyes-rhd','erinyes',NULL,'Racial Hit Dice','9d8 outsider racial Hit Dice; racial BAB +9 and base saves Fort +6, Ref +6, Will +6.',10),
  ('mm1-rt-erinyes-flight','erinyes',NULL,'Flight','Fly speed 50 ft. with good maneuverability.',20),
  ('mm1-rt-erinyes-darkvision','erinyes',NULL,'Darkvision','Darkvision 60 ft.',30),
  ('mm1-rt-erinyes-natural-armor','erinyes',NULL,'Natural Armor','+8 natural armor bonus.',40),
  ('mm1-rt-erinyes-dr','erinyes',NULL,'Damage Reduction','Damage reduction 5/good.',50),
  ('mm1-rt-erinyes-immunities','erinyes',NULL,'Baatezu Immunities','Immune to fire and poison.',60),
  ('mm1-rt-erinyes-resistances','erinyes',NULL,'Baatezu Resistances','Resistance to acid 10 and cold 10.',70),
  ('mm1-rt-erinyes-see-darkness','erinyes',NULL,'See in Darkness','Can see normally in darkness, including supernatural darkness, as granted by the source entry.',80),
  ('mm1-rt-erinyes-sr','erinyes',NULL,'Spell Resistance','Spell resistance 20.',90),
  ('mm1-rt-erinyes-telepathy','erinyes','mm1-sa-erinyes-telepathy','Telepathy','Telepathy 100 ft.',100),
  ('mm1-rt-erinyes-entangle','erinyes','mm1-sa-erinyes-entangle','Entangle','Use the source-entry rope to entangle enemies.',110),
  ('mm1-rt-erinyes-spell-like','erinyes','mm1-sa-erinyes-spell-like','Spell-Like Abilities','At-will infernal spell-like abilities.',120),
  ('mm1-rt-erinyes-summon','erinyes','mm1-sa-erinyes-summon','Summon Baatezu','Once-daily chance to summon lesser devils.',130),
  ('mm1-rt-erinyes-true-seeing','erinyes','mm1-sa-erinyes-true-seeing','True Seeing','Continuous true seeing at caster level 14th.',140),
  ('mm1-rt-erinyes-aligned','erinyes',NULL,'Aligned Weapons','Natural weapons and wielded weapons count as evil-aligned and lawful-aligned for overcoming damage reduction.',150),
  ('mm1-rt-erinyes-dodge','erinyes',NULL,'Bonus Feat: Dodge','Dodge is marked as a racial bonus feat in the source entry. It is recorded as a trait until fixed race-feat grants are modeled explicitly.',160),
  ('mm1-rt-erinyes-mobility','erinyes',NULL,'Bonus Feat: Mobility','Mobility is marked as a racial bonus feat in the source entry. It is recorded as a trait until fixed race-feat grants are modeled explicitly.',170),
  ('mm1-rt-erinyes-skills','erinyes',NULL,'Racial Skills','Monster-entry racial-HD class skills are Concentration, Diplomacy, Escape Artist, Hide, Knowledge, Listen, Move Silently, Search, Sense Motive, Spot, Survival, and Use Rope.',180)
)
INSERT INTO dnd35_race_traits
  (id,race_id,special_ability_id,name,rules_text,position,effects,parameters)
SELECT t.id,r.id,t.special_ability_id,t.name,t.rules_text,t.position,NULL,NULL
FROM traits t
JOIN dnd35_races r ON r.id='mm1-race-'||t.race_slug
WHERE 1
ON CONFLICT(id) DO UPDATE SET
  race_id=excluded.race_id,
  special_ability_id=excluded.special_ability_id,
  name=excluded.name,
  rules_text=excluded.rules_text,
  position=excluded.position,
  effects=NULL,
  parameters=NULL;
