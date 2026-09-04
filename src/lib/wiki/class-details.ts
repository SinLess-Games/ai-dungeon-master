import type { WikiSection } from "./dm-guide";

export interface ClassDetail {
  /** One-line role summary shown under the title. */
  role: string;
  /** Key ability scores, in play order. */
  keyAbilities: string;
  /** Weapon, armour and shield proficiency summary. */
  proficiencies: string;
  /** Starting wealth in gold pieces (average in parentheses). */
  startingGold: string;
  /** Spellcasting/manifesting summary, when the class has one. */
  casting?: string;
  /** Narrative and rules sections rendered after the mechanical tables. */
  sections: WikiSection[];
}

/**
 * Player-facing detail for each class. Written from scratch as original
 * reference material for this app; open-game mechanics only, no book prose.
 */
export const CLASS_DETAILS: Record<string, ClassDetail> = {
  barbarian: {
    role: "Front-line damage dealer and damage sponge who trades defence for raw aggression.",
    keyAbilities: "Strength, then Constitution; Dexterity if you fight unarmoured.",
    proficiencies: "All simple and martial weapons, light and medium armour, and shields (not tower shields).",
    startingGold: "4d4 x 10 gp (100 gp average)",
    sections: [
      {
        heading: "Rage",
        body: "Once per day at 1st level (and more often as you level) you can fly into a rage as a free action on your turn. While raging you gain **+4 Strength**, **+4 Constitution**, a **+2 morale bonus on Will saves**, and take a **-2 penalty to AC**. The Constitution boost gives you 2 temporary hit points per Hit Die for the duration.\n\nRage lasts a number of rounds equal to **3 + your (new) Constitution modifier**, and you can end it early as a free action. While raging you cannot use anything that requires patience or concentration — Concentration, Craft, most Intelligence-, Dexterity- or Charisma-based skills, spellcasting, or activating magic items by command word. Balance, Escape Artist, Intimidate and Ride still work.\n\nWhen the rage ends you are **fatigued** (-2 Str, -2 Dex, cannot run or charge) for the rest of the encounter. You can only start a rage when not already fatigued or exhausted.",
      },
      {
        heading: "Illiteracy and armour",
        body: "A barbarian begins play unable to read or write any language. Spending 2 skill points buys literacy in all the languages you speak. A barbarian who gains a level in any other class becomes literate automatically.\n\nFast Movement only applies in no armour, light armour or medium armour, and only when not carrying a heavy load — the same restriction applies to a monk's speed bonus if you multiclass.",
      },
      {
        heading: "Playing a barbarian",
        body: "You are the party's opening move. Charge the biggest threat, rage, and keep the enemy's attention while the rest of the group works. Your low Will save and rage penalty to AC are the price — a caster who can shield you or a cleric who can drop a save-boosting spell makes an enormous difference.\n\nBarbarians come from places where survival is a daily skill rather than a hobby: nomad camps, frozen coasts, jungles, orc warbands, or simply an unusually violent frontier town. Nothing requires you to be stupid or unwashed; illiteracy is a background detail, not a personality.",
      },
      {
        heading: "Multiclassing and advancement",
        body: "A barbarian who becomes lawful can no longer rage and cannot gain further barbarian levels, though other class levels still work normally. Barbarians pair well with fighter (bonus feats), ranger (skills and a second combat style), and any prestige class that rewards raw damage. Beyond 20th level, rage uses per day and Damage Reduction keep advancing on the epic track.",
      },
    ],
  },

  bard: {
    role: "Support caster, face of the party, and the widest skill list in the game.",
    keyAbilities: "Charisma above all, then Dexterity and Intelligence.",
    proficiencies: "All simple weapons plus longsword, rapier, sap, short sword, shortbow and whip; light armour and shields (not tower shields). You can cast bardic spells in light armour with no arcane spell failure.",
    startingGold: "4d4 x 10 gp (100 gp average)",
    casting: "Spontaneous arcane casting off Charisma, up to 6th-level spells. You know a small fixed list of spells and can cast any of them with your daily slots — no preparation. You need Cha 10 + spell level to cast a spell, and bonus slots come from high Charisma.",
    sections: [
      {
        heading: "Bardic music",
        body: "You can use bardic music a number of times per day equal to your bard level. Each use takes a standard action to start and requires a Perform check; most effects continue while you keep performing and for a few rounds after you stop.\n\n- **Countersong** (1st) — Perform check substitutes for allies' saves against sonic and language-dependent effects for 10 rounds.\n- **Fascinate** (1st) — hold one or more creatures rapt; your Perform check sets the Will DC.\n- **Inspire Courage** (1st) — allies who can hear you gain a morale bonus on saves against charm and fear and on attack and damage rolls (+1, rising to +4 by 20th).\n- **Inspire Competence** (3rd) — one ally gains +2 on a skill check.\n- **Suggestion** (6th) — plant a course of action in a fascinated creature.\n- **Inspire Greatness** (9th) — grant allies bonus Hit Dice, attack bonus and Fortitude saves.\n- **Song of Freedom** (12th) — act as *break enchantment*.\n- **Inspire Heroics** (15th) — a large morale bonus to saves and AC.\n- **Mass Suggestion** (18th) — suggestion to every fascinated creature at once.",
      },
      {
        heading: "Bardic knowledge",
        body: "Make a check of **1d20 + bard level + Intelligence modifier** to recall a scrap of relevant lore about a person, place or thing. Common knowledge is DC 10; obscure DC 20; extremely obscure DC 25 or higher. You cannot retry, and the DM decides how much detail you get.",
      },
      {
        heading: "Playing a bard",
        body: "You rarely win the fight yourself — you make everyone else win it faster. Open with inspire courage, then use your spells for control and utility (*glitterdust*, *haste*, *grease*, *invisibility*) rather than damage. Out of combat you are the party's negotiator, investigator and lockpick-adjacent generalist.\n\nBards must be nonlawful; the class rewards improvisation. Perform is your engine skill, so pick an instrument or style and commit to it.",
      },
    ],
  },

  cleric: {
    role: "Divine spellcaster, healer, buffer and surprisingly capable armoured fighter.",
    keyAbilities: "Wisdom for spells, Constitution and Strength to hold the line, Charisma for turning.",
    proficiencies: "All simple weapons, all armour, and all shields (not tower shields), plus your deity's favoured weapon if a domain grants it.",
    startingGold: "5d4 x 10 gp (125 gp average)",
    casting: "Prepared divine casting off Wisdom, up to 9th-level spells. You prepare from the entire cleric list each day after 8 hours' rest and an hour of prayer, plus one domain spell of each level.",
    sections: [
      {
        heading: "Domains",
        body: "Choose two domains at 1st level from those your deity offers. Each grants a **granted power** (usually a bonus feat, a boosted skill, or a once-per-day ability) and adds one **domain spell** per spell level to your daily preparation. Domain slots can only be filled with that domain's spell.\n\nA cleric with no deity picks two domains that match their alignment and beliefs, subject to the DM's approval.",
      },
      {
        heading: "Turning and rebuking undead",
        body: "A number of times per day equal to **3 + your Charisma modifier**, you can channel divine energy as a standard action.\n\n1. **Turning check** — 1d20 + Cha modifier tells you the highest Hit Dice of undead affected.\n2. **Turning damage** — 2d6 + cleric level + Cha modifier is the total HD of undead you affect, nearest first.\n\nGood clerics (and neutral clerics who choose to) turn undead, making them flee for 10 rounds; if your total damage is at least twice a creature's HD it is destroyed outright. Evil clerics rebuke instead, cowing undead and eventually commanding them. Turn attempts also fuel a large number of divine feats.",
      },
      {
        heading: "Spontaneous casting",
        body: "A good cleric can convert any prepared non-domain spell into a *cure* spell of the same level on the fly. An evil cleric converts to *inflict* spells instead. A neutral cleric of a neutral deity picks one option at 1st level and is locked into it forever. This is why you can afford to prepare useful spells instead of hoarding healing.",
      },
      {
        heading: "Alignment and conduct",
        body: "Your alignment must be within one step of your deity's on either axis, and you cannot be neutral unless your deity is. Clerics who grossly violate their god's code lose all spells and class abilities until they atone.\n\nA cleric whose alignment includes **good**, **evil**, **law** or **chaos** casts spells with those descriptors at +1 caster level and cannot cast spells of the opposing descriptor at all.",
      },
      {
        heading: "Playing a cleric",
        body: "Do not play a cleric as a healing dispenser. Buff before the fight (*divine favor*, *bless*, *magic vestment*), control during it (*spiritual weapon*, *hold person*), and heal only when someone would otherwise drop. Your armour and 3/4 base attack mean you can stand in the front rank while doing it.",
      },
    ],
  },

  druid: {
    role: "Nature caster, shapeshifter and pet owner — three characters wearing one hat.",
    keyAbilities: "Wisdom for spells, Constitution for wild-shape brawling, Dexterity in light armour.",
    proficiencies: "Club, dagger, dart, quarterstaff, scimitar, sickle, shortspear, sling and spear; light and medium armour and shields, but **nothing made of metal**.",
    startingGold: "2d4 x 10 gp (50 gp average)",
    casting: "Prepared divine casting off Wisdom, up to 9th-level spells, prepared in the morning after communing with nature for an hour.",
    sections: [
      {
        heading: "The metal prohibition",
        body: "Druids will not wear metal armour or carry metal shields — that means hide, leather, padded or wooden armour only. A druid who wears prohibited armour loses all spellcasting and supernatural class abilities for 24 hours after taking it off. Metal weapons are fine; the restriction is about armour and shields.",
      },
      {
        heading: "Wild shape",
        body: "From 5th level you can take the form of a Small or Medium animal once per day, and more often and in more sizes as you level (Large at 8th, Tiny at 11th, Huge at 15th). Elemental forms arrive at 16th, plant forms at 12th.\n\nWild shape works like *polymorph*: you gain the animal's physical ability scores, natural attacks, movement modes and senses, but keep your own mental scores, saves, hit points and class abilities. Your gear melds into the new form and stops functioning. Each use lasts hours equal to your druid level, or until you change back.",
      },
      {
        heading: "Animal companion",
        body: "A loyal animal chosen from the standard list joins you at 1st level. It gains bonus Hit Dice, natural armour, Strength and Dexterity as you level, gets your class level as its bonus on saving throws against enchantments, shares your link (you can handle it as a free action and use Handle Animal untrained on it), and from 3rd level shares your spells. Higher-level animals are available if you accept an effective druid-level penalty.\n\nIf your companion dies you can call a new one after a day of ceremony; there is no experience penalty.",
      },
      {
        heading: "Other class features",
        body: "**Nature Sense** gives +2 on Knowledge (nature) and Survival. **Wild Empathy** lets you change an animal's attitude with a check of 1d20 + druid level + Cha. **Woodland Stride** (2nd) ignores natural undergrowth. **Trackless Step** (3rd) leaves no trail. **Resist Nature's Lure** (4th) grants +4 on saves against fey. **Venom Immunity** arrives at 9th, **A Thousand Faces** (change self at will) at 13th, **Timeless Body** at 15th, and true immortality of form at 20th.",
      },
      {
        heading: "Alignment and conduct",
        body: "A druid must have neutrality in their alignment (LN, NG, N, NE or CN). A druid who stops being neutral, or who teaches the Druidic language to a non-druid, loses all spells and druid abilities and cannot gain druid levels until they atone.",
      },
    ],
  },

  fighter: {
    role: "The weapons specialist. More combat feats, earlier, than anyone else.",
    keyAbilities: "Strength (or Dexterity for archery and finesse), Constitution, and Intelligence if you want skills.",
    proficiencies: "All simple and martial weapons, all armour, and all shields including tower shields.",
    startingGold: "6d4 x 10 gp (150 gp average)",
    sections: [
      {
        heading: "Bonus feats",
        body: "You gain a bonus combat feat at 1st level and another at every even level — eleven extra feats by 20th, on top of the feats every character gets. They must come from the fighter bonus feat list (Power Attack, Combat Expertise, Weapon Focus, Improved Trip, Two-Weapon Fighting, Point Blank Shot and their long chains of follow-ups).\n\nThis is the class's entire identity: no other class can pick up a full feat chain and still have feats left for something else.",
      },
      {
        heading: "Choose a style at 1st level",
        body: "Feat chains are long, so decide early:\n\n- **Two-handed** — Power Attack, Cleave, Improved Bull Rush, Leap Attack. Highest raw damage.\n- **Sword and board** — Shield Specialization, Improved Shield Bash, Combat Expertise. Durable, holds a doorway.\n- **Archery** — Point Blank Shot, Precise Shot, Rapid Shot, Manyshot. Safe damage at range.\n- **Two-weapon** — needs Dex 15+ and lots of feats, but pairs beautifully with sneak attack.\n- **Battlefield control** — Combat Expertise, Improved Trip, Improved Disarm. Fewer kills, more won fights.",
      },
      {
        heading: "Playing a fighter",
        body: "Only 2 skill points per level, so spend them on Intimidate, Jump or Climb and lean on the party for the rest. Fighter levels are the standard entry ticket for combat prestige classes, and a two- or four-level dip pays for itself on almost any martial build. Weapon Specialization arrives at fighter level 4.",
      },
    ],
  },

  monk: {
    role: "Unarmoured skirmisher with unarmed damage, mobility and the best saving throws in the game.",
    keyAbilities: "Wisdom and Dexterity (both add to AC), then Strength.",
    proficiencies: "Club, crossbows, dagger, handaxe, javelin, kama, nunchaku, quarterstaff, sai, shuriken, siangham, sling and shortspear. **No armour or shields at all** — wearing either shuts off AC bonus, flurry, fast movement and most class features.",
    startingGold: "5d4 gp (12 gp average) — monks start with almost nothing on purpose.",
    sections: [
      {
        heading: "Unarmed strike and flurry of blows",
        body: "Your unarmed strike deals **1d6** at 1st level, rising to 2d10 by 20th (Small monks deal less, Large more). It counts as both armed and unarmed, is never an off-hand attack, and you can deal lethal or nonlethal damage at will.\n\n**Flurry of blows** gives you one extra attack at your highest bonus with a **-2 penalty on all attacks** that round, usable only unarmoured with unarmed strikes or special monk weapons. The penalty drops to -1 at 5th and to none at 9th; a second extra attack arrives at 11th.",
      },
      {
        heading: "AC bonus and fast movement",
        body: "While unarmoured and unencumbered you add your **Wisdom modifier** to AC, plus a scaling class bonus (+1 at 5th, up to +5 at 20th). This bonus applies even against touch attacks and when flat-footed, but not when helpless or immobilised.\n\nFast movement adds +10 ft. to your land speed at 3rd, up to +60 ft. at 18th — again only unarmoured and lightly loaded.",
      },
      {
        heading: "The rest of the ladder",
        body: "**Evasion** (2nd) and **Improved Evasion** (9th) turn Reflex saves into no damage. **Still Mind** (3rd) grants +2 against enchantments. **Ki Strike** (4th) makes your fists magic, then lawful (10th) and adamantine (16th). **Slow Fall** (4th+) reduces falling damage near a wall. **Purity of Body** (5th) blocks disease, **Wholeness of Body** (7th) heals you, **Diamond Body** (11th) blocks poison, **Abundant Step** (12th) is *dimension door*, **Diamond Soul** (13th) gives spell resistance 10 + level, **Quivering Palm** (15th) can kill outright once a week, **Timeless Body** (17th), **Tongue of the Sun and Moon** (17th), **Empty Body** (19th) is etherealness, and **Perfect Self** (20th) makes you a lawful outsider.",
      },
      {
        heading: "Alignment and multiclassing",
        body: "A monk must be lawful. A monk who becomes nonlawful loses all monk abilities and can never gain monk levels again. Uniquely, **a monk who takes a level in any other class can never advance as a monk again** — so plan any multiclass carefully, and take monk levels first if you intend to dip.",
      },
    ],
  },

  paladin: {
    role: "Holy knight — heavy armour, a warhorse, smite evil and a short divine spell list.",
    keyAbilities: "Strength and Charisma (Charisma feeds smite, saves and lay on hands), then Constitution.",
    proficiencies: "All simple and martial weapons, all armour, and all shields (not tower shields).",
    startingGold: "6d4 x 10 gp (150 gp average)",
    casting: "Prepared divine casting off Wisdom, beginning at 4th level and reaching 4th-level spells. Your caster level is half your paladin level.",
    sections: [
      {
        heading: "Smite evil and divine grace",
        body: "Once per day at 1st level (and up to five times by 19th) you can declare a **smite evil** on one attack, adding your **Charisma modifier to the attack roll** and **your paladin level to damage**. If the target is not evil, the use is wasted.\n\n**Divine Grace** (2nd) adds your Charisma modifier to all three saving throws — the single best reason to keep Charisma high, and the reason paladins are almost impossible to control with spells.",
      },
      {
        heading: "Healing, immunity and detection",
        body: "**Detect Evil** at will (1st). **Lay on Hands** (2nd) heals a pool of **paladin level x Cha modifier** hit points per day, split however you like, or deals that damage to undead as a touch attack. **Divine Health** (3rd) makes you immune to all disease, including magical ones. **Aura of Courage** (3rd) makes you immune to fear and gives allies within 10 ft. +4 against it. **Remove Disease** arrives at 6th, once per week and more often later.",
      },
      {
        heading: "Turn undead and special mount",
        body: "From 4th level you turn undead as a cleric of three levels lower. From 5th level you can call a **special mount** — a heavy warhorse (or pony) with bonus Hit Dice, natural armour, improved Intelligence, empathic link, share spells and eventually spell resistance. Calling it is a standard action, usable a few times per day, for hours equal to your level.",
      },
      {
        heading: "Code of conduct",
        body: "A paladin must be **lawful good** and must act like it: never willingly commit an evil act, respect legitimate authority, keep their word, help those in need, punish those who threaten the innocent. You may not associate with anyone who consistently offends your morals or works against your ideals, and you may not hire evil henchmen or cohorts.\n\nA paladin who ever willingly commits an evil act, or who grossly violates the code, loses **all paladin spells and class features** (though keeps proficiencies) until they receive an *atonement* spell. A paladin who stops being lawful good can never gain further paladin levels. Paladins may also not multiclass freely: once you take a level in another class, you can no longer advance as a paladin.",
      },
    ],
  },

  ranger: {
    role: "Wilderness scout and skirmisher with tracking, favoured enemies and a free fighting style.",
    keyAbilities: "Dexterity for archery or Strength for two-weapon fighting; Wisdom for spells and Survival.",
    proficiencies: "All simple and martial weapons, light armour and shields (not tower shields). Your combat style bonuses only work in light armour or none.",
    startingGold: "6d4 x 10 gp (150 gp average)",
    casting: "Prepared divine casting off Wisdom, beginning at 4th level and reaching 4th-level spells, at half your ranger level as caster level.",
    sections: [
      {
        heading: "Favored enemy",
        body: "At 1st level and every five levels after, choose a creature type (and for humanoids and outsiders, a subtype). Against that group you gain a **+2 bonus on Bluff, Listen, Sense Motive, Spot and Survival checks, and +2 on weapon damage rolls**, rising by +2 each time you re-select the same enemy. Pick something the campaign actually contains — ask your DM before committing to aberrations.",
      },
      {
        heading: "Combat style",
        body: "At 2nd level pick **archery** or **two-weapon fighting**. You get that style's key feats for free and without meeting the prerequisites: Rapid Shot or Two-Weapon Fighting at 2nd, Manyshot or Improved Two-Weapon Fighting at 6th, and Improved Precise Shot or Greater Two-Weapon Fighting at 11th. This is worth several feats' value, but only functions in light or no armour.",
      },
      {
        heading: "Wilderness abilities",
        body: "**Track** as a bonus feat and **Wild Empathy** at 1st. **Endurance** at 3rd. **Animal Companion** at 4th (as a druid of half your level). **Woodland Stride** at 7th, **Swift Tracker** at 8th (track at full speed), **Evasion** at 9th, **Camouflage** at 13th (Hide in any natural terrain) and **Hide in Plain Sight** at 17th.",
      },
      {
        heading: "Playing a ranger",
        body: "Rangers are the best scouts in the game: good skills, good Reflex and Fortitude, tracking, and enough combat power to survive being the one who walks ahead. With 6 skill points per level, take Survival, Spot, Listen, Hide, Move Silently and Knowledge (nature). There is no alignment requirement.",
      },
    ],
  },

  rogue: {
    role: "Skill monster, trap-handler and burst damage dealer who wins fights by not being seen.",
    keyAbilities: "Dexterity first, then Intelligence for skill points; Strength or Charisma depending on style.",
    proficiencies: "All simple weapons plus hand crossbow, rapier, sap, shortbow and short sword; light armour, no shields.",
    startingGold: "5d4 x 10 gp (125 gp average)",
    sections: [
      {
        heading: "Sneak attack",
        body: "When your target is **denied its Dexterity bonus to AC** or when you **flank** it, you deal an extra **1d6** damage, rising by 1d6 every two levels to **10d6** at 19th. It applies to ranged attacks within 30 ft. as well as melee.\n\nSneak attack does not work against creatures immune to critical hits (undead, constructs, oozes, plants, elementals), against a target with concealment, or when you cannot see and reach a vital spot — which is why *true seeing*, ghost-touch weapons and a friendly wizard matter so much.",
      },
      {
        heading: "Trapfinding, evasion and dodging",
        body: "**Trapfinding** lets you use Search to find traps of any DC, including magical ones, and Disable Device to remove them — the only class that can do this natively. **Evasion** (2nd) turns a successful Reflex save into no damage. **Uncanny Dodge** (4th) keeps your Dex bonus when flat-footed, and **Improved Uncanny Dodge** (8th) makes you effectively unflankable. **Trap Sense** improves your Reflex saves and AC against traps every three levels.",
      },
      {
        heading: "Special abilities",
        body: "At 10th level and every three levels after, choose one: **Crippling Strike** (sneak attacks deal 2 Strength damage), **Defensive Roll** (once a day, take half damage from a killing blow), **Improved Evasion**, **Opportunist** (a free attack when an ally hits), **Skill Mastery** (take 10 on chosen skills even under pressure), **Slippery Mind** (a second save against enchantments), or a bonus feat.",
      },
      {
        heading: "Playing a rogue",
        body: "8 + Int skill points per level is the largest budget of any class. Cover the party's blind spots: Search, Disable Device, Open Lock, Hide, Move Silently, Spot, Listen, Bluff, Tumble and Use Magic Device (which lets you fake your way into wands and scrolls). In combat, get flanking rather than charging — a rogue in the front rank without cover dies quickly.",
      },
    ],
  },

  sorcerer: {
    role: "Spontaneous arcane blaster with a small spell selection and enormous daily volume.",
    keyAbilities: "Charisma sets everything — spells known, slots and save DCs; Constitution and Dexterity keep you alive.",
    proficiencies: "All simple weapons; no armour or shields (armour causes arcane spell failure).",
    startingGold: "3d4 x 10 gp (75 gp average)",
    casting: "Spontaneous arcane casting off Charisma up to 9th-level spells. You know a fixed short list and can cast any known spell with any open slot of that level, but you learn spells one level later than a wizard and can only swap a known spell at 4th level and every two levels after.",
    sections: [
      {
        heading: "Spontaneous casting in practice",
        body: "You never prepare spells. After 8 hours' rest and 15 minutes of concentration, all your slots refresh, and you spend them on whatever you know as the situation demands. You need **Charisma 10 + spell level** to cast a spell of that level, and high Charisma grants bonus slots.\n\nThe trade-off is breadth: a wizard has a hundred options and picks the right one in advance; you have a dozen and can use any of them right now, three times in a row.",
      },
      {
        heading: "Choosing spells known",
        body: "Every pick is permanent for several levels, so favour spells that are useful in many situations. Good staples: *grease*, *magic missile*, *glitterdust*, *web*, *haste*, *fly*, *dispel magic*, *black tentacles*, *teleport*, *wall of force*. Avoid narrow single-target save-or-die effects until high level, and let scrolls and wands cover situational utility.",
      },
      {
        heading: "Familiar and bloodline",
        body: "You gain a familiar at 1st level: a small animal that grants a static benefit (Alertness, plus a scaling bonus depending on type), shares your saves and can deliver touch spells. Losing it costs experience, so keep it out of combat.\n\nSorcerous power is traditionally inherited — a draconic ancestor, an outsider in the family line, or something older and less explicable. There is no alignment restriction.",
      },
    ],
  },

  wizard: {
    role: "Prepared arcane caster with the deepest spell list and the most problem-solving power in the game.",
    keyAbilities: "Intelligence sets bonus spells, save DCs and skill points; Constitution and Dexterity keep you breathing.",
    proficiencies: "Club, dagger, heavy and light crossbow, and quarterstaff; no armour or shields.",
    startingGold: "3d4 x 10 gp (75 gp average)",
    casting: "Prepared arcane casting off Intelligence up to 9th-level spells. You must study your spellbook for an hour each day to fill your slots, and you need Intelligence 10 + spell level to cast a spell of that level.",
    sections: [
      {
        heading: "Your spellbook",
        body: "You begin with a spellbook containing all 0-level spells plus three 1st-level spells of your choice, and you add **two new spells of any level you can cast** at each new wizard level, free. Beyond that, you learn spells by copying them from scrolls or other spellbooks: a Spellcraft check (DC 15 + spell level) and time and gold spent on inks. Losing your spellbook is a genuine crisis, so keep a backup.",
      },
      {
        heading: "Specialisation",
        body: "At 1st level you may choose one of the eight schools as a **specialist school**. You gain one extra spell slot of every level, which must be filled with a spell from that school, and +2 on Spellcraft checks concerning it. In exchange you give up two other schools entirely (one if you specialise in divination) — you can never cast or even learn spells from them, and scrolls of those spells are useless to you.\n\nEnchantment and evocation are the usual sacrifices. Never bar conjuration, transmutation or abjuration.",
      },
      {
        heading: "Bonus feats and familiar",
        body: "At 1st, 5th, 10th, 15th and 20th level you gain a bonus feat from the wizard list — metamagic feats (Extend, Empower, Quicken, Silent, Still), item creation feats (Scribe Scroll at 1st for free, Craft Wondrous Item, Craft Wand), or Spell Mastery.\n\nA familiar arrives at 1st level with the same rules as a sorcerer's: Alertness, a scaling type-based benefit, shared saves and touch spell delivery.",
      },
      {
        heading: "Playing a wizard",
        body: "Preparation is the whole game. Scout first, prepare second. Keep utility (*knock*, *see invisibility*, *fly*, *dispel magic*) in reserve and leave a few slots open to fill after a short rest once you know what you are facing. Battlefield control beats damage: a *web* or *solid fog* wins more fights than a *fireball*.",
      },
    ],
  },
};
