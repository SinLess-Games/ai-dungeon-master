-- Explicit racial class-skill grants that apply even without retained racial Hit Dice.

-- Changelings treat Speak Language as a class skill regardless of class.
INSERT OR IGNORE INTO dnd35_race_class_skills (race_id,skill_id)
SELECT 'mm3-race-changeling',s.id
FROM dnd35_skills s
WHERE s.slug='speak-language' AND s.owner_user_id IS NULL AND s.is_enabled=1
  AND EXISTS (SELECT 1 FROM dnd35_races r WHERE r.id='mm3-race-changeling');
