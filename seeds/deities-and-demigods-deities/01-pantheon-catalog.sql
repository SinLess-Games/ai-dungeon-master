-- Deities and Demigods: D&D pantheon structured catalog.
-- Source: Deities and Demigods (2002), Chapter 3, pp. 57-58 and Table 3-1.
-- The current database has no first-class pantheon table, so pantheon membership/cosmology is stored as a structured rule.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0',
        'Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL);

INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dd-rule-dnd-pantheon','dd-3.0','57-58','dd-dnd-pantheon','The D&D Pantheon',
  'The core D&D pantheon is a loose collection of deities spread across the Great Wheel, with no single leader and several strong rivalries.',
  'Loose pantheon. No leader deity. The book explicitly notes the rivalries Hextor versus Heironeous and Corellon Larethian versus Gruumsh, and allows ascension to godhood; Vecna and St. Cuthbert are cited as ascended deities.',
  0,NULL,1,'religion','pantheon-catalog',0,1,'dd-loose-pantheon',NULL,
  '["deities-and-demigods","pantheon","d&d","great-wheel"]',
  '{"pantheonSlug":"dnd-pantheon","type":"loose","leader":null,"ascensionPossible":true,"members":["bahamut","boccob","corellon-larethian","ehlonna","erythnul","fharlanghn","garl-glittergold","gruumsh","heironeous","hextor","kord","kurtulmak","lolth","moradin","nerull","obad-hai","olidammara","pelor","st-cuthbert","tiamat","vecna","wee-jas","yondalla"],"explicitRivalries":[["hextor","heironeous"],["corellon-larethian","gruumsh"]],"ascendedExamples":["vecna","st-cuthbert"],"homePlanes":{"Abyss":["lolth"],"Acheron":["gruumsh","hextor","wee-jas"],"Arborea":["corellon-larethian"],"Arcadia":["st-cuthbert"],"Baator":["tiamat","kurtulmak"],"Beastlands":["ehlonna"],"Bytopia":["garl-glittergold"],"Carceri":["nerull"],"Celestia":["bahamut","heironeous","moradin","yondalla"],"Elysium":["pelor"],"Material Plane":["fharlanghn","vecna"],"Outlands":["boccob","obad-hai"],"Pandemonium":["erythnul"],"Ysgard":["kord","olidammara"]},"cosmology":"Great Wheel"}'
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug='dd-dnd-pantheon' AND r.owner_user_id IS NULL
);
