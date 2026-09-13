-- Deities and Demigods divine creature templates and 3.5 update material.
-- Primary source: Deities and Demigods (2002).
-- Revision source: official D&D v.3.5 Accessory Update appended to the supplied PDF.
-- Where the update changes a mechanic, the update row supersedes the original-era behavior.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES
  ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0','Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL),
  ('dd-3.5-update','deities-and-demigods-3-5-update','Deities and Demigods - D&D v.3.5 Accessory Update','DD 3.5 Update','Wizards of the Coast','dnd','3.5','Official revision notes that update Deities and Demigods to the revised 3.5 core rules. These rows supersede conflicting 3.0 mechanics from the book.',NULL,1,0,NULL);

WITH desired(source_id,slug,name,page,summary,tags,mechanics,supersedes_slug) AS (VALUES
('dd-3.0','dd-template-petitioner','Petitioner Template','29-30',
 'A petitioner is a deceased soul given outsider form on an Outer Plane. The template strips most former supernatural power, grants planar defenses, and binds the petitioner to its plane.',
 '["deity","monster","template","petitioner","outsider","outer-planes"]',
 '{"typeChange":"outsider","hitDice":{"fixed":"2d8","retainHitPointBonus":true},"armorClass":"Retain only natural armor, Dexterity, and size modifiers; armor and other former AC bonuses are lost.","baseAttackBonus":2,"specialAttacks":"Lose supernatural and spell-like special attacks; retain extraordinary attacks.","specialQualities":{"mentalImmunity":true,"energyImmunityChoice":{"choose":2,"options":["acid","cold","electricity","fire","poison","petrification","polymorph"]},"energyResistanceChoice":{"amount":20,"choose":2,"options":["acid","cold","electricity","fire"]},"planarCommitment":{"cannotVoluntarilyLeavePlane":true,"forcedDeparture":"teleported 100 miles in a random direction"},"planeSpecificOptionExamples":["DR 5/silver and SR 5","permanent magic circle against evil","fast healing 1","DR 10/+1","SR 10","+2d8 Hit Dice","replace standard immunities/resistances with resistance 5 to listed energies or poison"]},"saves":{"fort":3,"ref":3,"will":3},"abilities":"same as base creature; campaign may cap ability scores at 18","skills":"none","feats":"none","challengeRating":1,"treasure":"none","playerCharacterUse":false,"resurrectionMemory":"A former petitioner restored to life has no memory of petitioner existence."}',NULL),

('dd-3.5-update','dd-update-template-einherjar','Einherjar Template','10-11',
 'The 3.5 accessory update defines einherjar as an acquired divine-rank-0 template for experienced good humanoid warriors and supplies revised quasi-deity defenses.',
 '["deity","monster","template","einherjar","quasi-deity","divine-rank-0","3.5-update"]',
 '{"acquired":true,"eligibility":{"baseType":"humanoid","alignment":"good","minimumLevels":10,"qualifyingClasses":["barbarian","fighter","ranger","paladin"]},"divineRank":0,"sizeChange":null,"typeChange":"outsider","subtypes":["good"],"materialPlaneAddsSubtype":"extraplanar","baseLandSpeedIncreaseFeet":30,"quasiDeityTraits":{"immunities":["transmutation","energy drain","ability drain","ability damage","mind-affecting effects"],"damageReduction":{"amount":10,"bypass":"epic","edition":"3.5 update"},"fireResistance":5,"spellResistance":32,"immortal":true}}',NULL),

('dd-3.5-update','dd-update-asgardian-giants','Asgardian Giants as Quasi-Deities','10-11',
 'Jotunheim frost giants and Muspelheim fire giants use their Monster Manual counterparts with divine-rank-0 quasi-deity traits and are commonly experienced warriors.',
 '["deity","monster","giant","asgardian","quasi-deity","3.5-update"]',
 '{"baseCreatures":["frost giant","fire giant"],"divineRank":0,"quasiDeityTraits":{"immunities":["transmutation","energy drain","ability drain","ability damage","mind-affecting effects"],"damageReduction":{"amount":10,"bypass":"epic"},"fireResistance":5,"spellResistance":32,"immortal":true},"typicalClassLevels":{"minimum":5,"classes":["barbarian","fighter","ranger"]}}',NULL),

('dd-3.5-update','dd-update-valkyries','Valkyries','10-11',
 'Under the 3.5 update, valkyries are human female paladins with the einherjar template; their mounts are celestial pegasi with normal paladin-mount benefits.',
 '["deity","monster","valkyrie","einherjar","paladin","3.5-update"]',
 '{"baseCreature":"human female paladin","template":"dd-update-template-einherjar","mount":"celestial pegasus","mountBenefits":"normal paladin special mount benefits"}',NULL)
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dd-rule-'||d.slug,d.source_id,d.page,d.slug,d.name,d.summary,d.summary,0,NULL,1,
       'divine-creature','subsystem',0,1,NULL,d.supersedes_slug,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id=d.source_id AND r.slug=d.slug AND r.owner_user_id IS NULL
);
