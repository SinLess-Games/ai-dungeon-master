-- Epic Level Handbook epic-prestige class feature definitions.
-- Detailed scaling/cadence is stored on class-feature grants so advancement can continue
-- beyond the ten displayed class levels without treating the source table as a cap.

WITH desired(class_slug,feature_slug,name,page,description,choice_kind) AS (VALUES
  ('agent-retriever','uncanny-location','Uncanny Location','24-25','After a day of attunement to a sought creature or object, determine its location as discern location and maintain the link while pursuing that quarry exclusively.',NULL),
  ('agent-retriever','tracking-bonus','Tracking Bonus','25','Gain a scaling insight bonus on Survival checks made to track the current quarry.',NULL),
  ('agent-retriever','plane-shift','Plane Shift','25','Use plane shift as a spell-like ability; daily uses increase with class level.',NULL),
  ('agent-retriever','force-sphere','Force Sphere','25','Trap a visible creature or object within 30 feet in a persistent sphere of force; the target receives a Reflex save based on class level and Dexterity.',NULL),
  ('agent-retriever','ethereal-jaunt','Ethereal Jaunt','25','Use ethereal jaunt as a spell-like ability; daily uses increase with class level.',NULL),
  ('agent-retriever','bonus-feat','Bonus Epic Feat','25','Select an epic bonus feat from the agent retriever list.','feat'),

  ('cosmic-descryer','superior-planar-summoning','Superior Planar Summoning','26','Increase the Hit Dice limits or advancement of the source-listed high-level summoning and calling spells; the increase scales every four class levels.',NULL),
  ('cosmic-descryer','naturalization','Naturalization','26','Become treated as native to selected visited planes for effects that distinguish native from nonnative creatures; add another plane every two class levels.', 'other'),
  ('cosmic-descryer','enduring-gate','Enduring Gate','26','As a full-round action, extend a gate casting to one or more full days; duration increases every three class levels.',NULL),
  ('cosmic-descryer','cosmic-connection','Cosmic Connection','26-27','Temporarily connect to the multiverse, becoming native on every plane, immune to critical hits, able to use dimension door at will, and able to trade self-damage for bonuses or caster-level increases.',NULL),
  ('cosmic-descryer','bonus-feat','Bonus Epic Feat','26','Select an epic bonus feat from the cosmic descryer list.','feat'),

  ('divine-emissary','special-mount-progression','Special Mount Progression','27','If the emissary has a special mount, it continues to improve on a five-level cadence and gains spell resistance based on emissary and originating class levels.',NULL),
  ('divine-emissary','granted-domain','Granted Domain','28','Gain access to one domain of the patron deity and its granted power; the domain expands spell options without independently increasing maximum spell level.','domain'),
  ('divine-emissary','divine-inspiration','Divine Inspiration','28','Gain a +2 luck bonus on attack and damage rolls for 10 rounds; daily uses increase every three levels.',NULL),
  ('divine-emissary','extra-smite','Extra Smite','28','Gain additional daily uses of an existing smite ability; damage uses the combined level of divine emissary and the class that granted smite.',NULL),
  ('divine-emissary','greater-planar-ally','Greater Planar Ally','28','Call a greater planar ally without the ally requesting the normal return favor; uses increase on a ten-level cadence.',NULL),
  ('divine-emissary','divine-hand','Divine Hand','28','As a free action gain a +20 sacred or profane bonus on the next attack made with the patron deity’s favored weapon; uses increase every ten levels.',NULL),
  ('divine-emissary','bonus-feat','Bonus Epic Feat','28','Select an epic bonus feat from the divine emissary list.','feat'),

  ('epic-infiltrator','weapon-armor-proficiency','Weapon and Armor Proficiency','29','Proficient with all simple and martial weapons, all armor, and shields.',NULL),
  ('epic-infiltrator','improved-cover-identity','Improved Cover Identity','29','Maintain multiple highly practiced cover identities that improve Disguise, Bluff, and Gather Information and conceal alignment from divination; identity capacity scales with class level.','other'),
  ('epic-infiltrator','sneak-attack','Sneak Attack','29','Gain scaling sneak-attack damage that stacks with sneak attack from other sources.',NULL),
  ('epic-infiltrator','specialist-training','Specialist Training','29-30','Choose an espionage specialty and gain +3 on its associated skill checks; repeated selections may improve the same specialty.','other'),
  ('epic-infiltrator','read-thoughts','Read Thoughts','30','Read the surface thoughts of one selected creature as a supernatural detect thoughts effect; uses scale with class level.',NULL),
  ('epic-infiltrator','far-senses','Far Senses','30','Project hearing or vision to a personally visited location within a class-level-based range; can also extend read thoughts through the remote sense. Uses scale every two levels.',NULL),
  ('epic-infiltrator','mind-blank','Mind Blank','30','Gain personal immunity to mind-affecting effects and divinations as mind blank; uses scale on an eight-level cadence.',NULL),

  ('guardian-paramount','weapon-armor-proficiency','Weapon and Armor Proficiency','30','Proficient with all simple and martial weapons, all armor, and shields.',NULL),
  ('guardian-paramount','uncanny-dodge-enabler','Uncanny Dodge Enabler','30-31','Extend the guardian paramount’s existing uncanny dodge benefits to a designated adjacent creature; uses scale every three levels.',NULL),
  ('guardian-paramount','evasive-preceptor','Evasive Preceptor','31','Extend evasion or improved evasion to a designated adjacent creature; uses scale every three levels.',NULL),
  ('guardian-paramount','protective-aura','Protective Aura','31','Create a modified shield other effect in which transferred wounds are taken as nonlethal damage; uses scale every three levels.',NULL),
  ('guardian-paramount','adjust-probability','Adjust Probability','31','Force a visible nearby creature to reroll an attack roll, check, or saving throw after the result is known; the second result stands. Uses scale every three levels.',NULL),
  ('guardian-paramount','call-back','Call Back','31','Return to life a creature previously protected by one of the guardian paramount’s class abilities, functioning like true resurrection; uses scale every six levels.',NULL),
  ('guardian-paramount','bonus-feat','Bonus Epic Feat','30-31','Select an epic bonus feat from the guardian paramount list.','feat'),

  ('high-proselytizer','weapon-armor-proficiency','Weapon and Armor Proficiency','32','Proficient with simple weapons, all armor, and shields.',NULL),
  ('high-proselytizer','proselytize','Proselytize','32','Preach with supernatural reach and protection, allowing listeners to become enraptured and influenced according to allegiance, alignment, Hit Dice, and saving throw.',NULL),
  ('high-proselytizer','deific-touch','Deific Touch','32','During proselytize, deliver a patron-deity-themed touch effect once per use cadence.',NULL),
  ('high-proselytizer','deific-word','Deific Word','32','During proselytize, release a triple-strength sound burst against listeners who resist becoming enraptured.',NULL),
  ('high-proselytizer','deific-face','Deific Face','32','During proselytize, unleash a sunburst-like blinding manifestation against listeners who resist becoming enraptured.',NULL),
  ('high-proselytizer','deific-aura','Deific Aura','32','During proselytize, invoke the alignment-appropriate blasphemy, dictum, holy word, or word of chaos against listeners who resist becoming enraptured.',NULL),
  ('high-proselytizer','heal','Heal','32','Use heal as a spell-like ability; daily uses increase every four levels.',NULL),
  ('high-proselytizer','bonus-feat','Bonus Epic Feat','32-33','Select an epic bonus feat from the high proselytizer list.','feat'),

  ('legendary-dreadnought','weapon-armor-proficiency','Weapon and Armor Proficiency','33','Proficient with all simple and martial weapons, all armor, and shields.',NULL),
  ('legendary-dreadnought','unstoppable','Unstoppable','33','Gain a +20 bonus on a single qualifying Strength check to break or burst an object, including an attempt against wall of force, or apply the bonus to one attack roll; uses scale every five levels.',NULL),
  ('legendary-dreadnought','unmovable','Unmovable','33','Gain a +20 bonus against being grabbed or moved, or on one saving throw; can create a Will save against a movement effect that normally allows none. Uses scale every five levels.',NULL),
  ('legendary-dreadnought','shrug-off-punishment','Shrug Off Punishment','34','Gain 12 bonus hit points, with another 12 every five levels.',NULL),
  ('legendary-dreadnought','thick-skinned','Thick Skinned','34','Gain stacking damage reduction 3/—, improving by another 3 every five levels according to the source stacking restrictions.',NULL),
  ('legendary-dreadnought','bonus-feat','Bonus Epic Feat','34','Select an epic bonus feat from the legendary dreadnought list.','feat'),

  ('perfect-wight','improved-invisibility','Improved Invisibility','34','Gain improved invisibility as a supernatural effect cast at 20th caster level; daily uses scale every five levels.',NULL),
  ('perfect-wight','improved-legerdemain','Improved Legerdemain','34','Use selected manipulation skills at 30 feet or deliver a melee sneak/death attack across that distance as though flanking; daily uses scale every five levels.',NULL),
  ('perfect-wight','incorporeal','Incorporeal','34-35','Become incorporeal for 20 + class level rounds; daily uses scale every five levels.',NULL),
  ('perfect-wight','shadow-form','Shadow Form','35','Assume an enhanced incorporeal shadow form with critical-hit immunity, fast flight, and the option to trade self-damage for bonuses or effective-level increases.',NULL),
  ('perfect-wight','bonus-feat','Bonus Epic Feat','35','Select an epic bonus feat from the perfect wight list.','feat'),

  ('union-sentinel','weapon-armor-proficiency','Weapon and Armor Proficiency','36','Proficient with all simple and martial weapons, all armor, and shields.',NULL),
  ('union-sentinel','sending','Sending','36','Use sending as a spell-like ability at fixed caster level; daily uses scale every seven levels.',NULL),
  ('union-sentinel','shield-of-law','Shield of Law','36','Use shield of law as a spell-like ability at fixed caster level; daily uses scale every three levels.',NULL),
  ('union-sentinel','freedom','Freedom','36','Use freedom as a spell-like ability at fixed caster level; daily uses scale every six levels.',NULL),
  ('union-sentinel','knock','Knock','36','Use knock as a spell-like ability at fixed caster level; daily uses scale every four levels.',NULL),
  ('union-sentinel','dimensional-anchor','Dimensional Anchor','36','Use dimensional anchor as a spell-like ability at fixed caster level; daily uses scale every three levels.',NULL),
  ('union-sentinel','portal-guardian','Portal Guardian','36','While adjacent to a portal or gate, suppress activation from either side without preventing the sentinel’s normal defense; daily uses scale every six levels.',NULL),
  ('union-sentinel','forcecage','Forcecage','36','Use forcecage as a spell-like ability at fixed caster level; daily uses scale every five levels.',NULL),
  ('union-sentinel','imprisonment','Imprisonment','36','Use imprisonment as a spell-like ability at fixed caster level; weekly uses scale every five levels.',NULL)
)
INSERT OR IGNORE INTO dnd35_class_features
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,special_ability_id,choice_kind)
SELECT 'elh-class-feature-'||d.class_slug||'-'||d.feature_slug,'elh-3.0',d.page,
       d.class_slug||'-'||d.feature_slug,d.name,d.description,d.description,0,NULL,1,NULL,d.choice_kind
FROM desired d;
