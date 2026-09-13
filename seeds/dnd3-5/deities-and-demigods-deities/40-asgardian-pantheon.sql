-- Deities and Demigods: Asgardian pantheon catalog, theology, cosmology, cleric options, wyrd/Ragnarok, and recommendation tables.
-- Source: Deities and Demigods (2002), Chapter 6, pp. 163-167, Tables 6-1 through 6-3.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0',
        'Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL);

WITH desired(id,slug,name,alignment,portfolio,rank_band,domains,favored_weapon) AS (VALUES
 ('dd-deity-odin','odin','Odin','NG','Knowledge, magic, supreme, war','greater','Air, Knowledge, Magic, Travel, Trickery, War','Shortspear'),
 ('dd-deity-aegir','aegir','Aegir','NE','Sea, storms','intermediate','Death, Destruction, Evil, Strength, Water','Greatclub'),
 ('dd-deity-balder','balder','Balder','NG','Beauty, light, music, poetry, rebirth','intermediate','Good, Healing, Knowledge','Greatsword'),
 ('dd-deity-forseti','forseti','Forseti','N','Justice, law','intermediate','Knowledge, Protection, Strength','Longsword'),
 ('dd-deity-frey','frey','Frey','NG','Agriculture, fertility, harvest, sun','greater','Air, Good, Plant, Sun','Greatsword'),
 ('dd-deity-freya','freya','Freya','NG','Fertility, love, magic, vanity','intermediate','Air, Charm, Good, Magic','Longsword'),
 ('dd-deity-frigga','frigga','Frigga','N','Birth, fertility, love','greater','Air, Animal, Community, Knowledge','Natural weapons'),
 ('dd-deity-heimdall','heimdall','Heimdall','LG','Watchfulness, sight, hearing, loyalty','intermediate','Good, Law, War','Longsword'),
 ('dd-deity-hel','hel','Hel','NE','Death, underworld','intermediate','Death, Destruction, Evil','Longsword'),
 ('dd-deity-hermod','hermod','Hermod','CN','Luck, communication, freedom','demigod','Chaos, Luck, Travel','Rapier'),
 ('dd-deity-loki','loki','Loki','CE','Thieves, trickery, murder','greater','Chaos, Destruction, Evil, Trickery','Dagger'),
 ('dd-deity-njord','njord','Njord','NG','Commerce, sea, wind','intermediate','Air, Good, Water','Longspear'),
 ('dd-deity-odur','odur','Odur','CG','Light, sun, travel','demigod','Chaos, Fire, Sun','Bastard sword'),
 ('dd-deity-sif','sif','Sif','CG','War, dueling','lesser','Chaos, Good, War','Longsword'),
 ('dd-deity-skadi','skadi','Skadi','N','Earth, mountains','lesser','Destruction, Earth, Strength','Greataxe'),
 ('dd-deity-surtur','surtur','Surtur','LE','Fire, war','intermediate','Evil, Fire, Law, Strength, War','Longsword'),
 ('dd-deity-thor','thor','Thor','CG','Storms, thunder, war','greater','Chaos, Good, Protection, Strength, War, Weather','Warhammer'),
 ('dd-deity-thrym','thrym','Thrym','CE','War, cold, giants','intermediate','Chaos, Earth, Evil, Strength, War','Greataxe'),
 ('dd-deity-tyr','tyr','Tyr','LN','Courage, trust, strategy, tactics, writing','intermediate','Law, Protection, War','Longsword'),
 ('dd-deity-uller','uller','Uller','CN','Archers, hunting, winter','lesser','Chaos, Protection, Travel','Longbow')
)
INSERT INTO dnd35_deities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,alignment,portfolio,symbol)
SELECT d.id,'dd-3.0','166-167',d.slug,d.name,
       d.name||' is a '||d.rank_band||' deity of the Asgardian pantheon whose portfolio is '||d.portfolio||'.',
       'Pantheon: Asgardian. Divine status: '||d.rank_band||'. Domains: '||d.domains||'. Favored weapon: '||d.favored_weapon||'.',
       0,NULL,1,d.alignment,d.portfolio,NULL
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_deities x WHERE x.slug=d.slug AND x.owner_user_id IS NULL
);

