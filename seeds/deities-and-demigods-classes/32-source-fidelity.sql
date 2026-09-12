-- Deities and Demigods prestige classes: source-fidelity metadata for 3.0 skill and spell lists.
-- The executable class-skill and class-spell joins intentionally target the revised 3.5 catalog where a
-- direct equivalent exists. These rule rows preserve what the 2002 source actually printed so the runtime
-- can distinguish source text from a later compatibility mapping.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0',
        'Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL);

WITH desired(slug,name,page,parent_slug,description,mechanics) AS (VALUES
('dd-berserk-source-skills','Berserk Printed Class Skills','201-202','berserk',
 'Preserves the class-skill names printed for the Berserk prestige class before revised-skill normalization.',
 '{"classSlug":"berserk","printed3_0":["Animal Empathy","Climb","Intimidate","Jump","Listen","Spot","Swim","Wilderness Lore"],"skillPointsPerLevel":"2 + Int modifier","effective3_5":{"liveClassSkillSlugs":["climb","intimidate","jump","listen","spot","swim","survival"],"transitions":[{"printed":"Wilderness Lore","revised":"Survival","type":"renamed/replaced core skill"},{"printed":"Animal Empathy","revised":null,"type":"defunct skill","note":"Do not invent an Animal Empathy skill row in the 3.5 schema. Where a revised class grants wild empathy, use that class feature; otherwise the printed class-skill name remains source metadata only."}]},"sourceFidelity":"The executable 3.5 class-skill list is not evidence that the 2002 book printed Survival or omitted Animal Empathy."}'),

('dd-justiciar-of-taiia-source-spell-list','Justiciar of Taiia Printed Spell List','206','justiciar-of-taiia',
 'Preserves the complete four-level spell list printed for the Justiciar of Taiia.',
 '{"classSlug":"justiciar-of-taiia","printed3_0":{"1":["bane","cause fear","command","deathwatch","divine favor","doom","magic weapon"],"2":["aid","bull''s strength","enthrall","hold person","spiritual weapon","zone of truth"],"3":["bestow curse","blindness/deafness","contagion","magic vestment","prayer","searing light"],"4":["commune","discern lies","divine power","greater magic weapon"]},"casting":{"tradition":"divine","ability":"Wisdom","preparation":"as cleric","zeroSlotMeaning":"bonus-spell access only","spontaneousCureOrInflict":false},"effective3_5":{"policy":"Resolve each printed spell against the revised 3.5 spell catalog while retaining the printed name in this source payload. The official Deities and Demigods accessory update does not publish a replacement Justiciar spell list."}}'),

('dd-soldier-of-light-source-spell-list','Soldier of Light Printed Spell List','209','soldier-of-light',
 'Preserves the complete four-level spell list printed for the Soldier of Light, including two 3.0 names that the live 3.5 join maps to later equivalents.',
 '{"classSlug":"soldier-of-light","printed3_0":{"1":["bless","bless water","bless weapon","cure light wounds","detect evil","invisibility to undead","light","magic weapon","protection from evil","shield of faith"],"2":["aid","consecrate","cure moderate wounds","daylight","lesser restoration","make whole","shield other"],"3":["cure serious wounds","greater magic weapon","magic circle against evil","negative energy protection","prayer","remove disease","searing light"],"4":["cure critical wounds","death ward","holy smite","holy sword","lesser planar ally","restoration"]},"casting":{"tradition":"divine","ability":"Wisdom","preparation":"as cleric","zeroSlotMeaning":"bonus-spell access only","spontaneousCasting":"May convert prepared divine spells to cure spells of the same level as the class feature permits."},"effective3_5":{"liveCompatibilityMappings":[{"printed":"invisibility to undead","liveSlug":"hide-from-undead","authority":"direct revised-catalog compatibility mapping; not an explicit Deities and Demigods accessory-update instruction"},{"printed":"negative energy protection","liveSlug":"protection-from-negative-energy","authority":"later revised-catalog compatibility mapping; not an explicit Deities and Demigods accessory-update instruction"}],"policy":"Never replace the printed3_0 names in source metadata merely because the executable 3.5 spell join targets a later spell slug."}}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dd-rule-'||d.slug,'dd-3.0',d.page,d.slug,d.name,d.description,
  'Use the structured mechanics payload to distinguish the printed 3.0 class data from executable revised-catalog compatibility mappings.',
  0,NULL,1,'class','source-fidelity',0,1,d.parent_slug,NULL,
  '["deities-and-demigods","prestige-class","source-fidelity","revision-3.5"]',d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);