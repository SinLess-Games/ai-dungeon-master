-- Dungeon Master's Guide source-backed rules catalog.
-- Mechanical summaries are intentionally concise; the supplied sourcebook remains authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG',
        'Wizards of the Coast','dnd','3.5','D&D v.3.5 core Dungeon Master''s Guide, including the official errata appended to the supplied source PDF.',NULL,1,0,NULL);

WITH desired(slug,name,source_page,category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,summary,tags,mechanics) AS (VALUES
  ('dmg-avalanche','Avalanches','90','hazards','rule',0,1,NULL,NULL,'Avalanches have a moving burying zone and can deal damage, bury creatures, and require digging or checks to escape.','["hazards","mountains"]','{}'),
  ('dmg-altitude-sickness','Altitude Sickness','90','hazards','rule',0,1,NULL,NULL,'High altitude can fatigue or harm unacclimated creatures according to elevation, exposure, and Fortitude saves.','["hazards","altitude"]','{}'),
  ('dmg-desert-terrain','Desert Terrain','91','environment','rule',0,1,NULL,NULL,'Desert terrain defines dunes, rocky desert, movement, visibility, heat, and scarcity-related hazards.','["terrain","desert"]','{}'),
  ('dmg-plains-terrain','Plains Terrain','91','environment','rule',0,1,NULL,NULL,'Plains terrain defines visibility, cover scarcity, grasslands, and movement characteristics.','["terrain","plains"]','{}'),
  ('dmg-aquatic-terrain','Aquatic Terrain','92','environment','rule',0,1,NULL,NULL,'Aquatic terrain defines swimming, currents, visibility, depth, pressure, and other water-based movement constraints.','["terrain","aquatic"]','{}'),
  ('dmg-underwater-combat','Underwater Combat','93','combat','rule',0,1,NULL,NULL,'Underwater combat modifies weapon effectiveness, movement, spellcasting, fire effects, and attack options according to whether creatures have appropriate movement or freedom.','["underwater","combat"]','{}'),
  ('dmg-weather','Weather','93','environment','table',0,1,NULL,NULL,'Weather tables and rules cover wind, rain, snow, storms, temperature, visibility, and their mechanical effects.','["weather"]','{}'),
  ('dmg-wind-effects','Wind Effects','95','environment','rule',0,1,NULL,NULL,'Wind strength can penalize ranged attacks, extinguish flames, impede movement, and affect creatures by size; severe winds impose stronger effects.','["wind","weather"]','{}'),
  ('dmg-urban-features','Urban Features','99','environment','rule',0,1,NULL,NULL,'City streets, buildings, crowds, lighting, rooftops, and structures provide movement, cover, concealment, climb, and encounter constraints.','["urban"]','{}'),
  ('dmg-urban-weapon-spell-restrictions','Urban Weapon and Spell Restrictions','99','campaign','guidance',0,1,NULL,NULL,'Law, social norms, and local enforcement can restrict visible weapons and spell use; consequences depend on the settlement and campaign.','["urban","law"]','{}'),
  ('dmg-npc-classes','NPC Classes','107','npcs','rule',0,1,NULL,NULL,'Adept, aristocrat, commoner, expert, and warrior provide class progressions for ordinary NPC roles and use the standard multiclass/advancement framework.','["npc","classes"]','{}'),
  ('dmg-npc-generation','NPC Statistics','110','npcs','procedure',0,1,NULL,NULL,'NPC statistics can be generated from level, class, race, ability-score array, gear, skills, feats, spells, and expected wealth according to NPC tables.','["npc","generation"]','{}'),
  ('dmg-npc-attitudes','NPC Attitudes','128','social','rule',0,1,NULL,NULL,'NPC reactions use attitude categories from hostile through helpful; social checks and circumstances can improve or worsen attitude within the limits of the relevant skill rules.','["npc","attitude","social"]','{}'),
  ('dmg-fleshing-out-npcs','Fleshing Out NPCs','128','npcs','guidance',0,1,NULL,NULL,'Use goals, appearance, mannerisms, relationships, possessions, and history to distinguish important NPCs beyond their statistics.','["npc","roleplaying"]','{}'),
  ('dmg-establish-campaign','Establishing a Campaign','129','campaign','guidance',0,1,NULL,NULL,'Define the campaign premise, starting conditions, allowed options, setting assumptions, tone, and expected style before play.','["campaign"]','{}'),
  ('dmg-maintain-campaign','Maintaining a Campaign','130','campaign','guidance',0,1,NULL,NULL,'Track consequences, recurring NPCs, timelines, character goals, setting changes, and pacing to keep the campaign coherent over time.','["campaign","continuity"]','{}'),
  ('dmg-character-world-roles','Characters and the World Around Them','131','campaign','guidance',0,1,NULL,NULL,'Character classes and levels imply social roles and reactions in the world, but the setting can modify those assumptions.','["worldbuilding","characters"]','{}'),
  ('dmg-war-calamities','War and Other Calamities','133','campaign','guidance',0,1,NULL,NULL,'Large-scale wars, disasters, plagues, and upheavals primarily shape adventures and setting conditions; resolve only the details relevant to play.','["campaign","war"]','{}'),
  ('dmg-changing-alignment','Changing Alignment','134','alignment','guidance',0,1,NULL,NULL,'Alignment can change when sustained choices demonstrate a genuine shift; mechanical consequences follow class, spell, item, or planar rules that depend on alignment.','["alignment"]','{}'),
  ('dmg-character-power-level','Character Power Level','135','campaign','guidance',0,1,NULL,NULL,'Monitor party capability, wealth, unusual abilities, and item access against expected level so encounter and reward assumptions remain useful.','["balance","wealth"]','{}'),
  ('dmg-community-statistics','Community Statistics','137','worldbuilding','table',0,1,NULL,NULL,'Settlement size determines population range and contributes to expected highest-level NPCs, available goods, and economic assets.','["settlements","worldbuilding"]','{}'),
  ('dmg-community-power-centers','Community Power Centers','138','worldbuilding','procedure',0,1,NULL,NULL,'A settlement can have one or more political, economic, religious, or other power centers with alignments and relationships that shape local conflicts.','["settlements","politics"]','{}'),
  ('dmg-gp-limit-assets','Community GP Limit and Assets','137','economy','table',0,1,NULL,NULL,'Settlement size sets a gp limit for readily available individual items and an estimate of total liquid community assets.','["settlements","economy"]','{}'),
  ('dmg-world-building','World-Building','135','worldbuilding','guidance',0,1,NULL,NULL,'Build only the geography, cultures, organizations, history, economics, and cosmology needed to support play, expanding detail as characters encounter it.','["worldbuilding"]','{}'),
  ('dmg-different-world','Building a Different World','144','worldbuilding','guidance',0,1,NULL,NULL,'Changing technology, culture, weapons, magic assumptions, or genre conventions can alter baseline rules and available content; document campaign-specific changes.','["worldbuilding","variants"]','{}'),
  ('dmg-planar-traits','Planar Traits','147','planes','rule',0,1,NULL,NULL,'Planes can have physical, elemental, energy, alignment, magic, gravity, and time traits that modify creatures, spells, movement, and survival.','["planes"]','{}'),
  ('dmg-planar-travel','Adventuring on Other Planes','147','planes','rule',0,1,NULL,NULL,'Planar travel subjects creatures to destination traits and hazards; planar access, navigation, survival, and return depend on spells, portals, and plane properties.','["planes","travel"]','{}'),
  ('dmg-create-cosmology','Creating a Cosmology','167','worldbuilding','guidance',0,1,NULL,NULL,'A campaign can use the standard cosmology or define its own planar arrangement, links, traits, deities, and travel assumptions.','["planes","worldbuilding"]','{}'),
  ('dmg-race-modification','Modifying a Common Race','171','characters','guidance',0,1,NULL,NULL,'Race alterations should be evaluated for ability adjustments, size, movement, senses, traits, favored class, level adjustment, and interaction with existing options.','["race","design"]','{}'),
  ('dmg-monsters-as-races','Monsters as Races','172','characters','rule',0,1,NULL,NULL,'Monstrous characters combine racial Hit Dice, level adjustment, and class levels to determine effective character level and advancement.','["race","ecl"]','{}'),
  ('dmg-modifying-classes','Modifying Character Classes','174','characters','guidance',0,1,NULL,NULL,'Class changes should preserve role, progression, and overall power while considering what is traded away and how changes interact with multiclassing.','["classes","design"]','{}'),
  ('dmg-creating-classes','Creating New Classes','175','characters','guidance',0,1,NULL,NULL,'New base classes should be benchmarked against existing class chassis, level progression, class features, spellcasting, skills, and multiclass implications.','["classes","design"]','{}'),
  ('dmg-prestige-class-qualification','Prestige Class Qualification','176','characters','rule',0,1,NULL,NULL,'A character must meet all listed prerequisites before taking the first level of a prestige class; losing a prerequisite can affect access only where a rule specifically says so.','["prestige-class"]','{}'),
  ('dmg-learning-skills-feats','Learning Skills and Feats','197','advancement','rule',0,1,NULL,NULL,'On gaining a level, spend skill points and select feats as granted by character level or class progression, meeting prerequisites at the time selected.','["advancement","skills","feats"]','{}'),
  ('dmg-learning-new-spells','Learning New Spells','198','advancement','rule',0,1,NULL,NULL,'Spell acquisition on advancement follows class-specific preparation/spellbook/spells-known rules and any campaign access requirements.','["advancement","spells"]','{}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dmg-3.5-rule-' || d.slug, 'dmg-3.5', d.source_page, d.slug, d.name, d.summary, d.summary,
  0,NULL,1,d.category,d.kind,d.is_variant,d.default_enabled,d.parent_slug,d.supersedes_slug,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r
  WHERE r.slug=d.slug AND r.owner_user_id IS NULL
);
