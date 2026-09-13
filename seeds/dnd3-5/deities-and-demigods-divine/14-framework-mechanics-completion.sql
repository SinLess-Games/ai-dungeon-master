-- Deities and Demigods Chapter 2: divine framework mechanics completion.
-- Source: Deities and Demigods (2002), pp. 25-31 and 54-55, plus the official 3.5 accessory update.
-- The initial framework intentionally established discoverable subsystem rows. This ordered completion
-- turns the broad summaries into executable structured mechanics while preserving printed 3.0 values
-- separately from explicit revised 3.5 deltas.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES
  ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0','Deities and Demigods (2002).',NULL,1,0,NULL),
  ('dd-3.5-update','deities-and-demigods-3-5-update','Deities and Demigods - D&D v.3.5 Accessory Update','DD 3.5 Update','Wizards of the Coast','dnd','3.5','Official revision notes that update Deities and Demigods to revised 3.5 core rules.',NULL,1,0,NULL);

-- Correct stale earned-divinity wording. The source says the requirements should vary so one class
-- does not dominate access to divinity; it does not mandate one universal repeatable test.
UPDATE dnd35_rules
SET description='Under an earned-divinity model, mortals who satisfy campaign-defined requirements automatically attain divine status. The requirements should vary so no single class dominates access to godhood.',
    rules_text='The campaign defines the deeds, achievements, quests, knowledge, or other requirements for earned divinity. Once a candidate satisfies them, ascension occurs automatically under this model. Requirements should vary rather than funneling all candidates through one class-dependent path.',
    mechanics=json_set(COALESCE(mechanics,'{}'),
      '$.requirementsShouldVary',json('true'),
      '$.avoidSingleClassDominance',json('true'),
      '$.automaticOnMeetingRequirements',json('true'))
WHERE source_id='dd-3.0' AND slug='dd-earned-divinity' AND owner_user_id IS NULL;

UPDATE dnd35_rules
SET rules_text='Rank-1+ deities sense normally to one mile per divine rank using only senses they actually possess. As a standard action they can remote-sense around worshipers, sacred sites or objects, recent invocations of their names or titles, and portfolio events. Remote sensing crosses planes and most barriers but can be blocked by Divine Shield or an equal-or-higher-rank deity.',
    mechanics='{"minimumRank":1,"normalSenseRadiusMiles":"divine rank","automaticDarkvision":false,"cannotSeeThroughSolidObjectsWithoutSpecialSense":true,"remoteSensing":{"action":"standard","radiusMiles":"divine rank","validCenters":["worshiper","holy site","sacred object or locale","location where deity name or title was spoken within the last hour","portfolio-related event"],"crossesPlanes":true,"penetratesBarriers":true,"blockedBy":["Divine Shield","sensing block created by deity of equal or higher rank"],"ignores":["misdirection","nondetection","similar anti-scrying spells"],"createsDetectableSensor":false,"simultaneousLocations":[{"minRank":1,"maxRank":5,"count":2},{"minRank":6,"maxRank":10,"count":5},{"minRank":11,"maxRank":15,"count":10},{"minRank":16,"maxRank":20,"count":20}],"persistsUntilChangedOrCenterExpires":true},"blockSensing":{"action":"standard","targets":"deities of equal or lower rank","radiusMiles":"divine rank","validCenters":["self","sacred locale","portfolio-related event"],"simultaneousRemoteLocations":2,"alsoBlocksWithinOneMileOfSelf":true,"durationHours":"divine rank"}}'
WHERE source_id='dd-3.0' AND slug='dd-divine-senses' AND owner_user_id IS NULL;

UPDATE dnd35_rules
SET rules_text='Portfolio sense gives awareness that a qualifying portfolio event is occurring and where it is, but supplies no sensory detail. A deity may then use remote sensing to perceive the event.',
    mechanics='{"bands":[{"minRank":1,"maxRank":5,"minimumPeopleAffected":1000,"pastWeeksPerRank":0,"futureWeeksPerRank":0,"presentOnly":true},{"minRank":6,"maxRank":10,"minimumPeopleAffected":500,"pastWeeksPerRank":0,"futureWeeksPerRank":0},{"minRank":11,"maxRank":15,"minimumPeopleAffected":0,"pastWeeksPerRank":1,"futureWeeksPerRank":0},{"minRank":16,"maxRank":20,"minimumPeopleAffected":0,"pastWeeksPerRank":1,"futureWeeksPerRank":1}],"informationGranted":["event is occurring or occurred","event location"],"sensoryDetailGranted":false,"mayFollowWithRemoteSensing":true,"individualDeityEntriesMayDefineMoreSpecificPortfolioTriggers":true}'
