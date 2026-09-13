-- Deities and Demigods prestige-class spell lists.
-- The book is a 3.0 source used in a 3.5 ruleset. Direct revised names are used where the
-- later 3.5 catalog provides the same spell concept (notably hide from undead and
-- protection from negative energy). Missing spell definitions are skipped safely.

WITH desired(class_slug,spell_slug,spell_level,source_name) AS (VALUES
  -- Justiciar of Taiia, pp. 205-206.
  ('justiciar-of-taiia','bane',1,'bane'),
  ('justiciar-of-taiia','cause-fear',1,'cause fear'),
  ('justiciar-of-taiia','command',1,'command'),
  ('justiciar-of-taiia','deathwatch',1,'deathwatch'),
  ('justiciar-of-taiia','divine-favor',1,'divine favor'),
  ('justiciar-of-taiia','doom',1,'doom'),
  ('justiciar-of-taiia','magic-weapon',1,'magic weapon'),
  ('justiciar-of-taiia','aid',2,'aid'),
  ('justiciar-of-taiia','bulls-strength',2,'bull''s strength'),
  ('justiciar-of-taiia','enthrall',2,'enthrall'),
  ('justiciar-of-taiia','hold-person',2,'hold person'),
  ('justiciar-of-taiia','spiritual-weapon',2,'spiritual weapon'),
  ('justiciar-of-taiia','zone-of-truth',2,'zone of truth'),
  ('justiciar-of-taiia','bestow-curse',3,'bestow curse'),
  ('justiciar-of-taiia','blindness-deafness',3,'blindness/deafness'),
  ('justiciar-of-taiia','contagion',3,'contagion'),
  ('justiciar-of-taiia','magic-vestment',3,'magic vestment'),
  ('justiciar-of-taiia','prayer',3,'prayer'),
  ('justiciar-of-taiia','searing-light',3,'searing light'),
  ('justiciar-of-taiia','commune',4,'commune'),
  ('justiciar-of-taiia','discern-lies',4,'discern lies'),
  ('justiciar-of-taiia','divine-power',4,'divine power'),
  ('justiciar-of-taiia','magic-weapon-greater',4,'greater magic weapon'),

  -- Soldier of Light, pp. 208-209.
  ('soldier-of-light','bless',1,'bless'),
  ('soldier-of-light','bless-water',1,'bless water'),
  ('soldier-of-light','bless-weapon',1,'bless weapon'),
  ('soldier-of-light','cure-light-wounds',1,'cure light wounds'),
  ('soldier-of-light','detect-evil',1,'detect evil'),
  -- 3.0 "invisibility to undead" is represented by the revised hide from undead spell.
  ('soldier-of-light','hide-from-undead',1,'invisibility to undead'),
  ('soldier-of-light','light',1,'light'),
  ('soldier-of-light','magic-weapon',1,'magic weapon'),
  ('soldier-of-light','protection-from-evil',1,'protection from evil'),
  ('soldier-of-light','shield-of-faith',1,'shield of faith'),
  ('soldier-of-light','aid',2,'aid'),
  ('soldier-of-light','consecrate',2,'consecrate'),
  ('soldier-of-light','cure-moderate-wounds',2,'cure moderate wounds'),
  ('soldier-of-light','daylight',2,'daylight'),
  ('soldier-of-light','restoration-lesser',2,'lesser restoration'),
  ('soldier-of-light','make-whole',2,'make whole'),
  ('soldier-of-light','shield-other',2,'shield other'),
  ('soldier-of-light','cure-serious-wounds',3,'cure serious wounds'),
  ('soldier-of-light','magic-weapon-greater',3,'greater magic weapon'),
  ('soldier-of-light','magic-circle-against-evil',3,'magic circle against evil'),
  -- Spell Compendium carries the revised 3.5 form under this name.
  ('soldier-of-light','protection-from-negative-energy',3,'negative energy protection'),
  ('soldier-of-light','prayer',3,'prayer'),
  ('soldier-of-light','remove-disease',3,'remove disease'),
  ('soldier-of-light','searing-light',3,'searing light'),
  ('soldier-of-light','cure-critical-wounds',4,'cure critical wounds'),
  ('soldier-of-light','death-ward',4,'death ward'),
  ('soldier-of-light','holy-smite',4,'holy smite'),
  ('soldier-of-light','holy-sword',4,'holy sword'),
  ('soldier-of-light','planar-ally-lesser',4,'lesser planar ally'),
  ('soldier-of-light','restoration',4,'restoration')
)
INSERT INTO dnd35_spell_class_levels (spell_id,class_id,spell_level)
SELECT sp.id,c.id,d.spell_level
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug AND c.owner_user_id IS NULL
JOIN dnd35_sources cs ON cs.id=c.source_id AND cs.slug='deities-and-demigods-3-0'
JOIN dnd35_spells sp ON sp.slug=d.spell_slug AND sp.owner_user_id IS NULL AND sp.is_enabled=1
ON CONFLICT(spell_id,class_id) DO UPDATE SET spell_level=excluded.spell_level;
