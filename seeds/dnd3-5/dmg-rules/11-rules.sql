-- Dungeon Master's Guide source-backed rules catalog.
-- Mechanical summaries are intentionally concise; the supplied sourcebook remains authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG',
        'Wizards of the Coast','dnd','3.5','D&D v.3.5 core Dungeon Master''s Guide, including the official errata appended to the supplied source PDF.',NULL,1,0,NULL);

WITH desired(slug,name,source_page,category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,summary,tags,mechanics) AS (VALUES
  ('dmg-character-death','Character Death','41','characters','rule',0,1,NULL,NULL,'Death, raising, and replacement-character consequences are adjudicated using the core death and resurrection rules plus campaign-level decisions.','["death","characters"]','{}'),
  ('dmg-new-character-after-death','Making a New Character','42','characters','guidance',0,1,NULL,NULL,'A replacement character should enter at a level and wealth appropriate to the campaign and group, avoiding both punitive underpowering and undue advantage.','["replacement","characters"]','{}'),
  ('dmg-adventure-motivation','Adventure Motivation','43','adventures','guidance',0,1,NULL,NULL,'Give characters a reason to engage with an adventure that matches their goals and the campaign.','["adventure-design"]','{}'),
  ('dmg-adventure-structure','Adventure Structure','44','adventures','guidance',0,1,NULL,NULL,'Adventures can be organized around sites, events, or combinations of both; structure should support meaningful choices and escalation.','["adventure-design"]','{}'),
  ('dmg-site-based-adventures','Site-Based Adventures','46','adventures','guidance',0,1,NULL,NULL,'A site-based adventure is organized primarily around locations and the encounters, clues, hazards, and inhabitants within them.','["adventure-design"]','{}'),
  ('dmg-event-based-adventures','Event-Based Adventures','47','adventures','guidance',0,1,NULL,NULL,'An event-based adventure is organized around events, timelines, reactions, and consequences rather than only map locations.','["adventure-design"]','{}'),
  ('dmg-tailored-vs-status-quo','Tailored or Status Quo Encounters','48','encounters','guidance',0,1,NULL,NULL,'Encounters may be tailored to party capability or exist as status-quo world elements; make the campaign''s assumptions legible enough for players to make informed choices.','["encounters","world"]','{}'),
  ('dmg-challenge-rating','Challenge Rating','48','encounters','rule',0,1,NULL,NULL,'Challenge Rating estimates the difficulty of a single creature or obstacle for a four-character party of the indicated level.','["cr","encounters"]','{}'),
  ('dmg-encounter-level','Encounter Level','48','encounters','rule',0,1,NULL,NULL,'Encounter Level combines multiple creatures or hazards into an approximate overall encounter difficulty.','["el","encounters"]','{}'),
  ('dmg-encounter-difficulty','Encounter Difficulty','49','encounters','guidance',0,1,NULL,NULL,'Vary encounter difficulty across an adventure; not every encounter should match party level, and very difficult encounters should have appropriate warning or escape possibilities.','["encounters","difficulty"]','{}'),
  ('dmg-tougher-monsters','Tougher Monsters','50','encounters','guidance',0,1,NULL,NULL,'Increasing a monster''s capabilities or adding class levels/templates changes the expected challenge and should be reflected in CR/encounter design.','["monsters","cr"]','{}'),
  ('dmg-encounter-location','Encounter Location','50','encounters','guidance',0,1,NULL,NULL,'Terrain, visibility, starting distance, cover, elevation, and hazards can materially change encounter difficulty.','["terrain","encounters"]','{}'),
  ('dmg-rewards-behavior','Rewards and Behavior','50','rewards','guidance',0,1,NULL,NULL,'Rewards influence player behavior; award XP and treasure in ways that reinforce the kinds of play the campaign intends to encourage.','["rewards","behavior"]','{}'),
  ('dmg-treasure-by-encounter','Treasure by Encounter','51','treasure','table',0,1,NULL,NULL,'Use encounter and level-based treasure guidelines to keep expected wealth roughly aligned with character level while allowing individual hoards to vary.','["treasure","wealth"]','{}'),
  ('dmg-character-wealth-by-level','Character Wealth by Level','54','treasure','table',0,1,NULL,NULL,'Expected total character wealth provides a benchmark for creating or auditing characters above 1st level and for spotting campaign wealth drift.','["wealth","characters"]','{}'),
  ('dmg-combining-adventures','Bringing Adventures Together','56','campaign','guidance',0,1,NULL,NULL,'Link adventures through recurring NPCs, consequences, locations, goals, and unresolved threads to form a campaign.','["campaign","adventures"]','{}'),
  ('dmg-between-adventures','Between Adventures','57','downtime','guidance',0,1,NULL,NULL,'Between adventures, resolve healing, shopping, research, training, crafting, travel, and campaign consequences according to elapsed time and the relevant subsystems.','["downtime"]','{}'),
  ('dmg-dungeon-terrain','Dungeon Terrain','59','environment','rule',0,1,NULL,NULL,'Dungeon walls, floors, doors, rooms, corridors, rubble, stairs, and other features have defined hardness, hit points, movement, and skill-check effects.','["dungeon","terrain"]','{}'),
  ('dmg-walls','Walls','59','environment','table',0,1,NULL,NULL,'Common wall materials define break DC, hardness, hit points, and climbing characteristics.','["walls","objects"]','{}'),
  ('dmg-doors','Doors','60','environment','table',0,1,NULL,NULL,'Doors have material-based hardness, hit points, break DCs, lock characteristics, and opening consequences.','["doors","objects"]','{}'),
  ('dmg-rooms','Rooms','62','environment','guidance',0,1,NULL,NULL,'Room construction and contents establish tactical space, visibility, cover, and exploration constraints.','["dungeon"]','{}'),
  ('dmg-corridors','Corridors','63','environment','guidance',0,1,NULL,NULL,'Corridor width, turns, intersections, slopes, and obstructions shape movement, sight lines, and encounter tactics.','["dungeon","movement"]','{}'),
  ('dmg-cave-ins-collapses','Cave-Ins and Collapses','66','hazards','rule',0,1,NULL,NULL,'Collapsing structures can bury creatures, deal damage, pin or entrap victims, and require checks or excavation to escape.','["hazards","collapse"]','{}'),
  ('dmg-illumination','Illumination','67','environment','rule',0,1,NULL,NULL,'Light sources and illumination categories determine visibility and interact with low-light vision, darkvision, concealment, and spotting.','["light","vision"]','{}'),
  ('dmg-trap-elements','Elements of a Trap','68','traps','rule',0,1,NULL,NULL,'A trap is defined by trigger, reset, bypass, Search DC, Disable Device DC, attack/save, effect, CR, and construction information as applicable.','["traps"]','{}'),
  ('dmg-trap-search-disable','Finding and Disabling Traps','68','traps','rule',0,1,NULL,NULL,'Search locates traps when the character is entitled to find them; Disable Device can defeat mechanical or magical traps according to trap type and DC.','["traps","skills"]','{}'),
  ('dmg-trap-challenge-rating','Trap Challenge Rating','75','traps','procedure',0,1,NULL,NULL,'Trap CR is estimated from attack bonus or save DC, damage/effects, detection/disabling difficulty, and special features.','["traps","cr"]','{}'),
  ('dmg-designing-traps','Designing a Trap','74','traps','procedure',0,1,NULL,NULL,'Choose trigger, effect, detection/disabling DCs, reset, bypass, CR, and construction cost, then verify the resulting threat against the trap guidelines.','["traps","design"]','{}'),
  ('dmg-wandering-monsters','Wandering Monsters','77','encounters','procedure',0,1,NULL,NULL,'Random encounter checks model creatures moving through an area; frequency and encounter tables should reflect the site''s ecology and danger.','["random-encounters","dungeon"]','{}'),
  ('dmg-random-dungeons','Random Dungeons','77','adventures','procedure',0,1,NULL,NULL,'Random dungeon tables can generate rooms, corridors, features, encounters, and treasure, with the DM interpreting results into a coherent site.','["random","dungeon"]','{}'),
  ('dmg-getting-lost','Getting Lost','86','travel','procedure',0,1,NULL,NULL,'When navigation is uncertain, use Survival checks modified by terrain, visibility, and circumstances; failed checks can misdirect travel until characters reorient.','["travel","survival"]','{}'),
  ('dmg-forest-terrain','Forest Terrain','87','environment','rule',0,1,NULL,NULL,'Forest terrain defines undergrowth, trees, visibility, movement, cover, and encounter effects.','["terrain","forest"]','{}'),
  ('dmg-marsh-terrain','Marsh Terrain','88','environment','rule',0,1,NULL,NULL,'Marsh terrain defines bogs, deep bogs, movement costs, concealment, and related hazards.','["terrain","marsh"]','{}'),
  ('dmg-hill-terrain','Hill Terrain','89','environment','rule',0,1,NULL,NULL,'Hill terrain defines slopes, elevation, movement, and visibility effects.','["terrain","hills"]','{}'),
  ('dmg-mountain-terrain','Mountain Terrain','89','environment','rule',0,1,NULL,NULL,'Mountain terrain defines steep slopes, cliffs, chasms, scree, altitude effects, and travel constraints.','["terrain","mountains"]','{}')
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
