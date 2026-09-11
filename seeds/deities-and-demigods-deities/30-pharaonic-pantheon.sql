-- Deities and Demigods: Pharaonic pantheon identity, theology, cosmology, cleric options, and recommendation tables.
-- Source: Deities and Demigods (2002), Chapter 5, pp. 135-138, Tables 5-1 through 5-3.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0',
        'Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL);

WITH desired(id,slug,name,alignment,portfolio,rank_band,domains,favored_weapon) AS (VALUES
  ('dd-deity-re-horakhty','re-horakhty','Re-Horakhty','LG','Nobility, sun, supreme, vengeance','greater','Glory, Good, Law, Nobility, Sun, War','Khopesh'),
  ('dd-deity-anubis','anubis','Anubis','LN','Judgment, death','lesser','Law, Magic, Repose','Mace'),
  ('dd-deity-apep','apep','Apep','NE','Evil, fire, serpents','demigod','Evil, Fire, Scalykind','Heavy pick'),
  ('dd-deity-bast','bast','Bast','CG','Cats, vengeance','lesser','Chaos, Destruction, Protection, Strength, War','Tiger claws'),
  ('dd-deity-bes','bes','Bes','CN','Luck, music, protection','lesser','Luck, Protection, Trickery','Short sword'),
  ('dd-deity-hathor','hathor','Hathor','NG','Love, music, dance, moon, fate, motherhood','lesser','Community, Good, Luck','Longsword'),
  ('dd-deity-imhotep','imhotep','Imhotep','NG','Crafts, medicine','demigod','Artifice, Healing, Knowledge','Quarterstaff'),
  ('dd-deity-isis','isis','Isis','NG','Fertility, magic, marriage','greater','Good, Magic, Protection, Water','Quarterstaff'),
  ('dd-deity-nephthys','nephthys','Nephthys','CG','Death, grief','intermediate','Chaos, Good, Protection, Repose','Mace'),
  ('dd-deity-osiris','osiris','Osiris','LG','Harvest, nature, underworld','greater','Air, Earth, Good, Law, Plant, Repose','Flail'),
  ('dd-deity-ptah','ptah','Ptah','LN','Crafts, knowledge, secrets, travel','intermediate','Creation, Knowledge, Law, Travel','Mace'),
  ('dd-deity-set','set','Set','CE','Darkness, evil, night, desert storms, drought','greater','Air, Chaos, Darkness, Destruction, Evil, Strength','Spear'),
  ('dd-deity-sobek','sobek','Sobek','LE','Water, river hazards, crocodiles, wetlands','demigod','Animal, Evil, Water','Shortspear'),
  ('dd-deity-thoth','thoth','Thoth','N','Knowledge, wisdom, learning','intermediate','Knowledge, Magic, Rune','Quarterstaff')
)
INSERT INTO dnd35_deities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,alignment,portfolio,symbol)
SELECT d.id,'dd-3.0','137',d.slug,d.name,
       d.name||' is a '||d.rank_band||' deity of the Pharaonic pantheon whose portfolio is '||d.portfolio||'.',
       'Pantheon: Pharaonic. Divine status: '||d.rank_band||'. Domains: '||d.domains||'. Favored weapon: '||d.favored_weapon||'.',
       0,NULL,1,d.alignment,d.portfolio,NULL
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_deities x WHERE x.slug=d.slug AND x.owner_user_id IS NULL
);

WITH desired(deity_slug,domain_slug) AS (VALUES
 ('re-horakhty','glory'),('re-horakhty','good'),('re-horakhty','law'),('re-horakhty','nobility'),('re-horakhty','sun'),('re-horakhty','war'),
 ('anubis','law'),('anubis','magic'),('anubis','repose'),
 ('apep','evil'),('apep','fire'),('apep','scalykind'),
 ('bast','chaos'),('bast','destruction'),('bast','protection'),('bast','strength'),('bast','war'),
 ('bes','luck'),('bes','protection'),('bes','trickery'),
 ('hathor','community'),('hathor','good'),('hathor','luck'),
 ('imhotep','artifice'),('imhotep','healing'),('imhotep','knowledge'),
 ('isis','good'),('isis','magic'),('isis','protection'),('isis','water'),
 ('nephthys','chaos'),('nephthys','good'),('nephthys','protection'),('nephthys','repose'),
 ('osiris','air'),('osiris','earth'),('osiris','good'),('osiris','law'),('osiris','plant'),('osiris','repose'),
 ('ptah','creation'),('ptah','knowledge'),('ptah','law'),('ptah','travel'),
 ('set','air'),('set','chaos'),('set','darkness'),('set','destruction'),('set','evil'),('set','strength'),
 ('sobek','animal'),('sobek','evil'),('sobek','water'),
 ('thoth','knowledge'),('thoth','magic'),('thoth','rune')
)
INSERT OR IGNORE INTO dnd35_deity_domains (deity_id,domain_id)
SELECT deity.id,domain.id
FROM desired d
JOIN dnd35_deities deity ON deity.slug=d.deity_slug AND deity.owner_user_id IS NULL
JOIN dnd35_domains domain ON domain.slug=d.domain_slug AND domain.owner_user_id IS NULL;

