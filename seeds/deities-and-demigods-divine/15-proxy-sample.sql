-- Deities and Demigods: printed sample divine proxy.
-- Source: Deities and Demigods (2002), pp. 54-55.
-- The sample has no Challenge Rating, so it is stored as a structured rule/stat block rather than fabricated as a monster row.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES
  ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0','Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL),
  ('dd-3.5-update','deities-and-demigods-3-5-update','Deities and Demigods - D&D v.3.5 Accessory Update','DD 3.5 Update','Wizards of the Coast','dnd','3.5','Official revision notes that update Deities and Demigods to the revised 3.5 core rules. These rows supersede conflicting 3.0 mechanics from the book.',NULL,1,0,NULL);

WITH desired(slug,name,page,description,mechanics) AS (VALUES
('dd-sample-proxy-hodge-guiley','Hodge Guiley, Sample Proxy of Heironeous','54-55',
 'The printed example of a mortal servant invested with one divine rank as a proxy of Heironeous. The source supplies a full abbreviated stat block but no Challenge Rating.',
 '{"name":"Hodge Guiley","role":"sample proxy of Heironeous","patronDeitySlug":"heironeous","sourceEdition":"3.0","divineRank":1,"sex":"male","alignment":"LG","classes":[{"class":"Paladin","level":20}],"creature":{"type":"Humanoid","size":"Medium","hitDice":"20d10+40","hitPoints":240,"initiative":4,"speedFeet":120,"armorClass":{"total":28,"touch":11,"flatFooted":28}},"attacks":{"longsword":"+24/+19/+14/+9 melee; 1d8+8 plus 1d6 electricity/17-20; +3 ghost touch shock longsword","shieldBash":"+16 melee; 1d8; animated bashing large shield"},"saves":{"fort":18,"ref":10,"will":12},"abilities":{"str":16,"dex":10,"con":14,"int":8,"wis":15,"cha":14},"skills":{"Concentration":10,"Diplomacy":10,"Handle Animal":10,"Heal":10,"Knowledge (religion)":5,"Ride (horse)":10},"feats":["Cleave","Great Cleave","Improved Critical (longsword)","Improved Initiative","Power Attack","Sunder","Weapon Focus (longsword)","Weapon Specialization (longsword)"],"specialAttacks":{"smiteEvil":{"printedUsesPerDay":1,"attackBonus":2,"extraDamage":20},"turnUndead":{"usesPerDay":5,"effectiveClericLevel":18}},"specialQualities":{"printedDamageReduction":"36/+4","printedFireResistance":20,"printedColdResistance":20,"electricityImmunity":true,"spellResistance":33,"divineAura":{"radiusFeet":10,"dc":13},"salientDivineAbility":"Gift of Life","auraOfCourage":true,"detectEvilAtWill":true,"divineGrace":true,"divineHealth":true,"layOnHandsHitPointsPerDay":40,"removeDiseasePerWeek":6,"immortal":true,"naturalOneNotAutomaticFailure":true,"personalSensesMiles":1,"remoteSensing":{"radiusMiles":1,"focuses":["Heironeous worshipers","Heironeous holy sites","Heironeous sacred objects","places where Heironeous name or titles were spoken recently"],"remoteLocations":2},"blockSensing":"Can block rank-0 divine sensing under the rank-1 proxy package.","portfolio":"justice","automaticPortfolioActions":{"maximumDc":15,"freeActionsPerRound":2},"createMagicItems":"minor magic items related to justice","portfolioSense":"as inherited from Heironeous under the proxy rules"},"spellcasting":{"paladinSpellsPerDay":"4/4/3/3","baseDc":"12 + spell level"},"possessions":["+4 ghost touch invulnerability full plate","+5 animated bashing large steel shield","+3 ghost touch shock longsword","boots of striding and springing","cloak of resistance +1"],"proxyRules":{"investedRanks":1,"patronRankCost":1,"gainsPatronSalientAbilities":true,"gainsRank1DemigodPowers":true,"prerequisitesStillApply":true},"sourceNotes":{"challengeRating":"not printed; intentionally not inferred","printedEnergyDefenseAnomaly":"The abbreviated sample prints fire and cold resistance 20 plus electricity immunity instead of reproducing every generic rank-1 deity defense line."},"revision3_5":{"damageReduction":"15/epic","fireResistance":6,"paladin":{"smiteEvilUsesPerDay":5,"specialMount":"summoned special mount rather than continuously present"},"policy":"Apply the official revised divine framework and Paladin 20 class changes when running this sample in 3.5, while preserving the printed 3.0 block above as source data."}}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dd-rule-'||d.slug,'dd-3.0',d.page,d.slug,d.name,d.description,
       'Use the mechanics payload for the printed Hodge Guiley proxy block. No Challenge Rating is assigned because Deities and Demigods does not print one for this sample.',
       0,NULL,1,'divine-minion','statblock',0,1,'dd-proxies',NULL,
       '["deities-and-demigods","proxy","divine-minion","heironeous","sample-statblock","source-fidelity"]',d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
