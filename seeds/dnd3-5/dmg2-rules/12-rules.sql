-- Dungeon Master's Guide II source-backed rules catalog.
-- Mechanical summaries are intentionally concise; the supplied sourcebook remains authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg2-3.5','dungeon-masters-guide-ii-3-5','Dungeon Master''s Guide II','DMG II',
        'Wizards of the Coast','dnd','3.5','D&D v.3.5 Dungeon Master''s Guide II: expanded DM procedures, encounter subsystems, campaign tools, character teamwork systems, and magic-item options.',NULL,1,0,NULL);

WITH desired(slug,name,source_page,category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,summary,tags,mechanics) AS (VALUES
  ('dmg2-campaign-begin-end','Beginning and Ending a Campaign','73','campaign','guidance',0,1,NULL,NULL,'Set expectations, establish the premise and initial situation, and plan for satisfying closure when major goals or group circumstances end the campaign.','["campaign"]','{}'),
  ('dmg2-campaign-structure','Campaign Structure','74','campaign','guidance',0,1,NULL,NULL,'A campaign can be episodic, arc-based, sandbox-like, or tightly plotted; choose a structure that matches player preferences and available preparation.','["campaign"]','{}'),
  ('dmg2-campaign-concept','Campaign Concept','76','campaign','guidance',0,1,NULL,NULL,'Define a concise central concept that guides adventure selection, setting detail, opposition, and player expectations without preventing deviation.','["campaign"]','{}'),
  ('dmg2-campaign-closure','Campaign Closure','77','campaign','guidance',0,1,NULL,NULL,'Bring major character and setting threads to resolution when ending a campaign rather than simply stopping after an arbitrary session.','["campaign"]','{}'),
  ('dmg2-starting-level','Starting Level','78','campaign','guidance',0,1,NULL,NULL,'Choose campaign starting level based on desired complexity, character competence, player experience, and intended story scope.','["campaign","character-creation"]','{}'),
  ('dmg2-race-class-requirements','Campaign Race and Class Requirements','78','campaign','guidance',1,0,NULL,NULL,'A campaign may restrict or require races/classes to reinforce a concept, but such restrictions should be explicit before character creation.','["campaign","restrictions"]','{}'),
  ('dmg2-modified-alignments','Modified Alignments','79','campaign','subsystem',1,0,NULL,NULL,'A campaign can reinterpret, constrain, or modify alignment assumptions; document mechanical consequences for classes, spells, items, and cosmology.','["alignment","campaign"]','{}'),
  ('dmg2-house-expanded-rules','House Rules and Expanded Rules','80','campaign','guidance',0,1,NULL,NULL,'Choose optional/expanded subsystems deliberately and communicate which are active; do not silently assume every supplement option is baseline.','["variants","campaign"]','{}'),
  ('dmg2-pregame','The Pregame','80','campaign','guidance',0,1,NULL,NULL,'Before play, align on premise, characters, party relationships, allowed material, tone, logistics, and table expectations.','["campaign","session-zero"]','{}'),
  ('dmg2-medieval-society','Medieval Society Framework','81','worldbuilding','guidance',0,1,NULL,NULL,'Use monarchs, lords, knights, common laborers, guilds, towns, and institutions as a flexible fantasy-social framework rather than a mandatory historical simulation.','["society","worldbuilding"]','{}'),
  ('dmg2-monarchs-lords','Monarchs and Lords','82','worldbuilding','guidance',0,1,NULL,NULL,'Political authority is layered through rulers and subordinate lords whose rights, duties, rivalries, and resources create adventure hooks.','["politics","worldbuilding"]','{}'),
  ('dmg2-knights-footmen','Knights and Footmen','84','worldbuilding','guidance',0,1,NULL,NULL,'Military obligations, retainers, and social rank can define who bears arms, who commands forces, and what service is owed.','["military","worldbuilding"]','{}'),
  ('dmg2-court','The Monarch''s Court','86','worldbuilding','guidance',0,1,NULL,NULL,'Court positions, factions, petitioners, and rivalries provide a reusable structure for political encounters and patronage.','["politics","court"]','{}'),
  ('dmg2-villages-towns-cities','Villages, Towns, and Cities','87','worldbuilding','guidance',0,1,NULL,NULL,'Settlement social and economic structures can be populated with occupations, factions, services, and local conflicts appropriate to size.','["settlements"]','{}'),
  ('dmg2-guilds-occupations','Guilds and Occupations','90','worldbuilding','subsystem',1,0,NULL,NULL,'Mercantile and nonmercantile guilds can regulate trades, training, prices, political influence, membership, and adventure opportunities.','["guilds","economy"]','{}'),
  ('dmg2-establishments','Establishments','98','worldbuilding','guidance',0,1,NULL,NULL,'Inns, eating halls, taverns, shops, and other establishments can be generated from owner, clientele, quality, prices, rumors, and local complications.','["settlements","business"]','{}'),
  ('dmg2-laws-law-rank','Law Rank','101','law','subsystem',1,0,NULL,NULL,'A community''s law rank summarizes how restrictive and vigorously enforced its laws are, guiding weapon, magic, crime, and punishment expectations.','["law","settlements"]','{}'),
  ('dmg2-justice','Administration of Justice','103','law','subsystem',1,0,NULL,NULL,'Local authorities investigate, arrest, detain, try, and punish alleged offenders according to the settlement''s institutions and law rank.','["law"]','{}'),
  ('dmg2-outlawry','Writs of Outlawry','103','law','subsystem',1,0,NULL,NULL,'A formal declaration of outlawry removes ordinary legal protection and changes how authorities and citizens can lawfully treat the named offender.','["law"]','{}'),
  ('dmg2-trial-sentence','Trial and Sentence','103','law','subsystem',1,0,NULL,NULL,'Trials and sentences depend on local law, evidence, status, and government; use them as campaign procedures rather than modern legal assumptions.','["law"]','{}'),
  ('dmg2-other-governments','Other Forms of Government','105','worldbuilding','guidance',0,1,NULL,NULL,'Settlements can use councils, theocracies, oligarchies, democracies, military governments, or other structures rather than monarchy.','["government"]','{}'),
  ('dmg2-city-building','Building a City','107','worldbuilding','procedure',1,0,NULL,NULL,'Determine geography, size, building count, districts/functions, major institutions, and details in stages instead of designing every structure individually.','["city","worldbuilding"]','{}'),
  ('dmg2-magic-events','Magic Events','109','campaign','subsystem',1,0,NULL,NULL,'A magic event is a large-scale supernatural phenomenon defined by manifestation, area, progression, effects, active phase, and a way it can stop or be stopped.','["magic","events"]','{}'),
  ('dmg2-contacts','Contacts','153','npcs','subsystem',1,0,NULL,NULL,'Contacts are recurring NPC relationships that provide information, favors, access, or services within the limits of the relationship and campaign.','["contacts","npcs"]','{}'),
  ('dmg2-gaining-contact','Gaining a Contact','153','npcs','procedure',1,0,'dmg2-contacts',NULL,'Contacts are gained through roleplaying, reputation, shared interests, obligations, or campaign rewards rather than appearing as unrestricted resources.','["contacts"]','{}'),
  ('dmg2-uses-for-contacts','Using Contacts','154','npcs','guidance',1,0,'dmg2-contacts',NULL,'A contact''s help should match their capabilities, relationship, risk, and resources; repeated demands can create costs or consequences.','["contacts"]','{}'),
  ('dmg2-hirelings','Hirelings','154','npcs','subsystem',1,0,NULL,NULL,'Hirelings provide labor or adventuring services for compensation, with availability, loyalty, risk, and expected pay depending on specialty and danger.','["hirelings"]','{}'),
  ('dmg2-specialists','Specialists','155','npcs','table',1,0,NULL,NULL,'Specialist NPCs have sample service prices and availability that can be used for skilled labor, research, transport, magic, and other expertise.','["hirelings","services"]','{}'),
  ('dmg2-unique-npc-abilities','Unique NPC Abilities','157','npcs','subsystem',1,0,NULL,NULL,'Unique abilities can make an NPC mechanically unusual; use them deliberately as bespoke traits rather than general player options.','["npcs","abilities"]','{}'),
  ('dmg2-complex-npc-stat-blocks','Complex NPCs and Stat Blocks','160','npcs','guidance',0,1,NULL,NULL,'Build important NPCs from role first, then give only the statistics, tactics, gear, and unusual abilities needed for likely interactions.','["npcs","stat-block"]','{}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dmg2-3.5-rule-' || d.slug, 'dmg2-3.5', d.source_page, d.slug, d.name, d.summary, d.summary,
  0,NULL,1,d.category,d.kind,d.is_variant,d.default_enabled,d.parent_slug,d.supersedes_slug,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r
  WHERE r.slug=d.slug AND r.owner_user_id IS NULL
);
