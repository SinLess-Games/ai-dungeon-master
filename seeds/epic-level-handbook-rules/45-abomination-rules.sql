-- Epic Level Handbook shared Abomination traits and construction guidance.
-- Source: Epic Level Handbook, Chapter 5, pp. 157-158.
-- Mechanical text is summarized; specific monster stat blocks remain authoritative when they differ from these general guidelines.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(slug,name,page,category,kind,summary,tags,mechanics) AS (VALUES
('elh-abomination-traits','Abomination Traits','157-158','epic-monsters','group-traits',
 'Shared traits of Epic Level Handbook abominations, which are a grouping of outsider creatures rather than a separate creature type.',
 '["epic","monster","abomination","outsider","deific"]',
 '{"groupingNotCreatureType":true,"deificStatus":{"whenUsingDeitiesAndDemigods":"divine rank 0"},"hitPoints":{"maximumPerHitDie":true},"immunities":["polymorphing","petrification","form-altering attacks","energy drain","ability drain","ability damage","death from massive damage","mind-affecting effects"],"energyImmunity":"one of five energy types, specific to the abomination","defaultResistances":{"fire":20,"cold":20},"defaultDamageReduction":"at least 30/+6; specific stat blocks may differ","nondetection":{"continuous":true,"casterLevel":"equal to abomination HD"},"trueSeeing":{"atWill":true},"blindsightFeet":500,"telepathyFeet":1000,"featSelection":"may select both nonepic and epic feats","summonCreature":"may summon creatures associated with the divine progenitor portfolio or the abomination's imprisonment","precedence":"Specific abomination stat blocks override these general values where they differ."}'),

('elh-building-abominations','Building Abominations','157-158','epic-monsters','construction-guidance',
 'Guidance for creating additional abominations that share a spark of deific power but possess unique abilities tied to their divine progenitor or imprisonment.',
 '["epic","monster","abomination","construction","generator"]',
 '{"fastHealingAndRegeneration":{"typicalRange":"5-55","guidance":"usually higher with higher HD","regenerationBypass":"normally at least two sources: one opposed to subtype/alignment and one unique thematic source"},"naturalArmor":{"typicalRange":"+10 to +100","guidance":"usually higher with higher HD"},"spellLikeAbilities":{"casterLevel":"20th or higher","count":"no fixed rule; infernal is suggested as an upper-end guide"},"uniqueAbilities":"at least one tied to progenitor portfolio or imprisonment","spellResistanceGuideline":"CR + 12","sizeGuidelines":[{"size":"Fine","strength":"12-13","dexterity":"26-27","constitution":"12-13","hitDice":"4d8-9d8","slam":null,"bite":"1d6","claw":"1d4","gore":"1d4"},{"size":"Diminutive","strength":"14-15","dexterity":"24-25","constitution":"14-15","hitDice":"7d8-13d8","slam":"1d4","bite":"1d8","claw":"1d6","gore":"1d6"},{"size":"Tiny","strength":"18-19","dexterity":"22-23","constitution":"16-17","hitDice":"10d8-21d8","slam":"1d6","bite":"2d6","claw":"1d8","gore":"1d8"},{"size":"Small","strength":"26-27","dexterity":"20-21","constitution":"20-21","hitDice":"19d8-33d8","slam":"1d8","bite":"2d8","claw":"2d6","gore":"2d6"},{"size":"Medium","strength":"34-35","dexterity":"18-19","constitution":"24-25","hitDice":"27d8-38d8","slam":"2d6","bite":"4d6","claw":"2d8","gore":"2d8"},{"size":"Large","strength":"42-43","dexterity":"16-17","constitution":"28-29","hitDice":"36d8-50d8+","slam":"2d8","bite":"4d8","claw":"4d6","gore":"4d6"},{"size":"Huge","strength":"50-51","dexterity":"14-15","constitution":"32-33","hitDice":"47d8-58d8+","slam":"4d6","bite":"8d6","claw":"4d8","gore":"4d8"},{"size":"Gargantuan","strength":"58-59","dexterity":"12-13","constitution":"36-37","hitDice":"56d8-70d8+","slam":"4d8","bite":"8d8","claw":"8d6","gore":"8d6"},{"size":"Colossal","strength":"66-67","dexterity":"10-11","constitution":"40-41","hitDice":"71d8+","slam":"8d6","bite":"16d6","claw":"8d8","gore":"8d8"}]}')
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
