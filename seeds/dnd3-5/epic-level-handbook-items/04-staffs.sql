-- Epic Level Handbook epic staffs.
-- Source: Epic Level Handbook, Chapter 4, pp. 142-144.
-- Mechanical text is summarized; source remains authoritative.
-- Epic staffs are created with 50 charges and cannot be recharged.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(
  id,page,slug,name,description,rules_text,price_copper,caster_level,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text
) AS (VALUES
('elh-item-staff-spheres','144','staff-of-spheres','Staff of Spheres',
 'An iron-shod wooden epic staff devoted to Otiluke sphere spells.',
 '50 charges. Spell-trigger powers: Otiluke''s freezing sphere (1 charge, DC 19), Otiluke''s resilient sphere (1 charge, DC 16), and Otiluke''s telekinetic sphere (1 charge, DC 22).',
 22837500,21,0,NULL,NULL,'Craft Staff; Craft Epic Staff; Otiluke''s freezing sphere; Otiluke''s resilient sphere; Otiluke''s telekinetic sphere.'),
('elh-item-staff-mighty-force','143','staff-of-mighty-force','Staff of Mighty Force',
 'A platinum-shod epic staff focused on force effects.',
 '50 charges. Spell-trigger powers: quickened shield (1 charge; activation limited to once per round), forcecage (1 charge), and Bigby''s crushing hand (1 charge).',
 26500000,21,0,NULL,NULL,'Craft Staff; Craft Epic Staff; Quicken Spell; Bigby''s crushing hand; forcecage; shield.'),
('elh-item-staff-walls','144','staff-of-walls','Staff of Walls',
 'A square metal epic staff that produces powerful barriers.',
 '50 charges. Spell-trigger powers: wall of iron, wall of stone, and wall of force, each costing 1 charge.',
 27562500,30,0,NULL,NULL,'Craft Staff; Craft Epic Staff; Extend Spell; extended wall of force; wall of iron; wall of stone.'),
('elh-item-staff-winter','144','staff-of-winter','Staff of Winter',
 'A frost-coated steel epic staff filled with intensified cold magic.',
 '50 charges. Spell-trigger powers: intensified cone of cold (2 charges, DC 28), intensified ice storm (2 charges, DC 26), intensified Otiluke''s freezing sphere (2 charges, DC 29), and wall of ice (1 charge).',
 29250000,24,0,NULL,NULL,'Craft Staff; Craft Epic Staff; Extend Spell; Intensify Spell; cone of cold; ice storm; Otiluke''s freezing sphere; wall of ice.'),
('elh-item-staff-prism','143-144','staff-of-prism','Staff of Prism',
 'A three-sided crystal epic staff devoted to prismatic effects.',
 '50 charges. Spell-trigger powers: extended prismatic sphere (1 charge, DC 25), extended prismatic spray (1 charge, DC 22), and extended prismatic wall (1 charge, DC 23).',
 32681200,21,0,NULL,NULL,'Craft Staff; Craft Epic Staff; Extend Spell; prismatic sphere; prismatic spray; prismatic wall.'),
('elh-item-staff-rapid-barrage','144','staff-of-rapid-barrage','Staff of Rapid Barrage',
 'An epic staff designed to unleash quickened attack magic at exceptional speed.',
 '50 charges. Either power is activated as a free action, but the staff can be activated only once per round: intensified quickened magic missile (1 charge; five missiles dealing 10 damage each) or heightened enhanced quickened fireball (1 charge; 20d6 damage, DC 19).',
 41775000,25,0,NULL,NULL,'Craft Staff; Craft Epic Staff; Enhance Spell; Heighten Spell; Intensify Spell; Quicken Spell; fireball; magic missile.'),
('elh-item-staff-planar-might','143','staff-of-planar-might','Staff of Planar Might',
 'An epic planar staff that protects its wielder from planar traits and calls extraplanar allies.',
 '50 charges. While held, the wielder ignores planar alignment traits and positive- or negative-dominant planar traits. Spell-trigger powers: greater planar ally, greater planar binding, and gate, each costing 1 charge. The staff is also a +5 outsider-bane quarterstaff; its bane alignment is determined when the item is generated. When depleted it remains a +5 quarterstaff without the other special abilities.',
 46000000,21,5,NULL,NULL,'Craft Staff; Craft Epic Staff; gate; greater planar ally; greater planar binding; protection from elements.'),
('elh-item-staff-domination','142','staff-of-domination','Staff of Domination',
 'A thick iron-banded epic staff that heightens coercive enchantments.',
 '50 charges. Spell-trigger powers: heightened dominate monster (1 charge, DC 33), heightened demand (1 charge, DC 32), heightened mass charm (1 charge, DC 32), and heightened geas (1 charge, DC 33).',
 46440000,21,0,NULL,NULL,'Craft Staff; Craft Epic Staff; Heighten Spell; demand; dominate monster; geas; mass charm.'),
('elh-item-staff-fiery-power','142-143','staff-of-fiery-power','Staff of Fiery Power',
 'A +5 flaming epic quarterstaff with fire resistance and destructive fire magic.',
 '50 charges. While held it grants fire resistance 30. Spell-trigger powers: extended wall of fire (1 charge, DC 18), intensified delayed blast fireball (2 charges; 240 damage, DC 22), meteor swarm heightened to 12th (2 charges, DC 30), and extended summon monster IX (2 charges; elder fire elemental only). It can be deliberately broken in a retributive strike whose damage scales with remaining charges; the breaker risks planar displacement or destruction. When depleted it remains a +5 quarterstaff without other special abilities.',
 50000000,25,5,NULL,NULL,'Craft Staff; Craft Epic Staff; Extend Spell; Heighten Spell; Improved Heighten Spell; Intensify Spell; Spell Focus (Evocation); continual flame; delayed blast fireball; meteor swarm; protection from elements; summon monster IX; wall of fire.'),
('elh-item-staff-natures-fury','143','staff-of-natures-fury','Staff of Nature''s Fury',
 'A lightning-scarred +5 aberration-bane oak quarterstaff containing destructive natural magic.',
 '50 charges. Spell-trigger powers: earthquake (1 charge), whirlwind heightened to 10th (1 charge, DC 25), and fire storm heightened to 10th (1 charge, DC 25). When depleted it remains a +5 quarterstaff without other special abilities.',
 50000000,21,5,NULL,NULL,'Craft Staff; Craft Epic Staff; Heighten Spell; Improved Heighten Spell; earthquake; fire storm; summon monster I or summon nature''s ally I; whirlwind.'),
('elh-item-staff-hierophants','143','staff-of-the-hierophants','Staff of the Hierophants',
 'An age-darkened carved epic staff containing intensified and extended druidic magic.',
 '50 charges. Spell-trigger powers: enlarged extended creeping doom (1 charge, DC 23), enlarged extended command plants (1 charge, DC 25), intensified elemental swarm (2 charges, DC 34), and intensified shambler (2 charges, DC 34).',
 50118700,27,0,NULL,NULL,'Craft Staff; Craft Epic Staff; Enlarge Spell; Extend Spell; Intensify Spell; creeping doom; command plants; elemental swarm; shambler.'),
('elh-item-staff-cosmos','142','staff-of-the-cosmos','Staff of the Cosmos',
 'A jet-black stone epic staff whose surface resembles a moving star field.',
 '50 charges. Spell-trigger powers: intensified chain lightning (1 charge, DC 29), intensified meteor swarm (1 charge, DC 34), and intensified sunburst (1 charge, DC 32). Table 4-24 lists 683,487 gp, while the adjacent prose extraction lists 683,437 gp; the table value is preserved here and the discrepancy is documented rather than silently normalized.',
 68348700,27,0,NULL,NULL,'Craft Staff; Craft Epic Staff; Intensify Spell; chain lightning; meteor swarm; sunburst.'),
('elh-item-staff-necromancy','143','staff-of-necromancy','Staff of Necromancy',
 'An epic staff formed from fused finger bones and devoted to death magic.',
 '50 charges. Spell-trigger powers: intensified circle of death (2 charges, DC 29), create greater undead (1 charge), finger of death improved-heightened to 16th (2 charges, DC 34), and soul bind improved-heightened to 16th (2 charges, DC 34). Souls captured by soul bind are trapped in the staff itself and are released only if the staff is broken.',
 150531200,27,0,129015600,14303,'Craft Staff; Craft Epic Staff; Intensify Spell; Heighten Spell; Improved Heighten Spell; circle of death; create greater undead; finger of death; soul bind.')
)
INSERT INTO dnd35_items
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT d.id,'elh-3.0',d.page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
       'magic',d.price_copper,NULL,NULL,NULL,NULL
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_items i WHERE i.source_id='elh-3.0' AND i.slug=d.slug AND i.owner_user_id IS NULL
);

