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
import { DM_SYSTEM_PROMPT } from "@/prompts/dungeon-master/system-prompt";

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
      notation: z
        .string()
        .describe(
          "Bare dice only, such as d20 or 2d6. Do NOT add the character's modifier — the app adds it from the sheet.",
        ),
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
  upsertPartyMember: tool({
    description:
      "Add or update someone travelling with the player: an adventuring companion, a cohort gained through Leadership, or a low-level follower. Use this whenever an NPC joins the party, gains levels, is hurt outside the player's own sheet, or is equipped.",
    inputSchema: z.object({
      name: z.string(),
      tier: z.enum(["companion", "cohort", "follower"]).default("companion"),
      controlledBy: z.enum(["dm", "player"]).default("dm"),
      role: z.string().nullable(),
      race: z.string().nullable(),
      classLine: z.string().nullable().describe("e.g. 'Cleric 4' or 'Fighter 2/Rogue 1'"),
      level: z.number().int().nullable(),
      attitude: z.string().nullable(),
      hp: z.number().int().nullable(),
      maxHp: z.number().int().nullable(),
      ac: z.number().int().nullable(),
      initiative: z.number().int().nullable(),
      status: z.enum(["active", "benched", "gone"]).nullable(),
      notes: z.string().nullable(),
      gear: z
        .array(
          z.object({
            name: z.string(),
            quantity: z.number().int().min(1).default(1),
            slot: z.string().default("pack"),
            notes: z.string().default(""),
          }),
        )
        .nullable(),
    }),
  }),
  removePartyMember: tool({
    description: "Remove someone from the party roster when they leave for good.",
    inputSchema: z.object({ name: z.string() }),
  }),
  shapeWorld: tool({
    description:
      "Draw or update the campaign's overland world map. Call this once at the very start of a campaign to create the setting, then again whenever new places are invented or renamed. Send only what changes.",
    inputSchema: z.object({
      worldName: z.string().nullable(),
      tagline: z.string().nullable(),
      premise: z.string().nullable(),
      regions: z
        .array(
          z.object({
            name: z.string(),
            terrain: z
              .enum([
                "plains","forest","hills","mountains","desert","swamp","tundra","jungle","coast","sea","wasteland","underdark",
              ])
              .nullable(),
            description: z.string().nullable(),
          }),
        )
        .nullable(),
      sites: z
        .array(
          z.object({
            name: z.string(),
            kind: z
              .enum(["city","town","village","keep","dungeon","ruin","lair","wonder","camp","port"])
              .nullable(),
            regionName: z.string().nullable(),
            description: z.string().nullable(),
            x: z.number().nullable().describe("0-100 across; leave null to place inside the named region"),
            y: z.number().nullable().describe("0-70 down; leave null to place inside the named region"),
            discovered: z.boolean().nullable().describe("true if the party already knows this place exists"),
          }),
        )
        .nullable(),
    }),
  }),
  moveParty: tool({
    description:
      "Move the party marker on the world map. Use the site name when they arrive somewhere mapped, or coordinates when they are out in the wild.",
    inputSchema: z.object({
      siteName: z.string().nullable(),
      x: z.number().nullable(),
      y: z.number().nullable(),
    }),
  }),
  discoverSite: tool({
    description: "Reveal a place on the world map because the party learned it exists.",
    inputSchema: z.object({ name: z.string() }),
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
        const auth = await requireApiUser(request);
        if ("response" in auth) return auth.response;

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
            system: `${DM_SYSTEM_PROMPT}

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
