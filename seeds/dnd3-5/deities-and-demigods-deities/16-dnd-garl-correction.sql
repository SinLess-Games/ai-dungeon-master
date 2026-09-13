-- Deities and Demigods: semantic correction for Garl Glittergold.
-- Source: Deities and Demigods (2002), p. 70.
-- The initial stat-block batch conservatively stored only the retrieved avatar subset because the
-- main salient-divine-ability line had not yet been exposed by extraction. The source page has now
-- been resolved directly. This ordered correction replaces that temporary metadata with the full
-- printed main list and stores the avatar's smaller printed subset under the avatar payload.

UPDATE dnd35_rules
SET mechanics = json_remove(
  json_set(
    mechanics,
    '$.salientDivineAbilities', json('[
      "Alter Reality",
      "Alter Size",
      "Arcane Mastery",
      "Area Divine Shield",
      "Automatic Metamagic (quicken wizard spells)",
      "Automatic Metamagic (silent wizard spells)",
      "Automatic Metamagic (still wizard spells)",
      "Avatar",
      "Banestrike (kobolds)",
      "Battlesense",
      "Clearsight",
      "Control Creatures (gnomes)",
      "Create Greater Object",
      "Create Object",
      "Divine Blast",
      "Divine Creation",
      "Divine Dodge",
      "Divine Glibness",
      "Divine Shield",
      "Divine Spell Focus (Illusion)",
      "Increased Spell Resistance",
      "Mass Divine Blast",
      "Spontaneous Wizard Spells"
    ]'),
    '$.avatar.salientDivineAbilities', json('[
      "Arcane Mastery",
      "Automatic Metamagic (quicken wizard spells)",
      "Banestrike (kobolds)",
      "Clearsight",
      "Control Creatures (gnomes)",
      "Divine Blast",
      "Divine Dodge",
      "Divine Glibness",
      "Divine Shield",
      "Divine Spell Focus (Illusion)",
      "Spontaneous Wizard Spells"
    ]'),
    '$.sourceFidelityCorrections.garlSalientAbilityRetrieval',
    'The full main-block salient-divine-ability list was recovered directly from source page 70; the earlier temporary extraction caveat is superseded by this correction.'
  ),
  '$.salientDivineAbilitiesRetrievedForAvatar',
  '$.mainSalientAbilityListStatus'
)
WHERE source_id='dd-3.0'
  AND slug='dd-statblock-garl-glittergold'
  AND owner_user_id IS NULL;
