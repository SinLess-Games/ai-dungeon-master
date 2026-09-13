-- Deities and Demigods: Chapter 7 alternative religions and deity catalog.
-- Source: Deities and Demigods (2002), Chapter 7, pp. 203-212.
-- Chapter 7 demonstrates three reusable campaign religion models: monotheism,
-- dualism, and a standalone mystery cult. Mechanical text is summarized.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0',
        'Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL);

-- The four fully statted divine entities in Chapter 7.
WITH desired(id,page,slug,name,alignment,portfolio,symbol,rank_band,domains,favored_weapon,description) AS (VALUES
  ('dd-deity-taiia','203-205','taiia','Taiia','N','Creation, destruction, mortal life and death','Solar disk with three eyes','greater',
   'Creator: Air, Chaos, Earth, Good, Healing, Knowledge, Law, Luck, Magic, Protection, Sun, Travel; Destroyer: Chaos, Death, Destruction, Evil, Fire, Law, Strength, Trickery, War, Water',
   'Creator: trident; Destroyer: battleaxe',
   'The sole deity of the Faith of the Sun, expressed through Creator and Destroyer aspects.'),
  ('dd-deity-elishar','207-209','elishar','Elishar','NG','Positive energy, light, prophecy','Five-pointed star containing a smaller five-pointed star','intermediate',
   'Good, Healing, Knowledge, Luck, Protection, Sun','Scimitar',
   'The positive-energy deity of Following the Light and cosmic opposite of Toldoth.'),
  ('dd-deity-toldoth','210-211','toldoth','Toldoth','NE','Negative energy, darkness, destruction','Onyx disk','intermediate',
   'Death, Destruction, Evil, Strength, Trickery, War','Battleaxe',
   'The negative-energy deity of Following the Light and cosmic opposite of Elishar.'),
  ('dd-deity-dennari','211-212','dennari','Dennari','CG','Earth, liberation, suffering','Warhammer with leaves sprouting from its handle','lesser',
   'Chaos, Earth, Good, Liberation, Plant','Warhammer',
   'An earth-mother deity whose independent mystery cult centers on liberation, endurance, and the suffering of oppressed people.')
)
INSERT INTO dnd35_deities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,alignment,portfolio,symbol)
SELECT d.id,'dd-3.0',d.page,d.slug,d.name,d.description,
       'Divine status: '||d.rank_band||'. Domains: '||d.domains||'. Favored weapon: '||d.favored_weapon||'.',
       0,NULL,1,d.alignment,d.portfolio,d.symbol
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_deities x WHERE x.slug=d.slug AND x.owner_user_id IS NULL
);

-- Taiia has aspect-specific domain access. The join table has no aspect column,
-- so it stores the union while the religion rule below preserves which aspect grants which set.
WITH desired(deity_slug,domain_slug) AS (VALUES
  ('taiia','air'),('taiia','chaos'),('taiia','earth'),('taiia','good'),('taiia','healing'),('taiia','knowledge'),
  ('taiia','law'),('taiia','luck'),('taiia','magic'),('taiia','protection'),('taiia','sun'),('taiia','travel'),
  ('taiia','death'),('taiia','destruction'),('taiia','evil'),('taiia','fire'),('taiia','strength'),('taiia','trickery'),
  ('taiia','war'),('taiia','water'),
  ('elishar','good'),('elishar','healing'),('elishar','knowledge'),('elishar','luck'),('elishar','protection'),('elishar','sun'),
  ('toldoth','death'),('toldoth','destruction'),('toldoth','evil'),('toldoth','strength'),('toldoth','trickery'),('toldoth','war'),
  ('dennari','chaos'),('dennari','earth'),('dennari','good'),('dennari','liberation'),('dennari','plant')
)
INSERT OR IGNORE INTO dnd35_deity_domains (deity_id,domain_id)
SELECT deity.id,domain.id
FROM desired d
JOIN dnd35_deities deity ON deity.slug=d.deity_slug AND deity.owner_user_id IS NULL
JOIN dnd35_domains domain ON domain.slug=d.domain_slug AND domain.owner_user_id IS NULL;

