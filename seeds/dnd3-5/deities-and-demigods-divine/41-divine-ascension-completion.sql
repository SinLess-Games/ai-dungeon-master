-- Deities and Demigods Appendix 2: Divine Ascension completion and source-fidelity corrections.
-- Source: Deities and Demigods (2002), pp. 218-223.
-- Complements 40-divine-ascension.sql with planning, eligibility, limited/unlimited divinity,
-- deicide, and portfolio-succession rules that materially affect playable ascension.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0',
        'Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL);

-- The source treats deicide as an explicit method of ascension. Add it to the previously seeded method catalog.
UPDATE dnd35_rules
SET mechanics = json_set(
  mechanics,
  '$.methods',
  json('[
    {"method":"innate","summary":"Divinity is normally inborn; mortal ascension may be impossible, though spectacular heroic death can optionally lead to rank 0 or rank 1."},
    {"method":"earned","summary":"A mortal who fulfills campaign-defined requirements automatically becomes a god; requirements should vary so one class does not dominate access to divinity."},
    {"method":"stolen","summary":"A mortal can take a deity''s divine source or spark if the campaign makes divinity stealable; the campaign decides how rank and portfolio move with it."},
    {"method":"deicide","summary":"If gods can die, defeating a deity can be an ascension route; whether the killer receives rank, merely frees rank, or inherits portfolio depends on the campaign''s divine-power rules."},
    {"method":"imparted","summary":"An existing divine authority deliberately grants godhood to a worthy mortal; in a tight pantheon this is usually controlled by the leader, while in a loose pantheon the mortal''s patron is normally the source."},
    {"method":"surrendered","summary":"A deity can voluntarily surrender divine status permanently or temporarily, including to a chosen replacement."},
    {"method":"mixed","summary":"A campaign can mix origins and ascension methods among different gods."}
  ]')
)
WHERE source_id='dd-3.0' AND slug='dd-divine-ascension-methods' AND owner_user_id IS NULL;

-- Correct an over-specific earlier summary: the source says earned-divinity requirements should vary so no class dominates;
-- it does not require one repeatable universal test.
UPDATE dnd35_rules
SET mechanics = json_set(
      json_remove(mechanics,'$.requirementsShouldBeRepeatable'),
      '$.requirementsShouldVary',json('true'),
      '$.avoidSingleClassDominance',json('true'),
      '$.automaticOnMeetingRequirements',json('true'),
      '$.knowledgeOfRequirements','May be widespread, known to high clerics, or deliberately hidden by the gods.'
    )
WHERE source_id='dd-3.0' AND slug='dd-earned-divine-power' AND owner_user_id IS NULL;

