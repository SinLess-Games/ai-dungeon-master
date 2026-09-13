-- Deities and Demigods Appendix 1: structured domain spell lists.
-- Source: Deities and Demigods (2002), pp. 213-215, plus the official D&D v.3.5 Accessory Update.
-- The current schema has domain identities/granted powers but no domain-to-spell join table.
-- Preserve these source spell progressions as dnd35_rules mechanics instead of inventing a schema migration.
-- printed3_0 always preserves the book as printed; effective3_5 applies only explicit official revision deltas.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES
  ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0','Deities and Demigods (2002).',NULL,1,0,NULL),
  ('dd-3.5-update','deities-and-demigods-3-5-update','Deities and Demigods - D&D v.3.5 Accessory Update','DD 3.5 Update','Wizards of the Coast','dnd','3.5','Official revision notes that update Deities and Demigods to the revised 3.5 core rules.',NULL,1,0,NULL);

WITH desired(slug,name,page,domain_slug,mechanics) AS (VALUES
('dd-domain-spell-list-artifice','Artifice Domain Spell List','213','artifice',
 '{"domainSlug":"artifice","printed3_0":{"1":"animate rope","2":"wood shape","3":"stone shape","4":"minor creation","5":"fabricate","6":"major creation","7":"hardening","8":"true creation","9":"prismatic sphere"},"revision3_5":{"changes":[]},"effective3_5":{"1":"animate rope","2":"wood shape","3":"stone shape","4":"minor creation","5":"fabricate","6":"major creation","7":"hardening","8":"true creation","9":"prismatic sphere"}}'),

('dd-domain-spell-list-charm','Charm Domain Spell List','213','charm',
 '{"domainSlug":"charm","printed3_0":{"1":"charm person","2":"calm emotions","3":"suggestion","4":"emotion","5":"charm monster","6":"geas/quest","7":"insanity","8":"demand","9":"dominate monster"},"revision3_5":{"changes":[{"level":4,"from":"emotion","to":"heroism","authority":"official Deities and Demigods 3.5 update"}]},"effective3_5":{"1":"charm person","2":"calm emotions","3":"suggestion","4":"heroism","5":"charm monster","6":"geas/quest","7":"insanity","8":"demand","9":"dominate monster"}}'),

('dd-domain-spell-list-community','Community Domain Spell List','213','community',
 '{"domainSlug":"community","printed3_0":{"1":"bless","2":"shield other","3":"prayer","4":"status","5":"Rary''s telepathic bond","6":"heroes'' feast","7":"refuge","8":"mass heal","9":"miracle"},"revision3_5":{"changes":[{"level":2,"from":"shield other","to":"status"},{"level":4,"from":"status","to":"status, greater"},{"level":8,"from":"mass heal","to":"sympathy"},{"level":9,"from":"miracle","to":"mass heal"}],"greaterStatusSource":"dd-3.5-update"},"effective3_5":{"1":"bless","2":"status","3":"prayer","4":"status, greater","5":"Rary''s telepathic bond","6":"heroes'' feast","7":"refuge","8":"sympathy","9":"mass heal"}}'),

('dd-domain-spell-list-creation','Creation Domain Spell List','213','creation',
 '{"domainSlug":"creation","printed3_0":{"1":"create water","2":"minor image","3":"create food and water","4":"minor creation","5":"major creation","6":"heroes'' feast","7":"permanent image","8":"true creation","9":"genesis"},"revision3_5":{"changes":[]},"effective3_5":{"1":"create water","2":"minor image","3":"create food and water","4":"minor creation","5":"major creation","6":"heroes'' feast","7":"permanent image","8":"true creation","9":"genesis"}}'),

('dd-domain-spell-list-darkness','Darkness Domain Spell List','213','darkness',
 '{"domainSlug":"darkness","printed3_0":{"1":"obscuring mist","2":"blindness","3":"blacklight","4":"armor of darkness","5":"summon monster V","6":"prying eyes","7":"nightmare","8":"power word blind","9":"power word kill"},"specialRestrictions":{"5":"Summon monster V summons only 1d3 shadows."},"revision3_5":{"changes":[]},"effective3_5":{"1":"obscuring mist","2":"blindness","3":"blacklight","4":"armor of darkness","5":"summon monster V","6":"prying eyes","7":"nightmare","8":"power word blind","9":"power word kill"}}'),

('dd-domain-spell-list-glory','Glory Domain Spell List','214','glory',
 '{"domainSlug":"glory","printed3_0":{"1":"disrupt undead","2":"bless weapon","3":"searing light","4":"holy smite","5":"holy sword","6":"bolt of glory","7":"sunbeam","8":"crown of glory","9":"gate"},"revision3_5":{"changes":[]},"effective3_5":{"1":"disrupt undead","2":"bless weapon","3":"searing light","4":"holy smite","5":"holy sword","6":"bolt of glory","7":"sunbeam","8":"crown of glory","9":"gate"}}'),

('dd-domain-spell-list-liberation','Liberation Domain Spell List','214','liberation',
 '{"domainSlug":"liberation","printed3_0":{"1":"remove fear","2":"remove paralysis","3":"remove curse","4":"freedom of movement","5":"break enchantment","6":"greater dispelling","7":"refuge","8":"mind blank","9":"unbinding"},"sourceDiscrepancy":"The official 3.5 update says unbinding was erroneously omitted from the book, but the supplied 2002 source PDF visibly prints Unbinding as the 9th-level Liberation spell. Preserve both facts.","revision3_5":{"changes":[{"level":6,"from":"greater dispelling","to":"greater dispel magic","type":"revised core spell name"},{"level":9,"from":"unbinding","to":"freedom","authority":"official Deities and Demigods 3.5 update"}]},"effective3_5":{"1":"remove fear","2":"remove paralysis","3":"remove curse","4":"freedom of movement","5":"break enchantment","6":"greater dispel magic","7":"refuge","8":"mind blank","9":"freedom"}}'),

('dd-domain-spell-list-madness','Madness Domain Spell List','214','madness',
 '{"domainSlug":"madness","printed3_0":{"1":"random action","2":"touch of madness","3":"rage","4":"confusion","5":"bolts of bedevilment","6":"phantasmal killer","7":"insanity","8":"maddening scream","9":"weird"},"revision3_5":{"changes":[{"level":3,"spell":"rage","instruction":"Use the revised Player''s Handbook rage spell rather than the distinct spell text printed in Deities and Demigods."}]},"effective3_5":{"1":"random action","2":"touch of madness","3":"rage (revised PHB)","4":"confusion","5":"bolts of bedevilment","6":"phantasmal killer","7":"insanity","8":"maddening scream","9":"weird"}}'),

('dd-domain-spell-list-nobility','Nobility Domain Spell List','214','nobility',
 '{"domainSlug":"nobility","printed3_0":{"1":"divine favor","2":"enthrall","3":"magic vestment","4":"discern lies","5":"greater command","6":"geas/quest","7":"repulsion","8":"demand","9":"storm of vengeance"},"revision3_5":{"changes":[]},"effective3_5":{"1":"divine favor","2":"enthrall","3":"magic vestment","4":"discern lies","5":"greater command","6":"geas/quest","7":"repulsion","8":"demand","9":"storm of vengeance"}}'),

('dd-domain-spell-list-repose','Repose Domain Spell List','214-215','repose',
 '{"domainSlug":"repose","printed3_0":{"1":"deathwatch","2":"gentle repose","3":"speak with dead","4":"death ward","5":"slay living","6":"undeath to death","7":"destruction","8":"surelife","9":"wail of the banshee"},"revision3_5":{"changes":[{"level":6,"spell":"undeath to death","instruction":"Use the revised Player''s Handbook spell of the same name rather than the Deities and Demigods spell text."}]},"effective3_5":{"1":"deathwatch","2":"gentle repose","3":"speak with dead","4":"death ward","5":"slay living","6":"undeath to death (revised PHB)","7":"destruction","8":"surelife","9":"wail of the banshee"}}'),

('dd-domain-spell-list-rune','Rune Domain Spell List','215','rune',
 '{"domainSlug":"rune","printed3_0":{"1":"erase","2":"secret page","3":"glyph of warding","4":"explosive runes","5":"lesser planar binding","6":"greater glyph of warding","7":"Drawmij''s instant summons","8":"symbol","9":"teleportation circle"},"revision3_5":{"changes":[{"level":8,"from":"symbol","to":"symbol of death","authority":"official Deities and Demigods 3.5 update"}]},"effective3_5":{"1":"erase","2":"secret page","3":"glyph of warding","4":"explosive runes","5":"lesser planar binding","6":"greater glyph of warding","7":"Drawmij''s instant summons","8":"symbol of death","9":"teleportation circle"}}'),

('dd-domain-spell-list-scalykind','Scalykind Domain Spell List','215','scalykind',
 '{"domainSlug":"scalykind","printed3_0":{"1":"magic fang","2":"animal trance","3":"greater magic fang","4":"poison","5":"animal growth","6":"eyebite","7":"creeping doom","8":"animal shapes","9":"shapechange"},"specialRestrictions":{"2":"Affects ophidian or reptilian creatures only.","5":"Affects ophidian or reptilian creatures only.","7":"Creeping doom is composed of tiny snakes.","8":"Affects ophidian or reptilian creatures only."},"revision3_5":{"changes":[]},"effective3_5":{"1":"magic fang","2":"animal trance","3":"greater magic fang","4":"poison","5":"animal growth","6":"eyebite","7":"creeping doom","8":"animal shapes","9":"shapechange"}}'),

('dd-domain-spell-list-weather','Weather Domain Spell List','215','weather',
 '{"domainSlug":"weather","printed3_0":{"1":"obscuring mist","2":"fog cloud","3":"call lightning","4":"sleet storm","5":"ice storm","6":"control winds","7":"control weather","8":"whirlwind","9":"storm of vengeance"},"revision3_5":{"changes":[{"level":5,"from":"ice storm","to":"call lightning storm","authority":"official Deities and Demigods 3.5 update"}]},"effective3_5":{"1":"obscuring mist","2":"fog cloud","3":"call lightning","4":"sleet storm","5":"call lightning storm","6":"control winds","7":"control weather","8":"whirlwind","9":"storm of vengeance"}}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dd-rule-'||d.slug,'dd-3.0',d.page,d.slug,d.name,
  'Structured spell progression for the '||d.domain_slug||' domain, preserving the printed 3.0 list and explicit official 3.5 revisions.',
  'Use printed3_0 for source-faithful 3.0 play and effective3_5 for revised 3.5 execution. Only changes explicitly supported by the official update or revised core spell naming are applied.',
  0,NULL,1,'domain','spell-list',0,1,d.domain_slug,NULL,
  '["deities-and-demigods","domain","spell-list","revision-3.5"]',d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
