-- Epic Level Handbook Chapter 5 semantics correction.
-- The CR index labels its player-facing value as ECL, not level adjustment.
-- ELH pp. 155-156 explicitly distinguishes level adjustment from ECL and demonstrates that ECL includes more than level adjustment.
-- Earlier import batches accidentally stored several index ECL values in dnd35_monsters.level_adjustment.
-- Clear those values and retain the source ECL in defenses metadata instead.

UPDATE dnd35_monsters
SET level_adjustment = NULL,
    defenses = json_set(defenses, '$[0].extension.parameters.sourceEcl', 50)
WHERE source_id='elh-3.0' AND slug='leshay' AND owner_user_id IS NULL;

UPDATE dnd35_monsters
SET level_adjustment = NULL,
    defenses = json_set(defenses, '$[0].extension.parameters.sourceEcl', 7)
WHERE source_id='elh-3.0' AND slug='mercane' AND owner_user_id IS NULL;

UPDATE dnd35_monsters
SET level_adjustment = NULL,
    defenses = json_set(defenses, '$[0].extension.parameters.sourceEcl', 32)
WHERE source_id='elh-3.0' AND slug='neh-thalggu' AND owner_user_id IS NULL;

UPDATE dnd35_monsters
SET level_adjustment = NULL,
    defenses = json_set(defenses, '$[0].extension.parameters.sourceEcl', 26)
WHERE source_id='elh-3.0' AND slug='paragon-mind-flayer' AND owner_user_id IS NULL;

UPDATE dnd35_monsters
SET level_adjustment = NULL,
    defenses = json_set(defenses, '$[0].extension.parameters.sourceEcl', 60)
WHERE source_id='elh-3.0' AND slug='prismasaurus' AND owner_user_id IS NULL;

UPDATE dnd35_monsters
SET level_adjustment = NULL,
    defenses = json_set(defenses, '$[0].extension.parameters.sourceEcl', 24)
WHERE source_id='elh-3.0' AND slug='pseudonatural-troll' AND owner_user_id IS NULL;