WHERE source_id='dd-3.0' AND slug='dd-portfolio-sense' AND owner_user_id IS NULL;

UPDATE dnd35_rules
SET rules_text='For an action related to the deity''s portfolio, qualifying checks can be resolved as free actions up to the rank-band DC and per-round limits. The deity still needs any required tools and materials.',
    mechanics='{"action":"free","mustRelateToPortfolio":true,"stillRequiresToolsAndMaterials":true,"bands":[{"minRank":1,"maxRank":5,"maximumDc":15,"freeActionsPerRound":2},{"minRank":6,"maxRank":10,"maximumDc":20,"freeActionsPerRound":5},{"minRank":11,"maxRank":15,"maximumDc":25,"freeActionsPerRound":10},{"minRank":16,"maxRank":20,"maximumDc":30,"freeActionsPerRound":20}]}'
WHERE source_id='dd-3.0' AND slug='dd-automatic-actions' AND owner_user_id IS NULL;

UPDATE dnd35_rules
SET description='A rank-1+ deity projects a mind-affecting extraordinary aura. Each round it may choose Daze, Fright, or Resolve, and may freely adjust the aura radius up to the maximum allowed by divine rank.',
    rules_text='Will save DC = 10 + divine rank + Charisma modifier. A successful save grants immunity to that deity''s aura for one day. Deities are immune to auras of equal-or-lower-rank deities. The deity can exempt its worshipers, creatures of its alignment, or both.',
    mechanics='{"minimumRank":1,"type":"extraordinary","mindAffecting":true,"save":{"type":"Will","dc":"10 + divine rank + Charisma modifier","successImmunityDuration":"1 day"},"deityImmunity":"immune to auras of deities of equal or lower rank","radius":{"adjustmentAction":"free","maySetToZero":true,"bands":[{"minRank":1,"maxRank":5,"maximum":"10 ft. per rank"},{"minRank":6,"maxRank":10,"maximum":"100 ft. per rank"},{"minRank":11,"maxRank":15,"maximum":"100 ft. per rank"},{"minRank":16,"maxRank":20,"maximum":"1 mile per rank"}]},"overlap":{"higherRankSuppressesLower":true,"equalRanksCoexist":true},"exemptions":{"action":"free","choices":["own worshipers","beings of deity alignment","both"],"duration":"1 day or until dismissed"},"effects":{"daze":{"effect":"Affected beings stare in fascination; they defend normally but can take no actions."},"fright":{"base":"Affected beings are shaken and take a -2 morale penalty on attack rolls, saves, and checks.","escalation":"The deity''s glance or gesture makes affected beings frightened; they flee as quickly as possible but choose their path."},"resolve":{"allies":"+4 morale bonus on attack rolls, saves, and checks","foes":"-4 morale penalty on attack rolls, saves, and checks"}},"effectSelectionAction":"free once each round","persistsWhileInsideAura":true}'
WHERE source_id='dd-3.0' AND slug='dd-divine-aura' AND owner_user_id IS NULL;

UPDATE dnd35_rules
SET rules_text='Divine immunities are rank-dependent. Unless a specific immunity says otherwise, an attacker that is a deity of equal or higher rank can bypass the general divine immunity. Energy immunity to electricity, cold, and acid is an explicit exception and applies even against higher-rank deities.',
    mechanics='{"rank0AndHigher":{"immunities":["transmutation","energy drain","ability drain","ability damage","mind-affecting effects"],"shapeChangingOwnPowersWorkNormally":true},"rank1AndHigher":{"immunities":["electricity","cold","acid","disease","poison","stunning","sleep","paralysis","death effects","disintegration"],"massiveDamageDeathImmunity":true,"energyImmunityWorksAgainstHigherRankDeity":true},"rank6AndHigher":{"immunities":["imprisonment and banishment effects"],"explicitExamples":["banishment","binding","dimensional anchor","dismissal","imprisonment","repulsion","soul bind","temporal stasis","trap the soul","turning","rebuking"]},"generalEqualOrHigherRankBypass":true,"exception":"electricity, cold, and acid immunity remains effective against higher-rank deity attackers"}'
WHERE source_id='dd-3.0' AND slug='dd-divine-immunities' AND owner_user_id IS NULL;

