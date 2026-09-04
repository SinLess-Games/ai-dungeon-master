import type { WikiArticle } from "./dm-guide";

/**
 * Player-facing reference for planar travel and adventuring beyond the
 * Material Plane. Original summaries of mechanics only.
 */

export const EXPANSION7_CATEGORIES = ["Planar Play"] as const;

export const EXPANSION7_ARTICLES: WikiArticle[] = [
  {
    id: "planar-structure",
    title: "How the planes are put together",
    category: "Planar Play",
    summary:
      "Transitive, inner, outer and demiplanes, the layers they are built from, and how a plane's shape changes what your character can do there.",
    tags: ["planes", "cosmology", "travel", "layers"],
    sections: [
      {
        heading: "Families of planes",
        body: `Most cosmologies sort planes into four rough families:

- **Transitive planes** — the roads between everything else: the Astral (thought-speed travel, no natural gravity, almost no time), the Ethereal (overlaps the Material, lets you pass through solid matter), and the Plane of Shadow (a dim mirror of the world where distance is compressed).
- **Inner planes** — raw elemental and energy environments: Air, Earth, Fire, Water, Positive and Negative Energy.
- **Outer planes** — realms shaped by belief and alignment, home to celestials, fiends and gods.
- **Demiplanes** — small, self-contained pockets, sometimes made by a spell or a very powerful creature.`,
      },
      {
        heading: "Layers and sizes",
        body: `Many outer planes are built from **layers**, each effectively its own world with its own rules of landscape and law. Moving between layers usually needs a specific gate, a path, or a spell rather than simply walking.

A plane's size ranges from finite (you can reach an edge) to infinite (you cannot). Practical effect: on a finite plane a hunt has a boundary; on an infinite one, tracking someone who fled requires magic, not legwork.`,
      },
      {
        heading: "Traits that change your character sheet",
        body: `Every plane carries traits, and they hit builds unevenly:

- **Gravity** — normal, heavy (penalties to attacks and Dex-based checks, doubled falling damage), light, none, subjective directional (you fall the way you decide), or objective directional (down is sideways).
- **Time** — flowing normal, faster or slower than the Material. Return home from a fast-time plane and years may have passed.
- **Shape and morphic traits** — static (nothing you do sticks), alterable (normal), highly morphic (terrain shifts constantly), magically or divinely morphic (only certain beings reshape it).
- **Elemental and energy dominance** — a fire-dominant plane damages you every round without protection; negative-dominant planes drain you.
- **Alignment traits** — mildly or strongly aligned planes impose penalties on characters of the opposed alignment.
- **Magic traits** — enhanced, impeded, limited, wild, or dead magic. A dead-magic plane is the single most dangerous surprise for a caster.

Ask what the traits are before you step through. Planar knowledge checks exist exactly for this.`,
      },
    ],
  },
  {
    id: "planar-travel",
    title: "Getting there and getting home",
    category: "Planar Play",
    summary:
      "Portals, gates, conduits, colour pools, planar spells and the risks of arriving somewhere you did not aim for.",
    tags: ["portals", "plane shift", "astral", "ethereal"],
    sections: [
      {
        heading: "Doors that already exist",
        body: `**Portals** are fixed links between two places. Some are always open, some need a key (an object, a word, a phase of the moon, a sacrifice), some open only at certain times, and some are one-way — the classic mistake is stepping through a door that has no handle on the far side.

Astral travellers reach the outer planes through **colour pools**; the Ethereal touches the Material almost everywhere, so an ethereal traveller can watch a room they cannot be seen in.`,
      },
      {
        heading: "Travel by spell",
        body: `- *Plane shift* moves a group but lands you anywhere from a few to several hundred miles off target — never use it to arrive on top of a specific person.
- *Gate* is precise and expensive, and can call a being through as well as move you.
- *Astral projection* sends a duplicate while your body stays behind; cutting the silver cord is the danger.
- *Etherealness* and *blink* put you partly out of phase; *ethereal jaunt* lets you scout and slip past walls.
- *Rope trick* and similar effects make a temporary pocket to rest in.

Always plan the return trip and its cost before you leave. A party stranded on a plane with impeded magic has no second chance.`,
      },
      {
        heading: "Surviving arrival",
        body: `Standard planar kit: protection from the dominant energy, a way to breathe, a way to move in the local gravity, food and water that does not depend on the local environment, and something that reads as neutral to the natives.

Native creatures often have the **extraplanar** subtype only when off their home plane — meaning on their own turf, spells that banish them do nothing. Bargaining, safe conduct and knowing a name matter more out here than a drawn sword.`,
      },
    ],
  },
  {
    id: "planar-natives",
    title: "Planar natives and planar characters",
    category: "Planar Play",
    summary:
      "What planetouched heritage, native races and outsider traits mean for a character built for travel between worlds.",
    tags: ["planetouched", "outsiders", "races", "subtypes"],
    sections: [
      {
        heading: "Planetouched heritage",
        body: `Characters with celestial or fiendish blood in their ancestry are **planetouched**: outsiders with the native subtype, so they eat, sleep and can be raised like anyone else, but they cannot be banished as summoned creatures. They typically bring darkvision, a resistance or two, and a small once-per-day spell-like ability — plus a social cost in places that recognise what they are.`,
      },
      {
        heading: "Races born elsewhere",
        body: `Planar campaigns add races raised in the deep planes: shapechangers, wanderers, elemental-blooded folk, and communities descended from stranded travellers. Mechanically they follow the standard race rules; what makes them play differently is their relationship to a home plane's traits — a character born under subjective gravity has never feared a fall.`,
      },
      {
        heading: "Outsider traits at the table",
        body: `Outsiders do not need to eat or sleep (though casters still rest to prepare spells), are not raised by *raise dead* (they need *resurrection* or better), and often carry damage reduction pierced only by a specific alignment or material. Carry the right weapon material or you will spend the fight doing nothing.

Alignment subtypes matter: a good-aligned outsider takes extra damage from evil-aligned weapons and vice versa, so bring the right tool for who you expect to meet.`,
      },
    ],
  },
];
