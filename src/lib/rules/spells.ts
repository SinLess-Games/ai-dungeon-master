export interface Spell {
  id: string;
  name: string;
  school: string;
  /** spell level by class id; "arcane" and "divine" act as fallbacks for other casters */
  levels: Record<string, number>;
  summary: string;
}

const s = (id: string, name: string, school: string, levels: Record<string, number>, summary: string): Spell => ({
  id,
  name,
  school,
  levels,
  summary,
});

export const SPELLS: Spell[] = [
  // ---- cantrips / orisons ----
  s("acid-splash", "Acid Splash", "Conjuration", { arcane: 0, wizard: 0, sorcerer: 0 }, "Ranged touch for 1d3 acid damage."),
  s("dancing-lights", "Dancing Lights", "Evocation", { arcane: 0, wizard: 0, sorcerer: 0, bard: 0 }, "Create up to four floating lights."),
  s("daze", "Daze", "Enchantment", { arcane: 0, wizard: 0, sorcerer: 0, bard: 0 }, "A weak humanoid loses its next action."),
  s("detect-magic", "Detect Magic", "Divination", { arcane: 0, divine: 0, wizard: 0, sorcerer: 0, bard: 0, cleric: 0, druid: 0 }, "Sense magical auras nearby."),
  s("flare", "Flare", "Evocation", { arcane: 0, wizard: 0, sorcerer: 0, bard: 0, druid: 0 }, "Dazzle one creature."),
  s("ghost-sound", "Ghost Sound", "Illusion", { arcane: 0, wizard: 0, sorcerer: 0, bard: 0 }, "Create illusory noise."),
  s("light", "Light", "Evocation", { arcane: 0, divine: 0, wizard: 0, sorcerer: 0, bard: 0, cleric: 0, druid: 0 }, "An object shines like a torch."),
  s("mage-hand", "Mage Hand", "Transmutation", { arcane: 0, wizard: 0, sorcerer: 0, bard: 0 }, "Move a light object at a distance."),
  s("mending", "Mending", "Transmutation", { arcane: 0, divine: 0, wizard: 0, sorcerer: 0, bard: 0, cleric: 0, druid: 0 }, "Repair small breaks in an object."),
  s("prestidigitation", "Prestidigitation", "Universal", { arcane: 0, wizard: 0, sorcerer: 0, bard: 0 }, "Minor tricks and cleaning."),
  s("ray-of-frost", "Ray of Frost", "Evocation", { arcane: 0, wizard: 0, sorcerer: 0 }, "Ranged touch for 1d3 cold damage."),
  s("read-magic", "Read Magic", "Divination", { arcane: 0, divine: 0, wizard: 0, sorcerer: 0, bard: 0, cleric: 0, druid: 0 }, "Read scrolls and spellbooks."),
  s("resistance", "Resistance", "Abjuration", { arcane: 0, divine: 0, wizard: 0, sorcerer: 0, bard: 0, cleric: 0, druid: 0 }, "+1 resistance bonus on saves."),
  s("touch-of-fatigue", "Touch of Fatigue", "Necromancy", { arcane: 0, wizard: 0, sorcerer: 0 }, "Touch attack fatigues a foe."),
  s("create-water", "Create Water", "Conjuration", { divine: 0, cleric: 0, druid: 0, paladin: 1 }, "Conjure clean drinking water."),
  s("cure-minor-wounds", "Cure Minor Wounds", "Conjuration", { divine: 0, cleric: 0, druid: 0 }, "Heal 1 point of damage."),
  s("guidance", "Guidance", "Divination", { divine: 0, cleric: 0, druid: 0 }, "+1 on one attack, save, or skill check."),
  s("virtue", "Virtue", "Transmutation", { divine: 0, cleric: 0, druid: 0, paladin: 1 }, "1 temporary hit point."),
  s("purify-food-drink", "Purify Food and Drink", "Transmutation", { divine: 0, cleric: 0, druid: 0 }, "Make spoiled provisions safe."),
  s("know-direction", "Know Direction", "Divination", { druid: 0, bard: 0 }, "You know which way is north."),

  // ---- 1st ----
  s("magic-missile", "Magic Missile", "Evocation", { arcane: 1, wizard: 1, sorcerer: 1 }, "Unerring force darts, 1d4+1 each."),
  s("shield", "Shield", "Abjuration", { arcane: 1, wizard: 1, sorcerer: 1 }, "+4 shield bonus to AC, blocks magic missiles."),
  s("mage-armor", "Mage Armor", "Conjuration", { arcane: 1, wizard: 1, sorcerer: 1 }, "+4 armor bonus for hours."),
  s("burning-hands", "Burning Hands", "Evocation", { arcane: 1, wizard: 1, sorcerer: 1 }, "Cone of fire, 1d4 per level."),
  s("charm-person", "Charm Person", "Enchantment", { arcane: 1, wizard: 1, sorcerer: 1, bard: 1 }, "Make a humanoid your friend."),
  s("sleep", "Sleep", "Enchantment", { arcane: 1, wizard: 1, sorcerer: 1, bard: 1 }, "Put 4 HD of weak creatures to sleep."),
  s("color-spray", "Color Spray", "Illusion", { arcane: 1, wizard: 1, sorcerer: 1 }, "Stun, blind, and knock out nearby foes."),
  s("expeditious-retreat", "Expeditious Retreat", "Transmutation", { arcane: 1, wizard: 1, sorcerer: 1, bard: 1 }, "+30 ft. speed."),
  s("feather-fall", "Feather Fall", "Transmutation", { arcane: 1, wizard: 1, sorcerer: 1, bard: 1 }, "Falling creatures descend safely."),
  s("grease", "Grease", "Conjuration", { arcane: 1, wizard: 1, sorcerer: 1, bard: 1 }, "Slippery ground makes foes fall."),
  s("identify", "Identify", "Divination", { arcane: 1, wizard: 1, sorcerer: 1, bard: 1 }, "Learn the properties of a magic item."),
  s("obscuring-mist", "Obscuring Mist", "Conjuration", { arcane: 1, divine: 1, wizard: 1, sorcerer: 1, cleric: 1, druid: 1 }, "Fog grants concealment."),
  s("enlarge-person", "Enlarge Person", "Transmutation", { arcane: 1, wizard: 1, sorcerer: 1 }, "A humanoid grows one size."),
  s("true-strike", "True Strike", "Divination", { arcane: 1, wizard: 1, sorcerer: 1 }, "+20 on your next attack roll."),
  s("protection-from-evil", "Protection from Evil", "Abjuration", { arcane: 1, divine: 1, wizard: 1, sorcerer: 1, cleric: 1, paladin: 1 }, "Ward against evil creatures and control."),
  s("cure-light-wounds", "Cure Light Wounds", "Conjuration", { divine: 1, cleric: 1, druid: 1, bard: 1, paladin: 1, ranger: 2 }, "Heal 1d8 + level damage."),
  s("bless", "Bless", "Enchantment", { divine: 1, cleric: 1, paladin: 1 }, "Allies gain +1 attack and vs. fear."),
  s("divine-favor", "Divine Favor", "Evocation", { divine: 1, cleric: 1, paladin: 1 }, "+1 per three levels on attack and damage."),
  s("shield-of-faith", "Shield of Faith", "Abjuration", { divine: 1, cleric: 1, paladin: 1 }, "Deflection bonus to AC."),
  s("entangle", "Entangle", "Transmutation", { druid: 1, ranger: 1 }, "Plants grab and hold foes."),
  s("faerie-fire", "Faerie Fire", "Evocation", { druid: 1 }, "Outline creatures in light."),
  s("goodberry", "Goodberry", "Transmutation", { druid: 1 }, "Berries become nourishing and healing."),
  s("magic-fang", "Magic Fang", "Transmutation", { druid: 1, ranger: 1 }, "+1 on a natural weapon."),
  s("magic-weapon", "Magic Weapon", "Transmutation", { divine: 1, cleric: 1, paladin: 1 }, "+1 enhancement on a weapon."),
  s("sanctuary", "Sanctuary", "Abjuration", { divine: 1, cleric: 1 }, "Foes must save to attack you."),
  s("command", "Command", "Enchantment", { divine: 1, cleric: 1 }, "One-word order a foe must obey."),
  s("doom", "Doom", "Necromancy", { divine: 1, cleric: 1 }, "One foe becomes shaken."),
  s("inflict-light-wounds", "Inflict Light Wounds", "Necromancy", { divine: 1, cleric: 1 }, "Deal 1d8 + level damage by touch."),
  s("hideous-laughter", "Tasha's Hideous Laughter", "Enchantment", { arcane: 2, wizard: 2, sorcerer: 2, bard: 1 }, "A foe collapses laughing."),
  s("cause-fear", "Cause Fear", "Necromancy", { arcane: 1, divine: 1, wizard: 1, sorcerer: 1, bard: 1, cleric: 1 }, "One creature flees in fear."),
  s("summon-monster-i", "Summon Monster I", "Conjuration", { arcane: 1, divine: 1, wizard: 1, sorcerer: 1, bard: 1, cleric: 1 }, "Call a small ally to fight for you."),
  s("comprehend-languages", "Comprehend Languages", "Divination", { arcane: 1, divine: 1, wizard: 1, sorcerer: 1, bard: 1, cleric: 1 }, "Understand any spoken or written tongue."),
  s("disguise-self", "Disguise Self", "Illusion", { arcane: 1, wizard: 1, sorcerer: 1, bard: 1 }, "Change your appearance."),
  s("silent-image", "Silent Image", "Illusion", { arcane: 1, wizard: 1, sorcerer: 1, bard: 1 }, "Create a visual illusion."),

  // ---- 2nd ----
  s("invisibility", "Invisibility", "Illusion", { arcane: 2, wizard: 2, sorcerer: 2, bard: 2 }, "The subject cannot be seen."),
  s("scorching-ray", "Scorching Ray", "Evocation", { arcane: 2, wizard: 2, sorcerer: 2 }, "Rays deal 4d6 fire damage each."),
  s("mirror-image", "Mirror Image", "Illusion", { arcane: 2, wizard: 2, sorcerer: 2, bard: 2 }, "Decoy duplicates absorb attacks."),
  s("web", "Web", "Conjuration", { arcane: 2, wizard: 2, sorcerer: 2 }, "Sticky strands entangle an area."),
  s("glitterdust", "Glitterdust", "Conjuration", { arcane: 2, wizard: 2, sorcerer: 2, bard: 2 }, "Blinds foes and reveals invisibility."),
  s("bulls-strength", "Bull's Strength", "Transmutation", { arcane: 2, divine: 2, wizard: 2, sorcerer: 2, cleric: 2, druid: 2, paladin: 2 }, "+4 Strength."),
  s("cats-grace", "Cat's Grace", "Transmutation", { arcane: 2, wizard: 2, sorcerer: 2, bard: 2, druid: 2, ranger: 2 }, "+4 Dexterity."),
  s("bears-endurance", "Bear's Endurance", "Transmutation", { arcane: 2, divine: 2, wizard: 2, sorcerer: 2, cleric: 2, druid: 2, ranger: 2 }, "+4 Constitution."),
  s("owls-wisdom", "Owl's Wisdom", "Transmutation", { arcane: 2, divine: 2, wizard: 2, sorcerer: 2, cleric: 2, druid: 2, paladin: 2 }, "+4 Wisdom."),
  s("foxs-cunning", "Fox's Cunning", "Transmutation", { arcane: 2, wizard: 2, sorcerer: 2, bard: 2 }, "+4 Intelligence."),
  s("eagles-splendor", "Eagle's Splendor", "Transmutation", { arcane: 2, divine: 2, wizard: 2, sorcerer: 2, bard: 2, cleric: 2, paladin: 2 }, "+4 Charisma."),
  s("blur", "Blur", "Illusion", { arcane: 2, wizard: 2, sorcerer: 2, bard: 2 }, "20% miss chance against you."),
  s("levitate", "Levitate", "Transmutation", { arcane: 2, wizard: 2, sorcerer: 2 }, "Move up and down in the air."),
  s("knock", "Knock", "Transmutation", { arcane: 2, wizard: 2, sorcerer: 2 }, "Open locked and barred doors."),
  s("see-invisibility", "See Invisibility", "Divination", { arcane: 2, wizard: 2, sorcerer: 2, bard: 3 }, "See invisible creatures."),
  s("acid-arrow", "Melf's Acid Arrow", "Conjuration", { arcane: 2, wizard: 2, sorcerer: 2 }, "Acid damage over several rounds."),
  s("cure-moderate-wounds", "Cure Moderate Wounds", "Conjuration", { divine: 2, cleric: 2, druid: 3, bard: 2, paladin: 3, ranger: 3 }, "Heal 2d8 + level damage."),
  s("hold-person", "Hold Person", "Enchantment", { arcane: 3, divine: 2, wizard: 3, sorcerer: 3, bard: 2, cleric: 2 }, "Paralyze a humanoid."),
  s("silence", "Silence", "Illusion", { divine: 2, cleric: 2, bard: 2 }, "No sound in the area; no verbal spells."),
  s("spiritual-weapon", "Spiritual Weapon", "Evocation", { divine: 2, cleric: 2 }, "A force weapon attacks for you."),
  s("aid", "Aid", "Enchantment", { divine: 2, cleric: 2 }, "+1 attack, +1 vs. fear, temporary hit points."),
  s("lesser-restoration", "Lesser Restoration", "Conjuration", { divine: 2, cleric: 2, druid: 2, paladin: 1 }, "Heal ability damage."),
  s("barkskin", "Barkskin", "Transmutation", { druid: 2, ranger: 2 }, "+2 or better natural armor."),
  s("flaming-sphere", "Flaming Sphere", "Evocation", { arcane: 2, wizard: 2, sorcerer: 2, druid: 2 }, "A rolling ball of fire."),
  s("heat-metal", "Heat Metal", "Transmutation", { druid: 2 }, "Metal gear burns its wearer."),
  s("summon-swarm", "Summon Swarm", "Conjuration", { arcane: 2, wizard: 2, sorcerer: 2, bard: 2, druid: 2 }, "Summon a biting swarm."),

  // ---- 3rd ----
  s("fireball", "Fireball", "Evocation", { arcane: 3, wizard: 3, sorcerer: 3 }, "20-ft. burst, 1d6 fire per level."),
  s("lightning-bolt", "Lightning Bolt", "Evocation", { arcane: 3, wizard: 3, sorcerer: 3 }, "Line of electricity, 1d6 per level."),
  s("haste", "Haste", "Transmutation", { arcane: 3, wizard: 3, sorcerer: 3, bard: 3 }, "Allies gain speed and an extra attack."),
  s("slow", "Slow", "Transmutation", { arcane: 3, wizard: 3, sorcerer: 3, bard: 3 }, "Foes act at half rate."),
  s("dispel-magic", "Dispel Magic", "Abjuration", { arcane: 3, divine: 3, wizard: 3, sorcerer: 3, bard: 3, cleric: 3, druid: 4, paladin: 3 }, "End ongoing spells."),
  s("fly", "Fly", "Transmutation", { arcane: 3, wizard: 3, sorcerer: 3 }, "Gain a fly speed of 60 ft."),
  s("displacement", "Displacement", "Illusion", { arcane: 3, wizard: 3, sorcerer: 3, bard: 3 }, "50% miss chance against you."),
  s("lesser-globe", "Lesser Globe of Invulnerability", "Abjuration", { arcane: 4, wizard: 4, sorcerer: 4 }, "Block low-level spells around you."),
  s("stinking-cloud", "Stinking Cloud", "Conjuration", { arcane: 3, wizard: 3, sorcerer: 3 }, "Nauseating vapors fill an area."),
  s("vampiric-touch", "Vampiric Touch", "Necromancy", { arcane: 3, wizard: 3, sorcerer: 3 }, "Drain life for temporary hit points."),
  s("cure-serious-wounds", "Cure Serious Wounds", "Conjuration", { divine: 3, cleric: 3, druid: 4, bard: 3, paladin: 4, ranger: 4 }, "Heal 3d8 + level damage."),
  s("prayer", "Prayer", "Enchantment", { divine: 3, cleric: 3, paladin: 3 }, "Allies +1, foes -1 on most rolls."),
  s("magic-circle-evil", "Magic Circle against Evil", "Abjuration", { arcane: 3, divine: 3, wizard: 3, sorcerer: 3, cleric: 3, paladin: 3 }, "Protection for a group."),
  s("searing-light", "Searing Light", "Evocation", { divine: 3, cleric: 3 }, "Ray of holy light burns undead."),
  s("call-lightning", "Call Lightning", "Evocation", { druid: 3 }, "Bolts strike from the sky."),
  s("water-breathing", "Water Breathing", "Transmutation", { arcane: 3, wizard: 3, sorcerer: 3, cleric: 3, druid: 3 }, "Breathe underwater."),
  s("greater-magic-fang", "Greater Magic Fang", "Transmutation", { druid: 3, ranger: 3 }, "Better enhancement on natural weapons."),
  s("protection-from-energy", "Protection from Energy", "Abjuration", { arcane: 3, divine: 3, wizard: 3, sorcerer: 3, cleric: 3, druid: 3, ranger: 2 }, "Absorb energy damage."),

  // ---- 4th ----
  s("polymorph", "Polymorph", "Transmutation", { arcane: 4, wizard: 4, sorcerer: 4, bard: 4 }, "Change a creature's form."),
  s("dimension-door", "Dimension Door", "Conjuration", { arcane: 4, wizard: 4, sorcerer: 4, bard: 4 }, "Teleport a short distance."),
  s("wall-of-fire", "Wall of Fire", "Evocation", { arcane: 4, wizard: 4, sorcerer: 4, druid: 5 }, "A burning barrier."),
  s("ice-storm", "Ice Storm", "Evocation", { arcane: 4, wizard: 4, sorcerer: 4, druid: 4 }, "Hail deals bludgeoning and cold damage."),
  s("enervation", "Enervation", "Necromancy", { arcane: 4, wizard: 4, sorcerer: 4 }, "Bestow negative levels with a ray."),
  s("greater-invisibility", "Greater Invisibility", "Illusion", { arcane: 4, wizard: 4, sorcerer: 4, bard: 4 }, "Stay invisible while attacking."),
  s("stoneskin", "Stoneskin", "Abjuration", { arcane: 4, wizard: 4, sorcerer: 4, druid: 5 }, "Damage reduction 10/adamantine."),
  s("divine-power", "Divine Power", "Evocation", { divine: 4, cleric: 4 }, "Fight with a warrior's attack bonus."),
  s("cure-critical-wounds", "Cure Critical Wounds", "Conjuration", { divine: 4, cleric: 4, druid: 5, bard: 4 }, "Heal 4d8 + level damage."),
  s("freedom-of-movement", "Freedom of Movement", "Abjuration", { divine: 4, cleric: 4, druid: 4, bard: 4, ranger: 4 }, "Move freely despite restraints."),
  s("restoration", "Restoration", "Conjuration", { divine: 4, cleric: 4, paladin: 4 }, "Remove ability drain and negative levels."),
  s("scrying", "Scrying", "Divination", { arcane: 4, wizard: 4, sorcerer: 4, bard: 3, cleric: 5, druid: 4 }, "Spy on a distant creature."),
  s("black-tentacles", "Evard's Black Tentacles", "Conjuration", { arcane: 4, wizard: 4, sorcerer: 4 }, "Grasping tentacles fill an area."),

  // ---- 5th ----
  s("teleport", "Teleport", "Conjuration", { arcane: 5, wizard: 5, sorcerer: 5 }, "Travel instantly across long distances."),
  s("cone-of-cold", "Cone of Cold", "Evocation", { arcane: 5, wizard: 5, sorcerer: 5 }, "1d6 cold per level in a cone."),
  s("wall-of-force", "Wall of Force", "Evocation", { arcane: 5, wizard: 5, sorcerer: 5 }, "An invisible, unbreakable barrier."),
  s("feeblemind", "Feeblemind", "Enchantment", { arcane: 5, wizard: 5, sorcerer: 5 }, "Shatter a caster's mind."),
  s("dominate-person", "Dominate Person", "Enchantment", { arcane: 5, wizard: 5, sorcerer: 5, bard: 4 }, "Control a humanoid's actions."),
  s("baleful-polymorph", "Baleful Polymorph", "Transmutation", { arcane: 5, wizard: 5, sorcerer: 5, druid: 5 }, "Turn a foe into a harmless animal."),
  s("raise-dead", "Raise Dead", "Conjuration", { divine: 5, cleric: 5 }, "Restore life to the recently dead."),
  s("flame-strike", "Flame Strike", "Evocation", { divine: 5, cleric: 5, druid: 4 }, "A column of divine fire."),
  s("righteous-might", "Righteous Might", "Transmutation", { divine: 5, cleric: 5 }, "Grow larger and stronger."),
  s("mass-cure-light", "Mass Cure Light Wounds", "Conjuration", { divine: 5, cleric: 5, druid: 6, bard: 5 }, "Heal many allies at once."),
  s("wall-of-stone", "Wall of Stone", "Conjuration", { arcane: 5, wizard: 5, sorcerer: 5, cleric: 5, druid: 6 }, "Create a solid stone barrier."),
  s("break-enchantment", "Break Enchantment", "Abjuration", { arcane: 5, divine: 5, wizard: 5, sorcerer: 5, bard: 4, cleric: 5, paladin: 4 }, "Free victims of curses and charms."),

  // ---- 6th ----
  s("disintegrate", "Disintegrate", "Transmutation", { arcane: 6, wizard: 6, sorcerer: 6 }, "A ray that reduces matter to dust."),
  s("chain-lightning", "Chain Lightning", "Evocation", { arcane: 6, wizard: 6, sorcerer: 6 }, "Lightning arcs between many foes."),
  s("greater-dispel", "Greater Dispel Magic", "Abjuration", { arcane: 6, divine: 6, wizard: 6, sorcerer: 6, bard: 5, cleric: 6, druid: 6 }, "Strip several magical effects."),
  s("true-seeing", "True Seeing", "Divination", { arcane: 6, divine: 5, wizard: 6, sorcerer: 6, cleric: 5, druid: 7 }, "See through illusions and disguises."),
  s("heal", "Heal", "Conjuration", { divine: 6, cleric: 6, druid: 7 }, "Heal 10 hit points per level and most conditions."),
  s("harm", "Harm", "Necromancy", { divine: 6, cleric: 6 }, "Deal 10 damage per level by touch."),
  s("planar-binding", "Planar Binding", "Conjuration", { arcane: 6, wizard: 6, sorcerer: 6 }, "Trap and bargain with an outsider."),
  s("mass-bulls-strength", "Mass Bull's Strength", "Transmutation", { arcane: 6, divine: 6, wizard: 6, sorcerer: 6, cleric: 6 }, "+4 Strength for the party."),
  s("antimagic-field", "Antimagic Field", "Abjuration", { arcane: 6, divine: 8, wizard: 6, sorcerer: 6, cleric: 8 }, "Suppress magic around you."),

  // ---- 7th ----
  s("finger-of-death", "Finger of Death", "Necromancy", { arcane: 7, wizard: 7, sorcerer: 7, druid: 8 }, "Kill a creature outright."),
  s("delayed-blast-fireball", "Delayed Blast Fireball", "Evocation", { arcane: 7, wizard: 7, sorcerer: 7 }, "A fireball you can time."),
  s("greater-teleport", "Greater Teleport", "Conjuration", { arcane: 7, wizard: 7, sorcerer: 7 }, "Teleport anywhere with no error."),
  s("limited-wish", "Limited Wish", "Universal", { arcane: 7, wizard: 7, sorcerer: 7 }, "Alter reality within limits."),
  s("resurrection", "Resurrection", "Conjuration", { divine: 7, cleric: 7 }, "Restore life from mere remains."),
  s("destruction", "Destruction", "Necromancy", { divine: 7, cleric: 7 }, "Slay a foe and consume the body."),
  s("mass-cure-serious", "Mass Cure Serious Wounds", "Conjuration", { divine: 7, cleric: 7, druid: 8 }, "Heal 3d8 + level to many allies."),
  s("control-weather", "Control Weather", "Transmutation", { arcane: 7, divine: 7, wizard: 7, sorcerer: 7, cleric: 7, druid: 7 }, "Change the weather around you."),

  // ---- 8th ----
  s("horrid-wilting", "Horrid Wilting", "Necromancy", { arcane: 8, wizard: 8, sorcerer: 8 }, "Drain moisture from many creatures."),
  s("polar-ray", "Polar Ray", "Evocation", { arcane: 8, wizard: 8, sorcerer: 8 }, "1d6 cold per level and Dex drain."),
  s("mind-blank", "Mind Blank", "Abjuration", { arcane: 8, wizard: 8, sorcerer: 8 }, "Total protection from divination and mind magic."),
  s("greater-planar-binding", "Greater Planar Binding", "Conjuration", { arcane: 8, wizard: 8, sorcerer: 8 }, "Bind a mighty outsider."),
  s("earthquake", "Earthquake", "Evocation", { divine: 8, cleric: 8, druid: 8 }, "Shatter the ground itself."),
  s("holy-aura", "Holy Aura", "Abjuration", { divine: 8, cleric: 8 }, "Shield allies with holy power."),
  s("mass-heal-lesser", "Mass Cure Critical Wounds", "Conjuration", { divine: 8, cleric: 8, druid: 9 }, "Heal 4d8 + level to many allies."),

  // ---- 9th ----
  s("wish", "Wish", "Universal", { arcane: 9, wizard: 9, sorcerer: 9 }, "Alter reality nearly at will."),
  s("time-stop", "Time Stop", "Transmutation", { arcane: 9, wizard: 9, sorcerer: 9 }, "Act freely while time is frozen."),
  s("meteor-swarm", "Meteor Swarm", "Evocation", { arcane: 9, wizard: 9, sorcerer: 9 }, "Four blazing spheres of destruction."),
  s("gate", "Gate", "Conjuration", { arcane: 9, divine: 9, wizard: 9, sorcerer: 9, cleric: 9 }, "Open a portal and call a being through."),
  s("shapechange", "Shapechange", "Transmutation", { arcane: 9, wizard: 9, sorcerer: 9, druid: 9 }, "Assume nearly any form at will."),
  s("miracle", "Miracle", "Evocation", { divine: 9, cleric: 9 }, "Ask your deity to intervene."),
  s("true-resurrection", "True Resurrection", "Conjuration", { divine: 9, cleric: 9 }, "Restore life from nothing at all."),
  s("mass-heal", "Mass Heal", "Conjuration", { divine: 9, cleric: 9 }, "Heal your whole party fully."),
  s("storm-of-vengeance", "Storm of Vengeance", "Conjuration", { divine: 9, cleric: 9, druid: 9 }, "A cataclysmic storm punishes your foes."),
];

