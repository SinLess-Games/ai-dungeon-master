-- Epic Level Handbook: selected Running an Epic Game mechanics.
-- Source: Epic Level Handbook, Chapter 3. Mechanical text is summarized; source pages remain authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(slug,name,page,category,kind,summary,tags,mechanics) AS (VALUES
('elh-epic-dungeon-walls','Epic Dungeon Walls','105','epic-dungeon','table',
 'Epic dungeons can use ordinary walls plus mithral, adamantine, force, and magically reinforced construction. Table 3-1 gives thickness, break DC, hardness, hit points per 10-foot square, and Climb DC.',
 '["epic","dungeon","wall","hardness","break-dc","climb"]',
 '{"hitPointSection":"10-ft-by-10-ft","walls":[{"type":"paper","thickness":"paper-thin","breakDc":1,"hardness":null,"hitPoints":1,"climbDc":30},{"type":"wood","thickness":"6 in.","breakDc":20,"hardness":5,"hitPoints":60,"climbDc":21},{"type":"masonry","thickness":"1 ft.","breakDc":35,"hardness":8,"hitPoints":90,"climbDc":15},{"type":"masonry, superior","thickness":"1 ft.","breakDc":35,"hardness":8,"hitPoints":90,"climbDc":20},{"type":"masonry, reinforced","thickness":"1 ft.","breakDc":45,"hardness":8,"hitPoints":150,"climbDc":15},{"type":"stone, hewn","thickness":"3 ft.","breakDc":50,"hardness":8,"hitPoints":540,"climbDc":22},{"type":"stone, unworked","thickness":"5 ft.","breakDc":65,"hardness":8,"hitPoints":900,"climbDc":20},{"type":"iron","thickness":"3 in.","breakDc":30,"hardness":10,"hitPoints":90,"climbDc":25},{"type":"mithral","thickness":"3 in.","breakDc":46,"hardness":15,"hitPoints":90,"climbDc":70},{"type":"adamantine","thickness":"3 in.","breakDc":66,"hardness":20,"hitPoints":120,"climbDc":70},{"type":"wall of force","thickness":"1 in.","breakDc":null,"hardness":null,"hitPoints":null,"climbDc":70},{"type":"wall of ice","thickness":"1 in./level","breakDc":"15 + 1 per inch","hardness":0,"hitPoints":"3 per inch","climbDc":25},{"type":"wall of iron","thickness":"1 in./4 levels","breakDc":"25 + 2 per inch","hardness":10,"hitPoints":"30 per inch","climbDc":25},{"type":"wall of stone","thickness":"1 in./4 levels","breakDc":"20 + 2 per inch","hardness":8,"hitPoints":"15 per inch","climbDc":22}],"magicallyTreatedModifier":{"breakDc":20,"hardnessMultiplier":2,"hitPointMultiplier":2,"minimumHitPoints":50,"canApplyToOtherWallTypes":true}}'),

('elh-epic-encounter-numbers','Epic Encounter Numbers','119-120','encounters','table',
 'Table 3-8 extends the encounter-building relationship between party level, creature Challenge Rating, and creature count into epic play.',
 '["epic","encounter","challenge-rating","encounter-level","party-level"]',
 '{"pattern":{"oneCreatureCr":["partyLevel-1","partyLevel","partyLevel+1"],"twoCreaturesCr":"partyLevel-2","threeCreaturesCr":"partyLevel-3","fourCreaturesCr":"partyLevel-4","fiveOrSixCreaturesCr":"partyLevel-5","sevenToNineCreaturesCr":"partyLevel-6","tenToTwelveCreaturesCr":"partyLevel-7","pairCr":"partyLevel-2","mixedPairCr":["partyLevel-1","partyLevel-3"]},"printedRows":[{"partyLevel":21,"one":[20,21,22],"two":19,"three":18,"four":17,"fiveOrSix":16,"sevenToNine":15,"tenToTwelve":14,"pair":19,"mixedPair":[20,18]},{"partyLevel":22,"one":[21,22,23],"two":20,"three":19,"four":18,"fiveOrSix":17,"sevenToNine":16,"tenToTwelve":15,"pair":20,"mixedPair":[21,19]},{"partyLevel":23,"one":[22,23,24],"two":21,"three":20,"four":19,"fiveOrSix":18,"sevenToNine":17,"tenToTwelve":16,"pair":21,"mixedPair":[22,20]},{"partyLevel":24,"one":[23,24,25],"two":22,"three":21,"four":20,"fiveOrSix":19,"sevenToNine":18,"tenToTwelve":17,"pair":22,"mixedPair":[23,21]},{"partyLevel":25,"one":[24,25,26],"two":23,"three":22,"four":21,"fiveOrSix":20,"sevenToNine":19,"tenToTwelve":18,"pair":23,"mixedPair":[24,22]},{"partyLevel":26,"one":[25,26,27],"two":24,"three":23,"four":22,"fiveOrSix":21,"sevenToNine":20,"tenToTwelve":19,"pair":24,"mixedPair":[25,23]},{"partyLevel":27,"one":[26,27,28],"two":25,"three":24,"four":23,"fiveOrSix":22,"sevenToNine":21,"tenToTwelve":20,"pair":25,"mixedPair":[26,24]},{"partyLevel":28,"one":[27,28,29],"two":26,"three":25,"four":24,"fiveOrSix":23,"sevenToNine":22,"tenToTwelve":21,"pair":26,"mixedPair":[27,25]},{"partyLevel":29,"one":[28,29,30],"two":27,"three":26,"four":25,"fiveOrSix":24,"sevenToNine":23,"tenToTwelve":22,"pair":27,"mixedPair":[28,26]},{"partyLevel":30,"one":[29,30,31],"two":28,"three":27,"four":26,"fiveOrSix":25,"sevenToNine":24,"tenToTwelve":23,"pair":28,"mixedPair":[29,27]},{"partyLevel":40,"one":[39,40,41],"two":38,"three":37,"four":36,"fiveOrSix":35,"sevenToNine":34,"tenToTwelve":33,"pair":38,"mixedPair":[39,37]}]}'),

('elh-epic-experience-awards','Epic Experience Awards','119-120','experience','rule',
 'Use the monster Challenge Rating, adjusted when appropriate for encounter difficulty, and the average party level to determine the XP value. The book supplies Table 3-9 for party levels 21-40 and CR 14-40 and directs the same progression to continue beyond the printed range.',
 '["epic","experience","challenge-rating","party-level","no-level-cap"]',
 '{"inputs":["monster challenge rating","average party level"],"printedPartyLevelRange":[21,40],"printedChallengeRatingRange":[14,40],"patternsContinueBeyondPrintedRange":true,"storyAwardsVariantAllowed":true,"guidance":"Use story awards only when the group is comfortable with that Dungeon Masters Guide variant."}'),

('elh-epic-treasure-values','Epic Treasure Values Per Encounter','121-122','treasure','table',
 'Epic encounter treasure rises more slowly than nonepic treasure. Table 3-10 gives average treasure values for encounter levels 21 through 40 and advises keeping long-run averages near those values.',
 '["epic","treasure","encounter-level","wealth"]',
 '{"averageTreasureGpByEncounterLevel":{"21":87000,"22":96000,"23":106000,"24":116000,"25":128000,"26":141000,"27":155000,"28":170000,"29":187000,"30":206000,"31":227000,"32":249000,"33":274000,"34":302000,"35":332000,"36":365000,"37":401000,"38":442000,"39":486000,"40":534000},"longRunGuidance":"Keep average encounter treasure near the table unless deliberately adjusting campaign wealth.","growthRateApproximatePercentPerEncounterLevel":10,"comparison":"Nonepic treasure generally rose roughly 30% per Encounter Level; epic treasure growth intentionally slows."}'),

('elh-epic-alternative-treasures','Alternative Epic Treasures','121-122','treasure','guidance',
 'Epic rewards need not be ordinary portable wealth. The book recommends campaign-scale rewards while warning that artifacts should not be random hoard contents.',
 '["epic","treasure","artifact","divine-favor","stronghold","ascension"]',
 '{"examples":["land","strongholds","titles of nobility","reputation","artifacts","divine favors","newly granted powers","a post in a deity power structure","a demiplane","a plane","divine ascension","epics and legends told about the characters"],"artifactGuidance":"Artifacts can be goals or deliberate rewards but should not normally appear as random treasure."}')
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
