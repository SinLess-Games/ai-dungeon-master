# The Endless Codex

**The Endless Codex** is an AI-powered Dungeon Master experience built around **Dungeons & Dragons 3.5**.

The goal is to make it possible to create a character, enter a campaign, and start playing without needing to organize a full group or wait for a human Dungeon Master.

The AI DM handles the world, NPCs, encounters, exploration, combat narration, quests, and ongoing campaign state while the application provides the tools needed to create, manage, and track your character.

## Features

The Endless Codex is being built to support:

- AI-powered Dungeon Master
- D&D 3.5 character creation
- Character sheet and progression tracking
- Attributes, skills, feats, spells, equipment, and inventory
- Campaign creation and management
- Persistent campaign state
- NPCs, factions, locations, and quests
- Rules-aware encounters
- Initiative and combat tracking
- Dice rolling
- Experience and level progression
- Campaign notes and world history
- Large persistent worlds
- Solo campaigns
- Open-ended adventures
- Custom campaign styles and settings
- Admin tools
- Developer blog and project updates

The long-term goal is to create a persistent tabletop experience where the world remembers what the player does and evolves around their decisions.

## The World

The default setting currently being developed is **Aeragorn**, a massive high-fantasy world shaped by unstable wild magic.

Aeragorn contains sprawling kingdoms, cities, towns, villages, hamlets, forts, ruins, wilderness regions, trade roads, ancient civilizations, and unexplored frontiers.

The world is periodically struck by powerful **Aetherstorms** capable of unpredictably altering creatures, people, magic, and even the landscape itself.

A creature caught in one of these storms could experience anything from a minor magical mutation to a complete transformation.

An elf might become a beholder.

A goblin might emerge as an ancient dragon.

Entire regions can become permanently altered by these storms, creating strange and dangerous areas known as **Stormscars**.

## Project Goals

The Endless Codex is designed around a few core ideas:

### Rules Matter

The game should respect D&D 3.5 mechanics instead of treating the rules as loose suggestions.

Character abilities, spells, combat, conditions, progression, and equipment should meaningfully affect gameplay.

### The World Should Feel Alive

The world should exist beyond the player.

Cities have politics.

Roads have travelers.

Villages have problems unrelated to the main story.

Factions pursue their own goals.

NPCs should remember important events and react to the player's actions.

### Adventure Should Be Always Available

You should not need to coordinate schedules or wait for a DM.

Create a character, enter the world, and play.

### Player Choice Matters

The AI should respond to unexpected decisions rather than forcing the player down a predetermined path.

The campaign should adapt to what the player actually chooses to do.

## Tech Stack

The project is currently being developed with Lovable and a modern TypeScript web stack.

Additional architecture and services will evolve as the project grows.

## Built with Lovable

This project was initially built with [Lovable](https://lovable.dev).

Continue development in the [Lovable editor](https://lovable.dev/projects/ff5a4290-261c-463e-b4c3-1bed82cf9855).

Lovable provides a fast workflow for iterating on the application while keeping the repository synchronized with the generated code.

- **Ship faster** — describe the feature you want to build and Lovable helps implement it.
- **Stay in sync** — changes made through Lovable are committed to this repository.
- **Full ownership** — the source code remains in your repository and can be developed independently.

## Local Development

To run the project locally, install:

- Node.js
- npm

Using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) is recommended for managing Node.js versions.

Clone the repository:

```sh
git clone <repository-url>
````

Enter the project directory:

```sh
cd <repository-name>
```

Install dependencies:

```sh
npm install
```

Start the development server:

```sh
npm run dev
```

The application should then be available at the local development URL shown in your terminal.

## Development Status

The Endless Codex is currently under active development.

Features, rules support, AI behavior, campaign systems, and interface design may change significantly as development continues.

## Planned Systems

Some of the larger systems planned for the project include:

- Expanded D&D 3.5 rules engine
- AI DM memory and campaign context
- Persistent world state
- Dynamic NPC generation
- Faction simulation
- Procedural towns and locations
- World maps
- Interactive travel
- Dynamic encounters
- Monster and encounter generation
- Spell management
- Equipment management
- Crafting
- Shops and economies
- Quest generation
- Reputation systems
- Character relationships
- Campaign timelines
- Session history
- World lore database
- Player journals
- Campaign exports
- Multiple campaign worlds

## Contributing

The project is still evolving rapidly.

Contribution guidelines, development standards, issue templates, and project architecture documentation will be added as the codebase matures.

## Disclaimer

The Endless Codex is an independent project and is not affiliated with or endorsed by Wizards of the Coast.

Dungeons & Dragons and related trademarks belong to their respective owners.
