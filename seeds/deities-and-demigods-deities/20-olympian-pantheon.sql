-- Deities and Demigods: Olympian pantheon identity and pantheon catalog.
-- Source: Deities and Demigods (2002), Chapter 4, pp. 99-100, Table 4-1.
-- Table 4-1 also lists The Academy, which has no divine rank; it is stored as a religion rule rather than a deity identity.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0',
        'Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL);

WITH desired(id,slug,name,alignment,portfolio,rank_band,domains,favored_weapon) AS (VALUES
  ('dd-deity-zeus','zeus','Zeus','CG','Sky, air, storms, fate, nobility','greater','Air, Chaos, Good, Nobility, Strength, Weather','Shortspear or halfspear'),
  ('dd-deity-aphrodite','aphrodite','Aphrodite','CG','Love, beauty','intermediate','Chaos, Charm, Good','Dagger'),
  ('dd-deity-apollo','apollo','Apollo','CG','Light, prophecy, music, healing','intermediate','Good, Healing, Knowledge, Magic, Sun','Composite longbow'),
  ('dd-deity-ares','ares','Ares','CE','War, killing, strife','intermediate','Chaos, Destruction, Evil, War','Shortspear'),
  ('dd-deity-artemis','artemis','Artemis','NG','Hunting, wild beasts, childbirth, dance','intermediate','Animal, Good, Plant, Sun','Short sword'),
  ('dd-deity-athena','athena','Athena','LG','Wisdom, crafts, civilization, war','greater','Artifice, Community, Good, Knowledge, Law, War','Shortspear'),
  ('dd-deity-demeter','demeter','Demeter','N','Agriculture','lesser','Earth, Plant, Protection','Spear'),
  ('dd-deity-dionysus','dionysus','Dionysus','CN','Mirth, madness, wine, fertility, theater','intermediate','Chaos, Destruction, Madness','Quarterstaff'),
  ('dd-deity-hades','hades','Hades','NE','Death, underworld, earth, wealth','greater','Death, Earth, Evil','Longsword'),
  ('dd-deity-hecate','hecate','Hecate','NE','Moon, magic, abundance, undead','intermediate','Creation, Evil, Knowledge, Magic','Dagger'),
  ('dd-deity-hephaestus','hephaestus','Hephaestus','NG','Smithing, crafts','intermediate','Artifice, Community, Earth, Fire, Good','Warhammer'),
  ('dd-deity-hera','hera','Hera','N','Marriage, women, intrigue','greater','Community, Nobility, Protection, Trickery','Light mace'),
  ('dd-deity-hercules','hercules','Hercules','CG','Strength, adventure','demigod','Chaos, Good, Luck, Strength','Greatclub'),
  ('dd-deity-hermes','hermes','Hermes','CG','Travel, commerce, thieves, gambling, running','intermediate','Chaos, Good, Luck, Travel, Trickery','Quarterstaff'),
  ('dd-deity-hestia','hestia','Hestia','NG','Home, hearth, family','lesser','Community, Good, Protection','Dagger'),
  ('dd-deity-nike','nike','Nike','LN','Victory','demigod','Law, Nobility, War','Light mace'),
  ('dd-deity-pan','pan','Pan','CN','Nature, passion, shepherds, mountains','lesser','Animal, Chaos, Plant','Unarmed strike'),
  ('dd-deity-poseidon','poseidon','Poseidon','CN','Sea, rivers, earthquakes','greater','Chaos, Earth, Water','Trident'),
  ('dd-deity-tyche','tyche','Tyche','N','Good fortune','lesser','Luck, Protection, Travel','Short sword')
)
INSERT INTO dnd35_deities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,alignment,portfolio,symbol)
SELECT d.id,'dd-3.0','100',d.slug,d.name,
       d.name||' is a '||d.rank_band||' deity of the Olympian pantheon whose portfolio is '||d.portfolio||'.',
       'Pantheon: Olympian. Divine status: '||d.rank_band||'. Domains: '||d.domains||'. Favored weapon: '||d.favored_weapon||'.',
       0,NULL,1,d.alignment,d.portfolio,NULL
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_deities x WHERE x.slug=d.slug AND x.owner_user_id IS NULL
);

