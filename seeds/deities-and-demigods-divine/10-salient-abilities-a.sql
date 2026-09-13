-- Deities and Demigods salient divine abilities, part 1.
-- Primary source: Deities and Demigods pp. 32-42.
-- Where the official v.3.5 accessory update changes an ability, the revised row is canonical.
-- Mechanical text is summarized; source pages remain authoritative.

WITH desired(slug,name,summary,prerequisites,updated) AS (VALUES
  ('alter-size','Alter Size','Change the deity and a limited amount of touched gear between Fine and Colossal size; use the revised 3.5 size, space, reach, and size-modifier rules.','Divine rank 1.',1),
  ('alter-form','Alter Form','Make minor corporeal changes to appearance, limbs, movement adaptations, clothing, and equipment without gaining the assumed form''s other statistics or abilities.','Divine rank 1; Alter Size.',0),
  ('shift-form','Shift Form','Assume forms of creatures associated with the deity''s portfolio, gaining the form-based capabilities allowed by the source while retaining divine identity.','Divine rank 6; Alter Size; Alter Form.',0),
  ('shapechange','Shapechange','Assume the form of any living corporeal creature other than another deity, subject to the divine shapechanging limits.','Divine rank 11; Alter Size; Alter Form.',0),
  ('true-shapechange','True Shapechange','Assume the form of any creature or object other than another deity, subject to the source''s divine transformation limits.','Divine rank 16; Alter Size; Alter Form; Shapechange.',0),
  ('alter-reality','Alter Reality','Reshape reality by duplicating powerful magical effects and by changing terrain, with the source-defined action and rest costs for especially large changes.','Divine rank 1; Charisma 29.',0),
  ('annihilating-strike','Annihilating Strike','A qualifying physical weapon or natural-weapon hit can obliterate the struck creature or object on a failed Fortitude save.','Divine rank 11; base attack bonus +20; Strength 25.',0),
  ('arcane-mastery','Arcane Mastery','Prepare any wizard spell the deity can cast without consulting a spellbook and gain exceptional access to wizard spell knowledge.','Divine rank 1; spellcaster level 1st; Intelligence 29; Spell Mastery.',0),
  ('spontaneous-wizard-spells','Spontaneous Wizard Spells','Cast available wizard spells spontaneously rather than preparing a specific spell in each slot.','Divine rank 6; spellcaster level 1st; Intelligence 29; Spell Mastery; Arcane Mastery.',0),
  ('automatic-metamagic','Automatic Metamagic','Choose a metamagic feat and apply it as a free action to one spellcasting class or to spell-like abilities without increasing spell-slot level.','Divine rank 1; spellcaster level 1st; selected metamagic feat still obeys its normal limitations.',0),
  ('avatar','Avatar','Create divine duplicates that act as extensions of the deity; the number available rises with divine status and creating an avatar consumes substantial time and divine investment.','Divine rank 6; Charisma 29.',0),
  ('banestrike','Banestrike','Choose a creature kind; weapons and natural attacks personally used by the deity gain a large attack and damage bonus against that designated foe.','Divine rank 1; base attack bonus +20.',0),
  ('battlesense','Battlesense','The deity is exceptionally difficult to surprise, flank, or catch flat-footed; under the 3.5 update this ability replaces uncanny dodge and improved uncanny dodge.','Divine rank 1.',1),
  ('call-creatures','Call Creatures','Call creatures of a chosen kind to aid the deity, subject to the quantity, Hit Dice, arrival, service, and dismissal limits in the source.','Divine rank 1.',0),
  ('clearsight','Clearsight','Perceive illusions, transformations, and disguises for what they are within a divine-rank-scaled distance, broadly resembling true seeing.','Divine rank 6; Wisdom 29.',0),
  ('command-plants','Command Plants','Cause extraordinary plant growth and control, charm, animate, or entangle plant creatures with divine authority.','Divine rank 1.',0),
  ('control-creatures','Control Creatures','Choose a creature kind and directly seize control of qualifying creatures; this divine control is not a mind-affecting effect.','Divine rank 1.',0),
  ('craft-artifact','Craft Artifact','Create magic items beyond ordinary mortal limits, including artifact-grade creations, subject to the source''s divine crafting costs and prerequisites.','Divine rank 1; appropriate item-creation capabilities as specified by the item.',0),
  ('create-object','Create Object','Create simple nonmagical objects from nothing, with allowable value/volume and required rest determined by divine rank and the source rules.','Divine rank 6; Intelligence 29.',0),
  ('create-greater-object','Create Greater Object','Create complex or masterwork nonmagical objects from nothing with broader value and complexity limits than Create Object.','Divine rank 11; Intelligence 29; Create Object.',0),
  ('divine-creation','Divine Creation','Create temporary magic items or creatures from nothing and create permanent nonmagical objects under the source-defined rest and duration rules.','Divine rank 16; Intelligence 29; Create Object; Create Greater Object.',0),
  ('divine-air-mastery','Divine Air Mastery','Exercise supernatural mastery over air, gaining air-related movement and combat advantages and authority over airborne creatures as described in the source.','Divine rank 1; Air domain.',0),
  ('divine-archery','Divine Archery','Perform ranged attacks with divine accuracy and range, exceeding mortal limits for archery and other qualifying ranged weapons.','Divine rank 1; base attack bonus +20; Dexterity 29; Point Blank Shot; Far Shot.',0),
  ('divine-armor-mastery','Divine Armor Mastery','Move in light or medium armor without the normal movement and Dexterity restrictions identified by the ability.','Divine rank 1; Armor Proficiency (light); Armor Proficiency (medium).',0),
  ('divine-bard','Divine Bard','Gain bardic performance far beyond mortal bard limits; the 3.5 update uses revised bard effects, including +8 morale values for divine courage and revised inspire heroics.','Divine rank 1; bard level 20th.',1),
  ('divine-battle-mastery','Divine Battle Mastery','Gain supreme command of combat maneuvers, allowing exceptional tactical reactions and combat-technique use beyond mortal fighter capability.','Divine rank 1; fighter level 20th; Combat Reflexes; Intelligence 13; Dexterity 13; Dodge; Combat Expertise; Mobility; Spring Attack; Whirlwind Attack; War domain.',0),
  ('divine-blast','Divine Blast','Release personal divine energy as a destructive ray whose attack, range, uses, and damage scale with divine rank.','Divine rank 1; Charisma 29.',0),
  ('mass-divine-blast','Mass Divine Blast','Expand Divine Blast so the deity can strike multiple targets or an area with divine energy.','Divine rank 6; Charisma 29; Divine Blast.',0),
  ('divine-blessing','Divine Blessing','Select an ability score and grant an exceptional enhancement of that ability to favored mortals under the source-defined limits.','Divine rank 1; selected ability score 40.',0),
  ('divine-celerity','Divine Celerity','Gain supernatural speed using the revised 3.5 haste effect rather than the obsolete extra-partial-action version.','Divine rank 1; Dexterity 29.',1),
  ('free-move','Free Move','Move with extraordinary freedom and speed, including movement that bypasses ordinary impediments as described by the ability.','Divine rank 1; Dexterity 29; Divine Celerity.',0),
  ('divine-dodge','Divine Dodge','Gain a divine chance to avoid attacks or damaging effects by simply not being at the point of impact.','Divine rank 1; Dexterity 29.',0),
  ('divine-druid','Divine Druid','Gain druidic powers beyond mortal limits; under the 3.5 update the deity can assume Fine-through-Colossal animal, magical beast, or plant forms.','Divine rank 1; druid level 20th.',1),
  ('divine-earth-mastery','Divine Earth Mastery','Exercise supernatural mastery over earth and earth-related creatures and terrain under the source-defined benefits.','Divine rank 1; Earth domain.',0),
  ('divine-fast-healing','Divine Fast Healing','Recover hit points at a supernatural rate determined by divine rank and the source rules.','Divine rank 1; Constitution 29 or an existing fast healing ability.',0),
  ('rejuvenation','Rejuvenation','After destruction, re-form after the source-defined delay unless the circumstances that prevent rejuvenation apply.','Divine rank 11; Divine Fast Healing.',0),
  ('divine-fire-mastery','Divine Fire Mastery','Exercise supernatural mastery over fire and fire-related creatures and effects under the source-defined benefits.','Divine rank 1; Fire domain.',0),
  ('divine-glibness','Divine Glibness','Use supernaturally persuasive speech to compel or influence listeners beyond ordinary Bluff and Diplomacy capability.','Divine rank 1; Charisma 29; Bluff 40 ranks; Trickery domain.',0),
  ('divine-inspiration','Divine Inspiration','Project a chosen emotional state into creatures in a divine-rank-scaled area; the 3.5 update makes the despair mode impose a -4 penalty on attacks, damage, saves, and checks.','Divine rank 1.',1),
  ('divine-monk','Divine Monk','Gain monk abilities beyond mortal limits; under the 3.5 update the second deflection-related benefit requires Deflect Arrows.','Divine rank 1; monk level 20th.',1),
  ('divine-paladin','Divine Paladin','Gain paladin abilities beyond mortal limits; under the 3.5 update the deity can smite evil ten times per day.','Divine rank 1; paladin level 20th.',1),
  ('divine-radiance','Divine Radiance','Emit intense holy light that damages or repels appropriate evil or undead foes and illuminates the surrounding area.','Divine rank 1; good alignment; Sun domain.',0),
  ('divine-rage','Divine Rage','Enter a vastly enhanced rage; under the 3.5 update it grants an extra attack at full attack bonus during a full attack rather than an extra partial action.','Divine rank 1; barbarian level 20th.',1),
  ('divine-ranger','Divine Ranger','Gain ranger abilities beyond mortal limits, including extraordinary tracking, favored-enemy, wilderness, and combat competence.','Divine rank 1; ranger level 20th; Wisdom 25; Survival/Wilderness Lore 40 ranks; Knowledge (nature) 30 ranks.',0),
  ('divine-recall','Divine Recall','Recall information related to a chosen subject with supernatural completeness and reliability.','Divine rank 1.',0),
  ('divine-rogue','Divine Rogue','Gain rogue abilities beyond mortal limits, expanding the deity''s ability to evade danger and exploit openings.','Divine rank 1; rogue level 20th; Dodge; improved evasion; defensive roll.',0),
  ('divine-shield','Divine Shield','Create a personal transparent barrier from divine energy that absorbs a rank-scaled amount of damage before collapsing.','Divine rank 1; Charisma 29.',0),
  ('area-divine-shield','Area Divine Shield','Project Divine Shield as a movable wall, sphere, or hemisphere large enough to protect an area or other creatures.','Divine rank 6; Charisma 29; Divine Shield.',0),
  ('divine-skill-focus','Divine Skill Focus','Gain superlative mastery of one selected skill and perform extreme applications of that skill with divine competence.','Divine rank 1; 23 ranks in the selected skill.',0),
  ('divine-sneak-attack','Divine Sneak Attack','Enhance sneak attacks beyond mortal rogue limits, including stronger precision damage and crippling effects.','Divine rank 1; rogue level 20th; crippling strike.',0)
)
INSERT INTO dnd35_special_abilities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,action_type,effects,parameters)
SELECT 'dd-sda-'||d.slug,
       CASE WHEN d.updated=1 THEN 'dd-3.5-update' ELSE 'dd-3.0' END,
       CASE WHEN d.updated=1 THEN 'update 5-6' ELSE '32-48' END,
       d.slug,d.name,d.summary,d.summary,0,NULL,1,'other',NULL,NULL,
       json_object('divineSystem','salient','minimumDivineRank',1,'prerequisitesText',d.prerequisites,'uses35Revision',d.updated)
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_special_abilities a WHERE a.slug=d.slug AND a.owner_user_id IS NULL
);
