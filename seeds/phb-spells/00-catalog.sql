-- phb-spells: shared spell catalog primitives.
-- Source: Player's Handbook v3.5, Chapters 10-11.
-- Run before 10-spells.sql. Safe to re-run.

INSERT OR IGNORE INTO dnd35_sources (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id) VALUES
('phb-3.5','players-handbook-3-5','Player''s Handbook','PHB','Wizards of the Coast','dnd','3.5','Core Rulebook I; source for the core D&D v3.5 spell catalog.',NULL,1,0,NULL);

INSERT OR IGNORE INTO dnd35_spell_schools (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,specialization_text) VALUES
  ('phb-spell-school-abjuration','phb-3.5','172-175','abjuration','Abjuration','Abjuration school of magic.','Core PHB spell school.',0,NULL,1,NULL),
  ('phb-spell-school-conjuration','phb-3.5','172-175','conjuration','Conjuration','Conjuration school of magic.','Core PHB spell school.',0,NULL,1,NULL),
  ('phb-spell-school-divination','phb-3.5','172-175','divination','Divination','Divination school of magic.','Core PHB spell school.',0,NULL,1,NULL),
  ('phb-spell-school-enchantment','phb-3.5','172-175','enchantment','Enchantment','Enchantment school of magic.','Core PHB spell school.',0,NULL,1,NULL),
  ('phb-spell-school-evocation','phb-3.5','172-175','evocation','Evocation','Evocation school of magic.','Core PHB spell school.',0,NULL,1,NULL),
  ('phb-spell-school-illusion','phb-3.5','172-175','illusion','Illusion','Illusion school of magic.','Core PHB spell school.',0,NULL,1,NULL),
  ('phb-spell-school-necromancy','phb-3.5','172-175','necromancy','Necromancy','Necromancy school of magic.','Core PHB spell school.',0,NULL,1,NULL),
  ('phb-spell-school-transmutation','phb-3.5','172-175','transmutation','Transmutation','Transmutation school of magic.','Core PHB spell school.',0,NULL,1,NULL),
  ('phb-spell-school-universal','phb-3.5','172-175','universal','Universal','Universal school of magic.','Core PHB spell school.',0,NULL,1,NULL);

INSERT OR IGNORE INTO dnd35_spell_descriptors (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled) VALUES
  ('phb-spell-descriptor-acid','phb-3.5','172-175','acid','Acid','Spell descriptor: Acid.','Core PHB spell descriptor.',0,NULL,1),
  ('phb-spell-descriptor-air','phb-3.5','172-175','air','Air','Spell descriptor: Air.','Core PHB spell descriptor.',0,NULL,1),
  ('phb-spell-descriptor-chaotic','phb-3.5','172-175','chaotic','Chaotic','Spell descriptor: Chaotic.','Core PHB spell descriptor.',0,NULL,1),
  ('phb-spell-descriptor-cold','phb-3.5','172-175','cold','Cold','Spell descriptor: Cold.','Core PHB spell descriptor.',0,NULL,1),
  ('phb-spell-descriptor-darkness','phb-3.5','172-175','darkness','Darkness','Spell descriptor: Darkness.','Core PHB spell descriptor.',0,NULL,1),
  ('phb-spell-descriptor-death','phb-3.5','172-175','death','Death','Spell descriptor: Death.','Core PHB spell descriptor.',0,NULL,1),
  ('phb-spell-descriptor-earth','phb-3.5','172-175','earth','Earth','Spell descriptor: Earth.','Core PHB spell descriptor.',0,NULL,1),
  ('phb-spell-descriptor-electricity','phb-3.5','172-175','electricity','Electricity','Spell descriptor: Electricity.','Core PHB spell descriptor.',0,NULL,1),
  ('phb-spell-descriptor-evil','phb-3.5','172-175','evil','Evil','Spell descriptor: Evil.','Core PHB spell descriptor.',0,NULL,1),
  ('phb-spell-descriptor-fear','phb-3.5','172-175','fear','Fear','Spell descriptor: Fear.','Core PHB spell descriptor.',0,NULL,1),
  ('phb-spell-descriptor-fire','phb-3.5','172-175','fire','Fire','Spell descriptor: Fire.','Core PHB spell descriptor.',0,NULL,1),
  ('phb-spell-descriptor-fire-or-cold','phb-3.5','172-175','fire-or-cold','Fire or Cold','Spell descriptor: Fire or Cold.','Core PHB spell descriptor.',0,NULL,1),
  ('phb-spell-descriptor-force','phb-3.5','172-175','force','Force','Spell descriptor: Force.','Core PHB spell descriptor.',0,NULL,1),
  ('phb-spell-descriptor-good','phb-3.5','172-175','good','Good','Spell descriptor: Good.','Core PHB spell descriptor.',0,NULL,1),
  ('phb-spell-descriptor-language-dependent','phb-3.5','172-175','language-dependent','Language-Dependent','Spell descriptor: Language-Dependent.','Core PHB spell descriptor.',0,NULL,1),
  ('phb-spell-descriptor-lawful','phb-3.5','172-175','lawful','Lawful','Spell descriptor: Lawful.','Core PHB spell descriptor.',0,NULL,1),
  ('phb-spell-descriptor-light','phb-3.5','172-175','light','Light','Spell descriptor: Light.','Core PHB spell descriptor.',0,NULL,1),
  ('phb-spell-descriptor-mind-affecting','phb-3.5','172-175','mind-affecting','Mind-Affecting','Spell descriptor: Mind-Affecting.','Core PHB spell descriptor.',0,NULL,1),
  ('phb-spell-descriptor-sonic','phb-3.5','172-175','sonic','Sonic','Spell descriptor: Sonic.','Core PHB spell descriptor.',0,NULL,1),
  ('phb-spell-descriptor-water','phb-3.5','172-175','water','Water','Spell descriptor: Water.','Core PHB spell descriptor.',0,NULL,1);

INSERT OR IGNORE INTO dnd35_domains (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,granted_power_text) VALUES
  ('phb-domain-air','phb-3.5','185-189','air','Air','Air cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-animal','phb-3.5','185-189','animal','Animal','Animal cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-chaos','phb-3.5','185-189','chaos','Chaos','Chaos cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-death','phb-3.5','185-189','death','Death','Death cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-destruction','phb-3.5','185-189','destruction','Destruction','Destruction cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-earth','phb-3.5','185-189','earth','Earth','Earth cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-evil','phb-3.5','185-189','evil','Evil','Evil cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-fire','phb-3.5','185-189','fire','Fire','Fire cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-good','phb-3.5','185-189','good','Good','Good cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-healing','phb-3.5','185-189','healing','Healing','Healing cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-knowledge','phb-3.5','185-189','knowledge','Knowledge','Knowledge cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-law','phb-3.5','185-189','law','Law','Law cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-luck','phb-3.5','185-189','luck','Luck','Luck cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-magic','phb-3.5','185-189','magic','Magic','Magic cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-plant','phb-3.5','185-189','plant','Plant','Plant cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-protection','phb-3.5','185-189','protection','Protection','Protection cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-strength','phb-3.5','185-189','strength','Strength','Strength cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-sun','phb-3.5','185-189','sun','Sun','Sun cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-travel','phb-3.5','185-189','travel','Travel','Travel cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-trickery','phb-3.5','185-189','trickery','Trickery','Trickery cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-war','phb-3.5','185-189','war','War','War cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL),
  ('phb-domain-water','phb-3.5','185-189','water','Water','Water cleric domain.','Core PHB cleric domain; granted power can be enriched by the dedicated domain seed.',0,NULL,1,NULL);
