-- Source-backed corrections applied after the MM3 race chassis seed.
-- Kept separate so already-published race rows remain idempotent and reviewable.

UPDATE dnd35_races
SET natural_armor=4
WHERE id='mm3-race-armand' AND source_id='mm3-3.5';
