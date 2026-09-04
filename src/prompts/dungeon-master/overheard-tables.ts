/**
 * Overheard rumour tables. Snippets of conversation the DM can drop into a
 * scene: the passive line anyone catches, and the fuller version a character
 * gets on a successful Listen/Perception check.
 */

export type OverheardEntry = {
  /** What drifts past on a passive ear. */
  caught: string;
  /** What a successful listen check gets you. */
  juicy: string;
};

export type OverheardTable = {
  id: string;
  /** Where this conversation fits. */
  place: string;
  entries: OverheardEntry[];
};

export const OVERHEARD_TABLES: OverheardTable[] = [
  {
    id: "graveyard",
    place: "a graveyard or boneyard",
    entries: [
      { caught: "Dead men tell no tales.", juicy: "Unless you ask the right questions — and bring them back to answer." },
      { caught: "The old elf finally kicked the bucket.", juicy: "They say he was a miser, and that he was buried with every coin of it." },
      { caught: "Did you see the white crow?", juicy: "An omen. Cold winds coming — cold enough to chill the dead." },
      { caught: "Come on, it'll be fun.", juicy: "Let's take the headstone off the Captain's grave." },
      { caught: "You've never done it in a graveyard before?", juicy: "You can be as loud as you like. Nobody here is waking up." },
      { caught: "No, it has to be a fresh one.", juicy: "These are far too rotten. Keep digging — I need intact remains for the work." },
      { caught: "Try to forgive him his sins.", juicy: "He was a good man once, just led astray. Why was he never given a trial?" },
      { caught: "Help me look for it.", juicy: "Gravegrass — dark purple, grows in spirals. It's the key ingredient." },
      { caught: "Throw the body in here.", juicy: "I dug out the bottom of the open grave. They bury the priest on top tomorrow and nobody ever finds our friend." },
      { caught: "Gods, what is that?", juicy: "Forget the dwarf's treasure, it isn't worth this. We're leaving." },
      { caught: "All the dates are the same.", juicy: "Dozens of graves, all the same day. What happened here fifty years ago?" },
      { caught: "This one's mine.", juicy: "And this one. And those three over there were mine too. So many lovely works, all in one gallery." },
    ],
  },
  {
    id: "library",
    place: "a great library or archive",
    entries: [
      { caught: "It's missing.", juicy: "Something in here moves things. Last week a whole shelf of familiars vanished." },
      { caught: "He'll be banned.", juicy: "He brought a candle in. Magical light only — witchfire at the very most, never a real flame." },
      { caught: "\"The Righteous and the Weak.\"", juicy: "A distorted history of a mad queen's crusade against magic — thousands burned, and the book calls it justice." },
      { caught: "The book that says \"Greed\".", juicy: "Second from the top. Pull it and the passage opens. Then we take the loot and go." },
      { caught: "These fees are killing me.", juicy: "Another gold for being hours late. One day I'll do the thing I keep saying I'll do." },
      { caught: "Read my book.", juicy: "\"Dealing with the Devil Inside.\" Interested? Just sign this contract and it's yours." },
      { caught: "I love the old psalms.", juicy: "\"In holy land doth my body sleep, but my spirit doth not keep its company.\"" },
      { caught: "I can't find the mimic.", juicy: "One of these books is a mimic and if I don't find it before it bites someone, I'm expelled." },
      { caught: "Best poetry I've ever read.", juicy: "\"Free flying bird upon the wing, brought low as beneath the dragon's shadow we all fall.\"" },
      { caught: "I'll burn this whole place down.", juicy: "A hundred letters to the librarian professing my love, and she answers by asking me to leave." },
      { caught: "This history makes no sense.", juicy: "It claims the plague never ended and we're living in the last days. Like someone from elsewhere wrote it." },
      { caught: "The words kept changing as I read.", juicy: "The one with the cracked binding. It told me things about myself no one knew — and things no one should." },
    ],
  },
  {
    id: "temple",
    place: "a temple or shrine",
    entries: [
      { caught: "Beat him again.", juicy: "If he fails to light the candles once more, let his cries of pain be the offering." },
      { caught: "I feel her slipping away.", juicy: "No one else tends the altar of the death god. It isn't fashionable to show them respect anymore." },
      { caught: "This was his favourite place.", juicy: "I miss the old bastard. Rough and gruff, but he had a soft spot for this temple." },
      { caught: "I hope this is enough.", juicy: "You promise this gold buys his way into the heavens? I can't stand the thought of him trapped here." },
      { caught: "There's a switch in the fountain.", juicy: "By the symbol for Charity. Push it and a stairwell opens beneath the water. I'm finding out where it goes tonight." },
      { caught: "Why can't you come inside?", juicy: "It's just a temple. What do you mean it will hurt you?" },
      { caught: "I saw her, I swear.", juicy: "Her wings, her face — so beautiful I don't want to look at anything else again." },
      { caught: "The damage is significant.", juicy: "The vandals did a number on us. But I found this symbol carved into several statues — do you recognise it?" },
      { caught: "He hasn't been here in some time.", juicy: "I wonder if he's lost his faith. I heard the high priest chastised him over an indiscretion." },
      { caught: "All the gods are dead.", juicy: "A scheme to take your money and their power. They died centuries ago. You're all worshipping ghosts." },
      { caught: "You heard what he does.", juicy: "I can't believe he's still a priest. He won't be for much longer — not after tonight." },
      { caught: "I worship the new god.", juicy: "He walks among us even now, he hears our needs, and he will bring about a new day for his children." },
    ],
  },
];

/** Compact briefing appended to the DM prompt so rumours stay in the DM's pocket. */
export const OVERHEARD_PROMPT_SECTION = `OVERHEARD RUMOURS
When the player is somewhere public — a graveyard, a library, a temple, a market, a tavern — you may let a scrap of conversation reach them. Give the surface line freely; give the full, useful version only on a successful Listen check you call for. Rumours are true, half-true, or a lie somebody believes — never label which. Some lead to a quest, some are texture, and one in a while one is a warning they will wish they had followed. Invent new ones in the same shape when the location calls for it. Examples of the shape:

${OVERHEARD_TABLES.map(
  (t) =>
    `In ${t.place}:\n` +
    t.entries
      .slice(0, 4)
      .map((e) => `- Caught: "${e.caught}" / Overheard in full: "${e.juicy}"`)
      .join("\n"),
).join("\n\n")}`;