WITH desired(item_id,caster_level,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text) AS (VALUES
('elh-item-staff-spheres',21,0,NULL,NULL,'Craft Staff; Craft Epic Staff; Otiluke''s freezing sphere; Otiluke''s resilient sphere; Otiluke''s telekinetic sphere.'),
('elh-item-staff-mighty-force',21,0,NULL,NULL,'Craft Staff; Craft Epic Staff; Quicken Spell; Bigby''s crushing hand; forcecage; shield.'),
('elh-item-staff-walls',30,0,NULL,NULL,'Craft Staff; Craft Epic Staff; Extend Spell; extended wall of force; wall of iron; wall of stone.'),
('elh-item-staff-winter',24,0,NULL,NULL,'Craft Staff; Craft Epic Staff; Extend Spell; Intensify Spell; cone of cold; ice storm; Otiluke''s freezing sphere; wall of ice.'),
('elh-item-staff-prism',21,0,NULL,NULL,'Craft Staff; Craft Epic Staff; Extend Spell; prismatic sphere; prismatic spray; prismatic wall.'),
('elh-item-staff-rapid-barrage',25,0,NULL,NULL,'Craft Staff; Craft Epic Staff; Enhance Spell; Heighten Spell; Intensify Spell; Quicken Spell; fireball; magic missile.'),
('elh-item-staff-planar-might',21,5,NULL,NULL,'Craft Staff; Craft Epic Staff; gate; greater planar ally; greater planar binding; protection from elements.'),
('elh-item-staff-domination',21,0,NULL,NULL,'Craft Staff; Craft Epic Staff; Heighten Spell; demand; dominate monster; geas; mass charm.'),
('elh-item-staff-fiery-power',25,5,NULL,NULL,'Craft Staff; Craft Epic Staff; Extend Spell; Heighten Spell; Improved Heighten Spell; Intensify Spell; Spell Focus (Evocation); continual flame; delayed blast fireball; meteor swarm; protection from elements; summon monster IX; wall of fire.'),
('elh-item-staff-natures-fury',21,5,NULL,NULL,'Craft Staff; Craft Epic Staff; Heighten Spell; Improved Heighten Spell; earthquake; fire storm; summon monster I or summon nature''s ally I; whirlwind.'),
('elh-item-staff-hierophants',27,0,NULL,NULL,'Craft Staff; Craft Epic Staff; Enlarge Spell; Extend Spell; Intensify Spell; creeping doom; command plants; elemental swarm; shambler.'),
('elh-item-staff-cosmos',27,0,NULL,NULL,'Craft Staff; Craft Epic Staff; Intensify Spell; chain lightning; meteor swarm; sunburst.'),
('elh-item-staff-necromancy',27,0,129015600,14303,'Craft Staff; Craft Epic Staff; Intensify Spell; Heighten Spell; Improved Heighten Spell; circle of death; create greater undead; finger of death; soul bind.')
)
INSERT OR IGNORE INTO dnd35_magic_items
  (item_id,aura_school_id,caster_level,manifester_level,aura_strength,activation,activation_text,slot,
   maximum_charges,recharge_text,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text,crafting_prerequisites)
SELECT d.item_id,NULL,d.caster_level,NULL,NULL,'spell_trigger',
       'Uses the spell-trigger powers summarized on the item row.','slotless',50,'Cannot be recharged.',
       d.enhancement_bonus,d.craft_cost_copper,d.craft_xp_cost,d.crafting_text,NULL
FROM desired d;