WITH desired(deity_slug,domain_slug) AS (VALUES
 ('zeus','air'),('zeus','chaos'),('zeus','good'),('zeus','nobility'),('zeus','strength'),('zeus','weather'),
 ('aphrodite','chaos'),('aphrodite','charm'),('aphrodite','good'),
 ('apollo','good'),('apollo','healing'),('apollo','knowledge'),('apollo','magic'),('apollo','sun'),
 ('ares','chaos'),('ares','destruction'),('ares','evil'),('ares','war'),
 ('artemis','animal'),('artemis','good'),('artemis','plant'),('artemis','sun'),
 ('athena','artifice'),('athena','community'),('athena','good'),('athena','knowledge'),('athena','law'),('athena','war'),
 ('demeter','earth'),('demeter','plant'),('demeter','protection'),
 ('dionysus','chaos'),('dionysus','destruction'),('dionysus','madness'),
 ('hades','death'),('hades','earth'),('hades','evil'),
 ('hecate','creation'),('hecate','evil'),('hecate','knowledge'),('hecate','magic'),
 ('hephaestus','artifice'),('hephaestus','community'),('hephaestus','earth'),('hephaestus','fire'),('hephaestus','good'),
 ('hera','community'),('hera','nobility'),('hera','protection'),('hera','trickery'),
 ('hercules','chaos'),('hercules','good'),('hercules','luck'),('hercules','strength'),
 ('hermes','chaos'),('hermes','good'),('hermes','luck'),('hermes','travel'),('hermes','trickery'),
 ('hestia','community'),('hestia','good'),('hestia','protection'),
 ('nike','law'),('nike','nobility'),('nike','war'),
 ('pan','animal'),('pan','chaos'),('pan','plant'),
 ('poseidon','chaos'),('poseidon','earth'),('poseidon','water'),
 ('tyche','luck'),('tyche','protection'),('tyche','travel')
)
INSERT OR IGNORE INTO dnd35_deity_domains (deity_id,domain_id)
SELECT deity.id,domain.id
FROM desired d
JOIN dnd35_deities deity ON deity.slug=d.deity_slug AND deity.owner_user_id IS NULL
JOIN dnd35_domains domain ON domain.slug=d.domain_slug AND domain.owner_user_id IS NULL;

INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dd-rule-olympian-pantheon','dd-3.0','99-100','dd-olympian-pantheon','The Olympian Pantheon',
  'A tight family pantheon ruled by Zeus, centered on Olympus and supported by a distinct Olympian cosmology.',
  'The Olympian pantheon is a tight pantheon under the kingship of Zeus. Mortals are expected to revere the twelve central Olympian deities as a group, and clerics may select the entire pantheon rather than one deity as patron.',
  0,NULL,1,'religion','pantheon-catalog',0,1,NULL,NULL,
  '["deities-and-demigods","pantheon","olympian","olympus"]',
  '{"pantheonSlug":"olympian","type":"tight","leader":"zeus","allDeities":["zeus","aphrodite","apollo","ares","artemis","athena","demeter","dionysus","hades","hecate","hephaestus","hera","hercules","hermes","hestia","nike","pan","poseidon","tyche"],"twelveCentralDeities":["zeus","aphrodite","apollo","ares","artemis","athena","demeter","hephaestus","hera","hermes","hestia","poseidon"],"theology":{"generations":"Current pantheon is third/fourth divine generation after Gaea/Uranus and the Titans.","familyTies":true,"zeusKingship":true},"cosmology":{"Olympus":{"alignmentDominance":"none","minorPositiveEnergyDominance":true,"role":"home plane of nearly all Olympian deities"},"Hades":{"alignment":"mildly evil","minorNegativeEnergyDominance":true,"role":"realm of most mortal dead"},"Tartarus":{"alignment":"strongly evil","access":"through Hades only","role":"prison of the Titans"},"Elysion":{"alignment":"mildly good","role":"afterlife of certain great heroes"},"transitivePlanes":{"Ethereal":"coexists with Material","Astral":"connects only to Olympus and Elysion","Shadow":"connects only to Hades"}}}'
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug='dd-olympian-pantheon' AND r.owner_user_id IS NULL
);

INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dd-rule-olympian-academy','dd-3.0','100','dd-olympian-academy','The Academy',
  'A nondeity philosophical religious option listed alongside Olympian patrons in Table 4-1.',
  'The Academy has no divine rank. Alignment: neutral good. Domains: Good and Knowledge. Favored weapon: quarterstaff. Portfolio: good, truth, beauty.',
  0,NULL,1,'religion','nondeity-patron',0,1,'dd-olympian-pantheon',NULL,
  '["deities-and-demigods","olympian","academy","philosophy","nondeity"]',
  '{"pantheonSlug":"olympian","name":"The Academy","isDeity":false,"divineRank":null,"alignment":"NG","domains":["Good","Knowledge"],"favoredWeapon":"Quarterstaff","portfolio":["good","truth","beauty"]}'
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug='dd-olympian-academy' AND r.owner_user_id IS NULL
);
