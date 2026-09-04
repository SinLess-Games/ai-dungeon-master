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
  const i: any = input;
  const c: Character = structuredClone(character);
  const g: Campaign = structuredClone(campaign);

  switch (toolName) {
    case "updateCharacter": {
      const notes: string[] = [];
      if (num(i.hpDelta)) {
        c.hp.current = c.hp.current + num(i.hpDelta);
        notes.push(`HP ${i.hpDelta > 0 ? "+" : ""}${i.hpDelta} → ${c.hp.current}`);
      }
      if (i.tempHp !== null && i.tempHp !== undefined) {
        c.hp.temp = num(i.tempHp);
        notes.push(`temp HP ${c.hp.temp}`);
      }
      if (num(i.nonlethalDelta)) {
        c.hp.nonlethal = Math.max(0, c.hp.nonlethal + num(i.nonlethalDelta));
        notes.push(`nonlethal ${c.hp.nonlethal}`);
      }
      if (num(i.xpDelta)) {
        c.xp = Math.max(0, c.xp + num(i.xpDelta));
        notes.push(`XP ${i.xpDelta > 0 ? "+" : ""}${i.xpDelta} → ${c.xp}`);
      }
      if (num(i.goldDelta)) {
        c.gold = Math.max(0, c.gold + num(i.goldDelta));
        notes.push(`gold ${i.goldDelta > 0 ? "+" : ""}${i.goldDelta} → ${c.gold}`);
      }
      if (Array.isArray(i.addConditions)) {
        for (const cond of i.addConditions as string[]) {
          if (cond && !c.conditions.includes(cond)) c.conditions.push(cond);
        }
        if (i.addConditions.length) notes.push(`gained ${i.addConditions.join(", ")}`);
      }
      if (Array.isArray(i.removeConditions)) {
        c.conditions = c.conditions.filter((x) => !i.removeConditions.includes(x));
        if (i.removeConditions.length) notes.push(`cleared ${i.removeConditions.join(", ")}`);
      }
      return { character: c, campaign: g, output: notes.join("; ") || "no change" };
    }

    case "grantReward": {
      const grant: DmGrant = {
        id: newId(),
        at: new Date().toISOString(),
        kind: i.kind,
        detail: String(i.detail ?? ""),
        reason: String(i.reason ?? ""),
      };
      c.grants.push(grant);
      if (i.kind === "xp") {
        const n = parseInt(String(i.detail).replace(/[^\d-]/g, ""), 10);
        if (Number.isFinite(n)) c.xp = Math.max(0, c.xp + n);
      }
      return { character: c, campaign: g, output: `granted ${grant.kind}: ${grant.detail}` };
    }

    case "setAlignment": {
      const prev = c.alignment;
      c.alignment = i.alignment as Alignment;
      c.grants.push({
        id: newId(),
        at: new Date().toISOString(),
        kind: "alignment",
        detail: `${prev} → ${c.alignment}`,
        reason: String(i.reason ?? ""),
      });
      return { character: c, campaign: g, output: `alignment ${prev} → ${c.alignment}` };
    }

    case "addLoot": {
      const item: InventoryItem = {
        id: newId(),
        name: String(i.name ?? "Item"),
        quantity: Math.max(1, num(i.quantity) || 1),
        weight: num(i.weight),
        cost: num(i.cost),
        location: (i.location as InventoryItem["location"]) ?? "person",
        ...(i.note ? { note: String(i.note) } : {}),
      };
      c.inventory.push(item);
      return { character: c, campaign: g, output: `added ${item.quantity}× ${item.name}` };
    }

    case "updateScene": {
      const s = g.scene;
      if (i.location) s.location = String(i.location);
      if (i.region) s.region = String(i.region);
      if (i.timeOfDay) s.timeOfDay = String(i.timeOfDay);
      if (i.weather) s.weather = String(i.weather);
      if (typeof i.inCombat === "boolean") s.inCombat = i.inCombat;
      if (i.round !== null && i.round !== undefined) s.round = num(i.round);
      if (i.summary) s.summary = String(i.summary);
      return { character: c, campaign: g, output: `scene: ${s.location} (${s.timeOfDay})` };
    }

    case "upsertNpc": {
      const name = String(i.name ?? "").trim();
      const existing = g.npcs.find((n) => n.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        existing.role = String(i.role ?? existing.role);
        existing.attitude = String(i.attitude ?? existing.attitude);
        existing.notes = String(i.notes ?? existing.notes);
      } else {
        g.npcs.push({
          id: newId(),
          name,
          role: String(i.role ?? ""),
          attitude: String(i.attitude ?? "indifferent"),
          notes: String(i.notes ?? ""),
        });
      }
      return { character: c, campaign: g, output: `npc recorded: ${name}` };
    }

    case "upsertQuest": {
      const title = String(i.title ?? "").trim();
      const existing = g.quests.find((q) => q.title.toLowerCase() === title.toLowerCase());
      if (existing) {
        existing.detail = String(i.detail ?? existing.detail);
        existing.status = (i.status as QuestStatus) ?? existing.status;
      } else {
        g.quests.push({
          id: newId(),
          title,
          detail: String(i.detail ?? ""),
          status: (i.status as QuestStatus) ?? "active",
        });
      }
      return { character: c, campaign: g, output: `quest ${i.status ?? "active"}: ${title}` };
    }

    case "addJournal": {
      g.journal.unshift({ id: newId(), at: new Date().toISOString(), text: String(i.text ?? "") });
      g.journal = g.journal.slice(0, 200);
      return { character: c, campaign: g, output: "logged" };
    }

    default:
      return null;
  }
}

type QuestStatus = "active" | "done" | "failed";
