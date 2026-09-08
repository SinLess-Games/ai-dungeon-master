-- Dungeon Master's Guide II source-backed rules catalog.
-- Mechanical summaries are intentionally concise; the supplied sourcebook remains authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg2-3.5','dungeon-masters-guide-ii-3-5','Dungeon Master''s Guide II','DMG II',
        'Wizards of the Coast','dnd','3.5','D&D v.3.5 Dungeon Master''s Guide II: expanded DM procedures, encounter subsystems, campaign tools, character teamwork systems, and magic-item options.',NULL,1,0,NULL);

WITH desired(slug,name,source_page,category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,summary,tags,mechanics) AS (VALUES
  ('dmg2-fun-first','Fun Is the Primary DM Goal','5','running-game','guidance',0,1,NULL,NULL,'The DM''s primary job is to make the game fun for the players and the DM; other priorities are subordinate to that goal.','["dm","fun","table"]','{}'),
  ('dmg2-read-your-players','Read Your Players','5','running-game','guidance',0,1,NULL,NULL,'Observe what energizes, bores, frustrates, or engages each player and use those signals to tune future sessions.','["players","engagement"]','{}'),
  ('dmg2-something-for-everyone','Something for Everyone','5','running-game','guidance',0,1,NULL,NULL,'Once player preferences are understood, include opportunities that reward different tastes across a session or series of sessions.','["players","engagement"]','{}'),
  ('dmg2-keep-energy-up','Keep the Energy Level Up','5','running-game','guidance',0,1,NULL,NULL,'Maintain attention and excitement through presentation, pacing, clear focus, and energetic descriptions.','["pacing","engagement"]','{}'),
  ('dmg2-be-prepared','Be Prepared','5','running-game','guidance',0,1,NULL,NULL,'Use available preparation time deliberately, prioritizing material most likely to matter at the next session.','["preparation"]','{}'),
  ('dmg2-world-serves-game','World Serves the Game','6','running-game','guidance',0,1,NULL,NULL,'Prepared setting material is provisional until it enters play; revise minor unestablished details when doing so clearly improves the game.','["worldbuilding","improvisation"]','{}'),
  ('dmg2-continuity-priority','Continuity and Internal Consistency','6','running-game','guidance',0,1,NULL,NULL,'Preserve details players vividly remember; minor background facts can bend when nobody is invested in them and a change produces a better session.','["continuity","worldbuilding"]','{}'),
  ('dmg2-dm-authority-tool','DM Authority Is a Tool','7','running-game','guidance',0,1,NULL,NULL,'Use authority to focus play and enable fun, not to win social contests or deny player agency for its own sake.','["dm","authority"]','{}'),
  ('dmg2-player-style-observation','Know Your Players by Observation','8','running-game','guidance',0,1,NULL,NULL,'Track which scenes and incentives draw individual players into active participation rather than relying only on stated preferences.','["players","observation"]','{}'),
  ('dmg2-postgame-analysis','Postgame Analysis','8','running-game','procedure',0,1,NULL,NULL,'After a session, record highlights, key players, payoffs, weak points, affected players, and likely causes to improve future session design.','["session-review","players"]','{}'),
  ('dmg2-character-sheet-incentives','Decode Character Sheet Incentives','8','running-game','guidance',0,1,NULL,NULL,'Character build choices reveal desired play opportunities; create scenes where selected abilities, specialties, and themes matter.','["players","character-sheet"]','{}'),
  ('dmg2-incentive-power-accumulation','Player Incentive: Accumulating Cool Powers','9','running-game','guidance',0,1,NULL,NULL,'Players motivated by advancement respond to XP, treasure, new options, and opportunities to demonstrate newly acquired capabilities.','["players","incentives"]','{}'),
  ('dmg2-incentive-combat','Player Incentive: Kicking Butt','9','running-game','guidance',0,1,NULL,NULL,'Action-oriented players need exciting combats and can lose focus during long stretches without meaningful action.','["players","incentives","combat"]','{}'),
  ('dmg2-incentive-planning','Player Incentive: Brilliant Planning','10','running-game','guidance',0,1,NULL,NULL,'Reward careful plans when they exploit real information and terrain; do not invalidate a sound plan merely to force a longer fight.','["players","planning"]','{}'),
  ('dmg2-incentive-puzzles','Player Incentive: Puzzle Solving','11','running-game','guidance',0,1,NULL,NULL,'Puzzles and mysteries should challenge without blocking the entire adventure; include alternate activities and fail-safes when a puzzle stalls.','["players","puzzles"]','{}'),
  ('dmg2-incentive-favorite-role','Player Incentive: Favorite Role','12','running-game','guidance',0,1,NULL,NULL,'Give recurring character archetypes chances to use their signature abilities and fulfill the fantasy the player repeatedly chooses.','["players","roleplaying"]','{}'),
  ('dmg2-incentive-supercool','Player Incentive: Supercoolness','13','running-game','guidance',0,1,NULL,NULL,'Describe both success and failure in a way that preserves a character''s intended tone without shielding the character from legitimate risk.','["players","tone"]','{}'),
  ('dmg2-incentive-story','Player Incentive: Story','14','running-game','guidance',0,1,NULL,NULL,'Use character backgrounds, recurring NPCs, unresolved threads, and escalating plot developments for players motivated by narrative.','["players","story"]','{}'),
  ('dmg2-incentive-psychodrama','Player Incentive: Psychodrama','14','running-game','guidance',0,1,NULL,NULL,'Provide character-focused conflicts through NPCs and choices without allowing one player''s dramatic needs to consume the group''s play or turn the DM role into therapy.','["players","roleplaying"]','{}'),
  ('dmg2-incentive-irresponsibility','Player Incentive: Irresponsibility','15','running-game','guidance',0,1,NULL,NULL,'Provide harmless opportunities to defy corrupt authority or cause controlled mayhem so bored players are less likely to derail unrelated scenes.','["players","incentives"]','{}'),
  ('dmg2-incentive-exploration','Player Incentive: Setting Exploration','16','running-game','guidance',0,1,NULL,NULL,'Reward curiosity with meaningful places, secrets, maps, cultures, and discoveries instead of making exploration empty travel.','["players","exploration"]','{}'),
  ('dmg2-ground-rules','Ground Rules','22','running-game','guidance',0,1,NULL,NULL,'Agree on expectations for attendance, character creation, allowed books, table conduct, disputes, and campaign boundaries before they become conflicts.','["table","ground-rules"]','{}'),
  ('dmg2-communication-key','Communication Is Key','26','running-game','guidance',0,1,NULL,NULL,'Use clear descriptions, active listening, explicit turn-taking, and concise rulings to keep all players informed and involved.','["communication"]','{}'),
  ('dmg2-pay-attention','Paying Attention','29','running-game','guidance',0,1,NULL,NULL,'Monitor player focus and scene energy; redirect attention, change scene type, or move forward when the table disengages.','["attention","pacing"]','{}'),
  ('dmg2-keep-it-moving','Keep It Moving','29','running-game','guidance',0,1,NULL,NULL,'Compress low-value procedures, summarize uneventful transitions, and cut away from stalled discussion to preserve momentum.','["pacing"]','{}'),
  ('dmg2-preparation-priorities','Preparation Priorities','32','running-game','procedure',0,1,NULL,NULL,'When prep time is limited, prioritize likely encounters, critical NPC motives, rules references, maps, and flexible material before optional detail.','["preparation"]','{}'),
  ('dmg2-improvisational-aids','Improvisational Aids','34','running-game','guidance',0,1,NULL,NULL,'Keep reusable names, NPC traits, locations, motives, encounter ideas, and other modular prompts available for unplanned player choices.','["improvisation"]','{}'),
  ('dmg2-troubleshooting-communication','Troubleshooting through Communication','34','running-game','guidance',0,1,NULL,NULL,'Address table problems directly and privately when appropriate, focusing on behavior and desired play rather than personal attacks.','["table","communication"]','{}'),
  ('dmg2-mediation','Mediation','35','running-game','guidance',0,1,NULL,NULL,'When players conflict, identify the actual disagreement, let each side be heard, and seek a practical solution that preserves group play.','["table","conflict"]','{}'),
  ('dmg2-selfish-player','Selfishness at the Table','36','running-game','guidance',0,1,NULL,NULL,'Intervene when one player''s behavior consistently takes fun or decision-making away from the rest of the group.','["table","conflict"]','{}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dmg2-3.5-rule-' || d.slug, 'dmg2-3.5', d.source_page, d.slug, d.name, d.summary, d.summary,
  0,NULL,1,d.category,d.kind,d.is_variant,d.default_enabled,d.parent_slug,d.supersedes_slug,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r
  WHERE r.slug=d.slug AND r.owner_user_id IS NULL
);
