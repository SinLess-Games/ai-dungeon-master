-- Expanded Psionics Handbook class feature definitions.
-- Concise mechanical summaries; source book remains authoritative for full text.

WITH desired(class_slug, feature_slug, name, description, choice_kind) AS (VALUES
  ('psion','weapon-armor-proficiency','Weapon and Armor Proficiency','Proficient with simple weapons; no armor or shield proficiency.','none'),
  ('psion','discipline','Discipline','Choose one of the six psionic disciplines; discipline choice governs specialist powers and the psion specialist identity.','other'),
  ('psion','powers','Powers','Manifest Intelligence-based psionic powers from the psion/wilder list plus the chosen discipline list, using a power-point reserve.','none'),
  ('psion','bonus-feat','Bonus Feat','Gain a bonus psionic, metapsionic, or psionic item creation feat from the class-allowed categories, meeting prerequisites.','feat'),

  ('psychic-warrior','weapon-armor-proficiency','Weapon and Armor Proficiency','Proficient with all simple and martial weapons, all armor, and shields except tower shields.','none'),
  ('psychic-warrior','powers','Powers','Manifest Wisdom-based powers selected from the psychic warrior power list, using a power-point reserve.','none'),
  ('psychic-warrior','bonus-feat','Bonus Feat','Gain a bonus feat from the psychic warrior bonus-feat list, meeting prerequisites.','feat'),

  ('soulknife','weapon-armor-proficiency','Weapon and Armor Proficiency','Proficient with simple weapons, the mind blade, light armor, and shields except tower shields.','none'),
  ('soulknife','mind-blade','Mind Blade','Create a semisolid psychic weapon; enhancement bonus improves with class level.','none'),
  ('soulknife','weapon-focus-mind-blade','Weapon Focus (Mind Blade)','Gain Weapon Focus with the mind blade as a bonus feat.','none'),
  ('soulknife','wild-talent','Wild Talent','Gain Wild Talent as a bonus feat, providing the power-point reserve needed for psionic class abilities when necessary.','none'),
  ('soulknife','throw-mind-blade','Throw Mind Blade','Throw the mind blade as a ranged weapon; the blade dissipates after the attack.','none'),
  ('soulknife','psychic-strike','Psychic Strike','Charge the mind blade with psychic energy to deal scaling bonus damage to a qualifying living, nonmindless target.','none'),
  ('soulknife','free-draw','Free Draw','Materialize the mind blade as a free action, subject to the class limit on attempts per round.','none'),
  ('soulknife','shape-mind-blade','Shape Mind Blade','Reshape the mind blade into alternate weapon forms or split it into two blades.','other'),
  ('soulknife','mind-blade-enhancement','Mind Blade Enhancement','Assign weapon special abilities to the mind blade up to the class-defined enhancement-equivalent limit.','other'),
  ('soulknife','speed-of-thought','Speed of Thought','Gain Speed of Thought as a bonus feat.','none'),
  ('soulknife','bladewind','Bladewind','Fragment the mind blade during a full attack to make one attack against each opponent within reach.','none'),
  ('soulknife','greater-weapon-focus-mind-blade','Greater Weapon Focus (Mind Blade)','Gain Greater Weapon Focus with the mind blade as a bonus feat.','none'),
  ('soulknife','knife-to-the-soul','Knife to the Soul','Substitute mental ability damage for some psychic strike bonus-damage dice.','other'),
  ('soulknife','multiple-throw','Multiple Throw','Throw multiple mind blades in a round according to the number of melee attacks available.','none'),

  ('wilder','weapon-armor-proficiency','Weapon and Armor Proficiency','Proficient with simple weapons, light armor, and shields except tower shields.','none'),
  ('wilder','powers','Powers','Manifest Charisma-based powers spontaneously from the wilder list, using a power-point reserve.','none'),
  ('wilder','wild-surge','Wild Surge','Temporarily increase manifester level without paying the normal additional augmentation cost; maximum surge increases with class level.','none'),
  ('wilder','psychic-enervation','Psychic Enervation','Wild surge risks psychic enervation, dazing the wilder and draining power points when it occurs.','none'),
  ('wilder','elude-touch','Elude Touch','Add Charisma bonus to Armor Class against touch attacks, subject to the class limitation.','none'),
  ('wilder','surging-euphoria','Surging Euphoria','After a successful wild surge, gain scaling morale bonuses for a duration based on surge intensity.','none'),
  ('wilder','volatile-mind','Volatile Mind','Telepathy powers targeting the wilder cost their manifester extra power points; the surcharge increases with class level.','none'),

  ('cerebremancer','dual-progression','Spells per Day/Powers Known','Advance one existing arcane spellcasting class and one existing manifesting class at each cerebremancer level.','other'),

  ('elocater','powers-known','Powers Known','At indicated levels, advance an existing manifesting class for power points, powers known, and manifester level.','other'),
  ('elocater','scorn-earth','Scorn Earth','Float just above solid or liquid surfaces and move without normal ground-terrain impediments.','none'),
  ('elocater','sidestep-charge','Sidestep Charge','Gain Sidestep Charge as a bonus feat.','none'),
  ('elocater','opportunistic-strike','Opportunistic Strike','Gain a scaling insight bonus on the first attack against a foe recently damaged in melee by another combatant.','none'),
  ('elocater','dimension-step','Dimension Step','Use a limited self-only psychoportive dimension-step effect.','none'),
  ('elocater','flanker','Flanker','Designate an adjacent square as the effective square used to determine flanking.','other'),
  ('elocater','transporter','Transporter','Learn psionic teleport and psionic plane shift as bonus powers with the class-defined effective level.','none'),
  ('elocater','capricious-step','Capricious Step','Take an additional 5-foot step in rounds where no other movement is performed.','none'),
  ('elocater','dimension-spring-attack','Dimension Spring Attack','Combine dimension step and Spring Attack against a visible target within the class-defined range.','none'),
  ('elocater','accelerated-action','Accelerated Action','Gain a limited number of accelerated rounds per day that improve attacks, movement, defense, or power manifestation.','none'),

  ('fist-of-zuoken','monk-abilities','Monk Abilities','Stack class levels with monk levels for unarmed damage, Armor Class bonus, and unarmored speed.','none'),
  ('fist-of-zuoken','powers','Powers','Gain a Wisdom-based prestige-class power-point and powers-known progression using the psychic warrior power list.','none'),
  ('fist-of-zuoken','bonus-psionic-feat','Bonus Psionic Feat','Gain a bonus psionic feat, meeting prerequisites.','feat'),

  ('illithid-slayer','powers-known','Powers Known','At indicated levels, advance an existing manifesting class for power points, powers known, and manifester level.','other'),
  ('illithid-slayer','favored-enemy','Favored Enemy','Choose the class-defined psionic enemy and gain scaling bonuses on relevant skills and weapon damage against that enemy.','other'),
  ('illithid-slayer','enemy-sense','Enemy Sense','Sense the presence of the favored enemy within the class-defined radius without pinpointing exact location.','none'),
  ('illithid-slayer','brain-nausea','Brain Nausea','Creatures attempting to extract and consume the slayer’s brain must overcome the class defense.','none'),
  ('illithid-slayer','lucid-buffer','Lucid Buffer','Gain a competence bonus on saves against compulsions and mind-affecting effects.','none'),
  ('illithid-slayer','cerebral-blind','Cerebral Blind','While psionically focused, foil most effects that reveal the slayer’s location.','none'),
  ('illithid-slayer','breach-power-resistance','Breach Power Resistance','Successful weapon attacks temporarily reduce a target’s power resistance.','none'),
  ('illithid-slayer','cerebral-immunity','Cerebral Immunity','While psionically focused, become protected from nearly all mind-affecting powers and effects.','none'),
  ('illithid-slayer','blast-feedback','Blast Feedback','A successfully resisted mind blast can rebound upon its originator.','none'),

  ('metamind','powers-known','Powers Known','At indicated levels, advance an existing manifesting class for power points, powers known, and manifester level.','other'),
  ('metamind','free-manifesting','Free Manifesting','Manifest known powers of specified levels without paying their unaugmented base power-point cost a limited number of times per day.','none'),
  ('metamind','cognizance-psicrystal','Cognizance Psicrystal','Allow the psicrystal to store a scaling number of power points like a cognizance crystal.','none'),
  ('metamind','font-of-power','Font of Power','Once per day, manifest powers for a short duration without drawing their normal power-point cost from the reserve.','none'),

  ('psion-uncarnate','powers-known','Powers Known','At indicated levels, advance an existing manifesting class for power points, powers known, and manifester level.','other'),
  ('psion-uncarnate','incorporeal-touch','Incorporeal Touch','Make limited melee touch attacks that deal scaling damage and function against incorporeal targets.','none'),
  ('psion-uncarnate','uncarnate-armor','Uncarnate Armor','Retain armor bonuses while incorporeal under the class’s uncarnate abilities.','none'),
  ('psion-uncarnate','shed-body','Shed Body','Become incorporeal for a limited duration and number of uses per day.','none'),
  ('psion-uncarnate','assume-equipment','Assume Equipment','Bring selected equipment into incorporeal form when shedding the body.','other'),
  ('psion-uncarnate','assume-likeness','Assume Likeness','Use the class’s altered physical state to assume another creature’s likeness.','none'),
  ('psion-uncarnate','telekinetic-force','Telekinetic Force','Gain a class-defined telekinetic force ability.','none'),
  ('psion-uncarnate','uncarnate-bridge','Uncarnate Bridge','Use another creature as the endpoint of an incorporeal movement bridge.','none'),
  ('psion-uncarnate','uncarnate','Uncarnate','Permanently become an incorporeal creature while retaining the class-defined exceptions and benefits.','none'),

  ('pyrokineticist','fire-lash','Fire Lash','Create and wield a reach-length lash of psionically shaped fire.','none'),
  ('pyrokineticist','fire-adaptation','Fire Adaptation','Gain increasing resistance and saving-throw bonuses against fire and heat.','none'),
  ('pyrokineticist','hand-afire','Hand Afire','Envelop one hand in harmless-to-self flame that adds fire damage to armed unarmed attacks.','none'),
  ('pyrokineticist','bolt-of-fire','Bolt of Fire','Launch a ranged-touch bolt of fire whose damage scales with class level.','none'),
  ('pyrokineticist','weapon-afire','Weapon Afire','Envelop a wielded weapon in flame so successful attacks deal additional fire damage.','none'),
  ('pyrokineticist','nimbus','Nimbus','Become wreathed in flame for a limited duration, gaining offensive and defensive benefits.','none'),
  ('pyrokineticist','firewalk','Firewalk','Expend psionic focus and power points to walk through the air in any direction.','none'),
  ('pyrokineticist','fear-no-fire','Fear No Fire','Improve the class’s resistance and saving-throw bonuses against fire and heat.','none'),
  ('pyrokineticist','greater-weapon-afire','Greater Weapon Afire','Increase the bonus fire damage from hand afire, weapon afire, and the nimbus touch attack.','none'),
  ('pyrokineticist','heat-death','Heat Death','Expend psionic focus to superheat a living target, potentially killing it or dealing severe fire damage.','none'),
  ('pyrokineticist','conflagration','Conflagration','Once per day, create a large burst of intense fire centered on yourself with damage and lethal-shock effects.','none'),

  ('thrallherd','powers-known','Powers Known','At indicated levels, advance an existing manifesting class for power points, powers known, and manifester level.','other'),
  ('thrallherd','thrallherd','Thrallherd','Attract a thrall and believers using the class-specific psychic leadership rules.','none'),
  ('thrallherd','psionic-charm','Psionic Charm','Add psionic charm to powers known and reduce its power-point cost once per day according to class level.','none'),
  ('thrallherd','psionic-dominate','Psionic Dominate','Add psionic dominate to powers known and reduce its power-point cost once per day according to class level.','none'),
  ('thrallherd','greater-dominate','Greater Dominate','Reduce augmentation cost when psionic dominate is expanded to additional creature types.','none'),
  ('thrallherd','superior-dominate','Superior Dominate','Further reduce augmentation cost when psionic dominate is expanded to still more creature types.','none'),
  ('thrallherd','twofold-master','Twofold Master','Maintain a second thrall under the class-defined level limit.','none'),

  ('war-mind','powers','Powers','Manifest Wisdom-based powers from the war mind progression and power list.','none'),
  ('war-mind','chain-personal-superiority','Chain of Personal Superiority','Gain a limited-use insight bonus to Strength and Constitution that improves at higher class level.','none'),
  ('war-mind','chain-defensive-posture','Chain of Defensive Posture','Gain a limited-use insight bonus to Armor Class that improves at higher class level.','none'),
  ('war-mind','enduring-body','Enduring Body','Gain scaling damage reduction.','none'),
  ('war-mind','sweeping-strike','Sweeping Strike','Apply a qualifying melee attack against two adjacent threatened squares under the class rules.','none'),
  ('war-mind','chain-overwhelming-force','Chain of Overwhelming Force','Gain a limited-use burst of bonus melee damage.','none')
)
INSERT OR IGNORE INTO dnd35_class_features
  (id, source_id, source_page, slug, name, description, rules_text,
   is_homebrew, owner_user_id, is_enabled, special_ability_id, choice_kind)
SELECT
  'xph-class-feature-' || d.class_slug || '-' || d.feature_slug,
  s.id,
  'Classes / Prestige Classes',
  d.class_slug || '-' || d.feature_slug,
  d.name,
  d.description,
  d.description,
  0, NULL, 1, NULL,
  d.choice_kind
FROM desired d
CROSS JOIN dnd35_sources s
WHERE s.slug = 'expanded-psionics-handbook-3-5'
  AND s.owner_user_id IS NULL;
