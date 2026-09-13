-- D&D 3.0 Psionics Handbook class feature definitions.
INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('ph3e-3.0','psionics-handbook-3-0','Psionics Handbook','PsiHB','Wizards of the Coast','dnd','3.0',
'D&D 3.0 Psionics Handbook, including the official errata appended to the supplied source PDF.',NULL,1,0,NULL);

WITH desired(class_slug,feature_slug,name,description,choice_kind) AS (VALUES
('psion','weapon-armor-proficiency','Weapon and Armor Proficiency','Proficient with simple weapons; armor can impose applicable armor check penalties.','none'),
('psion','discipline','Discipline','Choose one of six disciplines. In D&D 3.0 each discipline has its own associated key ability: Psychometabolism Str, Psychoportation Dex, Psychokinesis Con, Metacreativity Int, Clairsentience Wis, Telepathy Cha.','other'),
('psion','powers','Powers','Manifest discovered psionic powers by spending power points; 0-level powers are talents with special free daily uses.','none'),
('psion','psionic-combat-modes','Psionic Combat Modes','Learn five psionic combat modes at 1st level and one additional mode at every odd level from 3rd through 11th.','other'),
('psion','psicrystal','Psicrystal','Encode and maintain a psicrystal whose abilities improve with psion level.','other'),
('psychic-warrior','weapon-armor-proficiency','Weapon and Armor Proficiency','Proficient with all simple and martial weapons, all armor, and shields.','none'),
('psychic-warrior','bonus-feat','Bonus Feat','Gain a bonus feat at 1st, 2nd, and every three class levels thereafter.','feat'),
('psychic-warrior','powers','Powers','Manifest discovered psychic-warrior powers by spending power points; talents receive special free daily uses.','none'),
('psychic-warrior','psionic-combat-modes','Psionic Combat Modes','Learn two psionic combat modes at 1st level and additional modes according to Table 1-6.','other'),
('psychic-warrior','weapon-specialization','Weapon Specialization','Gain Weapon Specialization at 6th level as the class table specifies.','feat'),
('metamind','inner-strength','Inner Strength','Gain Inner Strength as a bonus feat at the class-table levels.','none'),
('metamind','power-psicrystal','Power Psicrystal','At 1st level per official errata, the psicrystal can store 5 power points in addition to normal psicrystal abilities.','none'),
('metamind','trigger-power','Trigger Power','Gain Trigger Power at 3rd, 5th, 7th, and 9th level for an eligible 0th- through 3rd-level power.','other'),
('metamind','psychic-vampire','Psychic Vampire','At 8th level, gain the class ability to use psychic vampire through Trigger Power despite the normal level limit.','none'),
('metamind','apotheosis','Apotheosis','At 10th level, manifest 1st-level powers through the class Trigger Power ability.','none'),
('pyrokineticist','touch-aflame','Touch Aflame','Gain the class fire-touch ability.','none'),
('pyrokineticist','fire-lash','Fire Lash','Create and wield the class fire lash.','none'),
('pyrokineticist','fire-adaptation','Fire Adaptation','Gain the class fire resistance benefits.','none'),
('pyrokineticist','hand-afire','Hand Afire','Ignite one hand without harming yourself and add fire damage to unarmed attacks.','none'),
('pyrokineticist','bolt-of-fire','Bolt of Fire','Launch the class ranged fire bolt by paying its power-point cost.','none'),
('pyrokineticist','weapon-afire','Weapon Afire','Ignite a held weapon to add fire damage.','none'),
('pyrokineticist','breath-of-the-dragon','Breath of the Dragon','Gain the breath of the dragon power as a class spell-like ability.','none'),
('pyrokineticist','nimbus','Nimbus','Surround yourself with the class nimbus of fire.','none'),
('pyrokineticist','firewalk','Firewalk','Spend power points to walk through the air while leaving temporary fiery footprints.','none'),
('pyrokineticist','fear-no-fire','Fear No Fire','Gain the class high-level protection against fire and heat.','none'),
('pyrokineticist','heat-death','Heat Death','Use the class lethal heat attack by paying its power-point cost.','none'),
('pyrokineticist','fire-lord','Fire Lord','Once per day, become a fire elemental of your size as described by the class.','none'),
('slayer','weapon-armor-proficiency','Weapon and Armor Proficiency','Per official errata, proficient with all simple and martial weapons and with all armor and shields.','none'),
('slayer','favored-enemy-illithid','Favored Enemy (Illithid)','Gain the class favored-enemy benefits against illithids and illithidkin.','none'),
('slayer','illithid-sense','Illithid Sense','Sense nearby illithids while the required power-point reserve is maintained.','none'),
('slayer','brain-nausea','Brain Nausea','Discourage creatures from extracting and consuming the slayer’s brain.','none'),
('slayer','bonus-feat','Bonus Feat','Gain a bonus general, psionic, or metapsionic feat at 3rd, 5th, 7th, and 9th level.','feat'),
('slayer','lucid-buffer','Lucid Buffer','Gain class bonuses against compulsions, mind-affecting effects, and psionic attack modes.','none'),
('slayer','cerebral-blind','Cerebral Blind','Resisting hostile psionics can cause a psychic backlash against the attacker.','none'),
('slayer','breach-power-resistance','Breach Power Resistance','Successful qualifying weapon attacks temporarily reduce a target’s power resistance.','none'),
('slayer','blast-feedback','Blast Feedback','A resisted mind blast can feed back against its attacker.','none'),
('soulknife','weapon-armor-proficiency','Weapon and Armor Proficiency','Proficient with light armor but not shields.','none'),
('soulknife','mind-blade','Mind-Blade','Create a semisolid psychic blade; its enhancement bonus rises at even class levels.','none'),
('soulknife','sneak-attack','Sneak Attack','Deal scaling sneak attack damage with the mind-blade.','none'),
('soulknife','imbed-power','Imbed Power','Beginning at 2nd level per official errata, embed an eligible known power in the mind-blade.','other'),
('soulknife','throw-mind-blade','Throw Mind-Blade','Beginning at 2nd level per official errata, throw the mind-blade.','none'),
('soulknife','imbed-psionic-attack','Imbed Psionic Attack','Embed a psionic attack mode in the mind-blade.','other'),
('soulknife','sever-life','Sever Life','Gain the class sever-life attack.','none'),
('soulknife','free-draw','Free Draw','Create the mind-blade as a free action.','none'),
('soulknife','upgrade','Upgrade','Upgrade the class mind-blade as described by the source.','other'),
('soulknife','knife-to-the-soul','Knife to the Soul','Convert the mind-blade’s high-level psychic strike into damage to mental ability scores as described by the class.','none'))
INSERT INTO dnd35_class_features
(id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,special_ability_id,choice_kind)
SELECT 'ph3e-class-feature-'||d.class_slug||'-'||d.feature_slug,'ph3e-3.0','Class description','ph3e-'||d.class_slug||'-'||d.feature_slug,d.name,d.description,d.description,0,NULL,1,NULL,d.choice_kind
FROM desired d
WHERE NOT EXISTS (SELECT 1 FROM dnd35_class_features f WHERE f.slug='ph3e-'||d.class_slug||'-'||d.feature_slug AND f.owner_user_id IS NULL);