WITH desired(deity_slug,domain_slug) AS (VALUES
 ('odin','air'),('odin','knowledge'),('odin','magic'),('odin','travel'),('odin','trickery'),('odin','war'),
 ('aegir','death'),('aegir','destruction'),('aegir','evil'),('aegir','strength'),('aegir','water'),
 ('balder','good'),('balder','healing'),('balder','knowledge'),
 ('forseti','knowledge'),('forseti','protection'),('forseti','strength'),
 ('frey','air'),('frey','good'),('frey','plant'),('frey','sun'),
 ('freya','air'),('freya','charm'),('freya','good'),('freya','magic'),
 ('frigga','air'),('frigga','animal'),('frigga','community'),('frigga','knowledge'),
 ('heimdall','good'),('heimdall','law'),('heimdall','war'),
 ('hel','death'),('hel','destruction'),('hel','evil'),
 ('hermod','chaos'),('hermod','luck'),('hermod','travel'),
 ('loki','chaos'),('loki','destruction'),('loki','evil'),('loki','trickery'),
 ('njord','air'),('njord','good'),('njord','water'),
 ('odur','chaos'),('odur','fire'),('odur','sun'),
 ('sif','chaos'),('sif','good'),('sif','war'),
 ('skadi','destruction'),('skadi','earth'),('skadi','strength'),
 ('surtur','evil'),('surtur','fire'),('surtur','law'),('surtur','strength'),('surtur','war'),
 ('thor','chaos'),('thor','good'),('thor','protection'),('thor','strength'),('thor','war'),('thor','weather'),
 ('thrym','chaos'),('thrym','earth'),('thrym','evil'),('thrym','strength'),('thrym','war'),
 ('tyr','law'),('tyr','protection'),('tyr','war'),
 ('uller','chaos'),('uller','protection'),('uller','travel')
)
INSERT OR IGNORE INTO dnd35_deity_domains (deity_id,domain_id)
SELECT deity.id,domain.id
FROM desired d
JOIN dnd35_deities deity ON deity.slug=d.deity_slug AND deity.owner_user_id IS NULL
JOIN dnd35_domains domain ON domain.slug=d.domain_slug AND domain.owner_user_id IS NULL;

