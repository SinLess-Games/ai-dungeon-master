-- heroes-of-horror-feats
-- D&D 3.5 Heroes of Horror feat catalog. Mechanical summaries are concise and source-cited.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('hoh-3.5','heroes-of-horror-3-5','Heroes of Horror','HoH','Wizards of the Coast','dnd','3.5',
        'D&D 3.5 supplement for horror campaigns, taint, dread, dark character options, and dream/nightmare rules.',NULL,1,0,NULL);

WITH desired(slug,name,source_page,description,rules_text,repeatable,choice_kind,repeatability_text) AS (VALUES
  ('archivist-of-nature','Archivist of Nature','119','Extend dark knowledge to giants and fey.','Dark knowledge can affect giants and fey; use Knowledge (nature) for those checks.',0,'none',NULL),
  ('bane-magic','Bane Magic','119','Deal extra spell damage to one selected creature type.','Choose a creature type. Damaging spells deal +2d6 damage to creatures of that type; this does not affect nondamaging spells. Humanoid choices require a specific humanoid subtype.',1,'other','May be selected multiple times for different creature types; effects do not stack for the same target.'),
  ('blood-calls-to-blood','Blood Calls to Blood','120','Fiendish ancestry hardens you against fiend attacks.','Gain a +2 bonus on saving throws against spells, spell-like abilities, and supernatural abilities used by fiends.',0,'none',NULL),
  ('corrupt-arcana','Corrupt Arcana','120','Use depravity to prepare a corrupt spell outside a spontaneous caster''s normal spells known.','A spontaneous spellcaster with taint can prepare a corrupt spell not normally among spells known under the feat''s restrictions.',0,'spell',NULL),
  ('corrupt-spell-focus','Corrupt Spell Focus','120','Increase save DCs of corrupt spells.','Add +1 to the saving throw DC of corrupt spells you cast.',0,'none',NULL),
  ('debilitating-spell','Debilitating Spell','120','Empower damaging spells with taint-based ability damage.','A used spell gains the evil descriptor and can deal Constitution or Wisdom damage to one damaged target; uses per day depend on degree of taint.',0,'none',NULL),
  ('debilitating-strike','Debilitating Strike','120-121','Empower melee attacks with taint-based ability damage.','A used unarmed or melee attack counts as evil for damage reduction and can deal Constitution or Wisdom damage; uses per day depend on degree of taint.',0,'none',NULL),
  ('deformity-skin','Deformity (Skin)','121','Harden deliberately mutilated skin.','Gain a +1 natural armor bonus.',1,'none','May be taken more than once; its natural armor bonuses stack.'),
  ('deformity-tall','Deformity (Tall)','121','Gain exceptional reach while remaining Medium.','Gain 5 feet of additional reach while remaining Medium; take -1 AC and -2 on Hide checks.',0,'none',NULL),
  ('deformity-teeth','Deformity (Teeth)','121','Gain a bite natural weapon and an intimidating appearance.','Gain a 1d4 bite attack for a Medium creature and +1 on Intimidate checks; as a secondary attack it uses the normal secondary-attack penalty and half Strength bonus to damage.',0,'none',NULL),
  ('deformity-tongue','Deformity (Tongue)','121','Gain taste-based blindsense.','Gain blindsense out to 30 feet.',0,'none',NULL),
  ('disease-immunity','Disease Immunity','121-122','Become immune to one disease and more resistant to others.','Choose one disease: you are immune to it, gain +2 on saves against contracting other diseases, recover disease ability damage twice as fast, and your blood can aid disease treatment as described.',1,'other','May be selected multiple times, choosing a different disease each time; the +2 resistance bonus does not stack.'),
  ('draconic-archivist','Draconic Archivist','122','Extend dark knowledge to dragons and constructs.','Dark knowledge can affect dragons and constructs; use Knowledge (arcana) for those checks.',0,'none',NULL),
  ('dreamtelling','Dreamtelling','122','Interpret dreams with Knowledge (the planes).','Use Knowledge (the planes) to interpret dream symbolism, possible prophetic imagery, dreamscape injuries/origins, and navigation in dreamscapes according to the feat''s DCs and limits.',0,'none',NULL),
  ('eldritch-corruption','Eldritch Corruption','122','Apply selected metamagic effects by harming a willing ally.','Use an ally''s Constitution damage to enlarge, extend, heighten, or widen a spell without increasing its slot level or spontaneous casting time, subject to the feat rules.',0,'none',NULL),
  ('font-of-life','Font of Life','122','Gain another chance to resist energy drain.','When a negative level would become permanent, gain an additional saving throw under the feat''s timing and DC rules.',0,'none',NULL),
  ('forbidden-lore','Forbidden Lore','123','Improve lore checks about sinister and forbidden subjects based on depravity.','Gain a +2, +4, or +6 bonus on bardic knowledge or lore checks concerning sinister, supernatural, tainted, or forbidden subjects according to degree of depravity.',0,'none',NULL),
  ('greater-corrupt-spell-focus','Greater Corrupt Spell Focus','123','Further increase save DCs of corrupt spells.','Add +1 more to the saving throw DC of corrupt spells you cast, stacking with Corrupt Spell Focus for +2 total.',0,'none',NULL),
  ('haunting-melody','Haunting Melody','123','Use bardic music to inspire fear.','Expend a bardic music use to force opponents in range to save or become shaken for a number of rounds equal to your Perform ranks.',0,'none',NULL),
  ('improved-oneiromancy','Improved Oneiromancy','123','Add specific dream-related spells to your class spell list.','Add the Heroes of Horror dream-related spells listed by the feat to your class spell list; they must still be learned or prepared normally.',0,'none',NULL),
  ('lunatic-insight','Lunatic Insight','123','Depravity produces flashes of knowledge and speed.','Treat all Knowledge skills as trained and gain +2 morale on initiative and against mind-affecting spells and abilities.',0,'none',NULL),
  ('mad-faith','Mad Faith','123','Gain bonus divine spell slots from depravity.','Gain bonus divine spells per day as depravity rises: 1st-level at mild, plus 2nd-level at moderate, plus 3rd-level at severe; daily prayer/preparation time is doubled.',0,'none',NULL),
  ('master-of-knowledge','Master of Knowledge','123','Improve all Knowledge checks.','Gain +1 on all Knowledge skill checks.',0,'none',NULL),
  ('oneiromancy','Oneiromancy','123-124','Gain dream-magic advantages.','Avoid normal spell mishaps in nightmare realms; gain dreamscape benefits to enchantment/illusion magic and rules for spells cast against dream selves.',0,'none',NULL),
  ('pure-soul','Pure Soul','124','Become immune to acquiring taint.','You do not gain taint.',0,'none',NULL),
  ('spirit-sense','Spirit Sense','124','See and communicate with recently departed spirits.','See spirits of creatures dead for a number of minutes up to your Wisdom bonus, speak with them if a language is shared, and gain +4 circumstance on Listen or Spot checks to detect incorporeal creatures.',0,'none',NULL),
  ('surge-of-malevolence','Surge of Malevolence','124','Draw on taint for a large bonus to one roll.','Once per day, before rolling, add +3, +6, or +9 to one attack roll, saving throw, or check according to degree of corruption.',0,'none',NULL),
  ('tainted-fury','Tainted Fury','124','Enter a corruption-fueled fury with bonus hit points and a tainted smite.','Gain hit points equal to corruption score for a number of rounds equal to corruption; one melee attack can add half corruption to damage. Ending the fury requires a Fortitude save or causes Constitution damage and sickness.',0,'none',NULL),
  ('touch-of-taint','Touch of Taint','124','Make a draining natural attack also bestow corruption or depravity.','Choose a natural attack that deals ability damage/drain or negative levels; it also increases corruption or depravity according to the affected ability or energy drain.',0,'other',NULL),
  ('unnatural-will','Unnatural Will','124','Use force of personality against fear.','Add your Charisma modifier to Will saves against fear effects; this stacks with the normal Wisdom contribution.',0,'none',NULL),
  ('willing-deformity','Willing Deformity','125','Deliberate deformity makes you more intimidating and enables other deformity feats.','Gain +3 on Intimidate checks and qualify for other deformity feats.',0,'none',NULL)
)
INSERT INTO dnd35_feats
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   repeatable,choice_kind,repeatability_text,normal_text,special_text)
SELECT 'hoh-feat-'||d.slug,'hoh-3.5',d.source_page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
       d.repeatable,d.choice_kind,d.repeatability_text,NULL,NULL
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_feats f WHERE f.slug=d.slug AND f.owner_user_id IS NULL
);
