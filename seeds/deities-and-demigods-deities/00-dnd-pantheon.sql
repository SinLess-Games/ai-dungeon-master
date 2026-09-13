-- Deities and Demigods: D&D pantheon deity identity catalog.
-- Primary source: Deities and Demigods (2002), Table 3-1, p. 58.
-- Identity rows intentionally separate stable deity metadata from the much larger divine combat/stat blocks.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES
  ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0',
   'Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL);

WITH desired(
  id,slug,name,alignment,portfolio,rank_band,home_plane,domains,favored_weapon
) AS (VALUES
  ('dd-deity-bahamut','bahamut','Bahamut','LG','Good dragons, wind','lesser','Celestia','Air, Good, Luck, Protection','Claw'),
  ('dd-deity-boccob','boccob','Boccob','N','Magic, arcane knowledge, foresight, balance','greater','Outlands','Knowledge, Magic, Trickery','Quarterstaff'),
  ('dd-deity-corellon-larethian','corellon-larethian','Corellon Larethian','CG','Elves, magic, arts and crafts, music, war','greater','Arborea','Chaos, Good, Protection, War','Longsword'),
  ('dd-deity-ehlonna','ehlonna','Ehlonna','NG','Forests, woodlands, flora and fauna, fertility','intermediate','Beastlands','Animal, Good, Plant, Sun','Longsword'),
  ('dd-deity-erythnul','erythnul','Erythnul','CE','Hate, envy, malice, panic, ugliness, slaughter','intermediate','Pandemonium','Chaos, Evil, Trickery, War','Morningstar'),
  ('dd-deity-fharlanghn','fharlanghn','Fharlanghn','N','Horizons, distance, travel, roads','intermediate','Material Plane','Luck, Protection, Travel','Quarterstaff'),
  ('dd-deity-garl-glittergold','garl-glittergold','Garl Glittergold','NG','Gnomes, humor, wit, illusion, gemcutting, jewelrymaking','greater','Bytopia','Good, Protection, Trickery','Battleaxe'),
  ('dd-deity-gruumsh','gruumsh','Gruumsh','CE','Orcs, war, territory','greater','Acheron','Chaos, Evil, Strength, War','Spear'),
  ('dd-deity-heironeous','heironeous','Heironeous','LG','Valor, chivalry, justice, honor, war, daring','intermediate','Celestia','Good, Law, War','Longsword'),
  ('dd-deity-hextor','hextor','Hextor','LE','Tyranny, war, discord, massacres, conflict, fitness','intermediate','Acheron','Destruction, Evil, Law, War','Flail'),
  ('dd-deity-kord','kord','Kord','CG','Strength, athletics, sports, brawling, courage','intermediate','Ysgard','Chaos, Good, Luck, Strength','Greatsword'),
  ('dd-deity-kurtulmak','kurtulmak','Kurtulmak','LE','Kobolds, trapmaking, mining, war','intermediate','Baator','Evil, Law, Luck, Trickery','Spear'),
  ('dd-deity-lolth','lolth','Lolth','CE','Drow, spiders, evil, darkness','intermediate','Abyss','Chaos, Destruction, Evil, Trickery','Whip'),
  ('dd-deity-moradin','moradin','Moradin','LG','Dwarves, creation, smithing, engineering, war','greater','Celestia','Earth, Good, Law, Protection','Warhammer'),
  ('dd-deity-nerull','nerull','Nerull','NE','Death, darkness, murder, underworld','greater','Carceri','Death, Evil, Trickery','Scythe'),
  ('dd-deity-obad-hai','obad-hai','Obad-Hai','N','Nature, woodlands, freedom, hunting, beasts','intermediate','Outlands','Air, Animal, Earth, Fire, Plant, Water','Quarterstaff'),
  ('dd-deity-olidammara','olidammara','Olidammara','CN','Rogues, music, revelry, wine, humor, tricks','intermediate','Ysgard','Chaos, Luck, Trickery','Rapier'),
  ('dd-deity-pelor','pelor','Pelor','NG','Sun, light, strength, healing','greater','Elysium','Good, Healing, Strength, Sun','Mace'),
  ('dd-deity-st-cuthbert','st-cuthbert','St. Cuthbert','LN','Retribution, common sense, wisdom, zeal, honesty, truth, discipline','intermediate','Arcadia','Destruction, Law, Protection, Strength','Mace'),
  ('dd-deity-tiamat','tiamat','Tiamat','LE','Evil dragons, conquest','lesser','Baator','Destruction, Evil, Law, Trickery','Claw'),
  ('dd-deity-vecna','vecna','Vecna','NE','Secrets, intrigue','lesser','Material Plane','Evil, Knowledge, Magic','Dagger'),
  ('dd-deity-wee-jas','wee-jas','Wee Jas','LN','Death, magic, vanity, law','intermediate','Acheron','Death, Law, Magic','Dagger'),
  ('dd-deity-yondalla','yondalla','Yondalla','LG','Halflings, protection, fertility','greater','Celestia','Good, Law, Protection','Short sword')
)
INSERT INTO dnd35_deities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   alignment,portfolio,symbol)
SELECT d.id,'dd-3.0','58',d.slug,d.name,
       d.name||' is a '||d.rank_band||' deity of the D&D pantheon whose portfolio is '||d.portfolio||'.',
       'Pantheon: D&D. Divine status: '||d.rank_band||'. Home plane: '||d.home_plane||'. Domains: '||d.domains||'. Favored weapon: '||d.favored_weapon||'.',
       0,NULL,1,d.alignment,d.portfolio,NULL
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_deities x WHERE x.slug=d.slug AND x.owner_user_id IS NULL
);