WITH desired(slug,name,page,description,rules_text,kind,tags,mechanics) AS (VALUES
('dd-faith-of-the-sun','The Faith of the Sun','203-206',
 'A monotheistic religion centered on Taiia, whose daily solar cycle expresses complementary Creator and Destroyer aspects.',
 'The Faith of the Sun recognizes Taiia as the only deity and prohibits worship of any other god. Clerical alignment, domain access, favored weapon, and sect identity depend on whether a worshiper emphasizes Taiia as Creator or Destroyer. The church has no central authority, so multiple sects coexist and sometimes conflict.',
 'religion-model',
 '["deities-and-demigods","other-religions","monotheism","taiia","faith-of-the-sun"]',
 '{"religionSlug":"faith-of-the-sun","model":"monotheistic","soleDeity":"taiia","otherGodsRecognized":false,"otherGodWorshipProhibited":true,"deityAspects":{"creator":{"clericAlignments":["CG","CN","LG","LN","N","NG"],"domains":["Air","Chaos","Earth","Good","Healing","Knowledge","Law","Luck","Magic","Protection","Sun","Travel"],"favoredWeapon":"trident"},"destroyer":{"clericAlignments":["CE","CN","LN","LE","N","NE"],"domains":["Chaos","Death","Destruction","Evil","Fire","Law","Strength","Trickery","War","Water"],"favoredWeapon":"battleaxe"}},"church":{"centralAuthority":false,"sectsCanCooperateOrConflict":true,"commonClergyMarkers":["shaved head","prominently displayed sect holy symbol incorporating Taiia''s three-eyed solar disk"]},"afterlife":{"favored":"Followers hope to be joined with Taiia after death, their souls consumed into her eternal flame.","unfavored":"Those denied her favor remain eternally in darkness apart from Taiia."}}'),

('dd-faith-of-the-sun-sects','Faith of the Sun Sects','203-206',
 'Four example Taiian sects show how one monotheistic church can contain sharply different spiritual and political movements.',
 'Blind Mendicants and the Sun''s Path emphasize the Creator. Purifying Flame and Darkened Penitents emphasize the Destroyer. These are theological and behavioral structures; the source does not grant generic numeric initiation bonuses for membership.',
 'religious-sects',
 '["deities-and-demigods","other-religions","taiia","sects","justiciar-of-taiia"]',
 '{"parentReligion":"faith-of-the-sun","sects":{"blind-mendicants":{"aspect":"creator","themes":["mysticism","asceticism","poverty","fasting","contemplative prayer"],"practices":["blindfolding","some members voluntarily blind themselves"],"goal":"Heightened awareness of Taiia''s presence and purifying flame."},"purifying-flame":{"aspect":"destroyer","themes":["prophecy","judgment"],"methods":["oracular practice","formal justice","assassination","war"],"prestigeClassConnection":"Justiciar of Taiia"},"suns-path":{"aspect":"creator","themes":["devotional worship","joy"],"practices":["regular communal singing","whirling dances symbolizing the sun''s passage"]},"darkened-penitents":{"aspect":"destroyer","themes":["judgment","vicarious penance"],"practices":["accepting Taiia''s rejection upon themselves","meeting in magical darkness"],"goal":"Bear the burden of sin themselves in hope of averting Taiia''s wrath from others."}},"genericMechanicalInitiationBonus":null,"sourceFidelity":"Do not invent numerical membership benefits where the source supplies doctrine and practice only."}'),

('dd-following-the-light','Following the Light','207-211',
 'A dualistic religion built around the cosmic opposition of positive energy through Elishar and negative energy through Toldoth.',
 'Following the Light treats the Material Plane as the battlefield between Elishar and Toldoth. Most adherents side with Elishar and work to preserve life, healing, compassion, and light; Toldoth''s cults embrace death, destruction, darkness, suffering, and negative energy. Both churches expect a final cosmic confrontation.',
 'religion-model',
 '["deities-and-demigods","other-religions","dualism","elishar","toldoth","following-the-light"]',
 '{"religionSlug":"following-the-light","model":"dualistic","poles":{"positive":{"deity":"elishar","plane":"Positive Energy Plane","themes":["life","light","healing","compassion","prophecy"]},"negative":{"deity":"toldoth","plane":"Negative Energy Plane","themes":["death","darkness","destruction","suffering","negative energy"]}},"battlefield":"Material Plane","eschatology":{"finalConflictExpected":true,"elisharFollowersExpect":"Elishar to triumph over Toldoth.","toldothFollowersExpect":"Toldoth to triumph over Elishar and extinguish mortal life."},"orders":{"soldiersOfLight":{"deity":"elishar","prestigeClass":"Soldier of Light","mission":"Open warfare against Toldoth''s minions in preparation for the final conflict."}},"energons":{"positive":"xag-ya","negative":"xeg-yi","source":"Manual of the Planes; Deities and Demigods provides an abbreviated xag-ya companion block."}}'),

('dd-dennari-mystery-cult','The Mystery Cult of Dennari','211-212',
 'A standalone mystery cult not attached to a larger pantheon, intended as a religion that can be inserted into an existing campaign.',
 'Dennari''s cult centers on an earth-mother deity whose suffering and endurance mirror those of oppressed people. Her clergy support the poor and burdened and often worship secretly where oppressive governments persecute the faith.',
 'religion-model',
 '["deities-and-demigods","other-religions","mystery-cult","dennari","liberation"]',
 '{"religionSlug":"dennari-mystery-cult","model":"standalone-mystery-cult","deity":"dennari","connectedPantheon":null,"portableCampaignReligion":true,"themes":["earth","liberation","suffering","endurance","oppressed peoples"],"typicalWorshipers":["dwarves","oppressed and poor people","farmers","peasants"],"clergyMission":["support people under heavy burdens","give religious meaning to suffering","oppose or survive oppressive rule"],"typicalMeetingPlaces":["cavern shrines","private homes","secret gatherings where persecuted"],"genericMechanicalInitiationBonus":null,"sourceFidelity":"The chapter presents this as an example of a mystery cult independent of any pantheon; do not attach it to the D&D, Olympian, Pharaonic, or Asgardian pantheons."}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dd-rule-'||d.slug,'dd-3.0',d.page,d.slug,d.name,d.description,d.rules_text,
       0,NULL,1,'religion',d.kind,0,1,NULL,NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);