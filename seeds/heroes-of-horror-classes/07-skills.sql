-- Heroes of Horror class skill lists.
WITH desired(class_slug,skill_slug) AS (VALUES
  -- Archivist: all Knowledge skills are class skills.
  ('archivist','concentration'),('archivist','craft'),('archivist','decipher-script'),('archivist','diplomacy'),('archivist','gather-information'),('archivist','heal'),
  ('archivist','knowledge-arcana'),('archivist','knowledge-dungeoneering'),('archivist','knowledge-engineering'),('archivist','knowledge-geography'),('archivist','knowledge-history'),('archivist','knowledge-local'),('archivist','knowledge-nature'),('archivist','knowledge-nobility'),('archivist','knowledge-religion'),('archivist','knowledge-planes'),
  ('archivist','profession'),('archivist','search'),('archivist','spellcraft'),
  ('dread-necromancer','bluff'),('dread-necromancer','concentration'),('dread-necromancer','craft'),('dread-necromancer','decipher-script'),('dread-necromancer','disguise'),('dread-necromancer','hide'),('dread-necromancer','intimidate'),('dread-necromancer','knowledge-arcana'),('dread-necromancer','knowledge-religion'),('dread-necromancer','profession'),('dread-necromancer','spellcraft'),
  ('corrupt-avenger','bluff'),('corrupt-avenger','climb'),('corrupt-avenger','concentration'),('corrupt-avenger','diplomacy'),('corrupt-avenger','intimidate'),('corrupt-avenger','jump'),('corrupt-avenger','knowledge-local'),('corrupt-avenger','listen'),('corrupt-avenger','ride'),('corrupt-avenger','sense-motive'),('corrupt-avenger','spot'),('corrupt-avenger','survival'),
  ('death-delver','concentration'),('death-delver','craft'),('death-delver','gather-information'),('death-delver','knowledge-arcana'),('death-delver','knowledge-religion'),('death-delver','listen'),('death-delver','profession'),('death-delver','search'),('death-delver','spellcraft'),('death-delver','spot'),
  ('dread-witch','bluff'),('dread-witch','concentration'),('dread-witch','craft'),('dread-witch','intimidate'),('dread-witch','knowledge-arcana'),('dread-witch','knowledge-planes'),('dread-witch','profession'),('dread-witch','spellcraft'),
  ('fiend-blooded','bluff'),('fiend-blooded','concentration'),('fiend-blooded','intimidate'),('fiend-blooded','knowledge-arcana'),('fiend-blooded','knowledge-planes'),('fiend-blooded','spellcraft'),
  ('purifier-hallowed-doctrine','concentration'),('purifier-hallowed-doctrine','craft'),('purifier-hallowed-doctrine','diplomacy'),('purifier-hallowed-doctrine','heal'),('purifier-hallowed-doctrine','knowledge-arcana'),('purifier-hallowed-doctrine','knowledge-history'),('purifier-hallowed-doctrine','knowledge-religion'),('purifier-hallowed-doctrine','knowledge-planes'),('purifier-hallowed-doctrine','profession'),('purifier-hallowed-doctrine','spellcraft'),
  -- Tainted scholar: all Knowledge skills are class skills.
  ('tainted-scholar','concentration'),('tainted-scholar','craft'),('tainted-scholar','decipher-script'),('tainted-scholar','intimidate'),
  ('tainted-scholar','knowledge-arcana'),('tainted-scholar','knowledge-dungeoneering'),('tainted-scholar','knowledge-engineering'),('tainted-scholar','knowledge-geography'),('tainted-scholar','knowledge-history'),('tainted-scholar','knowledge-local'),('tainted-scholar','knowledge-nature'),('tainted-scholar','knowledge-nobility'),('tainted-scholar','knowledge-religion'),('tainted-scholar','knowledge-planes'),
  ('tainted-scholar','spellcraft')
)
INSERT OR IGNORE INTO dnd35_class_skills (class_id,skill_id)
SELECT c.id,s.id
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources src ON src.id=c.source_id
JOIN dnd35_skills s ON s.slug=d.skill_slug AND s.owner_user_id IS NULL
WHERE src.slug='heroes-of-horror-3-5' AND c.owner_user_id IS NULL;
