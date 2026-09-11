-- Epic Level Handbook monster templates.
-- Source: Epic Level Handbook, Chapter 5, pp. 209-213.
-- Mechanical text is summarized; source remains authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(slug,name,page,category,kind,summary,tags,mechanics) AS (VALUES
('elh-paragon-template','Paragon Creature Template','209-210','epic-monsters','template',
 'A paragon is an idealized specimen of a base creature: maximum hit points, dramatically improved speed, defenses, attacks, abilities, saves, skills, resistances, regeneration, and challenge rating.',
 '["epic","monster","template","paragon"]',
 '{"appliesTo":"any creature","typeChange":"none","hitPoints":{"maximumPerHitDie":true,"additionalPerHitDie":12},"speedMultiplier":3,"armorClass":{"insight":12,"luck":12,"naturalArmorMinimumBonus":5},"attacks":{"luckBonus":25},"damage":{"meleeAndThrownLuckBonus":20},"specialAttacks":{"insightBonus":13,"applyAtMostOncePerAbility":true},"spellLikeAbilities":{"baseCasterLevelBonus":15,"additionalThreePerDay":["greater dispelling","haste","see invisibility"],"additionalCasterLevel":15},"specialQualities":{"fireResistanceMinimum":10,"coldResistanceMinimum":10,"damageReductionMinimum":"20/+6","spellResistance":"base creature CR + 25, or existing if higher","fastHealingMinimum":20},"saves":{"insightBonus":10},"abilities":{"allScoresIncrease":15},"skills":{"competenceBonus":10},"feats":{"bonusFeats":2},"challengeRating":{"upTo6HD":"base CR +18","7To15HD":"base CR +15","16PlusHD":"base CR +12"},"treasure":"standard for adjusted CR","alignment":"same as base","advancement":"same as base"}'),

('elh-pseudonatural-template','Pseudonatural Creature Template','212-213','epic-monsters','template',
 'The Epic Level Handbook pseudonatural template transforms a corporeal base creature into an outsider from beyond the known planes, replacing melee attacks with tentacles and adding extreme defenses and alien abilities.',
 '["epic","monster","template","pseudonatural","far-realm"]',
 '{"appliesTo":"any corporeal creature","typeChange":"outsider","hitPoints":{"maximumPerHitDie":true},"speedMultiplier":2,"armorClass":{"naturalArmorMinimumBonus":35},"tentacleRakes":{"replaceMeleeAttacksInPseudonaturalForm":true,"baseDamage":"2d8 + Strength modifier","allUseBestAttackBonus":true,"extraAttacks":"one per 4 HD, subject to printed table"},"constantInsight":{"attackBonus":15,"ignoresConcealmentMissChance":true},"improvedGrab":{"trigger":"tentacle hit","target":"smaller opponent"},"rottingConstriction":{"constitutionDrain":"2d4 permanent","healingPerSuccessfulGrapple":10},"spellLikeAbilities":{"atWill":["blur","dimension door","shield","unhallow"],"casterLevel":20},"spellResistance":"HD × 5, or existing if higher","progressionTable":[{"hd":"1-3","acidElectricityResistance":15,"damageReduction":"20/+5","extraTentacleRakes":1},{"hd":"4-7","acidElectricityResistance":20,"damageReduction":"25/+6","extraTentacleRakes":2},{"hd":"8-11","acidElectricityResistance":25,"damageReduction":"30/+7","extraTentacleRakes":3},{"hd":"12-15","acidElectricityResistance":30,"damageReduction":"35/+8","extraTentacleRakes":4},{"hd":"16-19","acidElectricityResistance":35,"damageReduction":"40/+9","extraTentacleRakes":5},{"hd":"21-24","acidElectricityResistance":40,"damageReduction":"45/+10","extraTentacleRakes":6},{"hd":"each 4 more HD","acidElectricityResistance":"+5","damageReduction":"+5/+1","extraTentacleRakes":"+1"}],"sourceTableGap":"The printed ELH table jumps from 16-19 HD to 21-24 HD and gives no explicit 20-HD row; this seed intentionally does not infer one.","alternateForm":{"atWill":true,"action":"standard","mechanicsUnchanged":true,"enemyAttackMoralePenalty":-1},"abilities":{"strength":22,"constitution":10,"dexterity":10,"wisdom":10,"intelligenceMinimum":3},"challengeRating":{"upTo6HD":"base CR +16","7To15HD":"base CR +13","16PlusHD":"base CR +10"},"treasure":"same as base","alignment":"same as base","advancement":"same as base"}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'elh-rule-'||d.slug,'elh-3.0',d.page,d.slug,d.name,d.summary,d.summary,0,NULL,1,
       d.category,d.kind,0,1,NULL,NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='elh-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