WITH desired(slug,name,page,kind,description,mechanics) AS (VALUES
('dd-planning-the-ascent','Planning the Ascent','218-219','guidance',
 'Campaign guidance for making ascension a deliberate transition rather than a surprise reward or compensation for a bad die roll.',
 '{"purposeful":true,"playerForeknowledgeRecommended":true,"playerAgencyRecommended":true,"doNotUseAsCompensationForBadLuck":true,"mixedMortalDivineParty":{"possible":true,"practicalDifficulty":"high","reason":"Divine characters can usually do mortal-character tasks more easily and with less risk."},"partyTiming":{"ideal":"Characters who will remain active together ascend at roughly the same time.","singleAspirant":"If only one player wants ascension, the book recommends retiring that character from active play after ascension and explaining this consequence in advance."},"candidateLevelGuidance":{"below15":"rarely achieve ascension","20OrHigher":"may be candidates if the campaign cosmology allows ascension"},"exception":"The source sidebar discusses ascension to rank 0 as a campaign-management option for an overpowered character; this is guidance, not a general reward mechanic."}'),

('dd-limited-unlimited-divinity-ascension','Limited and Unlimited Divinity in Ascension','219','subsystem',
 'How a finite or unlimited supply of divine power constrains mortal ascension and later divine-rank growth.',
 '{"finiteDivinePower":{"divineSparksLimited":true,"mortalAscensionMayBeLimitedToRank0":true,"higherRankMayRequireFreedOrTransferredPower":true,"existingGodDeathOrSurrenderMayFreePower":true,"unallocatedPowerMayExist":true},"unlimitedDivinePower":{"newDivinityDoesNotRequireRemovingExistingRank":true,"advancementCanStillBeControlledByPantheonAuthority":true},"campaignDecision":true,"interactionWithAdvancement":"If power is finite, decide whether a slain or surrendering deity''s exact rank transfers or merely returns ranks to an available pool."}'),

('dd-deicide-ascension','Deicide as Ascension','220','rule',
 'If deities can die, defeating a god can serve as a method of ascension, but the campaign determines what actually transfers from the slain deity.',
 '{"requiresMortalDeities":true,"ascensionPossibleBySlayingDeity":true,"rankOutcomes":["killer receives some or all divine rank","slain rank is merely freed for later allocation","killer receives no rank automatically unless cosmology says so"],"portfolioOutcomes":"Separate campaign decision; killing a deity does not inherently require inheriting its portfolio.","limitedUnlimitedDivinityInteraction":true,"sourceWarning":"If killing gods is the only route to higher divine rank, divine campaigns are likely to center heavily on deicide."}'),

('dd-portfolio-after-stolen-or-slain-divinity','Portfolio Succession After Stolen or Slain Divinity','219-220','rule',
 'Campaign rules for deciding whether portfolio elements follow stolen/slain divine power or are redistributed independently.',
 '{"automaticPortfolioInheritance":false,"campaignDecision":true,"options":[{"mode":"linked-to-divine-source","effect":"Whoever possesses the divine source also receives its associated portfolio element."},{"mode":"tight-pantheon-reversion","effect":"The victim''s portfolio may revert to the pantheon leader, who redistributes responsibilities."},{"mode":"loose-pantheon-competition","effect":"Other deities may compete to prove who should receive the vacant portfolio."},{"mode":"independent","effect":"Divine rank can transfer or be freed without forcing the killer or thief to take the former deity''s portfolio."}],"designConsequence":"Automatic inheritance can discourage characters from slaying opposed deities if they do not want those portfolios."}'),

('dd-ascension-method-knowledge','Knowledge of Ascension Methods','218-221','guidance',
 'The campaign decides how widely ascension methods and prerequisites are known, and different methods imply different levels of secrecy.',
 '{"campaignDecision":true,"innateAfterHeroicDeath":"Can be publicly known if recent examples exist.","earned":"Requirements may be known to high clerics, commonly known, or hidden by existing gods.","stolen":"Theft commonly implies secret or suppressed knowledge, especially if current gods stole their own divinity.","imparted":"Often public because existing gods control admission and may gain prestige from elevating followers, but can be secret if desired.","hiddenKnowledgeSources":["ancient texts","religious mysteries","high clergy","divine servants","gods","ancient beings"]}'),

('dd-ascension-starting-rank','Starting Divine Rank After Ascension','223','rule',
 'Starting divine rank depends on cosmology and ascension method rather than character level alone.',
 '{"generalChoices":[0,1],"earned":{"recommendedRank":0},"imparted":{"recommendedRank":0},"stolen":{"default":"Campaign may throttle the acquired power if the mortal cannot initially handle the full status.","fullPredecessorPowerOptional":true},"surrendered":{"default":"Campaign may throttle the acquired power.","fullPredecessorPowerOptional":true},"deicide":{"default":"Campaign may throttle the acquired power or merely free the slain deity''s ranks.","fullPredecessorPowerOptional":true},"fullTransferConsequence":"Granting full predecessor power is explicitly offered as a campaign choice and naturally creates adventures about learning to use that power."}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dd-rule-'||d.slug,'dd-3.0',d.page,d.slug,d.name,d.description,d.description,
  0,NULL,1,'divine-ascension',d.kind,0,1,'dd-divine-ascension-methods',NULL,
  '["deities-and-demigods","divine-ascension","campaign-cosmology","source-fidelity"]',d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);