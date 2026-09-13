-- Dungeon Master's Guide v3.5 Chapter 7: Intelligent Items, pp. 268-272.
-- This seed captures the complete random-generation subsystem: eligibility, Table 7-30,
-- alignment, languages, lesser/greater powers, purposes, dedicated powers, Ego, dominance,
-- and the six printed intelligent-item examples.
-- Mechanical summaries are concise; the supplied DMG and appended errata remain authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG','Wizards of the Coast','dnd','3.5',
        'Core Rulebook II; source for D&D v3.5 magic items, treasure, special materials, and Dungeon Master rules.',NULL,1,0,NULL);

WITH desired(slug,name,page,kind,summary,tags,mechanics) AS (VALUES
('dmg-intelligent-item-eligibility','Intelligent Item Eligibility','268','rule',
 'Only permanent magic items can normally be intelligent. Single-use and charged items such as potions, scrolls, and wands are never intelligent; intelligent items are rare and should be used sparingly.',
 '["magic-items","intelligent-items","eligibility"]',
 '{"requiresPermanentMagicItem":true,"disallowedExamples":["potion","scroll","wand","single-use","charged-item"],"generalFrequency":"less than 1%"}'),
('dmg-intelligent-item-creature-traits','Intelligent Item Creature Traits','268','rule',
 'An intelligent item has Intelligence, Wisdom, and Charisma scores and is treated as a construct. It can think and feel as an NPC, acts on its owner''s turn, and can activate its own powers.',
 '["magic-items","intelligent-items","construct"]',
 '{"treatedAsCreature":true,"creatureType":"construct","hasMentalAbilityScores":true,"canActivateOwnPowers":true,"initiative":"acts on owner turn"}'),
('dmg-table-7-30-intelligent-capabilities','Table 7-30: Item Intelligence, Wisdom, Charisma, and Capabilities','269','table',
 'Percentile table determining an intelligent item''s mental ability scores, communication, powers, senses, and base price modifier.',
 '["magic-items","intelligent-items","random-generation","table-7-30"]',
 '{"ranges":[[1,34,{"abilityScores":"two at 12, one at 10","communication":"empathy","lesserPowers":1,"greaterPowers":0,"senses":"30 ft vision and hearing","priceModifierGp":1000}],[35,59,{"abilityScores":"two at 13, one at 10","communication":"empathy","lesserPowers":2,"greaterPowers":0,"senses":"60 ft vision and hearing","priceModifierGp":2000}],[60,79,{"abilityScores":"two at 14, one at 10","communication":"speech","lesserPowers":2,"greaterPowers":0,"senses":"120 ft vision and hearing","priceModifierGp":4000}],[80,91,{"abilityScores":"two at 15, one at 10","communication":"speech","lesserPowers":3,"greaterPowers":0,"senses":"60 ft darkvision and hearing","priceModifierGp":5000}],[92,97,{"abilityScores":"two at 16, one at 10","communication":"speech and read spoken languages","lesserPowers":3,"greaterPowers":0,"senses":"60 ft darkvision and hearing","priceModifierGp":6000}],[98,98,{"abilityScores":"two at 17, one at 10","communication":"speech and telepathy; reads spoken languages","lesserPowers":3,"greaterPowers":1,"senses":"120 ft darkvision and hearing","priceModifierGp":9000,"greaterPowerMayBecomeSpecialPurpose":true}],[99,99,{"abilityScores":"two at 18, one at 10","communication":"speech and telepathy; reads all languages and read magic","lesserPowers":3,"greaterPowers":2,"senses":"120 ft darkvision, blindsense, hearing","priceModifierGp":12000,"greaterPowerMayBecomeSpecialPurpose":true}],[100,100,{"abilityScores":"two at 19, one at 10","communication":"speech and telepathy; reads all languages and read magic","lesserPowers":4,"greaterPowers":3,"senses":"120 ft darkvision, blindsense, hearing","priceModifierGp":15000,"greaterPowerMayBecomeSpecialPurpose":true}]]}'),
('dmg-intelligent-item-alignment','Intelligent Item Alignment','269','table',
 'Every intelligent item has an alignment; random intelligent items use the printed percentile table. Alignment-oriented special abilities must remain compatible with the generated alignment.',
 '["magic-items","intelligent-items","alignment","random-generation"]',
 '{"ranges":[[1,5,"CG"],[6,15,"CN"],[16,20,"CE"],[21,25,"NE"],[26,30,"LE"],[31,55,"LG"],[56,60,"LN"],[61,80,"NG"],[81,100,"N"]],"neutralAxisCompatibility":{"CN":"any chaotic wielder","NE":"any evil wielder","LN":"any lawful wielder","NG":"any good wielder"},"alignmentAbilityCompatibilityRequired":true}'),
('dmg-intelligent-item-alignment-negative-levels','Inappropriate Wielder Negative Levels','269','rule',
 'A character whose alignment is incompatible with an intelligent item normally gains negative levels while holding it. Ego 20-29 increases this to two negative levels and Ego 30+ to three; these penalties never become actual level loss and cannot be removed while the item remains in hand.',
 '["magic-items","intelligent-items","alignment","ego","negative-levels"]',
 '{"baseNegativeLevels":1,"ego20To29":2,"ego30Plus":3,"becomesPermanentLevelLoss":false,"removableWhileHolding":false}'),
('dmg-intelligent-item-languages','Languages Spoken by Intelligent Items','269','rule',
 'An intelligent speaking item knows Common plus one additional appropriate language per point of Intelligence bonus.',
 '["magic-items","intelligent-items","languages"]',
 '{"baseLanguages":["Common"],"additionalLanguagesPerIntelligenceBonus":1,"chooseAppropriateToOriginAndPurpose":true}'),
('dmg-intelligent-lesser-powers','Intelligent Item Lesser Powers','269','table',
 'Percentile table for lesser intelligent-item powers and their base-price modifiers. Duplicate powers should be rerolled.',
 '["magic-items","intelligent-items","powers","lesser","random-generation"]',
 '{"rerollDuplicates":true,"ranges":[[1,5,"bless allies 3/day",1000],[6,10,"faerie fire 3/day",1100],[11,13,"minor image 1/day",2200],[14,20,"deathwatch continuously active",2700],[21,25,"detect magic at will",3600],[26,31,"10 ranks Intimidate",5000],[32,33,"10 ranks Decipher Script",5000],[34,36,"10 ranks Knowledge, choose category",5000],[37,40,"10 ranks Search",5000],[41,45,"10 ranks Spot",5000],[46,50,"10 ranks Listen",5000],[51,54,"10 ranks Spellcraft",5000],[55,60,"10 ranks Sense Motive",5000],[61,66,"10 ranks Bluff",5000],[67,72,"10 ranks Diplomacy",5000],[73,77,"major image 1/day",5400],[78,80,"darkness 3/day",6500],[81,83,"hold person on enemy 3/day",6500],[84,86,"zone of truth 3/day",6500],[87,89,"daze monster 3/day",6500],[90,95,"locate object 3/day",6500],[96,100,"cure moderate wounds 2d8+3 on wielder 3/day",6500]],"powerActivationAction":"standard"}'),
('dmg-intelligent-greater-powers','Intelligent Item Greater Powers','270','table',
 'Percentile table for greater intelligent-item powers and their base-price modifiers. The source table itself overlaps percentile 91 between locate creature and fear; that printed overlap is preserved rather than silently corrected.',
 '["magic-items","intelligent-items","powers","greater","random-generation","source-table-overlap"]',
 '{"rerollDuplicates":true,"ranges":[[1,6,"detect opposing alignment at will",7200],[7,10,"detect undead at will",7200],[11,13,"cause fear in enemy at will",7200],[14,18,"dimensional anchor on foe 1/day",10000],[19,23,"dismissal on foe 1/day",10000],[24,28,"lesser globe of invulnerability 1/day",10000],[29,33,"arcane eye 1/day",10000],[34,37,"detect scrying continuously",10000],[38,41,"wall of fire ring centered on wielder 1/day",10000],[42,45,"quench fires 3/day",16000],[46,50,"status at will",11000],[51,54,"gust of wind 3/day",11000],[55,59,"clairvoyance 3/day",16000],[60,64,"magic circle against opposing alignment at will",16000],[65,68,"haste on owner 3/day",16000],[69,73,"daylight 3/day",16000],[74,76,"deeper darkness 3/day",16000],[77,80,"invisibility purge, 30 ft, 3/day",16000],[81,85,"slow enemies 3/day",16000],[86,91,"locate creature 3/day",30000],[91,97,"fear against foes 3/day",30000],[98,100,"detect thoughts at will",44000]],"sourceTableOverlap":{"roll":91,"results":["locate creature 3/day","fear against foes 3/day"],"resolution":"DM/source adjudication required"}}'),
('dmg-intelligent-special-purpose','Intelligent Item Purpose','270','table',
 'A sufficiently capable intelligent item may replace a greater power with a special purpose. Its purpose must suit its type and alignment.',
 '["magic-items","intelligent-items","special-purpose","random-generation"]',
 '{"ranges":[[1,20,"defeat or slay diametrically opposed alignment"],[21,30,"defeat or slay arcane spellcasters"],[31,40,"defeat or slay divine spellcasters"],[41,50,"defeat or slay nonspellcasters"],[51,55,"defeat or slay a particular creature type"],[56,60,"defeat or slay a particular race or kind"],[61,70,"defend a particular race or kind"],[71,80,"defeat or slay servants of a specific deity"],[81,90,"defend servants and interests of a specific deity"],[91,95,"defeat or slay all except item and wielder"],[96,100,"DM or character choice"]],"neutralOpposedAlignmentPurpose":"preserve balance by defeating extreme alignments"}'),
('dmg-intelligent-dedicated-powers','Special Purpose Item Dedicated Powers','270-271','table',
 'Dedicated powers function only while the item is pursuing its special purpose. The item itself determines whether a use serves that purpose.',
 '["magic-items","intelligent-items","special-purpose","dedicated-power","random-generation"]',
 '{"ranges":[[1,6,"ice storm",50000],[7,12,"confusion",50000],[13,17,"phantasmal killer",50000],[18,24,"crushing despair",50000],[25,31,"dimension door on item and wielder",50000],[32,36,"contagion heightened to 4th as touch attack",56000],[37,43,"poison heightened to 4th as touch attack",56000],[44,50,"rusting grasp as touch attack",56000],[51,56,"10d6 lightning bolt",60000],[57,62,"10d6 fireball",60000],[63,68,"wielder +2 luck on attacks saves and checks",80000],[69,74,"mass inflict light wounds",81000],[75,81,"song of discord",81000],[82,87,"prying eyes",81000],[88,92,"15d6 greater shout 3/day",130000],[93,98,"waves of exhaustion",164000],[99,100,"true resurrection on wielder once/month",200000]],"onlyWhilePursuingPurpose":true,"itemMayRefuseUse":true}'),
('dmg-intelligent-item-ego','Intelligent Item Ego','271','table',
 'Ego measures an intelligent item''s power and force of personality. Add enhancement/special-ability bonuses, powers, purpose, communication abilities, and mental ability modifiers using the source table.',
 '["magic-items","intelligent-items","ego"]',
 '{"egoPoints":{"perEnhancementBonus":1,"perEquivalentSpecialAbilityBonus":1,"perLesserPower":1,"perGreaterPower":2,"specialPurposeAndDedicatedPower":4,"telepathy":1,"readLanguages":1,"readMagic":1,"perIntelligenceBonus":1,"perWisdomBonus":1,"perCharismaBonus":1}}'),
('dmg-intelligent-item-dominance','Intelligent Item Personality Conflict and Dominance','271','subsystem',
 'When item and possessor conflict, or whenever an Ego 20+ item is denied its wishes, the possessor makes a Will save against DC equal to item Ego. Failure makes the item dominant for one day or until a critical situation changes the contest.',
 '["magic-items","intelligent-items","ego","dominance","will-save"]',
 '{"conflictSave":"Will","dc":"item Ego","ego20PlusAlwaysConsidersSelfSuperior":true,"dominanceDuration":"1 day or until critical situation","dominantItemMayDemandConcessions":true,"dominantItemExtremeActions":["force combat","refuse to strike","strike wielder or associates","force surrender","drop itself"]}'),
('dmg-intelligent-item-rival-awareness','Intelligent Item Rival Awareness','271','rule',
 'An intelligent item is aware of other intelligent items within 60 feet and normally regards them as rivals, modified by alignment and personality.',
 '["magic-items","intelligent-items","senses","personality"]',
 '{"detectOtherIntelligentItemsFeet":60,"defaultAttitude":"rival"}'),
('dmg-intelligent-item-examples','Printed Intelligent Item Examples','271-272','catalog',
 'The DMG supplies six ready-to-use intelligent-item examples: Acrola, Jomnoth, Iquel, Bosk, Vesac, and Zax.',
 '["magic-items","intelligent-items","examples"]',
 '{"examples":[{"name":"Acrola, Watchful Tooth of Ashardalon","base":"+5 keen dagger","alignment":"CG","int":10,"wis":18,"cha":18,"ego":22,"priceGp":132802},{"name":"Jomnoth, Giantblight","base":"+3 giantbane dwarven waraxe","alignment":"LG","int":10,"wis":14,"cha":14,"ego":14,"priceGp":176430},{"name":"Iquel","base":"+2 holy composite longbow","alignment":"NG","int":17,"wis":10,"cha":17,"ego":16,"priceGp":66600},{"name":"Bosk, the Poetic Blade","base":"+2 longsword","alignment":"N","int":14,"wis":14,"cha":10,"ego":8,"priceGp":15815},{"name":"Vesac, the Deceiver","base":"luck blade","alignment":"NE","int":16,"wis":10,"cha":16,"ego":15,"priceGp":161560},{"name":"Zax, Cloak of Kings","base":"cloak of Charisma +6","alignment":"LN","int":10,"wis":14,"cha":14,"ego":5,"priceGp":56500}]}')
)
INSERT INTO dnd35_rules
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
  category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dmg-rule-'||d.slug,'dmg-3.5',d.page,d.slug,d.name,d.summary,d.summary,0,NULL,1,
       'magic-items',d.kind,0,1,NULL,NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_rules r WHERE r.source_id='dmg-3.5' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
