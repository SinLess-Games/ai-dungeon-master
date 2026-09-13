-- Player's Handbook v3.5 cleric domains and the core Greyhawk deity list.
WITH desired(slug,name,granted_power) AS (VALUES
  ('air','Air','Turn or destroy earth creatures; rebuke, command, or bolster air creatures.'),
  ('animal','Animal','Use speak with animals once per day; Knowledge (nature) is a class skill.'),
  ('chaos','Chaos','Cast chaos spells at +1 caster level.'),
  ('death','Death','Use a death touch once per day.'),
  ('destruction','Destruction','Use a smite once per day.'),
  ('earth','Earth','Turn or destroy air creatures; rebuke, command, or bolster earth creatures.'),
  ('evil','Evil','Cast evil spells at +1 caster level.'),
  ('fire','Fire','Turn or destroy water creatures; rebuke, command, or bolster fire creatures.'),
  ('good','Good','Cast good spells at +1 caster level.'),
  ('healing','Healing','Cast healing subschool spells at +1 caster level.'),
  ('knowledge','Knowledge','All Knowledge skills are class skills; cast divination spells at +1 caster level.'),
  ('law','Law','Cast law spells at +1 caster level.'),
  ('luck','Luck','Reroll one roll once per day before knowing whether it succeeds.'),
  ('magic','Magic','Use spell-completion and spell-trigger items as a wizard of one-half cleric level.'),
  ('plant','Plant','Rebuke or command plant creatures; Knowledge (nature) is a class skill.'),
  ('protection','Protection','Grant a resistance bonus on a saving throw once per day.'),
  ('strength','Strength','Perform a feat of strength once per day.'),
  ('sun','Sun','Perform a greater turning once per day in place of a normal turning.'),
  ('travel','Travel','Gain freedom of movement for a limited number of rounds per day; Survival is a class skill.'),
  ('trickery','Trickery','Bluff, Disguise, and Hide are class skills.'),
  ('war','War','Gain proficiency and Weapon Focus with the deity''s favored weapon.'),
  ('water','Water','Turn or destroy fire creatures; rebuke, command, or bolster water creatures.')
)
INSERT INTO dnd35_domains
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,granted_power_text)
SELECT 'phb-domain-'||d.slug,'phb-3.5','185-189',d.slug,d.name,'','',0,NULL,1,d.granted_power
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_domains x WHERE x.slug=d.slug AND x.owner_user_id IS NULL
);

WITH desired(slug,name,alignment,portfolio,symbol) AS (VALUES
  ('boccob','Boccob','N','Magic, arcane knowledge, balance, foresight','Eye within a pentagram'),
  ('corellon-larethian','Corellon Larethian','CG','Elves, magic, music, arts, warfare','Quarter moon or starburst'),
  ('ehlonna','Ehlonna','NG','Forests, woodlands, flora and fauna, fertility','Unicorn horn'),
  ('erythnul','Erythnul','CE','Hate, envy, malice, panic, ugliness, slaughter','Red blood drop'),
  ('fharlanghn','Fharlanghn','N','Roads, distance, travel','Disk bearing a curved line and horizon'),
  ('garl-glittergold','Garl Glittergold','NG','Gnomes, humor, gemcutting, trickery','Gold nugget'),
  ('gruumsh','Gruumsh','CE','Orcs, conquest, survival, strength, territory','Unwinking eye'),
  ('heironeous','Heironeous','LG','Valor, chivalry, justice, honor, war, daring','Fist holding a lightning bolt'),
  ('hextor','Hextor','LE','War, discord, massacres, conflict, fitness, tyranny','Six arrows facing downward'),
  ('kord','Kord','CG','Athletics, sports, brawling, strength, courage','Eight-pointed star composed of spears and maces'),
  ('moradin','Moradin','LG','Dwarves, creation, smithing, engineering, war','Hammer and anvil'),
  ('nerull','Nerull','NE','Death, darkness, murder, underworld','Skull and scythe'),
  ('obad-hai','Obad-Hai','N','Nature, freedom, hunting, beasts','Oak leaf and acorn'),
  ('olidammara','Olidammara','CN','Rogues, music, revelry, tricks, wine','Laughing mask'),
  ('pelor','Pelor','NG','Sun, light, strength, healing','Sun face'),
  ('st-cuthbert','St. Cuthbert','LN','Retribution, common sense, wisdom, zeal, honesty, truth, discipline','Ruby-studded starburst'),
  ('vecna','Vecna','NE','Secrets, intrigue','Left hand clutching an eye'),
  ('wee-jas','Wee Jas','LN','Magic, death, vanity, law','Red skull before a fireball'),
  ('yondalla','Yondalla','LG','Halflings, protection, fertility','Shield bearing a cornucopia')
)
INSERT INTO dnd35_deities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   alignment,portfolio,symbol)
SELECT 'phb-deity-'||d.slug,'phb-3.5','106-108',d.slug,d.name,'','',0,NULL,1,d.alignment,d.portfolio,d.symbol
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_deities x WHERE x.slug=d.slug AND x.owner_user_id IS NULL
);

WITH desired(deity_slug,domain_slug) AS (VALUES
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
  ('moradin','earth'),('moradin','good'),('moradin','law'),('moradin','protection'),
  ('nerull','death'),('nerull','evil'),('nerull','trickery'),
  ('obad-hai','air'),('obad-hai','animal'),('obad-hai','earth'),('obad-hai','fire'),('obad-hai','plant'),('obad-hai','water'),
  ('olidammara','chaos'),('olidammara','luck'),('olidammara','trickery'),
  ('pelor','good'),('pelor','healing'),('pelor','strength'),('pelor','sun'),
  ('st-cuthbert','destruction'),('st-cuthbert','law'),('st-cuthbert','protection'),('st-cuthbert','strength'),
  ('vecna','evil'),('vecna','knowledge'),('vecna','magic'),
  ('wee-jas','death'),('wee-jas','law'),('wee-jas','magic'),
  ('yondalla','good'),('yondalla','law'),('yondalla','protection')
)
INSERT INTO dnd35_deity_domains (deity_id,domain_id)
SELECT deity.id,domain.id
FROM desired d
JOIN dnd35_deities deity ON deity.slug=d.deity_slug AND deity.owner_user_id IS NULL
JOIN dnd35_domains domain ON domain.slug=d.domain_slug AND domain.owner_user_id IS NULL
ON CONFLICT(deity_id,domain_id) DO NOTHING;