WITH desired(slug,name,page,description,rules_text,kind,tags,mechanics) AS (VALUES
('dd-pharaonic-pantheon','The Pharaonic Pantheon','135-138',
 'A tight pantheon descended principally from Re and unified by Ma’at, with Re-Horakhty as its present ruler.',
 'The Pharaonic pantheon is a tight pantheon. Re is the primordial ancestor; Re-Horakhty, formerly Horus, rules the current pantheon after absorbing Re’s divine essence. Most members uphold Ma’at, while Apep, Set, and Sobek are explicit aberrant exceptions.',
 'pantheon-catalog',
 '["deities-and-demigods","pantheon","pharaonic","maat","tuat"]',
 '{"pantheonSlug":"pharaonic","type":"tight","leader":"re-horakhty","allDeities":["re-horakhty","anubis","apep","bast","bes","hathor","imhotep","isis","nephthys","osiris","ptah","set","sobek","thoth"],"maatAberrantDeities":["apep","set","sobek"],"theology":{"primordialAncestor":"Re","genealogy":{"Re":["Shu","Tefnut"],"ShuAndTefnut":["Geb","Nut"],"GebAndNut":["Isis","Nephthys","Osiris","Set"],"OsirisAndIsis":["Horus / Re-Horakhty"],"OsirisAndNephthys":["Anubis"],"SetAndNephthys":["Sobek"],"ReHorakhtyParthenogenesis":["Hathor","Bast"],"HathorSpouse":"Bes","BastSpouse":"Ptah"},"outsidersToFamily":{"imhotep":"mortal who ascended","thoth":"born from primordial chaos or possibly son of Re","apep":"primordial evil that may predate Re''s creation"},"remoteOlderGeneration":["Shu","Tefnut","Geb","Nut"],"remoteOlderGenerationHasStatBlocks":false},"cosmology":{"collectiveOtherworld":"Tuat","tuatComposition":"Solar Barge/daylight route, Offering Fields, and Twelve Hours of Night are perceived as one otherworld but are distinct Outer Planes.","SolarBarge":{"type":"tiny Outer Plane","alignment":"mildly good","divinelyMorphic":true,"minorPositiveDominance":true,"route":"Astral sky by day; Twelve Hours of Night by night","ruler":"re-horakhty","dawnConflict":"Bast fights Apep so the Solar Barge can escape the underworld."},"OfferingFields":{"name":"Seket-Hetep","alignment":"mildly good","divinelyMorphic":true,"role":"eternal reward for righteous souls","regions":["Seven Halls","Pillars of the West","Fourteen States","Fair Ament","Hall of Truth"],"majorResidents":["anubis","hathor","isis","nephthys","osiris","thoth"],"soulJudgment":"Anubis guides souls to the Hall of Truth, where they are weighed against the Feather of Ma’at; virtuous souls receive reward and condemned souls are consumed by Am-mit."},"TwelveHoursOfNight":{"alignment":"mildly evil","divinelyMorphic":true,"minorNegativeDominance":true,"role":"nightly underworld route of the Solar Barge and home to demons, serpentine monsters, and many improperly buried souls","masterOfEvils":"set","apepRole":"challenges the Solar Barge each morning"},"transitivePlanes":{"Ethereal":"coexists with Material normally","Astral":"route of Solar Barge and connects to Offering Fields and Twelve Hours of Night","Shadow":"connects only to Twelve Hours of Night"}}}'),

('dd-pharaonic-maat','Ma’at','137-138',
 'The principle of truth, justice, law, and order that binds the orthodox Pharaonic pantheon and governs judgment of the dead.',
 'Ma’at is the fundamental order of the universe. All Pharaonic deities except Apep, Set, and Sobek praise and uphold it. The dead are weighed against its feather; just souls are rewarded in the Offering Fields and those who fail judgment are consumed by Am-mit.',
 'religious-principle',
 '["deities-and-demigods","pharaonic","maat","afterlife","judgment"]',
 '{"pantheonSlug":"pharaonic","principle":"Ma’at","aspects":["truth","justice","law","order"],"orthodoxDeitiesUphold":true,"exceptions":["apep","set","sobek"],"judgmentOfDead":{"guide":"anubis","location":"Hall of Truth","test":"soul weighed against the Feather of Ma’at","success":"recognized as just and honorable and rewarded in the Offering Fields","failure":"consumed by Am-mit"},"socialRole":{"judges":"invoke Ma’at for impartial justice","rulers":"expected to govern according to Ma’at, often advised by clerics"}}'),

('dd-pharaonic-pantheon-cleric-options','Pharaonic Pantheon Cleric Options','137',
 'Rules for clerics who select the whole Pharaonic pantheon rather than one deity, including the orthodox alignment restriction and the aberrant evil cults.',
 'Whole-pantheon clerics may be any nonevil alignment and choose from the listed domains and favored weapons. Evil clerics instead worship Apep, Set, or Sobek and are not welcome in the other temples.',
 'pantheon-cleric-options',
 '["deities-and-demigods","pharaonic","pantheon","cleric-options"]',
 '{"pantheonSlug":"pharaonic","wholePantheonPatronAllowed":true,"usualPractice":"Clerics are usually deity-specific; noncleric believers usually revere the pantheon as a whole.","clericAlignment":"any nonevil","domains":["Air","Artifice","Chaos","Community","Creation","Destruction","Earth","Glory","Good","Healing","Knowledge","Law","Luck","Magic","Nobility","Plant","Protection","Repose","Rune","Strength","Sun","Travel","Trickery","War","Water"],"favoredWeapons":["flail","heavy pick","khopesh","longsword","mace","quarterstaff","short sword","spear","tiger claws"],"evilClericPatrons":["apep","set","sobek"],"evilClericsWelcomeInOrthodoxTemples":false,"raceRecommendations":{"human":"by class and alignment","dwarf":["osiris","ptah","or by class and alignment"],"elf":["bast","nephthys","or by class and alignment"],"gnome":["bes","hathor","thoth","or by class and alignment"],"half-elf":["bast","nephthys","or by class and alignment"],"half-orc":["bast","set","or by class and alignment"],"halfling":["bast","bes","hathor","or by class and alignment"]},"classRecommendations":{"bard":["bes (CN)","hathor (NG)","isis (NG)","thoth (N)"],"barbarian":["apep (NE)","bast (CG)"],"cleric":"any","druid":["apep (NE)","isis (NG)","ptah (LN)","sobek (LE)"],"fighter":["bast (CG)","re-horakhty (LG)","set (CE)"],"monk":["anubis (LN)","osiris (LG)","ptah (LN)","re-horakhty (LG)","sobek (LE)"],"paladin":["osiris (LG)","re-horakhty (LG)"],"ranger":["apep (NE)","bast (CG)","isis (NG)","nephthys (CG)","osiris (LG)","sobek (LE)"],"rogue":["apep (NE)","bast (CG)","bes (CN)","set (CE)"],"sorcerer":["isis (NG)","ptah (LN)","thoth (N)","set (CE)"],"wizard":["imhotep (NG)","isis (NG)","ptah (LN)","thoth (N)","set (CE)"],"illusionist":["bast (CG)","bes (CN)"],"necromancer":["anubis (LN)","nephthys (CG)","osiris (LG)","set (CE)"]}}'),

('dd-osirian-triad','The Osirian Triad','137',
 'A focused Pharaonic cult venerating Osiris, Isis, and their son Re-Horakhty as a triad.',
 'A cleric may serve the Osirian triad instead of the whole pantheon. Such clerics must be good, choose domains from the triad list, and choose khopesh, flail, or quarterstaff as favored weapon.',
 'pantheon-subcult',
 '["deities-and-demigods","pharaonic","osirian-triad","osiris","isis","re-horakhty"]',
 '{"pantheonSlug":"pharaonic","cult":"Osirian Triad","members":["osiris","isis","re-horakhty"],"clericAlignment":"good","normalizedDomains":["Air","Earth","Glory","Good","Law","Magic","Nobility","Plant","Protection","Repose","Sun","War","Water"],"sourcePrintedDomains":["Air","Earth","Law","Glory","Good","Law","Magic","Nobility","Plant","Protection","Repose","Sun","War","Water"],"favoredWeapons":["khopesh","flail","quarterstaff"],"sourceNote":"The printed domain list contains Law twice. The source sequence is retained while normalizedDomains removes the duplicate for rules-engine use."}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dd-rule-'||d.slug,'dd-3.0',d.page,d.slug,d.name,d.description,d.rules_text,
  0,NULL,1,'religion',d.kind,0,1,
  CASE WHEN d.slug='dd-pharaonic-pantheon' THEN NULL ELSE 'dd-pharaonic-pantheon' END,
  NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
