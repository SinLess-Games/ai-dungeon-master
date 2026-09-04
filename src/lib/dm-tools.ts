import type { Character, InventoryItem, DmGrant } from "./rules/character";
import type { Campaign } from "./campaign";
import type { Alignment } from "./rules/types";
import { newId } from "./storage";

type Any = Record<string, any>;

export interface ApplyResult {
  character: Character;
  campaign: Campaign;
  /** short text handed back to the model as the tool result */
  output: string;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/**
 * Applies a DM tool call to the local save. Pure: returns new objects.
 * Returns null for tools this module does not own (e.g. requestRoll).
 */
export function applyDmTool(
  toolName: string,
  input: Any,
  character: Character,
  campaign: Campaign,
): ApplyResult | null {
  const c: Character = structuredClone(character);
  const g: Campaign = structuredClone(campaign);

  switch (toolName) {
    case "updateCharacter": {
      const notes: string[] = [];
      if (num(input.hpDelta)) {
        c.hp.current = c.hp.current + num(input.hpDelta);
        notes.push(`HP ${input.hpDelta > 0 ? "+" : ""}${input.hpDelta} → ${c.hp.current}`);
      }
      if (input.tempHp !== null && input.tempHp !== undefined) {
        c.hp.temp = num(input.tempHp);
        notes.push(`temp HP ${c.hp.temp}`);
      }
      if (num(input.nonlethalDelta)) {
        c.hp.nonlethal = Math.max(0, c.hp.nonlethal + num(input.nonlethalDelta));
        notes.push(`nonlethal ${c.hp.nonlethal}`);
      }
      if (num(input.xpDelta)) {
        c.xp = Math.max(0, c.xp + num(input.xpDelta));
        notes.push(`XP ${input.xpDelta > 0 ? "+" : ""}${input.xpDelta} → ${c.xp}`);
      }
      if (num(input.goldDelta)) {
        c.gold = Math.max(0, c.gold + num(input.goldDelta));
        notes.push(`gold ${input.goldDelta > 0 ? "+" : ""}${input.goldDelta} → ${c.gold}`);
      }
      if (Array.isArray(input.addConditions)) {
        for (const cond of input.addConditions as string[]) {
          if (cond && !c.conditions.includes(cond)) c.conditions.push(cond);
        }
        if (input.addConditions.length) notes.push(`gained ${input.addConditions.join(", ")}`);
      }
      if (Array.isArray(input.removeConditions)) {
        c.conditions = c.conditions.filter((x) => !input.removeConditions.includes(x));
        if (input.removeConditions.length) notes.push(`cleared ${input.removeConditions.join(", ")}`);
      }
      return { character: c, campaign: g, output: notes.join("; ") || "no change" };
    }

    case "grantReward": {
      const grant: DmGrant = {
        id: newId(),
        at: new Date().toISOString(),
        kind: input.kind,
        detail: String(input.detail ?? ""),
        reason: String(input.reason ?? ""),
      };
      c.grants.push(grant);
      if (input.kind === "xp") {
        const n = parseInt(String(input.detail).replace(/[^\d-]/g, ""), 10);
        if (Number.isFinite(n)) c.xp = Math.max(0, c.xp + n);
      }
      return { character: c, campaign: g, output: `granted ${grant.kind}: ${grant.detail}` };
    }

    case "setAlignment": {
      const prev = c.alignment;
      c.alignment = input.alignment as Alignment;
      c.grants.push({
        id: newId(),
        at: new Date().toISOString(),
        kind: "alignment",
        detail: `${prev} → ${c.alignment}`,
        reason: String(input.reason ?? ""),
      });
      return { character: c, campaign: g, output: `alignment ${prev} → ${c.alignment}` };
    }

    case "addLoot": {
      const item: InventoryItem = {
        id: newId(),
        name: String(input.name ?? "Item"),
        quantity: Math.max(1, num(input.quantity) || 1),
        weight: num(input.weight),
        cost: num(input.cost),
        location: (input.location as InventoryItem["location"]) ?? "person",
        ...(input.note ? { note: String(input.note) } : {}),
      };
      c.inventory.push(item);
      return { character: c, campaign: g, output: `added ${item.quantity}× ${item.name}` };
    }

    case "updateScene": {
      const s = g.scene;
      if (input.location) s.location = String(input.location);
      if (input.region) s.region = String(input.region);
      if (input.timeOfDay) s.timeOfDay = String(input.timeOfDay);
      if (input.weather) s.weather = String(input.weather);
      if (typeof input.inCombat === "boolean") s.inCombat = input.inCombat;
      if (input.round !== null && input.round !== undefined) s.round = num(input.round);
      if (input.summary) s.summary = String(input.summary);
      return { character: c, campaign: g, output: `scene: ${s.location} (${s.timeOfDay})` };
    }

    case "upsertNpc": {
      const name = String(input.name ?? "").trim();
      const existing = g.npcs.find((n) => n.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        existing.role = String(input.role ?? existing.role);
        existing.attitude = String(input.attitude ?? existing.attitude);
        existing.notes = String(input.notes ?? existing.notes);
      } else {
        g.npcs.push({
          id: newId(),
          name,
          role: String(input.role ?? ""),
          attitude: String(input.attitude ?? "indifferent"),
          notes: String(input.notes ?? ""),
        });
      }
      return { character: c, campaign: g, output: `npc recorded: ${name}` };
    }

    case "upsertQuest": {
      const title = String(input.title ?? "").trim();
      const existing = g.quests.find((q) => q.title.toLowerCase() === title.toLowerCase());
      if (existing) {
        existing.detail = String(input.detail ?? existing.detail);
        existing.status = (input.status as QuestStatus) ?? existing.status;
      } else {
        g.quests.push({
          id: newId(),
          title,
          detail: String(input.detail ?? ""),
          status: (input.status as QuestStatus) ?? "active",
        });
      }
      return { character: c, campaign: g, output: `quest ${input.status ?? "active"}: ${title}` };
    }

    case "addJournal": {
      g.journal.unshift({ id: newId(), at: new Date().toISOString(), text: String(input.text ?? "") });
      g.journal = g.journal.slice(0, 200);
      return { character: c, campaign: g, output: "logged" };
    }

    default:
      return null;
  }
}

type QuestStatus = "active" | "done" | "failed";
