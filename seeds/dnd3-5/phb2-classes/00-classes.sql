-- phb2-classes
-- Player's Handbook II (D&D 3.5) base classes.
-- New base classes only: Beguiler, Dragon Shaman, Duskblade, Knight.
-- Chapter 2 alternate class features are intentionally not represented as separate classes.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('phb2-3.5','players-handbook-ii-3-5','Player''s Handbook II','PHB2','Wizards of the Coast',
        'dnd','3.5','D&D 3.5 supplement with new classes, feats, spells, and character options.',NULL,1,0,NULL);

WITH desired(slug,name,hit_die,skill_points,bab,fort,ref,will,source_page,description) AS (VALUES
  ('beguiler', 'Beguiler', 6, 6, 'three_quarters', 'poor', 'poor', 'good', '6-12', 'A spontaneous Intelligence-based arcane caster focused on deception, enchantment, illusion, skills, and trapfinding.'),
  ('dragon-shaman', 'Dragon Shaman', 10, 2, 'three_quarters', 'good', 'poor', 'good', '12-19', 'A martial draconic devotee who projects auras, gains totem adaptations, and develops a scaling breath weapon.'),
  ('duskblade', 'Duskblade', 8, 2, 'full', 'good', 'poor', 'good', '19-24', 'A full-base-attack arcane warrior who casts spontaneously and channels touch spells through weapon attacks.'),
  ('knight', 'Knight', 12, 2, 'full', 'poor', 'poor', 'good', '24-30', 'A heavily armored martial defender built around challenges, battlefield control, shield defense, and a knightly code.')
)
INSERT OR IGNORE INTO dnd35_classes
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,hit_die,skill_points_per_level,bab_progression,fort_progression,ref_progression,will_progression)
SELECT 'phb2-class-'||d.slug,s.id,d.source_page,d.slug,d.name,d.description,d.description,0,NULL,1,
       'base',d.hit_die,d.skill_points,d.bab,d.fort,d.ref,d.will
FROM desired d CROSS JOIN dnd35_sources s
WHERE s.slug='players-handbook-ii-3-5' AND s.owner_user_id IS NULL;

WITH desired(class_slug,level,bab,fort,ref,will) AS (VALUES
  ('beguiler', 1, 0, 0, 0, 2),
  ('beguiler', 2, 1, 0, 0, 3),
  ('beguiler', 3, 2, 1, 1, 3),
  ('beguiler', 4, 3, 1, 1, 4),
  ('beguiler', 5, 3, 1, 1, 4),
  ('beguiler', 6, 4, 2, 2, 5),
  ('beguiler', 7, 5, 2, 2, 5),
  ('beguiler', 8, 6, 2, 2, 6),
  ('beguiler', 9, 6, 3, 3, 6),
  ('beguiler', 10, 7, 3, 3, 7),
  ('beguiler', 11, 8, 3, 3, 7),
  ('beguiler', 12, 9, 4, 4, 8),
  ('beguiler', 13, 9, 4, 4, 8),
  ('beguiler', 14, 10, 4, 4, 9),
  ('beguiler', 15, 11, 5, 5, 9),
  ('beguiler', 16, 12, 5, 5, 10),
  ('beguiler', 17, 12, 5, 5, 10),
  ('beguiler', 18, 13, 6, 6, 11),
  ('beguiler', 19, 14, 6, 6, 11),
  ('beguiler', 20, 15, 6, 6, 12),
  ('dragon-shaman', 1, 0, 2, 0, 2),
  ('dragon-shaman', 2, 1, 3, 0, 3),
  ('dragon-shaman', 3, 2, 3, 1, 3),
  ('dragon-shaman', 4, 3, 4, 1, 4),
  ('dragon-shaman', 5, 3, 4, 1, 4),
  ('dragon-shaman', 6, 4, 5, 2, 5),
  ('dragon-shaman', 7, 5, 5, 2, 5),
  ('dragon-shaman', 8, 6, 6, 2, 6),
  ('dragon-shaman', 9, 6, 6, 3, 6),
  ('dragon-shaman', 10, 7, 7, 3, 7),
  ('dragon-shaman', 11, 8, 7, 3, 7),
  ('dragon-shaman', 12, 9, 8, 4, 8),
  ('dragon-shaman', 13, 9, 8, 4, 8),
  ('dragon-shaman', 14, 10, 9, 4, 9),
  ('dragon-shaman', 15, 11, 9, 5, 9),
  ('dragon-shaman', 16, 12, 10, 5, 10),
  ('dragon-shaman', 17, 12, 10, 5, 10),
  ('dragon-shaman', 18, 13, 11, 6, 11),
  ('dragon-shaman', 19, 14, 11, 6, 11),
  ('dragon-shaman', 20, 15, 12, 6, 12),
  ('duskblade', 1, 1, 2, 0, 2),
  ('duskblade', 2, 2, 3, 0, 3),
  ('duskblade', 3, 3, 3, 1, 3),
  ('duskblade', 4, 4, 4, 1, 4),
  ('duskblade', 5, 5, 4, 1, 4),
  ('duskblade', 6, 6, 5, 2, 5),
  ('duskblade', 7, 7, 5, 2, 5),
  ('duskblade', 8, 8, 6, 2, 6),
  ('duskblade', 9, 9, 6, 3, 6),
  ('duskblade', 10, 10, 7, 3, 7),
  ('duskblade', 11, 11, 7, 3, 7),
  ('duskblade', 12, 12, 8, 4, 8),
  ('duskblade', 13, 13, 8, 4, 8),
  ('duskblade', 14, 14, 9, 4, 9),
  ('duskblade', 15, 15, 9, 5, 9),
  ('duskblade', 16, 16, 10, 5, 10),
  ('duskblade', 17, 17, 10, 5, 10),
  ('duskblade', 18, 18, 11, 6, 11),
  ('duskblade', 19, 19, 11, 6, 11),
  ('duskblade', 20, 20, 12, 6, 12),
  ('knight', 1, 1, 0, 0, 2),
  ('knight', 2, 2, 0, 0, 3),
  ('knight', 3, 3, 1, 1, 3),
  ('knight', 4, 4, 1, 1, 4),
  ('knight', 5, 5, 1, 1, 4),
  ('knight', 6, 6, 2, 2, 5),
  ('knight', 7, 7, 2, 2, 5),
  ('knight', 8, 8, 2, 2, 6),
  ('knight', 9, 9, 3, 3, 6),
  ('knight', 10, 10, 3, 3, 7),
  ('knight', 11, 11, 3, 3, 7),
  ('knight', 12, 12, 4, 4, 8),
  ('knight', 13, 13, 4, 4, 8),
  ('knight', 14, 14, 4, 4, 9),
  ('knight', 15, 15, 5, 5, 9),
  ('knight', 16, 16, 5, 5, 10),
  ('knight', 17, 17, 5, 5, 10),
  ('knight', 18, 18, 6, 6, 11),
  ('knight', 19, 19, 6, 6, 11),
  ('knight', 20, 20, 6, 6, 12)
)
INSERT OR IGNORE INTO dnd35_class_levels
  (id,class_id,level,base_attack_bonus,fort,ref,will)
SELECT printf('phb2-class-level-%s-%02d',d.class_slug,d.level),c.id,d.level,d.bab,d.fort,d.ref,d.will
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources s ON s.id=c.source_id
WHERE s.slug='players-handbook-ii-3-5' AND c.owner_user_id IS NULL;