WITH desired(slug,name,page,description,rules_text,kind,tags,mechanics) AS (VALUES
('dd-asgardian-pantheon','The Asgardian Pantheon','163-167',
 'A tight pantheon ruled by Odin, formed from the Aesir, integrated Vanir, allied or adopted divine giants, and related deities.',
 'The Asgardian pantheon is tight: all mortals revere the whole pantheon even when they have a special patron. Odin is supreme ruler and casts the deciding vote in divine council. The gods are independent of worshiper power, can die, and the Aesir council can apparently bestow divine rank on worthy outsiders or giants.',
 'pantheon-catalog',
 '["deities-and-demigods","pantheon","asgardian","aesir","vanir","ragnarok","yggdrasil"]',
 '{"pantheonSlug":"asgardian","type":"tight","leader":"odin","allDeities":["odin","aegir","balder","forseti","frey","freya","frigga","heimdall","hel","hermod","loki","njord","odur","sif","skadi","surtur","thor","thrym","tyr","uller"],"divineCouncil":{"decisionsByCouncil":true,"odinHasDecidingVote":true},"worship":{"allMortalsRevereWholePantheon":true,"individualPatronExclusive":false},"divineNature":{"godsIndependentOfWorshiperPower":true,"godsCanDie":true,"divineRankPotentiallyUnbounded":true,"aesirCouncilCanBestowDivineRank":true},"aesirVanir":{"aesirThemes":["war","destiny"],"vanirThemes":["fertility","prosperity"],"warEndedByHostageExchange":true,"vanirHostagesToAesir":["njord","frey","freya"],"aesirHostagesToVanir":["honir","mimir"],"mimirFate":"Vanir beheaded Mimir after discovering the Aesir deception; Odin placed the head at Mimir''s well beneath Yggdrasil.","eventualIntegration":"Over time all Vanir deities integrated with the Aesir."},"asgardianGiants":{"jotunheimAndMuspelheimGiants":"divine beings capable of challenging gods","typicalDivineRankRange":"0-5","mannheimGiants":"mostly mortal"}}'),

('dd-asgardian-cosmology','Asgardian Cosmology and Yggdrasil','164-165',
 'Three-plane Asgardian cosmology linked by Yggdrasil, Bifrost, and the Plane of Shadow, with the traditional named worlds represented largely as regions.',
 'Asgard and Niflheim are Outer Planes and Midgard is the Material Plane. Bifrost connects Asgard to Midgard; Shadow connects Midgard to Niflheim. Astral and Ethereal do not connect directly to the Outer Planes. Yggdrasil has roots in each primary plane and its named wells anchor divine council, wisdom, and the underworld.',
 'cosmology',
 '["deities-and-demigods","asgardian","cosmology","yggdrasil","asgard","midgard","niflheim","bifrost"]',
 '{"pantheonSlug":"asgardian","primaryPlanes":{"Asgard":{"planeType":"Outer Plane","locations":{"Valhalla":"Odin''s hall of the einherjar; battle-dead train daily and rise restored each evening.","Valaskjalf":"Odin''s hall containing Hlidskjalf, the High Seat.","Thrudvangar":"Region containing Thor''s hall Bilskirnir.","Briedbalik":"Balder''s hall.","Glitnir":"Forseti''s hall; legal disputes are resolved there.","Sessrumnir":"Freya''s hall; half of men slain in battle and all women slain in battle come here.","Fensalir":"Frigga''s hall.","Himinbjorg":"Heimdall''s hall beside Bifrost.","Ydalir":"Uller''s hall.","Gimli":"Prophesied peaceful divine hall after Ragnarok.","Gladsheim":"Aesir communal hall.","Vingolf":"Aesir communal hall.","Vanaheim":"Home of the Vanir, represented as a location in Asgard.","Alfheim":"Home of the light elves and site of Frey''s hall.","Vigrid":"Field of the prophesied Ragnarok battle."}},"Midgard":{"planeType":"Material Plane","regions":{"Mannheim":"mortal homeland","Jotunheim":"land of the frost giants","Muspelheim":"land of the fire giants","Nidavellir":"dwarf realm","Svartalfheim":"domain of the dark elves"}},"Niflheim":{"planeType":"Outer Plane","ruler":"hel","role":"land of the dead for those dying by sickness, old age, or accident","locations":{"Eljudnir":"Hel''s judgment hall","Gnipahellir":"entrance cave guarded by Garm","Gjoll":"river encircling the dead","Hvergelmir":"spring feeding Gjoll"}}},"connectors":{"Bifrost":{"from":"Asgard","to":"Midgard","type":"conduit/Rainbow Bridge"},"Plane of Shadow":{"from":"Midgard","to":"Niflheim"},"Astral Plane":"Does not directly connect to Asgard or Niflheim; reaches from Midgard to Shadow.","Ethereal Plane":"Does not directly connect to Asgard or Niflheim; reaches from Midgard to Shadow."},"Yggdrasil":{"type":"World Tree","rootPlanes":["Asgard","Midgard","Niflheim"],"wells":{"Urd":{"plane":"Asgard","role":"fate; gods meet there in council; Norns tend the tree"},"Mimir":{"plane":"Midgard/Jotunheim","role":"wisdom; Odin sacrificed an eye for knowledge"},"Hvergelmir":{"plane":"Niflheim","role":"source of primordial rivers; Nidhoggr gnaws the root"}}},"sourceFidelityNote":"The setting uses many traditional world names, but mechanically describes three primary planes; named worlds such as Jotunheim, Muspelheim, Nidavellir, Svartalfheim, Vanaheim, and Alfheim are stored as regions/locations rather than invented independent planes."}'),

('dd-asgardian-pantheon-cleric-options','Asgardian Pantheon Cleric Options','166-167',
 'Rules for clerics who select the entire Asgardian pantheon rather than a single deity.',
 'Whole-pantheon Asgardian clerics may be of any alignment, choose domains from the pantheon list subject to the normal cleric rules, and select one listed favored weapon. Individual patron devotion never removes the obligation to revere the whole pantheon.',
 'pantheon-cleric-options',
 '["deities-and-demigods","asgardian","pantheon","cleric-options"]',
 '{"pantheonSlug":"asgardian","wholePantheonPatronAllowed":true,"clericAlignment":"any","domains":["Air","Animal","Chaos","Charm","Community","Death","Destruction","Good","Earth","Evil","Fire","Healing","Knowledge","Law","Luck","Magic","Plant","Protection","Strength","Sun","Travel","Trickery","War","Water","Weather"],"favoredWeapons":["composite longbow","dagger","greatclub","greatsword","longsword","quarterstaff","short sword","spear","unarmed strike","warhammer"],"raceRecommendations":{"human":"by class and alignment","dwarf":["heimdall","skadi","thor","tyr","or by class and alignment"],"elf":["frey","freya","hermod","njord","uller","or by class and alignment"],"gnome":["balder","frey","freya","odin","or by class and alignment"],"half-elf":["frey","freya","hermod","njord","uller","or by class and alignment"],"half-orc":["thor","uller","or by class and alignment"],"halfling":["forseti","frigga","hermod","skadi","uller","or by class and alignment"]},"classRecommendations":{"bard":["balder (NG)","freya (NG)","hermod (CN)","odin (CG, printed table value)"],"barbarian":["odur (CG)","sif (CG)","skadi (N)","thor (CG)","thrym (CE)","uller (CN)"],"cleric":"any","druid":["frey (NG)","frigga (N)","odur (CG)","skadi (N)","uller (CN)"],"fighter":["freya (NG)","heimdall (LG)","odin (CG, printed table value)","sif (CG)","surtur (LE)","thor (CG)","thrym (CE)","tyr (LN)"],"monk":["tyr (LN)"],"paladin":["heimdall (LG)"],"ranger":["frey (NG)","heimdall (LG)","odur (CG)","sif (CG)","thor (CG)","skadi (N)","tyr (LN)","uller (CN)"],"rogue":["loki (CE)","odin (CG, printed table value)"],"sorcerer":["freya (NG)","loki (CE)","odin (CG, printed table value)"],"wizard":["freya (NG)","frigga (N)","hel (NE)","odin (CG, printed table value)"]},"sourceNotes":["Table 6-1 and Odin''s individual entry identify Odin as neutral good, but Table 6-3 repeatedly prints Odin as CG. The recommendation-table value is retained as a source anomaly and does not override Odin''s deity alignment."]}'),

('dd-asgardian-wyrd-and-ragnarok','Wyrd, the Norns, and Ragnarok','165-166',
 'Campaign-level Asgardian fate and apocalypse framework, including the Norns and four supported Ragnarok eras.',
 'Asgardians believe the Norns set each person''s wyrd at birth. Ragnarok is inevitable but cyclical rather than final: Surtur burns the world, several gods survive, and creation begins again. Campaigns may be set long before Ragnarok, on its approach, during the war, or after it.',
 'campaign-framework',
 '["deities-and-demigods","asgardian","wyrd","norns","ragnarok","campaign"]',
 '{"pantheonSlug":"asgardian","wyrd":{"definedAs":"fate marked out by the Norns at birth","culturalResponse":"face fate with courage and seek legendary deeds worthy of song"},"norns":{"primary":[{"name":"Urd","meaning":"fate"},{"name":"Verdandi","meaning":"being"},{"name":"Skuld","meaning":"necessity"}],"role":"tend Yggdrasil at Urd''s well and measure the fates of beings","teachMortals":false,"lesserNornsExist":true},"ragnarok":{"inevitable":true,"cyclicalRenewal":true,"surturBurnsWorld":true,"prophesiedSurvivors":["balder","hod","modi","magni","vali","vidar"],"mjolnirAfterThor":"magni","campaignEras":[{"era":"Ragnarok distant","notes":"Pantheon can be used as normally presented."},{"era":"Ragnarok approaching","notes":"Loki is clearly evil and may be bound; Balder has died; gods and mortals prepare for final battle."},{"era":"During Ragnarok","notes":"Gods fight giants and have little time for mortals; Loki and his children fight alongside giants against Odin and the Aesir."},{"era":"Post-Ragnarok","notes":"Surviving deities inherit renewed creation; many clerics may temporarily lose domain access until divine portfolios are reassigned."}]}}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dd-rule-'||d.slug,'dd-3.0',d.page,d.slug,d.name,d.description,d.rules_text,
  0,NULL,1,'religion',d.kind,0,1,
  CASE WHEN d.slug='dd-asgardian-pantheon' THEN NULL ELSE 'dd-asgardian-pantheon' END,
  NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
