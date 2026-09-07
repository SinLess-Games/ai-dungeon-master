ALTER TABLE dnd35_character_conditions
ADD COLUMN expires_encounter_round INTEGER
CHECK (
  expires_encounter_round IS NULL OR
  (typeof(expires_encounter_round) = 'integer' AND expires_encounter_round >= 1)
);

ALTER TABLE dnd35_character_conditions
ADD COLUMN expires_turn_order INTEGER
CHECK (
  expires_turn_order IS NULL OR
  (typeof(expires_turn_order) = 'integer' AND expires_turn_order >= 0)
);

CREATE INDEX dnd35_character_conditions_encounter_expiry_idx
ON dnd35_character_conditions (
  encounter_id,
  expires_encounter_round,
  expires_turn_order
);
