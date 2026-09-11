-- Epic Level Handbook minor and major artifacts.
-- Source: Epic Level Handbook, Chapter 4, pp. 151-155.
-- Mechanical text is summarized; source remains authoritative.
-- Artifacts have no established market price and are not craftable by ordinary item-creation rules.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(
  id,page,slug,name,description,rules_text,category,weight_pounds,caster_level,enhancement_bonus,activation,activation_text,slot
) AS (VALUES
('elh-artifact-everfull-purse','151','everfull-purse','Everfull Purse',
 'Minor artifact. A leather pouch that multiplies a single gold coin overnight.',
 'If exactly one gold piece is placed in the purse at sunset, it is replaced by 25 gold pieces at sunrise. The purse has no effect if more than one gold piece or anything other than gold is left inside.',
 'magic',0.5,20,0,'other','Place exactly one gold piece inside at sunset; the transformation completes at sunrise.','slotless'),
('elh-artifact-libram-gainful-conjuration','151-152','libram-of-gainful-conjuration','Libram of Gainful Conjuration',
 'Minor artifact. A one-use mystic book rewarding good-aligned arcane spellcasters.',
 'A good arcane caster who studies the book for one week gains a +1 inherent bonus to the ability score controlling one chosen arcane spellcasting class and enough XP to place that class halfway into the next level. Nongood arcane casters instead permanently lose 1d4+1 Constitution and must atone before gaining further XP. A creature unable to cast arcane spells that reads even one word must make Will DC 20 or suffer insanity. After being read, the book vanishes; a character cannot benefit from another similar tome a second time.',
 'magic',3.0,19,0,'use_activated','Requires one week of study; the book vanishes after use.','slotless'),
('elh-artifact-libram-ineffable-damnation','152','libram-of-ineffable-damnation','Libram of Ineffable Damnation',
 'Minor artifact. A one-use mystic book rewarding evil-aligned arcane spellcasters.',
 'An evil arcane caster who studies the book for one week gains a +1 inherent bonus to the ability score controlling one chosen arcane spellcasting class and enough XP to place that class halfway into the next level. Nonevil arcane casters instead permanently lose 1d4+1 Constitution and must atone before gaining further XP. A creature unable to cast arcane spells that reads even one word must make Will DC 20 or suffer insanity. After being read, the book vanishes; a character cannot benefit from another similar tome a second time.',
 'magic',3.0,19,0,'use_activated','Requires one week of study; the book vanishes after use.','slotless'),
('elh-artifact-libram-silver-magic','152','libram-of-silver-magic','Libram of Silver Magic',
 'Minor artifact. A one-use mystic book rewarding neutral-aligned arcane spellcasters.',
 'A neutral arcane caster who studies the book for one week gains a +1 inherent bonus to the ability score controlling one chosen arcane spellcasting class and enough XP to place that class halfway into the next level. Good or evil arcane casters instead permanently lose 1d4+1 Constitution and must atone before gaining further XP. A creature unable to cast arcane spells that reads even one word must make Will DC 20 or suffer insanity. After being read, the book vanishes; a character cannot benefit from another similar tome a second time.',
 'magic',3.0,19,0,'use_activated','Requires one week of study; the book vanishes after use.','slotless'),
('elh-artifact-manual-puissant-skill-at-arms','152','manual-of-puissant-skill-at-arms','Manual of Puissant Skill at Arms',
 'Minor artifact. A martial manual that advances an eligible warrior class.',
 'A barbarian, fighter, monk, paladin, or ranger who studies the book for one week gains +1 inherent Strength and enough XP to place one qualifying class halfway into the next level. A character with none of those classes gains no benefit. An arcane spellcaster with no qualifying class who scans even one word loses 2d6×1,000 XP and must make Will DC 20 or permanently lose 1 Intelligence. After being read, the book vanishes; a character cannot benefit from another similar tome a second time.',
 'magic',3.0,19,0,'use_activated','Requires one week of study; the book vanishes after use.','slotless'),
('elh-artifact-manual-stealthy-pilfering','152','manual-of-stealthy-pilfering','Manual of Stealthy Pilfering',
 'Minor artifact. A manual that advances a rogue.',
 'A rogue who studies the book for one week gains +1 inherent Dexterity and enough XP to place the rogue halfway into the next level. A character without rogue levels gains no benefit. A divine spellcaster without rogue levels who scans even one word loses 2d6×1,000 XP and must make Will DC 20 or permanently lose 1 Wisdom. After being read, the book vanishes; a character cannot benefit from another similar tome a second time.',
 'magic',3.0,19,0,'use_activated','Requires one week of study; the book vanishes after use.','slotless'),
('elh-artifact-olidammaras-dice','152','olidammaras-dice','Olidammara''s Dice',
 'Minor artifact. A pair of six-sided ivory dice whose intentional roll produces an unpredictable boon or curse.',
 'Rolling both dice intentionally is a standard action. Roll 2d6: 2 lose 10,000 XP and roll again automatically next round; 3 permanently lose 1d4+1 Dexterity; 4 gain 1d4 negative levels with Fortitude DC 20 to remove; 5 take -1 on attacks, saves, and checks for 1 hour; 6 take -4 AC for 10 minutes; 7 gain +1 morale on attacks and saves against fear for 10 minutes; 8 gain blur for 10 minutes; 9 gain +1 insight on attacks, saves, and checks for 1 hour; 10 gain freedom of movement for 1 hour; 11 gain one limited wish that must be used within 1 minute; 12 gain 10,000 XP and may roll again next round. Normally a creature cannot gain another effect from the dice for 24 hours except the forced/optional rerolls caused by 2 or 12. No mundane or magical method, including divination, can predict or influence the result.',
 'magic',NULL,20,0,'use_activated','Announce an intentional roll and use a standard action to roll both dice.','slotless'),

('elh-artifact-axe-dwarvish-lords','153','axe-of-the-dwarvish-lords','Axe of the Dwarvish Lords',
 'Major artifact. A legendary dwarven waraxe tied to the rise and upheaval of dwarven kingdoms.',
 'Functions as a +6 keen throwing goblinoid-bane dwarven waraxe. A dwarf holding it doubles darkvision range. A nondwarf holding it takes 2 temporary Charisma damage that cannot be healed or restored while the Axe is held. The owner gains +10 on Craft (armorsmithing, blacksmithing, gemcutting, stonemasonry, and weaponsmithing). Once per week the wielder can summon an elder earth elemental as summon monster IX for 20 rounds.',
 'weapon',NULL,NULL,6,'other','Weapon abilities are continuous while wielded; elder earth elemental summon is usable once per week.','main_hand'),
('elh-artifact-codex-infinite-planes','153-154','codex-of-the-infinite-planes','Codex of the Infinite Planes',
 'Major artifact. An endless obsidian-and-lead tome whose planar powers are exceptionally dangerous to study and invoke.',
 'The first time a creature opens the Codex it suffers destruction; Fortitude DC 30 reduces this to 10d6 damage. Each day of study allows Spellcraft DC 50 to learn one random power, with +1 circumstance per additional day until a power is learned, and also requires Will DC 30 + 1 per day of study or insanity. Learned powers are usable at will: astral projection, banishment, elemental swarm, gate, greater planar ally, greater planar binding, plane shift, and soul bind. All powers and catastrophes use caster level 30 and save DC 20 + spell level. Activating a power requires both Concentration and Spellcraft at DC 40 + twice the spell level; take 10 is forbidden. Failure on either check causes one random catastrophe: repeated earthquake plus intensified storm of vengeance; a gate bringing 1d3+1 powerful evil outsiders to attack the owner; soul trapping plus imprisonment; or repeated wail of the banshee and destruction effects for up to 10 rounds.',
 'magic',NULL,30,0,'use_activated','Study is required to learn powers; each learned power requires Concentration and Spellcraft checks when activated.','slotless'),
('elh-artifact-cup-talisman-alakbar','154','cup-and-talisman-of-alakbar','Cup and Talisman of Al''Akbar',
 'Major artifact. A paired set of holy relics formerly carried by the demigod Al''Akbar.',
 'The Cup continuously emits daylight and automatically dispels darkness-based spells whose areas it enters. A gallon of holy water placed in the Cup becomes, at the owner''s choice, an immediately consumable cure critical wounds or neutralize poison elixir. The Talisman grants +6 enhancement Charisma and allows remove blindness/deafness, remove curse, and remove disease at will. If the Talisman is placed in the Cup and the Cup is filled with holy water, it creates a resurrection elixir once per month. Any evil creature touching either relic is struck by holy word; any chaotic creature is struck by dictum; chaotic evil creatures suffer both.',
 'magic',NULL,NULL,0,'other','Cup effects are continuous or triggered by adding holy water; Talisman utility spells are at will; combined resurrection elixir is usable once per month.','other'),
('elh-artifact-eye-gruumsh','154','eye-of-gruumsh','Eye of Gruumsh',
 'Major artifact. A black-sapphire-set stone revered as a relic of Gruumsh.',
 'An orc possessing the Eye gains +6 enhancement Strength and Charisma and doubles darkvision range. A nonorc instead gains +2 enhancement Strength and suffers -2 Intelligence and Charisma. Any weapon wielded by the owner gains the elf-bane property. Once per day the owner can hold the Eye before them to gain true seeing for as long as concentration continues; maintaining it requires a standard action each round.',
 'magic',NULL,NULL,0,'other','Racial benefits and elf-bane weapon effect are continuous while possessed; true seeing is usable once per day and requires concentration.','slotless'),
('elh-artifact-golem-armor','154','golem-armor','Golem Armor',
 'Major artifact. An enormous suit of black iron +10 full plate modeled after an iron golem.',
 'This +10 full plate increases the wearer''s size by one category to a maximum of Colossal and grants +10 enhancement Strength. The wearer is immune to mind-affecting effects, poison, disease and similar effects, critical hits, subdual damage, ability damage, energy drain, death from massive damage, and rust attacks, and gains damage reduction 50/+3. While wearing the armor the wearer cannot regain hit points by mundane or magical means. Donning or extracting oneself from the armor requires 1 hour.',
 'armor',NULL,NULL,10,'continuous','All benefits and restrictions apply while worn; donning or removal requires 1 hour.','body'),
('elh-artifact-invulnerable-coat-arnd','154-155','invulnerable-coat-of-arnd','Invulnerable Coat of Arnd',
 'Major artifact. A shimmering vest of chain created to defend a legendary champion against overwhelming foes.',
 'Functions as a +5 chain shirt of heavy fortification. Grants damage reduction 10/+5 and resistance 20 to acid, cold, electricity, fire, and sonic. If the wearer can turn undead, treat that wearer as having +4 class levels for purposes of caster level, turning undead, smiting evil, and laying on hands.',
 'armor',NULL,NULL,5,'continuous','All protective and divine-class benefits apply while worn.','body'),
('elh-artifact-iron-gauntlet-hextor','155','iron-gauntlet-of-hextor','Iron Gauntlet of Hextor',
 'Major artifact. An intelligent lawful-evil right-hand gauntlet imbued with a fragment of Hextor''s power and personality.',
 'Grants +8 enhancement Strength and doubles the damage bonus of the wearer''s smite attacks. If the wearer has Leadership, the Leadership score increases by +4, but the wearer can never attract or retain good or chaotic followers or cohorts. Once per day the wielder can use implosion as a 20th-level caster, DC 23. The gauntlet is intelligent (Int 13, Wis 18, Cha 24, Ego 26), lawful evil, communicates telepathically, and attempts to dominate any wearer who is not lawful evil in order to force lawful-evil acts or obtain a more suitable wearer.',
 'magic',NULL,20,0,'other','Ability and Leadership effects are continuous; implosion is usable once per day; intelligent-item domination follows its Ego conflict rules.','hands'),
('elh-artifact-ring-gaxx','155','ring-of-gaxx','Ring of Gaxx',
 'Major artifact. A platinum ring with nine rune-inscribed facets whose active power changes each sunrise.',
 'At each sunrise roll 1d10: 1 immunity to disease; 2 no need to breathe; 3 +5 natural armor; 4 low-light vision; 5 fast healing 1; 6 fly at will; 7 cold resistance 30; 8 freedom of movement; 9 +5 resistance on saves; 10 the wearer chooses the active facet. As a full-round action the wearer may attempt Concentration DC 50 to change an unwanted facet; the attempt deals 2d6 subdual damage whether successful or not, and on success the replacement facet is random. Removing the Ring causes the former wearer to take 2d6 subdual damage each minute until it is replaced or the accumulated subdual damage exceeds current hit points; the damage resumes when the creature regains consciousness.',
 'magic',NULL,NULL,0,'other','A facet activates at sunrise; changing facets requires a full-round action and Concentration DC 50. Removal triggers the artifact''s withdrawal effect.','other')
)
INSERT INTO dnd35_items
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT d.id,'elh-3.0',d.page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
       d.category,NULL,d.weight_pounds,NULL,NULL,NULL
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_items i WHERE i.source_id='elh-3.0' AND i.slug=d.slug AND i.owner_user_id IS NULL
);

