-- Racial Hit Dice already contribute to the creator's general-feat slot count.
-- Do not also expose those same feat slots as arbitrary selectable racial bonus feats.
-- Fixed racial bonus feats (for example Pixie's Dodge or Janni's Improved Initiative)
-- are recorded as race traits until the data model gains explicit fixed race-feat grants.
UPDATE dnd35_races
SET bonus_feats_at_first_level=0
WHERE source_id='srd-monster-races-3.5'
  AND owner_user_id IS NULL
  AND slug IN (
    'aasimar','minotaur','svirfneblin','doppelganger','hound-archon',
    'pixie-irresistible-dance','ogre-mage','trumpet-archon'
  );
