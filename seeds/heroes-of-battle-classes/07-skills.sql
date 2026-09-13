-- Heroes of Battle prestige-class skill lists.
WITH desired(class_slug,skill_slug) AS (VALUES
  ('combat-medic','concentration'),('combat-medic','craft'),('combat-medic','diplomacy'),('combat-medic','heal'),('combat-medic','knowledge-history'),('combat-medic','knowledge-religion'),('combat-medic','profession'),('combat-medic','ride'),('combat-medic','spellcraft'),('combat-medic','spot'),
  ('dread-commando','climb'),('dread-commando','craft'),('dread-commando','disable-device'),('dread-commando','disguise'),('dread-commando','escape-artist'),('dread-commando','hide'),('dread-commando','jump'),('dread-commando','knowledge-geography'),('dread-commando','listen'),('dread-commando','move-silently'),('dread-commando','open-lock'),('dread-commando','profession'),('dread-commando','search'),('dread-commando','spot'),('dread-commando','swim'),('dread-commando','use-rope'),
  ('legendary-leader','bluff'),('legendary-leader','craft'),('legendary-leader','diplomacy'),('legendary-leader','gather-information'),('legendary-leader','handle-animal'),('legendary-leader','intimidate'),('legendary-leader','knowledge-history'),('legendary-leader','knowledge-nobility'),('legendary-leader','profession'),('legendary-leader','ride'),('legendary-leader','sense-motive'),
  ('war-weaver','concentration'),('war-weaver','craft'),('war-weaver','knowledge-arcana'),('war-weaver','profession'),('war-weaver','spellcraft')
)
INSERT OR IGNORE INTO dnd35_class_skills (class_id,skill_id)
SELECT c.id,s.id
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources src ON src.id=c.source_id
JOIN dnd35_skills s ON s.slug=d.skill_slug AND s.owner_user_id IS NULL
WHERE src.slug='heroes-of-battle-3-5' AND c.owner_user_id IS NULL;