export interface Power {
  id: string;
  name: string;
  discipline: string;
  level: number;
  summary: string;
}

const p = (id: string, name: string, discipline: string, level: number, summary: string): Power => ({
  id,
  name,
  discipline,
  level,
  summary,
});

export const POWERS: Power[] = [
  p("call-to-mind", "Call to Mind", "Telepathy", 1, "Retry a failed Knowledge check with a bonus."),
  p("mind-thrust", "Mind Thrust", "Telepathy", 1, "Deal 1d10 damage to one mind."),
  p("energy-ray", "Energy Ray", "Psychokinesis", 1, "Ranged touch ray of chosen energy."),
  p("force-screen", "Force Screen", "Psychokinesis", 1, "+4 shield bonus to AC."),
  p("inertial-armor", "Inertial Armor", "Psychokinesis", 1, "+4 armor bonus for hours."),
  p("vigor", "Vigor", "Psychometabolism", 1, "Gain 5 temporary hit points."),
  p("thicken-skin", "Thicken Skin", "Psychometabolism", 1, "+1 natural armor."),
  p("offensive-precognition", "Offensive Precognition", "Clairsentience", 1, "Insight bonus on attack rolls."),
  p("defensive-precognition", "Defensive Precognition", "Clairsentience", 1, "Insight bonus to AC and saves."),
  p("astral-construct", "Astral Construct", "Metacreativity", 1, "Create a temporary construct servant."),
  p("psionic-charm", "Psionic Charm", "Telepathy", 1, "Make a humanoid your friend."),
  p("body-adjustment", "Body Adjustment", "Psychometabolism", 2, "Heal 1d12 damage."),
  p("energy-push", "Energy Push", "Psychokinesis", 2, "Damage and bull rush with energy."),
  p("concealing-amorpha", "Concealing Amorpha", "Metacreativity", 2, "Gain concealment from a shifting mass."),
  p("read-thoughts", "Read Thoughts", "Telepathy", 2, "Detect surface thoughts."),
  p("energy-missile", "Energy Missile", "Psychokinesis", 2, "Strike up to five targets with energy."),
  p("psionic-levitate", "Psionic Levitate", "Psychoportation", 2, "Move yourself up and down."),
  p("dimension-slide", "Dimension Slide", "Psychoportation", 3, "Teleport a short distance as a move."),
  p("energy-bolt", "Energy Bolt", "Psychokinesis", 3, "Line of energy, 5d6 damage."),
  p("dispel-psionics", "Dispel Psionics", "Psychokinesis", 3, "End ongoing psionic effects."),
  p("share-pain", "Share Pain", "Psychometabolism", 2, "Split damage with a willing subject."),
  p("psionic-blast", "Psionic Blast", "Telepathy", 3, "Stun creatures in a cone."),
  p("schism", "Schism", "Telepathy", 4, "Split your mind to manifest twice."),
  p("energy-adaptation", "Energy Adaptation", "Psychometabolism", 4, "Resist and absorb energy damage."),
  p("psychic-reformation", "Psychic Reformation", "Telepathy", 4, "Rebuild a creature's recent choices."),
  p("psionic-dominate", "Psionic Dominate", "Telepathy", 4, "Control a creature's actions."),
  p("psychofeedback", "Psychofeedback", "Psychometabolism", 5, "Trade one ability score for another."),
  p("true-seeing-psi", "Psionic True Seeing", "Clairsentience", 5, "See things as they truly are."),
  p("shatter-mind-blank", "Shatter Mind Blank", "Telepathy", 5, "Strip mental protections."),
  p("null-psionics-field", "Null Psionics Field", "Psychokinesis", 6, "Suppress psionics in an area."),
  p("temporal-acceleration", "Temporal Acceleration", "Psychoportation", 6, "Act while time stands still."),
  p("energy-conversion", "Energy Conversion", "Psychokinesis", 7, "Absorb energy attacks and hurl them back."),
  p("ultrablast", "Ultrablast", "Telepathy", 7, "Devastate the minds around you."),
  p("recall-death", "Recall Death", "Telepathy", 8, "A creature believes it has died."),
  p("true-metabolism", "True Metabolism", "Psychometabolism", 8, "Fast healing 10."),
  p("assimilate", "Assimilate", "Psychometabolism", 9, "Absorb a creature into your own body."),
  p("reality-revision", "Reality Revision", "Metacreativity", 9, "Rewrite reality within limits."),
  p("timeless-body", "Timeless Body", "Psychometabolism", 9, "Ignore harm for a short, perfect moment."),
];

/** highest spell level a caster of the given class level can cast, roughly. */
export function maxSpellLevel(classLevel: number, progression: "full" | "half"): number {
  if (progression === "half") {
    if (classLevel < 4) return 0;
    return Math.min(4, Math.floor((classLevel + 2) / 4));
  }
  return Math.min(9, Math.ceil(classLevel / 2));
}

export function spellLevelFor(spell: Spell, classId: string, fallback: "arcane" | "divine"): number | undefined {
  if (classId in spell.levels) return spell.levels[classId];
  return spell.levels[fallback];
}
