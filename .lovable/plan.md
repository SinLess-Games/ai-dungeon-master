# Better Dungeon Master prompting

Two changes: a stronger, better-organised set of instructions for the AI Dungeon Master, and a pool of varied campaign openings so no two campaigns start the same way.

## 1. A proper DM briefing

Today the DM's instructions are one long block written inline in the chat endpoint. It gets replaced with a dedicated, structured briefing that reads like a good DM's own notes:

- **Voice and craft** — tight second person, sensory detail over adjectives, hard cuts instead of summary, NPCs with wants and speech patterns, no narrating what the player feels or decides.
- **Turn shape** — describe what changed, show the world reacting, end on a live situation with real choices (never "what do you do?" into a vacuum).
- **Pacing** — respect the campaign's chosen pace and length; keep a hidden sense of scene → beat → milestone so a one-shot lands and a long campaign breathes.
- **Fairness as referee** — set difficulty by the rules, say the target number before the roll when it's knowable, never fudge a result after the fact, let failure move the story forward rather than stalling it.
- **Player agency** — no railroading, no invisible walls; if the player goes sideways the world answers honestly.
- **Rolls** — the player always rolls their own dice; the DM rolls only for monsters and hidden checks; results are stated plainly, then narrated.
- **Bookkeeping** — when to record damage, loot, scene changes, NPCs, quests, party members and journal entries, and the rule that rewards and alignment shifts must be earned and explained.
- **Tone dial** — the campaign's chosen style, type and DM temperament are honoured explicitly (grim, cinematic, whimsical, brutal, etc.).
- **Formatting** — kept as it is now (bold, italics, dice in code, boxed text as quotes, no top-level headings).

The character sheet and world state currently appended to the instructions stay exactly as they are.

## 2. Randomised campaign openings

Right now every campaign starts with the same single sentence asking the DM to describe the starting location. Instead there will be a pool of roughly a dozen distinct opening directives — for example: mid-crisis cold open, quiet arrival with a wrongness underneath, a stranger who already knows your name, aftermath of something you didn't witness, a job offer you can refuse, waking somewhere you don't recognise, a crowd parting around one thing, a journey interrupted.

Rules for choosing one:

- Openings are tagged, and the pool is filtered by the campaign's style and type first (a dungeon crawl or a horror game won't get a whimsical market opening), falling back to the general pool.
- The choice is locked to the campaign, so refreshing the page or coming back later does not restart the story differently.
- Every opening still ends by handing control to the player, and still uses the campaign's starting location, world, and character.

## Technical notes

- New `src/lib/dm-prompt.ts` exporting the composed DM system prompt; `src/routes/api/chat.ts` imports it instead of holding the inline string.
- New `src/lib/dm-openings.ts` with the tagged opening pool and a `pickOpening(campaign)` helper that hashes the campaign id for a stable, deterministic pick.
- `src/routes/campaigns.$id.tsx` calls `pickOpening` for its one-time kickoff message instead of the hardcoded sentence.
- Existing tools, context building, and persistence are untouched; no schema or backend changes.
