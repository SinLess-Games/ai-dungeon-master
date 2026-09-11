-- Epic Level Handbook: Worm That Walks template.
-- Source: Epic Level Handbook, Chapter 5, pp. 229-230.
-- Mechanical text is summarized; source remains authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(slug,name,page,category,kind,summary,tags,mechanics) AS (VALUES
('elh-worm-that-walks-template','Worm That Walks Template','229-230','epic-monsters','template',
 'A worm that walks is an evil wizard or sorcerer whose personality survives death by transferring into the worms or maggots that consume the corpse.',
 '["epic","monster","template","worm-that-walks","ooze","arcane"]',
 '{"appliesTo":"any evil wizard or sorcerer","typeChange":"ooze","sourceSampleTypeDiscrepancy":"The sample worm that walks on p. 228 is printed as Medium-Size Aberration, while the template on p. 229 explicitly changes type to ooze. Preserve the sample as printed and use ooze for generated template creatures.","hitDice":{"die":"d8","oozeBonusHitPointsBySize":true,"mediumExampleBonusHitPoints":10},"armorClass":{"insightBonus":20},"retainsOriginalSpecialAttacks":true,"engulf":{"targetMaximumSize":"one size category larger than worm","attack":"melee touch","initialDamage":100,"damagePerRound":100,"escape":"full-round action; then may move up to half speed and do nothing else","constructsImmune":true},"spellcasting":"retains all spells available as the living character","spellLikeAbilities":{"usesPerDay":1,"abilities":["animal friendship (vermin)","animal growth (vermin)","animal messenger (vermin)","animal shapes (vermin)","animal trance (vermin)","colossal vermin","creeping doom","giant vermin","summon swarm (vermin)","summon vermin","vermin plague"],"casterLevel":20,"summonVermin":"as summon nature''s ally except summons 10 HD of vermin per spell level","colossalVermin":"as giant vermin but may increase Large to Gargantuan and Huge to Colossal"},"blindsightFeet":300,"spellResistance":"Challenge Rating + 10","frightfulPresence":{"trigger":"engulfs a victim","willDc":"10 + floor(HD/2) + Charisma modifier","success":"shaken","failureByUpTo5":"frightened","failureBy6To10":"panicked","failureBy11OrMore":"cowering","duration":"1d4 rounds","priorWitnessSaveBonus":5,"engulfedVictimSavePenalty":-5},"discorporate":{"action":"free","effect":"collapse into individual vermin","survival":"if any component vermin survive they can breed and form a new body","risks":["component vermin become ordinary vulnerable vermin","equipment may be lost"]},"saves":"same as base character","abilities":"same as base character","skills":{"sameAsBase":true,"racialBonuses":{"Hide":20,"Intuit Direction":20,"Listen":20,"Move Silently":20}},"feats":"same as base character","epicFeats":"same as base character","climateTerrain":"any","organization":"solitary, occasionally with minions or master","challengeRating":"base character CR +3","treasure":"same as character","alignment":"any evil","advancement":"by character class","burialRitual":{"tendPlot":"1 year and 1 day","rareReagentsGp":10000,"xpCost":2000,"requiredSpells":["limited wish","polymorph any object","summon swarm heightened to 7th level","sympathy"],"successChance":"1% per prepared-but-uncast arcane spell or unused spontaneous spell slot present at death","emergence":"1d4 days after successful ritual"}}')
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