UPDATE dnd35_rules
SET rules_text='Spell resistance equals 32 + divine rank unless an individual stat block or salient divine ability supplies a different value.',
    mechanics='{"formula":"32 + divine rank","rank0":32,"increasedSpellResistance":"Each selection of Increased Spell Resistance is handled by that salient divine ability rather than this base formula."}'
WHERE source_id='dd-3.0' AND slug='dd-divine-spell-resistance' AND owner_user_id IS NULL;

UPDATE dnd35_rules
SET rules_text='All deities, including rank 0, are naturally immortal: they do not age and need not eat, sleep, or breathe. They cannot die of natural causes and die only under special circumstances, usually magical or physical combat. Rank-1+ deities are also immune to death from massive damage.',
    mechanics='{"minimumRank":0,"doesNotAge":true,"needsFood":false,"needsSleep":false,"needsBreathing":false,"naturalDeath":false,"canDieUnderSpecialCircumstances":true,"rank1PlusMassiveDamageDeathImmunity":true}'
WHERE source_id='dd-3.0' AND slug='dd-divine-immortality' AND owner_user_id IS NULL;

UPDATE dnd35_rules
SET rules_text='A rank-1+ deity can use any domain spell it can grant as a spell-like ability at will. Base caster level is 10 + divine rank and save DC is 10 + spell level + Charisma bonus + divine rank. Individual domain powers follow their own rules and are usable at least divine-rank times per day when normally limited to fewer uses.',
    mechanics='{"minimumRank":1,"domainSpellsAtWill":true,"casterLevel":"10 + divine rank","saveDc":"10 + spell level + positive Charisma modifier + divine rank","domainPowerUse":{"usesPerDay":"divine rank unless the power normally allows more uses","ifBasedOnClericLevelAndNoClericLevels":"effective cleric level = divine rank","ifBasedOnHalfClericLevelAndNoClericLevels":"effective half-cleric level = one-half divine rank"}}'
WHERE source_id='dd-3.0' AND slug='dd-divine-spell-like-abilities' AND owner_user_id IS NULL;

UPDATE dnd35_rules
SET description='Every rank-1+ deity has a godly realm and rank-dependent control over its environment, astral links, magic traits, terrain, portals, and—at greater rank—planar traits.',
    rules_text='Realm control depends on divine rank and whether the realm is on an Outer Plane or another plane. Environmental changes take effect over 10 minutes; major changes to astral links, planar traits, or terrain require a year and a day of sustained labor.',
    mechanics='{"minimumRank":1,"uses":["workplace","personal residence","audience chamber","retreat","fortress"],"controlRadius":[{"minRank":1,"maxRank":5,"outerPlane":"100 ft. per rank","materialOrOther":"100 ft. per rank"},{"minRank":6,"maxRank":10,"outerPlane":"1 mile","materialOrOther":"100 ft. per rank"},{"minRank":11,"maxRank":15,"outerPlane":"10 miles","materialOrOther":"100 ft. per rank"},{"minRank":16,"maxRank":20,"outerPlane":"100 miles","materialOrOther":"100 ft. per rank"}],"baselineEnvironment":{"temperature":"Any temperature normal for the plane; Material Plane range -20 F to 120 F.","scents":true,"backgroundSounds":true,"maximumSound":"No louder than about one hundred humans.","harmfulSound":false,"intelligibleSpeechMinimumRank":6},"rank1To10":{"buildingAndLandscape":"Must use own labor, magic, or divine powers."},"rank6Plus":{"controlAstralLinks":true,"maySuppressTeleportation":true,"mayDesignateAstralExceptions":true,"mayBlockOrDesignatePlanarPortals":true},"rank11Plus":{"magicTraits":{"types":["enhanced","impeded"],"maximumSpellGroups":4,"groupingExamples":["school","domain","descriptor"]},"erectBuildingsAtWill":true,"terrainAlteration":{"radiusMiles":10,"allowedTerrain":"Any terrain type found on Material Plane"}},"rank16Plus":{"mayChangeOrApplyTraits":["gravity","elemental","energy","time"],"limitedMagic":{"canApplyTo":["school","domain","spell descriptor"],"deityOwnSpellsAndSpellLikeAbilitiesExempt":true}},"environmentChange":{"action":"standard","takesEffectOver":"10 minutes"},"majorChangeLabor":{"appliesTo":["astral links","planar traits","terrain"],"duration":"1 year and 1 day","workPerDayHours":8,"mustRemainInRealm":true,"freeHoursPerDay":16,"effectBeginsAfterCompletion":true}}'
