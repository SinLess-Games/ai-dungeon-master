-- Deities and Demigods: divine ascension and advancement.
-- Source: Appendix 2, Divine Ascension, pp. 218-223. Mechanical text is summarized; source remains authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0','Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL);

WITH desired(slug,name,page,kind,summary,tags,mechanics) AS (VALUES
('dd-divine-ascension-methods','Methods of Divine Ascension','218-221','subsystem',
 'A campaign chooses how divinity can be acquired. The book presents innate, earned, stolen, imparted, surrendered, and mixed models rather than a single mandatory ascension mechanic.',
 '["deity","divine-ascension","campaign-cosmology","divine-power"]',
 '{"campaignChoice":true,"methods":[{"method":"innate","summary":"Divinity is normally inborn; mortal ascension may be impossible, though spectacular heroic death can optionally lead to rank 0 or rank 1."},{"method":"earned","summary":"Qualified mortals can satisfy repeatable campaign-defined requirements demonstrating worthiness and ascend."},{"method":"stolen","summary":"Divine rank can have a physical or otherwise stealable manifestation; taking it can elevate the thief while reducing or dethroning its prior holder."},{"method":"imparted","summary":"Existing divine beings intentionally grant a mortal divine status, implying recognition or worthiness by the pantheon."},{"method":"surrendered","summary":"A deity can surrender divine status permanently or temporarily and may transfer it to a chosen successor."},{"method":"mixed","summary":"A campaign may combine methods; different gods can have different origins."}],"knowledgeOfMethod":"Campaign decides whether methods are common knowledge, hidden lore, or known only to deities."}'),

('dd-innate-divine-power','Innate Divine Power','218-219','guidance',
 'If gods are born divine, mortal ascension is normally impossible, though a campaign can permit extraordinary dead heroes to become quasi-deities or demigods.',
 '["deity","ascension","innate-divinity"]',
 '{"defaultMortalAscensionPossible":false,"optionalHeroicDeathAscension":{"allowed":true,"possibleRanks":[0,1]}}'),

('dd-earned-divine-power','Earned Divine Power','219-220','guidance',
 'If divinity is earned, any mortal who satisfies the campaign-defined qualifications can potentially ascend. Requirements should demonstrate faith or worthiness and be repeatable by other characters.',
 '["deity","ascension","earned-divinity","quest"]',
 '{"qualifiedMortalsCanAscend":true,"requirementsDefinedByCampaign":true,"requirementsShouldBeRepeatable":true,"requirementThemes":["faith","worthiness","miraculous acts","heroic quests"]}'),

('dd-stolen-divine-power','Stolen Divinity','220','guidance',
 'A campaign may make divine rank something that can be stolen. Taking another being’s divine token or spark can cause immediate ascension and can simultaneously strip power from the former holder.',
 '["deity","ascension","stolen-divinity","divine-spark"]',
 '{"divinePowerCanBeStealable":true,"possibleResult":{"thiefAscends":true,"previousHolderMayLoseRank":true},"campaignDecisions":["Can mortals perceive and handle divine sparks?","Can deities steal from each other?","Can one creature safely possess multiple divine sparks?","How widely known is the process?"]}'),

('dd-imparted-divine-power','Imparted Divinity','220-221','guidance',
 'Existing deities can deliberately grant divine power to a worthy mortal, often establishing the new deity as a legitimate member or servant of an existing pantheon.',
 '["deity","ascension","imparted-divinity","pantheon"]',
 '{"grantedByExistingDivinePower":true,"impliesWorthiness":true,"possibleConsequences":["new faith","holy orders founded by former mortal followers","pantheon legitimacy"]}'),

('dd-surrendered-divine-power','Surrendered Divinity','221','guidance',
 'A deity may voluntarily surrender divine status permanently or temporarily. The power can return to the cosmos, be taken up by other gods, or be handed to a chosen replacement.',
 '["deity","ascension","surrendered-divinity","succession"]',
 '{"voluntary":true,"duration":["temporary","permanent"],"destinations":["chosen successor","other deities","cosmos or unassigned pool"],"returnCanCreateConflict":true}'),

('dd-divine-advancement','Divine Advancement','222-223','subsystem',
 'Divine-rank advancement is primarily roleplayed. Starting rank and later increases depend on the campaign cosmology, the availability of divine power, and the actions or approval of existing gods.',
 '["deity","divine-rank","advancement","roleplaying"]',
 '{"primaryMethod":"roleplaying","typicalStartingRank":[0,1],"impartedOrEarnedSuggestedStartingRank":0,"limitedDivinePower":{"advancementMayRequire":"existing deity surrenders power or dies","rankTransferOptional":true,"slayingGodMayOnlyFreeRanks":true},"unlimitedDivinePower":{"advancementMayBeControlledBy":"another deity or pantheon ruler"},"defaultRankIncreasePerAdvancement":1,"exception":"Campaign may grant full predecessor rank/power when a god is slain or power is stolen."}'),

('dd-limits-on-divine-advancement','Limits on Divine Advancement','223','rule',
 'Characters normally gain one divine rank at a time unless the campaign cosmology explicitly transfers a slain or dispossessed deity’s full rank and power.',
 '["deity","divine-rank","advancement","limit"]',
 '{"defaultRankIncrease":1,"fullPowerTransferRequiresCampaignRule":true}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dd-rule-'||d.slug,'dd-3.0',d.page,d.slug,d.name,d.summary,d.summary,0,NULL,1,
       'divine-ascension',d.kind,0,1,NULL,NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
