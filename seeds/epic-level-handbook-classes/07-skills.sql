-- Epic Level Handbook epic-prestige class skill lists, normalized to the 3.5 PHB skill catalog.
-- Compatibility normalization used here: Intuit Direction/Wilderness Lore -> Survival;
-- Innuendo -> Bluff; Pick Pocket -> Sleight of Hand; Read Lips -> Spot; Alchemy -> Craft.
-- The removed 3.0 Scry skill is not silently replaced with an unrelated 3.5 skill.

WITH desired(class_slug,skill_slug) AS (VALUES
  ('agent-retriever','appraise'),('agent-retriever','decipher-script'),('agent-retriever','diplomacy'),('agent-retriever','forgery'),('agent-retriever','gather-information'),
  ('agent-retriever','survival'),('agent-retriever','knowledge-arcana'),('agent-retriever','knowledge-geography'),('agent-retriever','knowledge-history'),('agent-retriever','knowledge-local'),('agent-retriever','knowledge-planes'),
  ('agent-retriever','listen'),('agent-retriever','search'),('agent-retriever','spot'),

  ('cosmic-descryer','craft'),('cosmic-descryer','bluff'),('cosmic-descryer','concentration'),('cosmic-descryer','diplomacy'),('cosmic-descryer','knowledge-arcana'),
  ('cosmic-descryer','knowledge-religion'),('cosmic-descryer','knowledge-planes'),('cosmic-descryer','profession'),('cosmic-descryer','sense-motive'),('cosmic-descryer','spellcraft'),

  ('divine-emissary','concentration'),('divine-emissary','craft'),('divine-emissary','diplomacy'),('divine-emissary','disguise'),('divine-emissary','gather-information'),('divine-emissary','heal'),
  ('divine-emissary','intimidate'),('divine-emissary','knowledge-religion'),('divine-emissary','profession'),('divine-emissary','search'),('divine-emissary','sense-motive'),('divine-emissary','spellcraft'),('divine-emissary','spot'),('divine-emissary','use-magic-device'),

  ('epic-infiltrator','appraise'),('epic-infiltrator','balance'),('epic-infiltrator','bluff'),('epic-infiltrator','climb'),('epic-infiltrator','craft'),('epic-infiltrator','decipher-script'),
  ('epic-infiltrator','diplomacy'),('epic-infiltrator','disable-device'),('epic-infiltrator','disguise'),('epic-infiltrator','escape-artist'),('epic-infiltrator','forgery'),('epic-infiltrator','gather-information'),
  ('epic-infiltrator','hide'),('epic-infiltrator','intimidate'),('epic-infiltrator','jump'),('epic-infiltrator','listen'),('epic-infiltrator','move-silently'),('epic-infiltrator','open-lock'),
  ('epic-infiltrator','sleight-of-hand'),('epic-infiltrator','profession'),('epic-infiltrator','spot'),('epic-infiltrator','sense-motive'),

  ('guardian-paramount','bluff'),('guardian-paramount','climb'),('guardian-paramount','diplomacy'),('guardian-paramount','intimidate'),('guardian-paramount','jump'),('guardian-paramount','listen'),('guardian-paramount','profession'),('guardian-paramount','spot'),

  ('high-proselytizer','concentration'),('high-proselytizer','craft'),('high-proselytizer','diplomacy'),('high-proselytizer','heal'),('high-proselytizer','knowledge-arcana'),('high-proselytizer','knowledge-religion'),('high-proselytizer','profession'),('high-proselytizer','sense-motive'),('high-proselytizer','spellcraft'),

  ('legendary-dreadnought','climb'),('legendary-dreadnought','craft'),('legendary-dreadnought','intimidate'),('legendary-dreadnought','jump'),('legendary-dreadnought','swim'),

  ('perfect-wight','appraise'),('perfect-wight','balance'),('perfect-wight','bluff'),('perfect-wight','climb'),('perfect-wight','craft'),('perfect-wight','disable-device'),('perfect-wight','diplomacy'),
  ('perfect-wight','disguise'),('perfect-wight','escape-artist'),('perfect-wight','gather-information'),('perfect-wight','hide'),('perfect-wight','survival'),('perfect-wight','jump'),
  ('perfect-wight','knowledge-arcana'),('perfect-wight','knowledge-dungeoneering'),('perfect-wight','knowledge-engineering'),('perfect-wight','knowledge-geography'),('perfect-wight','knowledge-history'),
  ('perfect-wight','knowledge-local'),('perfect-wight','knowledge-nature'),('perfect-wight','knowledge-nobility'),('perfect-wight','knowledge-religion'),('perfect-wight','knowledge-planes'),
  ('perfect-wight','listen'),('perfect-wight','move-silently'),('perfect-wight','open-lock'),('perfect-wight','search'),('perfect-wight','spot'),('perfect-wight','tumble'),('perfect-wight','use-rope'),

  ('union-sentinel','diplomacy'),('union-sentinel','gather-information'),('union-sentinel','intimidate'),('union-sentinel','knowledge-local'),('union-sentinel','listen'),('union-sentinel','profession'),('union-sentinel','search'),('union-sentinel','sense-motive'),('union-sentinel','spot')
)
INSERT OR IGNORE INTO dnd35_class_skills (class_id,skill_id)
SELECT c.id,s.id
FROM desired d
JOIN dnd35_classes c ON c.source_id='elh-3.0' AND c.slug=d.class_slug AND c.owner_user_id IS NULL
JOIN dnd35_skills s ON s.slug=d.skill_slug AND s.owner_user_id IS NULL;