WHERE source_id='dd-3.0' AND slug='dd-divine-realms' AND owner_user_id IS NULL;

UPDATE dnd35_rules
SET description='A deity may invest one divine rank in a physically present servant, reducing its own rank by one and turning that servant into a rank-1 divine proxy carrying the patron''s salient divine abilities.',
    rules_text='Each proxy costs the patron one divine rank for as long as the investiture continues. A deity may maintain multiple proxies by sacrificing one rank for each. It can retrieve one invested rank as a standard action without the proxy being present.',
    mechanics='{"rankInvestedPerProxy":1,"patronRankReducedBy":1,"proxyMustBePhysicallyPresentForInvestiture":true,"investitureAction":"not specified by source; do not infer","proxyGains":{"divineRank":1,"rankBand":"demigod","patronSalientDivineAbilities":"all"},"prerequisiteLimits":"A proxy may be unable to use inherited powers if it lacks required ability scores, feats, or divine rank.","multipleProxiesAllowed":true,"costPerAdditionalProxyRanks":1,"retrieveRank":{"action":"standard","proxyPresenceRequired":false},"remoteRetrievalMayStrandProxy":true,"socialStatus":"For the patron''s purposes the proxy is treated as the deity; insults and attacks against the proxy are treated as insults and attacks against the patron."}'
WHERE source_id='dd-3.0' AND slug='dd-proxies' AND owner_user_id IS NULL;

UPDATE dnd35_rules
SET mechanics=json_set(COALESCE(mechanics,'{}'),
      '$.exceptionalPetitioners',json('{"retainPreviousSkills":true,"retainPreviousFeats":true,"otherwiseUseNormalPetitionerLimits":true}'),
      '$.alignment','same as native plane',
      '$.advancement','none',
      '$.genericChallengeRating',1,
      '$.genericTreasure','none')
WHERE source_id='dd-3.0' AND slug='dd-petitioners' AND owner_user_id IS NULL;

