-- Deities and Demigods: closing Pharaonic religion/worldbuilding material.
-- Source: Deities and Demigods (2002), Chapter 5, p. 158.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0',
        'Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL);

WITH desired(slug,name,page,description,rules_text,kind,tags,mechanics) AS (VALUES
('dd-mysteries-thrice-greatest-thoth','The Mysteries of Thrice-Greatest Thoth','158',
 'An esoteric mystery cult centered on Thoth in his revelatory aspect, also known as the Mysteries of Thrice-Greatest Hermes where Olympian and Pharaonic traditions have influenced one another.',
 'The cult teaches that Thoth experienced a revelation of hidden universal truths that cannot simply be communicated: each believer must reach the revelation individually. Initiates pursue transformative esoteric knowledge through ritual, contemplative prayer, alchemy, and magical experimentation. Wizards are common initiates, especially transmuters and evokers. The source describes doctrine and practice but grants no numerical character benefit merely for initiation.',
 'mystery-cult',
 '["deities-and-demigods","pharaonic","thoth","mystery-cult","thrice-greatest-thoth","hermetic"]',
 '{"pantheonSlug":"pharaonic","cult":"Mysteries of Thrice-Greatest Thoth","alternateName":"Mysteries of Thrice-Greatest Hermes","patron":"thoth","syncreticContext":"The alternate Hermes name occurs in lands where the Olympian and Pharaonic pantheons have influenced one another.","centralMyth":"Thoth experiences a revelation of hidden truths of the universe that cannot be directly communicated; each initiate must experience the revelation individually.","doctrine":{"knowledgeIsKeyToUniverse":true,"ordinaryFactsImportantButInsufficient":true,"esotericKnowledge":"Deep understanding and intimate familiarity with the darkest secrets of the universe.","transformativeGoal":"Knowledge transforms the knower, making the initiate more akin to what is known and therefore more divine."},"practices":["ritual","contemplative prayer","alchemy","magical experimentation"],"commonInitiates":{"wizards":true,"especiallySchools":["Transmutation","Evocation"]},"explicitNumericCharacterBenefit":null,"sourceFidelityNote":"No feat-like, spell-like, level, skill, or numerical initiation benefit is stated in this section; none is invented."}'),

('dd-pharaonic-temple-conventions','Pharaonic Temple Conventions','158',
 'Architectural and ritual conventions for major urban temples under Osiris''s protection, including shared Osirian-triad temple complexes.',
 'Major temples in cities under Osiris''s protection are rectangular walled complexes entered between two great pylons marked with the god''s symbol. A public hieroglyphic hall depicts Osiris''s death and resurrection but contains no image of Osiris; his image appears only in an inner sanctuary and is made from the finest available materials. Osiris often shares a temple complex with Isis and Re-Horakhty, with a separate inner court for each deity, and a cultivated garden lies nearby.',
 'temple-conventions',
 '["deities-and-demigods","pharaonic","temple","osiris","isis","re-horakhty","worldbuilding"]',
 '{"pantheonSlug":"pharaonic","primaryPatron":"osiris","urbanMajorTemple":{"shape":"large rectangle","enclosure":"high walls","entrance":"two large pylons marked with the god''s symbol","publicHall":{"hieroglyphics":"story of Osiris''s death and resurrection","osirisImageAllowed":false},"innerSanctuary":{"osirisImageAllowed":true,"imageMaterials":"finest available"},"sharedTempleDeities":["osiris","isis","re-horakhty"],"sharedTempleLayout":"Each deity has a separate inner court.","nearbyFeature":"cultivated garden"}}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dd-rule-'||d.slug,'dd-3.0',d.page,d.slug,d.name,d.description,d.rules_text,
  0,NULL,1,'religion',d.kind,0,1,'dd-pharaonic-pantheon',NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
