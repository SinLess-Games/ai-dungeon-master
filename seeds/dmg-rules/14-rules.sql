-- Dungeon Master's Guide source-backed rules catalog.
-- Mechanical summaries are intentionally concise; the supplied sourcebook remains authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG',
        'Wizards of the Coast','dnd','3.5','D&D v.3.5 core Dungeon Master''s Guide, including the official errata appended to the supplied source PDF.',NULL,1,0,NULL);

WITH desired(slug,name,source_page,category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,summary,tags,mechanics) AS (VALUES
  ('dmg-charm-compulsion','Charm and Compulsion','291','special-abilities','rule',0,1,NULL,NULL,'Charm changes attitude/relationship without total control; compulsion can directly force behavior within the effect''s limits.','["mind-affecting"]','{}'),
  ('dmg-energy-drain-negative-levels','Energy Drain and Negative Levels','293','special-abilities','rule',0,1,NULL,NULL,'Negative levels impose cumulative penalties and can lead to permanent level loss if not removed; rules specify saves, duration, and restoration.','["negative-levels"]','{}'),
  ('dmg-gaze-attacks','Gaze Attacks','294','special-abilities','rule',0,1,NULL,NULL,'Gaze attacks affect creatures that meet the gaze within range; creatures can avert or close eyes for tradeoffs in exposure and combat effectiveness.','["gaze"]','{}'),
  ('dmg-incorporeal','Incorporeal','294','special-abilities','rule',0,1,NULL,NULL,'Incorporeal creatures interact specially with physical attacks, force effects, magic weapons, movement through objects, and material creatures.','["incorporeal"]','{}'),
  ('dmg-invisibility','Invisibility','295','special-abilities','rule',0,1,NULL,NULL,'Invisible creatures gain concealment-related benefits and are harder to locate; attacking generally ends ordinary invisibility, while detection can reveal position without necessarily negating the condition.','["invisibility"]','{}'),
  ('dmg-paralysis','Paralysis','300','conditions','rule',0,1,NULL,NULL,'A paralyzed creature is immobile and helpless but can take purely mental actions when the underlying effect allows.','["paralysis","conditions"]','{}'),
  ('dmg-poison','Poison','296','hazards','rule',0,1,NULL,NULL,'Poison has type, save DC, initial damage, and secondary damage; a second save after the listed interval determines secondary effects.','["poison"]','{}'),
  ('dmg-polymorph-special-ability','Polymorph Effects','297','special-abilities','rule',0,1,NULL,NULL,'Polymorph effects replace or retain statistics according to the specific effect; equipment behavior follows the current polymorph/alternate-form rules and errata.','["polymorph"]','{}'),
  ('dmg-polymorph-equipment-errata','Polymorph Equipment Errata','297','special-abilities','rule',0,1,NULL,'dmg-polymorph-equipment','A polymorphed creature keeps worn or held equipment if the new form can wear or hold it; otherwise that equipment melds into the form and ceases functioning for the duration.','["polymorph","errata"]','{}'),
  ('dmg-regeneration','Regeneration','298','special-abilities','rule',0,1,NULL,NULL,'Regeneration converts most lethal damage to nonlethal except specified damage types and governs regrowth/reattachment as the ability states.','["regeneration"]','{}'),
  ('dmg-scent','Scent','298','special-abilities','rule',0,1,NULL,NULL,'Scent detects nearby creatures by smell, can determine direction at close range, and can track using Wisdom/Survival as specified.','["scent"]','{}'),
  ('dmg-spell-resistance','Spell Resistance','298','magic','rule',0,1,NULL,NULL,'When a spell directly affects a creature with spell resistance, the caster makes a caster-level check against SR; check once per particular casting and reuse that result for later contact with the same casting.','["spell-resistance"]','{}'),
  ('dmg-turn-resistance','Turn Resistance','300','special-abilities','rule',0,1,NULL,NULL,'Turn resistance increases effective Hit Dice for resolving turning or rebuking attempts by the listed amount.','["turning"]','{}'),
  ('dmg-condition-summary','Condition Summary','300','conditions','table',0,1,NULL,NULL,'The condition summary defines mechanical consequences for common conditions such as blinded, dazed, dying, exhausted, fatigued, helpless, nauseated, prone, sickened, stunned, and unconscious.','["conditions"]','{}'),
  ('dmg-acid-effects','Acid Effects','302','environment','rule',0,1,NULL,NULL,'Acid deals damage based on contact or immersion, with repeated exposure according to the hazard rules; objects can also be damaged.','["acid","hazards"]','{}'),
  ('dmg-cold-dangers','Cold Dangers','302','environment','rule',0,1,NULL,NULL,'Cold exposure can deal nonlethal and then lethal damage, inflict fatigue, and interact with severe cold, protection, and survival checks.','["cold","hazards"]','{}'),
  ('dmg-heat-dangers','Heat Dangers','303','environment','rule',0,1,NULL,NULL,'Heat exposure can deal nonlethal damage and cause fatigue/heatstroke, with hotter conditions increasing save difficulty and frequency.','["heat","hazards"]','{}'),
  ('dmg-catching-fire','Catching on Fire','303','environment','rule',0,1,NULL,NULL,'A creature exposed to significant flame may catch fire, takes ongoing fire damage, and can attempt to extinguish flames using the specified save/action methods.','["fire","hazards"]','{}'),
  ('dmg-lava','Lava Effects','304','environment','rule',0,1,NULL,NULL,'Lava or magma deals heavy fire damage on contact and continuing damage after exposure; immersion is significantly worse than brief contact.','["lava","hazards"]','{}'),
  ('dmg-smoke','Smoke Effects','304','environment','rule',0,1,NULL,NULL,'Heavy smoke obscures vision and can force Fortitude saves against choking/nonlethal damage, with repeated exposure increasing danger.','["smoke","hazards"]','{}'),
  ('dmg-suffocation','Suffocation','304','environment','rule',0,1,NULL,NULL,'When air runs out, creatures make escalating Constitution checks; failure leads rapidly to unconsciousness, dying, and suffocation according to the suffocation sequence.','["suffocation","hazards"]','{}'),
  ('dmg-slow-suffocation-errata','Slow Suffocation Errata','304','environment','rule',0,1,NULL,'dmg-slow-suffocation','When slow-suffocation nonlethal damage makes a character unconscious, the character drops to -1 hit points and is dying; in the next round the character suffocates.','["suffocation","errata"]','{"unconscious_hp":-1,"death_delay_rounds":1}'),
  ('dmg-drowning','Drowning','304','environment','rule',0,1,NULL,NULL,'A character can hold breath for twice Constitution score in rounds, then makes a DC 10 Constitution check each round with DC increasing by 1; on failure: round 1 unconscious at 0 hp, round 2 -1 hp and dying, round 3 drowned.','["drowning","hazards"]','{"breath_rounds_formula":"2 * Constitution score","initial_check_dc":10,"dc_increase_per_round":1,"failure_sequence":[{"round":1,"state":"unconscious","hp":0},{"round":2,"state":"dying","hp":-1},{"round":3,"state":"drowned"}]}'),
  ('dmg-falling','Falling','303','environment','rule',0,1,NULL,NULL,'Falling deals damage by distance subject to the falling rules, with maximum normal falling damage and modifiers for intentional jumps, soft surfaces, or falling objects.','["falling","hazards"]','{}'),
  ('dmg-falling-objects','Falling Objects','303','environment','table',0,1,NULL,NULL,'Damage from falling objects depends on object weight and falling distance, subject to the environmental hazard table.','["falling","objects"]','{}'),
  ('dmg-starvation-thirst','Starvation and Thirst','304','environment','rule',0,1,NULL,NULL,'After going without food or water for the allowed interval, characters make escalating Constitution checks and take nonlethal damage until they eat/drink and recover.','["survival","hazards"]','{}'),
  ('dmg-sleep','Sleep Deprivation and Rest','304','environment','guidance',0,1,NULL,NULL,'Rest requirements interact with natural healing, spell preparation, fatigue, and environmental endurance; the DM adjudicates prolonged deprivation using the relevant fatigue rules.','["rest","fatigue"]','{}')
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