WITH desired(slug,name,page,kind,parent_slug,description,mechanics) AS (VALUES
('dd-divine-physical-characteristics','Divine Physical Characteristics','26','subsystem','dd-divine-rank',
 'Base physical and defensive rules shared by deities before individual stat-block exceptions.',
 '{"maximumHitPointsPerHitDie":true,"outsiderDefault":{"usuallyOutsiderHitDice":20,"automaticDarkvision":false},"baseSpeedFeet":{"fine":{"biped":20,"quadruped":60},"diminutive":{"biped":30,"quadruped":70},"tiny":{"biped":40,"quadruped":80},"small":{"biped":50,"quadruped":90},"medium":{"biped":60,"quadruped":100},"large":{"biped":80,"quadruped":120},"huge":{"biped":100,"quadruped":140},"gargantuan":{"biped":120,"quadruped":160},"colossal":{"biped":140,"quadruped":180}},"movementDerivations":{"burrow":"biped value regardless of form","swim":"biped value regardless of form","climb":"one-half biped value","fly":"twice quadruped value if capable of flight"},"armorClass":{"divineBonus":"divine rank","divineBonusAppliesToTouch":true,"divineBonusAppliesToIncorporealTouch":true,"twentyOutsiderHdNaturalArmor":"divine rank + 13","deflection":"positive Charisma modifier","nonOutsiderNaturalArmor":"normal natural armor + divine rank"}}'),

('dd-divine-statistical-bonuses','Divine Statistical Bonuses and Check Results','26-27','rule','dd-divine-rank',
 'Divine rank directly modifies attacks, saves, checks, and the reliability of high-rank deities.',
 '{"divineBonusEqualToRank":{"attackRolls":true,"savingThrows":true,"skillChecks":true,"abilityChecks":true,"casterLevelChecks":true,"turningChecks":true},"rank1Plus":{"natural1AttackNotAutomaticFailure":true,"natural1SaveNotAutomaticFailure":true},"lesserRank6To10":{"mayTake10OnAnyRequiredCheck":true},"intermediateRank11To15":{"requiredCheckResult":20},"greaterRank16To20":{"alwaysBestPossibleRoll":true,"appliesTo":["checks","saving throws","attack rolls","damage rolls"],"attackCriticalThreatStillRollsDie":true,"spellEffectsAutomaticallyMaximized":true,"maximizeSpellFeatUnnecessary":true}}'),

('dd-divine-domain-power-usage','Divine Domain Power Usage','27','rule','dd-divine-rank',
 'A rank-1+ deity can use any domain power it grants at least as often per day as its divine rank.',
 '{"minimumRank":1,"usesPerDay":"divine rank unless normal power permits more","higherNormalUseCountWins":true,"noClericLevels":{"clericLevelBasedPower":"effective cleric level = divine rank","halfClericLevelBasedPower":"effective cleric level contribution = one-half divine rank"}}'),

('dd-divine-grant-spells','Granting Divine Spells','28-29','rule','dd-divine-rank',
 'Deities grant divine spells and domain powers to worshipers and may selectively withhold future grants.',
 '{"automaticToPrayingMortalDivineSpellcasters":true,"typicalLists":["cleric","ranger"],"typicalMinimumDomains":3,"druidLevelsGrantDruidList":true,"paladinLevelsGrantPaladinList":true,"withholdFromSpecificMortal":{"action":"free"},"alreadyGrantedSpellRemainsUntilExpended":true}'),

('dd-divine-spontaneous-casting','Divine Spontaneous Casting','29','rule','dd-divine-rank',
 'A rank-1+ deity with levels in a divine spellcasting class can spontaneously cast any spell it can grant.',
 '{"minimumRank":1,"requiresDivineSpellcastingClassLevels":true,"conversionModel":"functions like cleric spontaneous cure conversion","eligibleReplacement":"any spell the deity can grant"}'),

('dd-divine-communication','Divine Communication','29','subsystem','dd-divine-rank',
 'Rank-1+ deities understand all languages and can speak directly to nearby beings or communicate across planes through worshipers, sacred sites, and divine likenesses.',
 '{"minimumRank":1,"languages":{"understandAny":true,"speakAny":true,"readAny":true,"includesNonverbal":true},"directSpeechRadiusMiles":"divine rank","remoteCommunication":{"initialAction":"standard","validTargets":["own worshiper","anyone within one mile per rank of dedicated site","anyone within one mile per rank of statue or other likeness"],"modes":["private telepathic message","audible voice from air, ground, or chosen object","manifestation or omen"],"cannotOriginateFrom":"object or locale dedicated to deity of equal or higher rank","crossesPlanes":true,"penetratesBarriers":true,"continuationAction":"free until ended","simultaneousLimit":"same as remote-sensing simultaneous-location limit"}}'),

('dd-divine-travel','Divine Travel','30','rule','dd-divine-rank',
 'Rank-1+ deities teleport at will and rank-6+ deities plane shift at will, subject to the source''s personal cargo limits.',
 '{"teleport":{"minimumRank":1,"printed3_0Spell":"teleport without error","effective3_5Spell":"greater teleport","casterLevel":20,"frequency":"at will","passengers":"self only","objectWeightPounds":"100 x divine rank"},"planeShift":{"minimumRank":6,"casterLevel":20,"frequency":"at will","passengers":"self only","objectWeightPounds":100,"sourceFidelity":"The printed sentence gives plane shift self plus up to 100 pounds of objects, unlike teleport''s 100 pounds per rank. Do not silently multiply plane-shift cargo by rank."},"companions":{"eligible":["familiar","personal mount","personal intelligent weapon"],"mustTouch":true,"weightCountsAgainstLimit":true}}'),

('dd-divine-special-familiar','Divine Special Familiar','30','rule','dd-divine-rank',
 'A rank-1+ sorcerer or wizard deity can temporarily treat a nearby creature of a specified kind as its special familiar without replacing its ordinary familiar.',
 '{"minimumRank":1,"requiresClassLevels":["sorcerer","wizard"],"rangeMiles":"divine rank","specifiedCreatureKindRequired":true,"simultaneousSpecialFamiliars":1,"instantSwitchAllowed":true,"newCreatureMustBeWithinRange":true,"doesNotReplaceNormalFamiliar":true,"normalFamiliarMayBeDifferentKind":true}'),

('dd-divine-damage-reduction-nonstacking','Divine and Other Damage Reduction','27','rule','dd-divine-damage-reduction',
 'Damage reduction from divine rank does not stack with damage reduction from another source such as barbarian levels; use whichever reduction is better against the attack.',
 '{"stacks":false,"resolution":"evaluate each applicable damage-reduction source independently and use the most beneficial result for that attack","exampleConcept":"A bypassed divine DR can leave a non-bypassable class DR still applicable."}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dd-rule-'||d.slug,'dd-3.0',d.page,d.slug,d.name,d.description,d.description,
  0,NULL,1,'divinity',d.kind,0,1,d.parent_slug,NULL,
  '["deities-and-demigods","divinity","chapter-2","framework","source-fidelity"]',d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
