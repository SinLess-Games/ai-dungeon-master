-- Epic Level Handbook: advanced dragons, force dragons, and prismatic dragons.
-- Source: Epic Level Handbook, Chapter 5, pp. 179-186.
-- Mechanical text is summarized; source remains authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(slug,name,page,category,kind,summary,tags,mechanics) AS (VALUES
('elh-advanced-dragon-progression','Advanced Dragon Progression','179-182','epic-monsters','subsystem',
 'Rules for advancing dragons beyond great wyrm, including virtual age categories, size, natural armor, breath weapon, spell resistance, movement, ability scores, damage reduction, caster level, feats, and challenge rating.',
 '["epic","dragon","advancement","great-wyrm"]',
 '{"virtualAge":{"standardDragon":{"hitDicePerVirtualAge":3},"epicDragon":{"hitDicePerVirtualAge":5}},"size":{"lesser":{"colossalAfterVirtualAges":2,"colossalPlusAdditionalVirtualAges":4},"ordinary":{"colossalAfterVirtualAges":1,"colossalPlusAdditionalVirtualAges":4},"greater":{"colossalPlusAdditionalVirtualAgesAfterColossal":4},"epic":{"sizeAfterGreatWyrm":"does not increase"}},"naturalArmor":{"increasePerHitDieBeyondGreatWyrm":1},"breathWeapon":{"damageDicePerVirtualAge":2,"exceptions":{"brass":1,"white":1},"saveDcFormula":"10 + floor(hitDice/2) + Constitution modifier"},"spellResistance":{"standardIncreasePerVirtualAge":2,"forceIncreasePerVirtualAge":3,"prismaticIncreasePerVirtualAge":6},"flight":{"onColossal":{"increaseFeet":50,"maneuverability":"clumsy"},"onColossalPlus":{"additionalIncreaseFeet":50,"maneuverability":"clumsy"}},"abilities":{"strengthPerVirtualAge":2,"constitutionPerVirtualAge":2,"intelligenceWisdomCharismaPerTwoVirtualAges":2,"dexterity":"unchanged"},"damageReduction":{"ordinary":{"increasePerTwoVirtualAges":{"amount":5,"enhancementBypass":1}},"forcePrismatic":{"increasePerTwoVirtualAges":{"amount":10,"enhancementBypass":1}}},"casterLevel":{"increasePerVirtualAge":2,"improvedSpellCapacityBonusFeat":"once per 3 caster levels above 20"},"feats":{"onePerHitDice":4,"postGreatWyrmMayChooseEpic":true},"challengeRating":{"standardIncreasePerVirtualAge":2,"epicIncreasePerVirtualAge":3}}'),

('elh-force-dragon-catalog','Force Dragon Age Catalog','182-184','epic-monsters','species-catalog',
 'Full age-category catalog for the force dragon, including challenge ratings, advancement bands, force immunity, deflecting force, concealment progression, and spell-like abilities.',
 '["epic","dragon","force","age-categories"]',
 '{"creatureType":"Dragon (Force)","alignment":"usually neutral","treasure":"double standard","environment":"any land and underground","challengeRatings":{"wyrmling":13,"veryYoung":19,"young":21,"juvenile":25,"youngAdult":28,"adult":31,"matureAdult":35,"old":37,"veryOld":39,"ancient":43,"wyrm":50,"greatWyrm":59},"advancement":{"wyrmling":"21-24 HD Huge","veryYoung":"26-29 HD Huge","young":"31-34 HD Gargantuan","juvenile":"36-39 HD Gargantuan","youngAdult":"41-44 HD Gargantuan","adult":"46-49 HD Gargantuan","matureAdult":"51-54 HD Colossal","old":"56-59 HD Colossal","veryOld":"61-64 HD Colossal","ancient":"66-69 HD Colossal","wyrm":"71-74 HD Colossal+","greatWyrm":"76+ HD Colossal+"},"traits":{"forceImmunity":"immune to force effects and may move through force barriers","deflectingForce":"deflection bonus equals Charisma bonus","blur":"juvenile and older, 20% miss chance","displacement":"old and older, 50% miss chance and supersedes blur","invisibility":"great wyrm, as improved invisibility; displacement still applies to creatures that see invisible"},"spellLikeAbilities":{"usesPerDay":3,"abilities":["forcecage","maze","Otiluke''s resilient sphere","Otiluke''s telekinetic sphere","wall of force"]}}'),

('elh-prismatic-dragon-catalog','Prismatic Dragon Age Catalog','185-186','epic-monsters','species-catalog',
 'Full age-category catalog for the prismatic dragon, including challenge ratings, advancement bands, prismatic breath, deflecting force, light immunity, and spell-like abilities.',
 '["epic","dragon","prismatic","light","age-categories"]',
 '{"creatureType":"Dragon (Light)","alignment":"usually neutral","treasure":"double standard","environment":"any land and underground","challengeRatings":{"wyrmling":14,"veryYoung":16,"young":22,"juvenile":30,"youngAdult":34,"adult":39,"matureAdult":43,"old":48,"veryOld":52,"ancient":57,"wyrm":61,"greatWyrm":66},"advancement":{"wyrmling":"24-27 HD Huge","veryYoung":"29-32 HD Huge","young":"34-37 HD Gargantuan","juvenile":"39-42 HD Gargantuan","youngAdult":"44-47 HD Gargantuan","adult":"49-52 HD Gargantuan","matureAdult":"54-57 HD Colossal","old":"59-62 HD Colossal","veryOld":"64-67 HD Colossal","ancient":"69-72 HD Colossal*","wyrm":"74-77 HD Colossal+","greatWyrm":"79+ HD Colossal+"},"traits":{"breathWeapon":"cone of prismatic spray; cone dimensions use dragon size","deflectingForce":"deflection bonus equals Charisma bonus","immunities":["sleep","paralysis","light effects","blindness effects"]},"spellLikeAbilities":{"atWill":["hypnotic pattern","rainbow pattern"],"threePerDay":["prismatic sphere","prismatic wall","sunbeam","sunburst"]}}')
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