WITH desired(item_id,caster_level,enhancement_bonus,activation,activation_text,slot) AS (VALUES
('elh-artifact-everfull-purse',20,0,'other','Place exactly one gold piece inside at sunset; the transformation completes at sunrise.','slotless'),
('elh-artifact-libram-gainful-conjuration',19,0,'use_activated','Requires one week of study; the book vanishes after use.','slotless'),
('elh-artifact-libram-ineffable-damnation',19,0,'use_activated','Requires one week of study; the book vanishes after use.','slotless'),
('elh-artifact-libram-silver-magic',19,0,'use_activated','Requires one week of study; the book vanishes after use.','slotless'),
('elh-artifact-manual-puissant-skill-at-arms',19,0,'use_activated','Requires one week of study; the book vanishes after use.','slotless'),
('elh-artifact-manual-stealthy-pilfering',19,0,'use_activated','Requires one week of study; the book vanishes after use.','slotless'),
('elh-artifact-olidammaras-dice',20,0,'use_activated','Announce an intentional roll and use a standard action to roll both dice.','slotless'),
('elh-artifact-axe-dwarvish-lords',NULL,6,'other','Weapon abilities are continuous while wielded; elder earth elemental summon is usable once per week.','main_hand'),
('elh-artifact-codex-infinite-planes',30,0,'use_activated','Study is required to learn powers; each learned power requires Concentration and Spellcraft checks when activated.','slotless'),
('elh-artifact-cup-talisman-alakbar',NULL,0,'other','Cup effects are continuous or triggered by adding holy water; Talisman utility spells are at will; combined resurrection elixir is usable once per month.','other'),
('elh-artifact-eye-gruumsh',NULL,0,'other','Racial benefits and elf-bane weapon effect are continuous while possessed; true seeing is usable once per day and requires concentration.','slotless'),
('elh-artifact-golem-armor',NULL,10,'continuous','All benefits and restrictions apply while worn; donning or removal requires 1 hour.','body'),
('elh-artifact-invulnerable-coat-arnd',NULL,5,'continuous','All protective and divine-class benefits apply while worn.','body'),
('elh-artifact-iron-gauntlet-hextor',20,0,'other','Ability and Leadership effects are continuous; implosion is usable once per day; intelligent-item domination follows its Ego conflict rules.','hands'),
('elh-artifact-ring-gaxx',NULL,0,'other','A facet activates at sunrise; changing facets requires a full-round action and Concentration DC 50. Removal triggers the artifact''s withdrawal effect.','other')
)
INSERT OR IGNORE INTO dnd35_magic_items
  (item_id,aura_school_id,caster_level,manifester_level,aura_strength,activation,activation_text,slot,
   maximum_charges,recharge_text,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text,crafting_prerequisites)
SELECT d.item_id,NULL,d.caster_level,NULL,NULL,d.activation,d.activation_text,d.slot,
       NULL,NULL,d.enhancement_bonus,NULL,NULL,
       'Artifact; no ordinary crafting formula or market price.',NULL
FROM desired d;