-- Domain memberships from Table 3-1. Missing domain rows are skipped rather than manufacturing duplicates.
WITH desired(deity_slug,domain_slug) AS (VALUES
  ('bahamut','air'),('bahamut','good'),('bahamut','luck'),('bahamut','protection'),
  ('boccob','knowledge'),('boccob','magic'),('boccob','trickery'),
  ('corellon-larethian','chaos'),('corellon-larethian','good'),('corellon-larethian','protection'),('corellon-larethian','war'),
  ('ehlonna','animal'),('ehlonna','good'),('ehlonna','plant'),('ehlonna','sun'),
  ('erythnul','chaos'),('erythnul','evil'),('erythnul','trickery'),('erythnul','war'),
  ('fharlanghn','luck'),('fharlanghn','protection'),('fharlanghn','travel'),
  ('garl-glittergold','good'),('garl-glittergold','protection'),('garl-glittergold','trickery'),
  ('gruumsh','chaos'),('gruumsh','evil'),('gruumsh','strength'),('gruumsh','war'),
  ('heironeous','good'),('heironeous','law'),('heironeous','war'),
  ('hextor','destruction'),('hextor','evil'),('hextor','law'),('hextor','war'),
  ('kord','chaos'),('kord','good'),('kord','luck'),('kord','strength'),
  ('kurtulmak','evil'),('kurtulmak','law'),('kurtulmak','luck'),('kurtulmak','trickery'),
  ('lolth','chaos'),('lolth','destruction'),('lolth','evil'),('lolth','trickery'),
  ('moradin','earth'),('moradin','good'),('moradin','law'),('moradin','protection'),
  ('nerull','death'),('nerull','evil'),('nerull','trickery'),
  ('obad-hai','air'),('obad-hai','animal'),('obad-hai','earth'),('obad-hai','fire'),('obad-hai','plant'),('obad-hai','water'),
  ('olidammara','chaos'),('olidammara','luck'),('olidammara','trickery'),
  ('pelor','good'),('pelor','healing'),('pelor','strength'),('pelor','sun'),
  ('st-cuthbert','destruction'),('st-cuthbert','law'),('st-cuthbert','protection'),('st-cuthbert','strength'),
  ('tiamat','destruction'),('tiamat','evil'),('tiamat','law'),('tiamat','trickery'),
  ('vecna','evil'),('vecna','knowledge'),('vecna','magic'),
  ('wee-jas','death'),('wee-jas','law'),('wee-jas','magic'),
  ('yondalla','good'),('yondalla','law'),('yondalla','protection')
)
INSERT OR IGNORE INTO dnd35_deity_domains (deity_id,domain_id)
SELECT deity.id,domain.id
FROM desired d
JOIN dnd35_deities deity ON deity.slug=d.deity_slug AND deity.owner_user_id IS NULL
JOIN dnd35_domains domain ON domain.slug=d.domain_slug AND domain.owner_user_id IS NULL;
