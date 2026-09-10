-- Creator-facing racial traits for all curated Monster Manual III player races.
-- Core chassis values (size, speed, LA, RHD, ability modifiers, natural armor) are also
-- stored structurally in 00-races.sql; these rows make the complete package visible to players.

WITH traits(id,race_slug,special_ability_id,name,rules_text,position) AS (VALUES
  -- Armand
  ('mm3-rt-armand-rhd','armand',NULL,'Racial Hit Dice','5d8 monstrous humanoid racial Hit Dice; racial BAB +5 and base saves Fort +1, Ref +4, Will +4.',10),
  ('mm3-rt-armand-vision','armand',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm3-rt-armand-armor','armand',NULL,'Natural Armor','+4 natural armor bonus.',30),
  ('mm3-rt-armand-claws','armand',NULL,'Natural Weapon','Claw attack dealing 1d4 damage.',40),
  ('mm3-rt-armand-skills','armand',NULL,'Racial Skills','Racial-HD class skills are Jump, Listen, Spot, and Survival; +4 racial bonus on Survival checks.',50),
  ('mm3-rt-armand-stance','armand','mm3-sa-armand-defensive-stance','Defensive Stance','Move-action defensive stance: +2 attacks, +2 resistance saves, +4 dodge AC; cannot move while maintaining it.',60),
  ('mm3-rt-armand-stability','armand','mm3-sa-armand-stability','Stability','+4 on checks to resist bull rush and trip while standing on the ground or burrowing.',70),

  -- Changeling
  ('mm3-rt-changeling-shape','changeling','mm3-sa-changeling-minor-change-shape','Minor Change Shape','At-will physical appearance alteration; +10 circumstance bonus on Disguise checks made with the ability.',10),
  ('mm3-rt-changeling-resilience','changeling',NULL,'Mental Resilience','+2 racial bonus on saving throws against sleep and charm effects.',20),
  ('mm3-rt-changeling-social','changeling',NULL,'Social Insight','+2 racial bonus on Bluff, Intimidate, and Sense Motive checks.',30),
  ('mm3-rt-changeling-linguist','changeling',NULL,'Natural Linguist','Speak Language is treated as a class skill regardless of class.',40),

  -- Dracotaur
  ('mm3-rt-dracotaur-rhd','dracotaur',NULL,'Racial Hit Dice','3d12 dragon racial Hit Dice; racial BAB +3 and base saves Fort +3, Ref +3, Will +3.',10),
  ('mm3-rt-dracotaur-senses','dracotaur',NULL,'Dragon Senses','Darkvision 60 ft. and low-light vision.',20),
  ('mm3-rt-dracotaur-armor','dracotaur',NULL,'Natural Armor','+5 natural armor bonus.',30),
  ('mm3-rt-dracotaur-weapons','dracotaur',NULL,'Natural Weapons','Bite (1d8) and tail slap (1d8).',40),
  ('mm3-rt-dracotaur-skills','dracotaur',NULL,'Racial Skills','Racial-HD class skills: Intimidate, Jump, Knowledge (arcana), Listen, Sense Motive, Spellcraft, Spot, Survival, Swim, and Use Magic Device. +4 racial bonus on Balance, Jump, and Swim.',50),
  ('mm3-rt-dracotaur-proficiency','dracotaur',NULL,'Weapon and Armor Proficiency','Proficient with natural weapons, all simple weapons, and light armor.',60),
  ('mm3-rt-dracotaur-immunities','dracotaur',NULL,'Dragon Immunities','Immune to magic sleep effects and paralysis.',70),
  ('mm3-rt-dracotaur-fire','dracotaur','mm3-sa-dracotaur-spit-fire','Spit Fire','Ranged fiery spittle attack with splash damage and a 1-minute reuse delay.',80),

  -- Sand Giant
  ('mm3-rt-sand-rhd','sand-giant',NULL,'Racial Hit Dice','15d8 giant racial Hit Dice; racial BAB +11 and base saves Fort +9, Ref +5, Will +5.',10),
  ('mm3-rt-sand-vision','sand-giant',NULL,'Low-Light Vision','Low-light vision.',20),
  ('mm3-rt-sand-armor','sand-giant',NULL,'Natural Armor','+11 natural armor bonus.',30),
  ('mm3-rt-sand-skills','sand-giant',NULL,'Racial Skills','Racial-HD class skills: Hide, Knowledge (nature), Listen, Spot, and Survival. +8 racial bonus on Hide and Survival checks in deserts.',40),
  ('mm3-rt-sand-blaster','sand-giant',NULL,'Sand Blaster Familiarity','Treat sand blasters as martial weapons rather than exotic weapons.',50),
  ('mm3-rt-sand-heat','sand-giant','mm3-sa-sand-giant-heat-shimmer','Heat Shimmer','At-will free-action blur-like defensive shimmer.',60),
  ('mm3-rt-sand-spells','sand-giant','mm3-sa-sand-giant-spell-like','Spell-Like Abilities','1/day each: meld into stone and statue; caster level 15th.',70),
  ('mm3-rt-sand-elements','sand-giant',NULL,'Elemental Adaptation','Immune to fire and vulnerable to cold.',80),

  -- Flind
  ('mm3-rt-flind-rhd','flind',NULL,'Racial Hit Dice','2d8 humanoid racial Hit Dice; racial BAB +1 and base saves Fort +3, Ref +0, Will +0.',10),
  ('mm3-rt-flind-vision','flind',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm3-rt-flind-armor','flind',NULL,'Natural Armor','+2 natural armor bonus.',30),
  ('mm3-rt-flind-skills','flind',NULL,'Racial Skills','Racial-HD class skills are Listen and Spot.',40),
  ('mm3-rt-flind-influence','flind',NULL,'Gnoll Influence','+2 racial bonus on Charisma-based checks made to influence gnolls.',50),
  ('mm3-rt-flindbar','flind',NULL,'Flindbar Familiarity','Treat the flindbar as a martial weapon rather than an exotic weapon.',60),

  -- Goatfolk
  ('mm3-rt-goatfolk-rhd','goatfolk',NULL,'Racial Hit Dice','3d8 monstrous humanoid racial Hit Dice; racial BAB +3 and base saves Fort +1, Ref +3, Will +3.',10),
  ('mm3-rt-goatfolk-vision','goatfolk',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm3-rt-goatfolk-armor','goatfolk',NULL,'Natural Armor','+2 natural armor bonus.',30),
  ('mm3-rt-goatfolk-headbutt','goatfolk',NULL,'Natural Weapon','Head butt attack dealing 1d6 damage.',40),
  ('mm3-rt-goatfolk-skills','goatfolk',NULL,'Racial Skills','Racial-HD class skills: Intimidate, Listen, Spot, and Survival. +4 racial bonus on Intimidate checks.',50),
  ('mm3-rt-goatfolk-weapons','goatfolk',NULL,'Weapon Proficiency','Proficient with the greataxe and all simple weapons.',60),
  ('mm3-rt-goatfolk-pack','goatfolk','mm3-sa-goatfolk-pack-fervor','Pack Fervor','Gain morale bonuses when another goatfolk is within 30 feet.',70),

  -- Forestkith Goblin
  ('mm3-rt-forestkith-vision','forestkith-goblin',NULL,'Darkvision','Darkvision 60 ft.',10),
  ('mm3-rt-forestkith-armor','forestkith-goblin',NULL,'Natural Armor','+1 natural armor bonus.',20),
  ('mm3-rt-forestkith-skills','forestkith-goblin',NULL,'Racial Skills','+2 Jump; +8 Climb and may take 10 even when rushed or threatened; +4 Hide and Move Silently in forests; +4 Craft (weaving) to make nets.',30),
  ('mm3-rt-forestkith-net','forestkith-goblin',NULL,'Net Familiarity','Treat nets as martial weapons rather than exotic weapons.',40),
  ('mm3-rt-forestkith-frenzy','forestkith-goblin','mm3-sa-forestkith-discordant-frenzy','Discordant Frenzy','Groups of attacking forestkith can shake nearby creatures of 2 HD or fewer.',50),
  ('mm3-rt-forestkith-light','forestkith-goblin',NULL,'Light Sensitivity','Dazzled in bright sunlight or within the radius of a daylight spell.',60),
  ('mm3-rt-forestkith-tree','forestkith-goblin','mm3-sa-forestkith-tree-shape','Tree Shape','Assume a tree, shrub, or limb form until sunset or damage ends it.',70),

  -- Harssaf
  ('mm3-rt-harssaf-rhd','harssaf',NULL,'Racial Hit Dice','6d8 monstrous humanoid racial Hit Dice; racial BAB +6 and base saves Fort +2, Ref +5, Will +5.',10),
  ('mm3-rt-harssaf-armor','harssaf',NULL,'Natural Armor','+3 natural armor bonus.',20),
  ('mm3-rt-harssaf-senses','harssaf',NULL,'Blindsense','Blindsense 30 ft.',30),
  ('mm3-rt-harssaf-skills','harssaf',NULL,'Racial Skills','Racial-HD class skills: Climb, Hide, Jump, Knowledge (nature), Listen, Move Silently, and Spot.',40),
  ('mm3-rt-harssaf-bonus-feats','harssaf',NULL,'Racial Bonus Feats','Alertness and Lightning Reflexes are racial bonus feats.',50),
  ('mm3-rt-harssaf-defense','harssaf',NULL,'Desert Defenses','Damage reduction 5/bludgeoning, fast healing 3, immunity to blindness and fire, spell resistance equal to 17 + class levels, and vulnerability to cold.',60),
  ('mm3-rt-harssaf-aura','harssaf','mm3-sa-harssaf-flaming-aura','Flaming Aura','At-will fiery aura damages adjacent creatures and adds fire damage to conductive melee attacks.',70),
  ('mm3-rt-harssaf-pulse','harssaf','mm3-sa-harssaf-sand-pulse','Sand Pulse','1/day 30-foot burst deals damage and can blind targets.',80),
  ('mm3-rt-harssaf-form','harssaf','mm3-sa-harssaf-sand-form','Sand Form','At-will ground-bound gaseous-form-like transformation into mobile sand.',90),

  -- Kenku
  ('mm3-rt-kenku-vision','kenku',NULL,'Low-Light Vision','Low-light vision.',10),
  ('mm3-rt-kenku-claws','kenku',NULL,'Natural Weapons','Two claws dealing 1d3 damage each.',20),
  ('mm3-rt-kenku-stealth','kenku',NULL,'Stealthy','+2 racial bonus on Hide and Move Silently checks.',30),
  ('mm3-rt-kenku-ally','kenku','mm3-sa-kenku-great-ally','Great Ally','Improved aid another and flanking attack bonuses.',40),
  ('mm3-rt-kenku-mimicry','kenku','mm3-sa-kenku-mimicry','Mimicry','Perfectly mimic familiar sounds, voices, and accents.',50),

  -- Blackscale Lizardfolk
  ('mm3-rt-blackscale-rhd','blackscale-lizardfolk',NULL,'Racial Hit Dice','4d8 monstrous humanoid racial Hit Dice; racial BAB +4 and base saves Fort +1, Ref +4, Will +4.',10),
  ('mm3-rt-blackscale-vision','blackscale-lizardfolk',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm3-rt-blackscale-armor','blackscale-lizardfolk',NULL,'Natural Armor','+7 natural armor bonus.',30),
  ('mm3-rt-blackscale-weapons','blackscale-lizardfolk',NULL,'Natural Weapons','Two claws (1d6) and bite (1d6).',40),
  ('mm3-rt-blackscale-skills','blackscale-lizardfolk',NULL,'Racial Skills','+4 racial bonus on Balance, Jump, and Swim checks; these are racial-HD class skills along with Spot from the source stat block.',50),
  ('mm3-rt-blackscale-hold','blackscale-lizardfolk','mm3-sa-lizardfolk-hold-breath','Hold Breath','Hold breath for 4 × Constitution score rounds before drowning checks begin.',60),
  ('mm3-rt-blackscale-acid','blackscale-lizardfolk',NULL,'Acid Resistance','Resistance to acid 5.',70),

  -- Poison Dusk Lizardfolk
  ('mm3-rt-poison-vision','poison-dusk-lizardfolk',NULL,'Low-Light Vision','Low-light vision.',10),
  ('mm3-rt-poison-armor','poison-dusk-lizardfolk',NULL,'Natural Armor','+3 natural armor bonus.',20),
  ('mm3-rt-poison-weapons','poison-dusk-lizardfolk',NULL,'Natural Weapons','Two claws (1d3) and bite (1d3).',30),
  ('mm3-rt-poison-skills','poison-dusk-lizardfolk',NULL,'Racial Skills','+4 racial bonus on Balance, Jump, and Swim checks.',40),
  ('mm3-rt-poison-use','poison-dusk-lizardfolk','mm3-sa-poison-dusk-poison-use','Poison Use','Apply poison to weapons without risk of poisoning yourself.',50),
  ('mm3-rt-poison-chameleon','poison-dusk-lizardfolk','mm3-sa-poison-dusk-chameleon','Chameleon Skin','+5 Hide while the skin is not covered by armor, robes, or similar clothing.',60),
  ('mm3-rt-poison-hold','poison-dusk-lizardfolk','mm3-sa-lizardfolk-hold-breath','Hold Breath','Hold breath for 4 × Constitution score rounds before drowning checks begin.',70),
  ('mm3-rt-poison-familiarity','poison-dusk-lizardfolk',NULL,'Weapon Familiarity','Treat bolas and nets as martial weapons rather than exotic weapons.',80),

  -- Lumi
  ('mm3-rt-lumi-rhd','lumi',NULL,'Racial Hit Dice','2d8 outsider racial Hit Dice; racial BAB +2 and base saves Fort +3, Ref +3, Will +3.',10),
  ('mm3-rt-lumi-vision','lumi',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm3-rt-lumi-skills','lumi',NULL,'Racial Skills','Racial-HD class skills: Concentration, Diplomacy, Heal, Knowledge (the planes), Listen, Search, Sense Motive, and Spot. +2 racial bonus on Search, Sense Motive, and Spot.',30),
  ('mm3-rt-lumi-feat','lumi',NULL,'Bonus Feat: Improved Initiative','Improved Initiative is a racial bonus feat.',40),
  ('mm3-rt-lumi-body','lumi','mm3-sa-lumi-body-of-light','Body of Light','Positive-energy body grants immunity to death, draining, and negative-energy effects.',50),
  ('mm3-rt-lumi-clear','lumi','mm3-sa-lumi-clear-vision','Clear Vision','Immune to blindness, dazzling, and the source-listed direct light/color attacks.',60),
  ('mm3-rt-lumi-head','lumi','mm3-sa-lumi-floating-head','Floating Head','Resists flanking, decapitation, strangling, and suffocation as described by the source.',70),
  ('mm3-rt-lumi-sla','lumi','mm3-sa-lumi-spell-like','Spell-Like Abilities','At-will disrupt undead/light and 3/day cure light wounds/glitterdust.',80),

  -- Nycter
  ('mm3-rt-nycter-rhd','nycter',NULL,'Racial Hit Dice','3d8 monstrous humanoid racial Hit Dice; racial BAB +3 and base saves Fort +1, Ref +3, Will +3.',10),
  ('mm3-rt-nycter-vision','nycter',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm3-rt-nycter-armor','nycter',NULL,'Natural Armor','+3 natural armor bonus.',30),
  ('mm3-rt-nycter-bite','nycter',NULL,'Natural Weapon','Bite attack dealing 1d4 damage.',40),
  ('mm3-rt-nycter-skills','nycter',NULL,'Racial Skills','Racial-HD class skills: Craft, Listen, Spot, and Survival. +4 racial bonus on Listen and Spot while blindsense functions.',50),
  ('mm3-rt-nycter-blindsense','nycter','mm3-sa-nycter-blindsense','Blindsense','Blindsense 60 ft. through echolocation.',60),
  ('mm3-rt-nycter-cry','nycter','mm3-sa-nycter-hunting-cry','Hunting Cry','30-foot sonic cone deals 2d4 sonic damage and can paralyze.',70),
  ('mm3-rt-nycter-sonic','nycter',NULL,'Sonic Vulnerability','Vulnerable to sonic damage.',80),

  -- Skullcrusher Ogre
  ('mm3-rt-skull-rhd','skullcrusher-ogre',NULL,'Racial Hit Dice','8d8 giant racial Hit Dice; racial BAB +6 and base saves Fort +6, Ref +2, Will +2.',10),
  ('mm3-rt-skull-senses','skullcrusher-ogre',NULL,'Giant Senses','Darkvision 60 ft. and low-light vision.',20),
  ('mm3-rt-skull-armor','skullcrusher-ogre',NULL,'Natural Armor','+2 natural armor bonus.',30),
  ('mm3-rt-skull-skills','skullcrusher-ogre',NULL,'Racial Skills','Racial-HD class skills: Craft, Handle Animal, Intimidate, Knowledge (architecture and engineering), and Ride.',40),
  ('mm3-rt-skull-feats','skullcrusher-ogre',NULL,'Racial Bonus Feats','Improved Grapple and Two-Weapon Fighting are racial bonus feats.',50),
  ('mm3-rt-skull-proficiency','skullcrusher-ogre',NULL,'Weapon and Armor Proficiency','Proficient with simple and martial weapons, all armor, and shields.',60),
  ('mm3-rt-skull-rock','skullcrusher-ogre','mm3-sa-skullcrusher-rock-throwing','Rock Throwing','Throw heavy rocks with a +1 racial attack bonus and 100-foot range increment.',70),

  -- Quaraphon
  ('mm3-rt-quaraphon-rhd','quaraphon',NULL,'Racial Hit Dice','9d8 aberration racial Hit Dice; racial BAB +6 and base saves Fort +3, Ref +3, Will +6.',10),
  ('mm3-rt-quaraphon-vision','quaraphon',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm3-rt-quaraphon-armor','quaraphon',NULL,'Natural Armor','+7 natural armor bonus.',30),
  ('mm3-rt-quaraphon-weapons','quaraphon',NULL,'Natural Weapons','Bite (1d6) and hoof (1d6).',40),
  ('mm3-rt-quaraphon-skills','quaraphon',NULL,'Racial Skills','Racial-HD class skills: Intimidate, Listen, Spot, and Survival.',50),
  ('mm3-rt-quaraphon-bellow','quaraphon','mm3-sa-quaraphon-bellow','Deafening Bellow','1/day 60-foot sonic bellow deals 2d6 sonic damage and can deafen.',60),

  -- Naztharune Rakshasa
  ('mm3-rt-naz-rhd','naztharune-rakshasa',NULL,'Racial Hit Dice','11d8 outsider racial Hit Dice; racial BAB +11 and base saves Fort +7, Ref +7, Will +7.',10),
  ('mm3-rt-naz-vision','naztharune-rakshasa',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm3-rt-naz-armor','naztharune-rakshasa',NULL,'Natural Armor','+5 natural armor bonus.',30),
  ('mm3-rt-naz-claws','naztharune-rakshasa',NULL,'Natural Weapons','Two claws dealing 1d4 damage each.',40),
  ('mm3-rt-naz-skills','naztharune-rakshasa',NULL,'Racial Skills','Racial-HD class skills: Balance, Bluff, Disguise, Escape Artist, Hide, Listen, Move Silently, Search, Spot, and Tumble. +4 racial bonus on Bluff and Disguise.',50),
  ('mm3-rt-naz-thoughts','naztharune-rakshasa','mm3-sa-naztharune-detect-thoughts','Detect Thoughts','Continuous supernatural detect thoughts; may suppress or resume freely.',60),
  ('mm3-rt-naz-shape','naztharune-rakshasa','mm3-sa-naztharune-change-shape','Change Shape','At-will humanoid shapechanging.',70),
  ('mm3-rt-naz-defense','naztharune-rakshasa',NULL,'Rakshasa Defenses','Damage reduction 15/good and piercing; spell resistance equal to 21 + class levels; evasion, improved evasion, uncanny dodge, improved uncanny dodge, and hide in plain sight.',80),
  ('mm3-rt-naz-jump','naztharune-rakshasa','mm3-sa-naztharune-shadow-jump','Shadow Jump','Travel up to 20 feet per day between shadows.',90),
  ('mm3-rt-naz-assassin','naztharune-rakshasa',NULL,'Assassin Aptitude','Automatically qualifies for the assassin prestige class as stated by the source entry.',100),

  -- Shifter
  ('mm3-rt-shifter-vision','shifter',NULL,'Low-Light Vision','Low-light vision.',10),
  ('mm3-rt-shifter-skills','shifter',NULL,'Athletic Instincts','+2 racial bonus on Balance, Climb, and Jump checks.',20),
  ('mm3-rt-shifter-shifting','shifter','mm3-sa-shifter-shifting','Shifting','Shift 1/day as a free action for 3 + Constitution modifier rounds.',30),
  ('mm3-rt-shifter-choice','shifter',NULL,'Shifter Trait Choice','Choose one trait: Beasthide (+2 Con and +2 natural armor while shifting), Cliffwalk (+2 Dex and climb 20 ft.), Longstride (+2 Dex and +10 ft. land speed), Longtooth (+2 Str and bite 1d6 with source scaling), Razorclaw (+2 Str and two claws 1d4 with source scaling), or Wildhunt (+2 Con and scent while shifting, with its Survival benefit). Only the chosen trait applies.',40),

  -- Crystalline Troll
  ('mm3-rt-crystal-rhd','crystalline-troll',NULL,'Racial Hit Dice','10d8 giant racial Hit Dice; racial BAB +7 and base saves Fort +7, Ref +3, Will +3.',10),
  ('mm3-rt-crystal-senses','crystalline-troll',NULL,'Troll Senses','Darkvision 60 ft., low-light vision, and scent.',20),
  ('mm3-rt-crystal-armor','crystalline-troll',NULL,'Natural Armor','+7 natural armor bonus.',30),
  ('mm3-rt-crystal-weapons','crystalline-troll',NULL,'Natural Weapons','Two claws (1d6) and bite (1d6).',40),
  ('mm3-rt-crystal-skills','crystalline-troll',NULL,'Racial Skills','Racial-HD class skills are Listen and Spot.',50),
  ('mm3-rt-crystal-rend','crystalline-troll','mm3-sa-crystalline-rend','Rend','Hitting with both claws deals additional rend damage.',60),
  ('mm3-rt-crystal-regen','crystalline-troll','mm3-sa-crystalline-regeneration','Regeneration 5','Regeneration 5; sonic attacks deal normal damage.',70),
  ('mm3-rt-crystal-elements','crystalline-troll',NULL,'Crystalline Defenses','Immune to acid and vulnerable to sonic damage.',80),

  -- Warforged Charger
  ('mm3-rt-charger-rhd','warforged-charger',NULL,'Racial Hit Dice','4d10 construct racial Hit Dice; racial BAB +3 and base saves Fort +1, Ref +1, Will +1.',10),
  ('mm3-rt-charger-living','warforged-charger','mm3-sa-living-construct','Living Construct Traits','Uses the living construct subtype rules rather than ordinary construct traits.',20),
  ('mm3-rt-charger-slams','warforged-charger',NULL,'Natural Weapons','Two slam attacks dealing 1d8 damage each.',30),
  ('mm3-rt-charger-skills','warforged-charger',NULL,'Racial Skills','Jump is the class skill for the charger’s construct racial Hit Dice.',40),
  ('mm3-rt-charger-feats','warforged-charger',NULL,'Racial Bonus Feats','Adamantine Body and Powerful Charge are granted as racial bonus feats in addition to feats from racial Hit Dice.',50),
  ('mm3-rt-charger-fists','warforged-charger','mm3-sa-charger-adamantine-fists','Adamantine Fists','Slam attacks count as adamantine for damage reduction and hardness.',60),
  ('mm3-rt-charger-plating','warforged-charger','mm3-sa-charger-adamantine-plating','Adamantine Plating','Integrated +8 armor, DR 2/adamantine, heavy-armor restrictions, and 35% arcane spell failure.',70),
  ('mm3-rt-charger-fortification','warforged-charger','mm3-sa-charger-moderate-fortification','Moderate Fortification','75% chance to negate extra critical-hit or sneak-attack damage.',80),

  -- Warforged Scout
  ('mm3-rt-scout-living','warforged-scout','mm3-sa-living-construct','Living Construct Traits','Uses the living construct subtype rules rather than ordinary construct traits.',10),
  ('mm3-rt-scout-plating','warforged-scout','mm3-sa-scout-composite-plating','Composite Plating','Integrated +2 armor with 5% arcane spell failure and armor-slot restrictions.',20),
  ('mm3-rt-scout-fortification','warforged-scout','mm3-sa-scout-light-fortification','Light Fortification','25% chance to negate extra critical-hit or sneak-attack damage.',30),

  -- Witchknife
  ('mm3-rt-witchknife-rhd','witchknife',NULL,'Racial Hit Dice','9d8 monstrous humanoid racial Hit Dice; racial BAB +9 and base saves Fort +3, Ref +6, Will +6.',10),
  ('mm3-rt-witchknife-vision','witchknife',NULL,'Low-Light Vision','Low-light vision.',20),
  ('mm3-rt-witchknife-armor','witchknife',NULL,'Natural Armor','+1 natural armor bonus.',30),
  ('mm3-rt-witchknife-skills','witchknife',NULL,'Racial Skills','Racial-HD class skills: Concentration, Hide, Sense Motive, Speak Language, and Spot.',40),
  ('mm3-rt-witchknife-proficiency','witchknife',NULL,'Weapon and Shield Proficiency','Proficient with all simple weapons and shields except tower shields.',50),
  ('mm3-rt-witchknife-psionics','witchknife','mm3-sa-witchknife-psionics','Psionics','At-will command/message/silence and 1/day greater command at effective caster level 9th.',60),
  ('mm3-rt-witchknife-sneak','witchknife','mm3-sa-witchknife-sneak-attack','Sneak Attack +2d6','Racial sneak attack +2d6.',70),
  ('mm3-rt-witchknife-elements','witchknife',NULL,'Energy Traits','Fire resistance 5 and vulnerability to sonic damage.',80)
)
INSERT INTO dnd35_race_traits
  (id,race_id,special_ability_id,name,rules_text,position,effects,parameters)
SELECT t.id,r.id,t.special_ability_id,t.name,t.rules_text,t.position,NULL,NULL
FROM traits t
JOIN dnd35_races r ON r.id='mm3-race-'||t.race_slug
WHERE 1
ON CONFLICT(id) DO UPDATE SET
  race_id=excluded.race_id,
  special_ability_id=excluded.special_ability_id,
  name=excluded.name,
  rules_text=excluded.rules_text,
  position=excluded.position,
  effects=NULL,
  parameters=NULL;
