import type { WikiArticle } from "./dm-guide";

/**
 * Player-facing reference for the expanded rule sets: epic levels (21+),
 * psionics, and horror/fear & taint play. Original summaries of the
 * mechanics — no text is reproduced from any sourcebook.
 */

export const EXPANSION_CATEGORIES = ["Epic Play", "Psionics", "Fear & Taint"] as const;

export const EXPANSION_ARTICLES: WikiArticle[] = [
  /* ------------------------------------------------------------ epic --- */
  {
    id: "epic-going-past-20",
    title: "Going Past 20th Level",
    category: "Epic Play",
    summary:
      "At character level 21 the normal progression stops and epic progression takes over: epic attack and save bonuses, a feat every third level, and no upper limit.",
    tags: ["epic", "level 21", "advancement"],
    sections: [
      {
        heading: "Becoming epic",
        body: `You are an **epic character** once your total character level reaches 21st. Some tables simply hand it over at the required experience total; others make the crossing a quest, a trial, or a bargain. Either way, the change is mechanical as well as dramatic.

You keep advancing in your existing classes. A ten-level prestige class can also be pushed past 10th once your character level is 20th or higher; shorter prestige classes cannot.`,
      },
      {
        heading: "What replaces base attack and saves",
        body: `Your **base attack bonus** and **base save bonuses** stop growing at character level 20. Instead:

- **Epic attack bonus:** +1 on all attacks at every odd level past 20th (21st, 23rd, 25th …). It does **not** grant extra attacks.
- **Epic save bonus:** +1 on all saving throws at every even level past 20th (22nd, 24th, 26th …).

Anywhere a feat or prestige class asks for your base attack or base save bonus, add the epic bonus in — except when working out how many iterative attacks you get.`,
      },
      {
        heading: "Feats, ability scores and skills",
        body: `- **Feats:** one extra feat at every level divisible by three (21st, 24th, 27th …), on top of class bonus feats. It can be an epic feat or an ordinary one.
- **Ability increases:** +1 to one ability at every level divisible by four (24th, 28th …).
- **Skill ranks:** maximum ranks in a class skill remain character level + 3; cross-class skills cap at half that.
- Multiclass characters count **character level**, not class level, for feats and ability increases.`,
      },
      {
        heading: "What keeps growing in your class",
        body: `Hit dice, skill points and most class features keep coming as usual. A few features that scale without limit (rage uses, sneak attack dice, wild shape, turning) continue on an epic schedule instead of stopping — usually gaining another step every few epic levels, with class bonus feats filling the gaps.`,
      },
    ],
  },
  {
    id: "epic-skills-and-feats",
    title: "Epic Skills and Epic Feats",
    category: "Epic Play",
    summary:
      "With 30+ ranks, ordinary skills do impossible things. Epic feats let you break the caps that bound you before 21st level.",
    tags: ["epic", "skills", "feats"],
    sections: [
      {
        heading: "Epic skill uses",
        body: `Epic ranks unlock DCs no normal character could attempt: jumping distances that read like flight, hiding while being watched, balancing on a cloud of smoke, talking a hostile army into standing down. As a rule of thumb the DM sets a DC in the 40–120 range and the result is legendary rather than merely difficult.

Two habits matter at epic tier:
- **Take 10 whenever you can.** Your modifier alone often beats the DC.
- **Synergy and circumstance bonuses stack up fast.** Stack them deliberately before the roll instead of hoping for a 20.`,
      },
      {
        heading: "Taking epic feats",
        body: `Epic feats are chosen with your normal feat slots at 21st, 24th, 27th and so on, and with class bonus feats where the class allows it. Most have steep prerequisites — a very high ability score, 20+ ranks in a skill, or a stack of earlier feats.

Typical things epic feats do:
- Raise a cap: more attacks of opportunity, unlimited stacking of a bonus, larger critical multipliers.
- Add a new use of an existing feature: extra rages, extra turning attempts, extra spell slots.
- Grant an outright supernatural ability: damage reduction, spell resistance, energy immunity, a devastating critical.`,
      },
    ],
  },
  {
    id: "epic-magic",
    title: "Epic Spellcasting and Epic Items",
    category: "Epic Play",
    summary:
      "Above 9th-level spells, magic stops being a spell list and becomes a project: a Spellcraft DC, a research cost, and a slot to cast it from.",
    tags: ["epic", "magic", "crafting"],
    sections: [
      {
        heading: "Spell slots past 20th",
        body: `You do not gain 10th-level or higher spells. Instead your caster level keeps rising, and you gain extra slots of the levels you already have (usually through epic feats). Everything that scales with caster level — damage dice, duration, range, dispel checks — keeps improving.`,
      },
      {
        heading: "Epic spells",
        body: `Epic spells are built rather than looked up:

1. You need the epic spellcasting ability, which requires very high ranks in the relevant magical skill and the ability to cast 9th-level spells.
2. You **develop** the spell: combine seeds (destroy, heal, transport, conjure, ward and so on), apply factors that raise or lower the difficulty, and arrive at a **Spellcraft DC**.
3. Development costs time and gold, and the spell is then part of your repertoire.
4. Casting takes an open 9th-level slot (usually a full-round action or longer) and a Spellcraft check against that DC. Failure burns the slot.

Mitigating factors — longer casting times, sacrificed XP, ritual assistants, burning several slots — lower the DC into reach.`,
      },
      {
        heading: "Epic magic items",
        body: `An item is epic when its bonus or effect exceeds the normal ceiling (better than +5 enhancement, an ability score bonus above +6, spell effects above 9th level, and so on). Crafting one needs the matching epic item creation feat, a very large gold and XP outlay, and usually a caster level far beyond 20. Artifacts stay unique — epic items are simply the strongest things a mortal can still make.`,
      },
    ],
  },

  /* -------------------------------------------------------- psionics --- */
  {
    id: "psionics-basics",
    title: "How Psionics Work",
    category: "Psionics",
    summary:
      "Powers are fuelled by a pool of power points instead of slots. You spend what you like, up to your manifester level, and stronger effects cost more.",
    tags: ["psionics", "power points", "manifesting"],
    sections: [
      {
        heading: "Manifesting a power",
        body: `Psionic characters **manifest powers**; the parallel to spellcasting is exact in most ways and different in a few important ones.

- Powers come from a **powers known** list — you always have them ready, like a sorcerer's spells known.
- Manifesting costs **power points** from a single daily pool. Cost is normally the power's level × 2 – 1 (a 1st-level power costs 1 point, 2nd costs 3, 3rd costs 5 … 9th costs 17).
- You can never spend more power points on one power than your **manifester level**.
- Save DCs are 10 + power level + your key ability modifier (Intelligence for psions, Wisdom for wilders and psychic warriors, Charisma for some others — the class tells you).
- Manifesting provokes attacks of opportunity, and a **Concentration** check keeps it going when you are hurt.`,
      },
      {
        heading: "Augmenting",
        body: `Most powers list an **Augment** line: pay extra points to make the power hit harder, last longer, affect more targets, or raise the save DC. Every 2 extra points spent this way usually also counts as +1 caster level for effects that care.

This is what makes psionics feel different from spellcasting: one low-level power scales with you all game, so you carry a short list of flexible tools rather than a long list of narrow ones.`,
      },
      {
        heading: "Displays",
        body: `Powers produce **displays** — visible, audible, olfactory, material or mental side effects — unless you take a feat or ability that hides them. A display makes it obvious that something psionic happened, though not necessarily what.`,
      },
    ],
  },
  {
    id: "psionics-focus",
    title: "Psionic Focus and Psionic Feats",
    category: "Psionics",
    summary:
      "Spend a minute of concentration to become psionically focused; expend that focus to power feats and special tricks.",
    tags: ["psionics", "focus", "feats"],
    sections: [
      {
        heading: "Gaining and using focus",
        body: `If you have any power points at all, you can attempt a **Concentration check (DC 20) as a full-round action** to become **psionically focused**. You stay focused until you use it up, or until you are knocked unconscious or sleep.

Being focused is worth something on its own — some abilities work only while focused — but its main use is currency:
- **Expend focus** to trigger a psionic feat.
- Expend focus to take 15 on a Concentration check for a class ability, or to fuel class features that ask for it.`,
      },
      {
        heading: "Psionic feats",
        body: `Psionic feats need you to be focused and usually consume that focus when used. They cover extra damage, extra speed, defensive reflexes, and metapsionic effects (empower, extend, twin, quicken) that also cost extra power points on top of the focus.

Practical advice: refocus whenever there is a minute of downtime, and treat "am I focused?" as part of your standard pre-combat checklist alongside buffs.`,
      },
    ],
  },
  {
    id: "psionics-classes",
    title: "Psionic Characters at the Table",
    category: "Psionics",
    summary:
      "Psions, psychic warriors, wilders and soulknives — what each one plays like, and the skills that go with them.",
    tags: ["psionics", "classes", "skills"],
    sections: [
      {
        heading: "The classes",
        body: `- **Psion** — the full manifester. Picks a discipline (telepathy, psychokinesis, psychometabolism, clairsentience, metacreativity, shaping) that defines its exclusive powers. Intelligence based, d4 hit die, the most power points of anyone.
- **Psychic Warrior** — a fighter with a small pool of self-buff powers. Wisdom based, d8 hit die, bonus combat feats.
- **Wilder** — raw, untrained talent. Fewer powers known, but **wild surge** lets it push manifester level higher at the risk of **psychic enervation** (losing points and being dazed). Charisma based.
- **Soulknife** — no powers at all; forms a blade of pure thought that scales with level and can be thrown and enhanced.`,
      },
      {
        heading: "Psionic skills",
        body: `- **Autohypnosis** — resist fear, ignore pain, memorize perfectly, hold on while dying.
- **Knowledge (psionics)** — psionic traditions, crystals, and psionic creatures.
- **Psicraft** — identify powers as they are manifested; the psionic Spellcraft.
- **Use Psionic Device** — activate dorjes, power stones and psionic items you have no business using.`,
      },
      {
        heading: "Psionics vs. magic",
        body: `Assume by default that **psionics and magic are transparent to each other**: spell resistance stops powers, dispel magic ends psionic effects, and *detect magic* sees them. Some tables prefer them to be separate systems entirely — agree which it is before the campaign starts, because it changes how counterplay works.`,
      },
    ],
  },
  {
    id: "psionics-items",
    title: "Psionic Items and Power Points",
    category: "Psionics",
    summary: "Dorjes, power stones, cognizance crystals and psicrowns — the psionic equivalents of wands and scrolls.",
    tags: ["psionics", "items", "gear"],
    sections: [
      {
        heading: "The item types",
        body: `- **Dorje** — the psionic wand: 50 charges of a single power.
- **Power stone** — the psionic scroll: single-use, and reading one needs Psicraft (or Use Psionic Device) to identify.
- **Cognizance crystal** — stores power points you can draw on to manifest your own powers.
- **Psicrown** — holds several powers and a shared pool of points.
- **Psionic tattoos** — cheap, single-use, applied to the skin.`,
      },
      {
        heading: "Bonus power points",
        body: `Your daily pool comes from your class table plus **bonus power points from your key ability**, roughly your ability modifier × manifester level ÷ 2. A high key ability therefore does three jobs at once: more points, higher save DCs, and access to the highest-level powers.`,
      },
    ],
  },

  /* ---------------------------------------------------- fear & taint --- */
  {
    id: "horror-fear-levels",
    title: "Fear: Shaken, Frightened, Panicked",
    category: "Fear & Taint",
    summary:
      "The four steps of fear, what each one does to your numbers, and how repeated frights stack up on a character.",
    tags: ["fear", "conditions", "horror"],
    sections: [
      {
        heading: "The ladder",
        body: `- **Shaken** — –2 on attack rolls, saves, skill checks and ability checks.
- **Frightened** — as shaken, and you must flee the source if you can. Cornered, you may fight.
- **Panicked** — –2 as above, you drop what you are holding and run for as long as the effect lasts; you cannot take actions except to flee, and you cower if trapped.
- **Cowering** — frozen: no actions, –2 AC, and you lose your Dexterity bonus.

Fear effects of the same kind do not stack their penalties, but they do stack their **severity**: something that would make an already-shaken character shaken instead makes them frightened, and a frightened one panicked.`,
      },
      {
        heading: "Saving against fear",
        body: `Fear is almost always a **Will save**. Common defences: a paladin's aura, *remove fear*, *heroism*, bardic music, high Wisdom, and the Autohypnosis skill for psionic characters. Immunity to fear (paladin at higher levels, some undead and constructs) skips the whole ladder.`,
      },
    ],
  },
  {
    id: "horror-dread-and-phobias",
    title: "Dread, Horror and Phobias",
    category: "Fear & Taint",
    summary:
      "Horror play adds slow-building dread and personal phobias on top of ordinary fear effects — and gives you ways to steady yourself.",
    tags: ["horror", "fear", "phobia"],
    sections: [
      {
        heading: "Dread",
        body: `Dread is fear that builds from atmosphere rather than a monster's gaze: a house that is wrong, a corpse arranged too carefully, a sound with no source. Mechanically the DM calls for a Will save against a DC scaled to how bad the scene is; failure usually leaves you **shaken** until the scene ends or until you do something decisive about the source.

Dread stacks with ordinary fear, so walking into a fight already shaken is the point of the genre.`,
      },
      {
        heading: "Phobias",
        body: `A character can take a specific **phobia** — darkness, heights, fire, cramped spaces, magic, or a creature type such as undead or aberrations. When you meet the object of your phobia you make a Will save whose DC scales with the severity of the encounter (the creature's challenge rating, the level of the spell, twenty feet of drop, and so on). Failure applies fear.

You can eventually conquer a phobia by facing it repeatedly and succeeding on the save each time.`,
      },
      {
        heading: "Holding it together",
        body: `Practical answers to a dread-heavy campaign: keep a fear-immunity ally close, invest in Will saves, carry *remove fear* or *heroism*, and remember that acting decisively against the source of dread is usually what ends the effect.`,
      },
    ],
  },
  {
    id: "horror-taint",
    title: "Taint: Corruption and Depravity",
    category: "Fear & Taint",
    summary:
      "Evil places, evil objects and evil deeds leave a mark. Corruption erodes the body, depravity the mind — both are tracked in points.",
    tags: ["taint", "corruption", "depravity", "horror"],
    sections: [
      {
        heading: "Picking up taint",
        body: `You gain taint by entering a place suffused with evil, handling a foul object, being attacked by certain monsters, or committing an evil act. Physical taint is **corruption**; mental taint is **depravity**. Both are counted in points, usually 1–3 at a time, with more for every full day of exposure.

You normally get a save to avoid it: **Fortitude against corruption, Will against depravity**.`,
      },
      {
        heading: "The shock of gaining it",
        body: `- Gain more corruption at once than your **Constitution modifier** and you make a Fortitude save (DC 15 + points gained): success means sickened 1d4 rounds, failure means nauseated 1d4 rounds.
- Gain more depravity at once than your **Wisdom modifier** and you make a Will save (DC 15 + points gained): success means dazed 1d4 rounds, failure means stunned 1d4 rounds.`,
      },
      {
        heading: "Thresholds and symptoms",
        body: `Compare corruption against your Constitution and depravity against your Wisdom to find whether your taint is **mild, moderate or severe**. A tough character can carry more corruption before it shows; a low-Wisdom character starts hearing things early.

- **Mild** — one minor symptom: sallow skin, bad dreams, a twitch.
- **Moderate** — a real penalty: recurring sickness, seizures, compulsions.
- **Severe** — permanent, and only *miracle* or *wish* removes it and drops you back to moderate.

If corruption ever climbs past the severe threshold, the character dies and rises hours later as a tainted creature under the DM's control.`,
      },
      {
        heading: "Getting clean",
        body: `Taint is removed by penance, sacred ground, dedicated magic (spells written for the purpose), or long isolation from the source. Powerful restorative magic helps but rarely erases severe taint outright. Some characters deliberately keep their taint, because certain feats and prestige classes require it — evil outsiders and undead carry taint scores with no penalty at all, which is exactly why those options exist.`,
      },
    ],
  },
  {
    id: "horror-surviving",
    title: "Playing a Character in a Horror Campaign",
    category: "Fear & Taint",
    summary: "What changes about your build and your habits when the campaign is meant to frighten you.",
    tags: ["horror", "advice", "party"],
    sections: [
      {
        heading: "Build choices that pay off",
        body: `- **Will save first.** Fear, dread and depravity all come through Will.
- **Constitution and Wisdom** double as your taint thresholds, not just your saves.
- Bring **light, silver, cold iron and holy water**; horror monsters punish an unprepared party far more than a raw shortage of damage.
- Someone should carry answers to fear (*remove fear*, *heroism*, bardic music, a paladin's aura).`,
      },
      {
        heading: "Habits at the table",
        body: `- Investigate before you kick the door. Information is the real treasure.
- Do not split the party as a habit, but accept that the genre sometimes forces it — agree a rally point.
- Keep track of your own taint, phobias, and fear conditions on your sheet; the DM will not remind you.
- Expect fewer, nastier fights and more scenes where retreat is the correct play.`,
      },
    ],
  },
];
