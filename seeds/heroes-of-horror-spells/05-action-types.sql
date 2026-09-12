-- Normalize Heroes of Horror spell casting times into runtime action buckets.
-- The exact printed casting time remains in casting_time; action_type is the
-- closest D&D 3.5 encounter action kind understood by the casting runtime.
-- Safe to re-run.

UPDATE dnd35_spells
SET action_type = CASE
  WHEN instr(lower(casting_time), 'immediate') > 0 THEN 'immediate'
  WHEN instr(lower(casting_time), 'swift') > 0 THEN 'swift'
  WHEN instr(lower(casting_time), 'free action') > 0 THEN 'free'
  WHEN instr(lower(casting_time), 'move action') > 0 THEN 'move'
  WHEN instr(lower(casting_time), 'standard action') > 0
    OR lower(trim(casting_time)) = '1 action' THEN 'standard'
  WHEN instr(lower(casting_time), 'full round') > 0
    OR instr(lower(casting_time), 'round') > 0
    OR instr(lower(casting_time), 'minute') > 0
    OR instr(lower(casting_time), 'hour') > 0
    OR instr(lower(casting_time), 'day') > 0 THEN 'full_round'
  ELSE 'standard'
END
WHERE source_id = 'hoh-3.5'
  AND owner_user_id IS NULL
  AND action_type IS NULL;
