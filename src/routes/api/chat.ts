import { createFileRoute } from "@tanstack/react-router";
import {
  convertToModelMessages,
  streamText,
  tool,
  stepCountIs,
  type ToolSet,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider, DM_MODEL } from "@/lib/ai-gateway.server";
import { roll as rollDice } from "@/lib/dice";

/**
 * Tools with no `execute` are executed on the client, which owns the local
 * campaign + character save. `dmRoll` is the only server-side tool: it is the
 * DM's own hidden dice.
 */
const dmTools = {
  dmRoll: tool({
    description:
      "Roll dice yourself as the DM (monster attacks, damage, hidden checks). Use requestRoll when the PLAYER should roll.",
    inputSchema: z.object({
      reason: z.string().describe("What this roll is for, e.g. 'Orc greataxe attack'"),
      count: z.number().int().min(1).max(10000),
      sides: z.number().int().min(2).max(100),
      modifier: z.number().int().default(0),
    }),
    execute: async ({ reason, count, sides, modifier }) => {
      const r = rollDice(count, sides, modifier, reason);
      return { reason, notation: r.notation, total: r.total, rolls: r.rolls.slice(0, 20) };
    },
  }),
  requestRoll: tool({
    description:
      "Ask the player to roll. The player physically clicks to roll; you receive the total. Always use this for player checks, attacks, saves and damage.",
    inputSchema: z.object({
      reason: z.string().describe("e.g. 'Hide check to slip past the guard'"),
      notation: z.string().describe("Dice notation such as d20, 2d6, 1d8+2"),
      skillId: z.string().nullable().describe("Skill id if this is a skill check, else null"),
      ability: z
        .enum(["str", "dex", "con", "int", "wis", "cha", "none"])
        .describe("Ability modifier to add, or 'none'"),
      dc: z.number().int().nullable().describe("The DC, or null to keep it secret"),
    }),
  }),
  updateCharacter: tool({
    description: "Apply mechanical changes to the player character.",
    inputSchema: z.object({
      hpDelta: z.number().int().nullable(),
      tempHp: z.number().int().nullable(),
      nonlethalDelta: z.number().int().nullable(),
      xpDelta: z.number().int().nullable(),
      goldDelta: z.number().nullable(),
      addConditions: z.array(z.string()).nullable(),
      removeConditions: z.array(z.string()).nullable(),
      reason: z.string(),
    }),
  }),
  grantReward: tool({
    description:
      "Grant a feat, skill points, ability score increase, or XP because of how the character played.",
    inputSchema: z.object({
      kind: z.enum(["feat", "skill-points", "ability", "ability-score", "xp"]),
      detail: z.string().describe("e.g. 'Toughness' or '+2 skill points' or '+1 Wisdom'"),
      reason: z.string(),
    }),
  }),
  setAlignment: tool({
    description: "Shift the character's alignment because of their actions.",
    inputSchema: z.object({
      alignment: z.enum(["LG", "NG", "CG", "LN", "N", "CN", "LE", "NE", "CE"]),
      reason: z.string(),
    }),
  }),
  addLoot: tool({
    description: "Give the character an item.",
    inputSchema: z.object({
      name: z.string(),
      quantity: z.number().int().min(1).default(1),
      weight: z.number().default(0),
      cost: z.number().default(0),
      location: z.enum(["person", "stored", "party"]).default("person"),
      note: z.string().nullable(),
    }),
  }),
  updateScene: tool({
    description: "Update the current scene: where they are, the time, weather and combat state.",
    inputSchema: z.object({
      location: z.string().nullable(),
      region: z.string().nullable(),
      timeOfDay: z.string().nullable(),
      weather: z.string().nullable(),
      inCombat: z.boolean().nullable(),
      round: z.number().int().nullable(),
      summary: z.string().nullable(),
    }),
  }),
  upsertNpc: tool({
    description: "Record or update an NPC the player has met.",
    inputSchema: z.object({
      name: z.string(),
      role: z.string(),
      attitude: z.string().describe("hostile, unfriendly, indifferent, friendly, helpful"),
      notes: z.string(),
    }),
  }),
  upsertQuest: tool({
    description: "Add or update a quest in the journal.",
    inputSchema: z.object({
      title: z.string(),
      detail: z.string(),
      status: z.enum(["active", "done", "failed"]).default("active"),
    }),
  }),
  addJournal: tool({
    description: "Write a short entry into the campaign log after something important happens.",
    inputSchema: z.object({ text: z.string() }),
  }),
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const body = (await request.json()) as { messages: UIMessage[]; context?: string };
        const gateway = createLovableAiGatewayProvider(key);

        try {
          const result = streamText({
            model: gateway(DM_MODEL),
            stopWhen: stepCountIs(30),
            tools: dmTools as unknown as ToolSet,
            abortSignal: request.signal,
            system: `You are the Dungeon Master for a solo Dungeons & Dragons 3.5 edition game, running by the d20 SRD.

HOW YOU RUN THE TABLE
- Narrate in vivid but tight second person. Two to five short paragraphs, then stop and ask what the player does.
- You play every NPC, monster and party companion. Give them voices and motives.
- You are a rules-accurate 3.5 referee: call for the right checks, set DCs by the SRD guidelines, apply modifiers, track initiative and rounds in combat.
- NEVER roll for the player. Use requestRoll and wait for the returned total. Use dmRoll for your own monsters and hidden rolls.
- After a roll comes back, state the result plainly (total vs DC) and narrate the outcome.
- Apply consequences with tools: updateCharacter for HP/XP/gold/conditions, addLoot for treasure, updateScene when the situation changes, upsertNpc and upsertQuest as the story develops, addJournal at milestones.
- Grant feats, skill points or ability increases with grantReward only when the player has genuinely earned it through play. Shift alignment with setAlignment only after a clear pattern of actions, and explain why.
- The player is free to do anything the rules allow. Never railroad. If they go off-script, improvise the world honestly.
- Combat: announce initiative order, resolve round by round, describe enemy actions, apply damage through updateCharacter.
- If the player asks a rules question, answer it as the SRD does.

${body.context ?? ""}`,
            messages: await convertToModelMessages(body.messages),
          });

          return result.toUIMessageStreamResponse();
        } catch (err) {
          const message = err instanceof Error ? err.message : "AI gateway error";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
