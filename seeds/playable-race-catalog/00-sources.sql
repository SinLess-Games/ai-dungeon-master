-- Source rows required by the playable-race catalog SQL mirrors.
-- These IDs match docs/dnd35-playable-race-catalog/*.csv.
-- The combined dmg-mm1 source is intentionally marked non-official because it is an internal catalog grouping, not a published book.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES
  ('phb-3.5','players-handbook-3-5','Player''s Handbook','PHB','Wizards of the Coast','dnd','3.5','Core Rulebook I and source for the core D&D 3.5 player races.',NULL,1,0,NULL),
  ('dmg-mm1-3.5','dmg-mm1-playable-race-catalog-3-5','DMG / Monster Manual Playable Race Catalog','DMG/MM','Wizards of the Coast','dnd','3.5','Internal source grouping retained from the playable-race CSV catalog. Replace rows with book-specific source IDs as mechanics are materialized.',NULL,0,0,NULL),
  ('mm1-3.5','monster-manual-3-5','Monster Manual','MM','Wizards of the Coast','dnd','3.5','Monster Manual v3.5 source catalog.',NULL,1,0,NULL),
  ('mm2-3.0','monster-manual-ii-3-0','Monster Manual II','MM2','Wizards of the Coast','dnd','3.0','Monster Manual II legacy 3.0 source catalog. PC ECL offsets are preserved as legacy metadata and are not treated as 3.5 level adjustment.',NULL,1,0,NULL),
  ('mm3-3.5','monster-manual-iii-3-5','Monster Manual III','MM3','Wizards of the Coast','dnd','3.5','Monster Manual III v3.5 source catalog.',NULL,1,0,NULL),
  ('mm4-3.5','monster-manual-iv-3-5','Monster Manual IV','MM4','Wizards of the Coast','dnd','3.5','Monster Manual IV v3.5 source catalog.',NULL,1,0,NULL),
  ('mm5-3.5','monster-manual-v-3-5','Monster Manual V','MM5','Wizards of the Coast','dnd','3.5','Monster Manual V v3.5 source catalog.',NULL,1,0,NULL),
  ('ff-3x','fiend-folio-3-x','Fiend Folio','FF','Wizards of the Coast','dnd','3.x','Fiend Folio transition-era source catalog; individual mechanics require edition-aware review.',NULL,1,0,NULL),
  ('xph-3.5','expanded-psionics-handbook-3-5','Expanded Psionics Handbook','XPH','Wizards of the Coast','dnd','3.5','Expanded Psionics Handbook v3.5 source catalog.',NULL,1,0,NULL);
