/// <reference types="@cloudflare/workers-types" />

import type { Database } from "@/infrastructure/database/client";
import type { EquipmentSlot } from "@/infrastructure/database/schema/dnd35/primitives";
import { loadActiveGameContext } from "./d1Dnd35State";

export interface InventoryConfigurationDependencies {
  db: Database;
  binding: D1Database;
  createId?: () => string;
  now?: () => Date;
}

export interface ConfigureCharacterInventoryInput {
  campaignId: string;
  actorId: string;
  inventoryId: string;
  location?: "carried" | "stored" | "party";
  equippedSlot?: EquipmentSlot | null;
  notes?: string | null;
  reason: string;
}

interface InventoryRow {
  id: string;
  characterId: string;
  itemId: string;
  itemName: string;
  category: string;
  location: "carried" | "stored" | "party";
  equipped: number;
  equippedSlot: EquipmentSlot | null;
  notes: string | null;
  magicSlot: EquipmentSlot | null;
}

function allowedSlots(row: Pick<InventoryRow, "category" | "magicSlot">): readonly EquipmentSlot[] {
  switch (row.category) {
    case "weapon":
      return ["main_hand", "off_hand", "both_hands"];
    case "armor":
      return ["body"];
    case "shield":
      return ["shield", "off_hand"];
    case "magic":
      return row.magicSlot ? [row.magicSlot] : ["slotless", "other"];
    default:
      return ["slotless", "other"];
  }
}

function sequenceConflict(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /game_events_campaign_sequence_uidx|UNIQUE constraint failed: game_events\.campaign_id, game_events\.sequence/i.test(
    message,
  );
}

function changed(result: D1Result<unknown> | undefined): number {
  return result?.meta?.changes ?? 0;
}

function conflictsWithBothHands(slot: EquipmentSlot): readonly EquipmentSlot[] {
  if (slot === "both_hands") return ["main_hand", "off_hand", "shield"];
  if (slot === "main_hand" || slot === "off_hand" || slot === "shield") return ["both_hands"];
  return [];
}

export async function configureCharacterInventory(
  deps: InventoryConfigurationDependencies,
  input: ConfigureCharacterInventoryInput,
) {
  const context = await loadActiveGameContext(deps.db, input.campaignId);
  if (!context) throw new Error("CAMPAIGN_GAME_NOT_ACTIVE");
  if (context.rulesetId !== "dnd35" || context.rulesetVersion !== "3.5") {
    throw new Error("CAMPAIGN_RULESET_UNSUPPORTED");
  }

  const actor = await deps.binding
    .prepare(
      `SELECT id, character_id AS characterId
       FROM game_actors
       WHERE id = ? AND campaign_id = ? AND kind = 'character'
         AND character_id IS NOT NULL AND status = 'active'
       LIMIT 1`,
    )
    .bind(input.actorId, input.campaignId)
    .first<{ id: string; characterId: string }>();
  if (!actor) throw new Error("GAME_CHARACTER_ACTOR_NOT_FOUND");

  const row = await deps.binding
    .prepare(
      `SELECT inventory.id,
              inventory.character_id AS characterId,
              inventory.item_id AS itemId,
              item.name AS itemName,
              item.category,
              inventory.location,
              inventory.equipped,
              inventory.equipped_slot AS equippedSlot,
              inventory.notes,
              magic.slot AS magicSlot
       FROM dnd35_character_inventory inventory
       JOIN dnd35_items item ON item.id = inventory.item_id
       LEFT JOIN dnd35_magic_items magic ON magic.item_id = item.id
       WHERE inventory.id = ? AND inventory.character_id = ?
       LIMIT 1`,
    )
    .bind(input.inventoryId, actor.characterId)
    .first<InventoryRow>();
  if (!row) throw new Error("GAME_INVENTORY_ITEM_NOT_FOUND");

  const location = input.location ?? row.location;
  let equippedSlot =
    input.equippedSlot === undefined ? row.equippedSlot : input.equippedSlot;
  if (location !== "carried") equippedSlot = null;
  const equipped = equippedSlot !== null;
  const notes = input.notes === undefined ? row.notes : input.notes;

  if (equippedSlot !== null && !allowedSlots(row).includes(equippedSlot)) {
    throw new Error("GAME_INVENTORY_SLOT_INVALID");
  }

  if (equippedSlot !== null && equippedSlot !== "slotless" && equippedSlot !== "other") {
    const incompatibleSlots = [equippedSlot, ...conflictsWithBothHands(equippedSlot)];
    const placeholders = incompatibleSlots.map(() => "?").join(", ");
    const conflict = await deps.binding
      .prepare(
        `SELECT id
         FROM dnd35_character_inventory
         WHERE character_id = ? AND id != ? AND equipped = 1
           AND equipped_slot IN (${placeholders})
         LIMIT 1`,
      )
      .bind(actor.characterId, row.id, ...incompatibleSlots)
      .first<{ id: string }>();
    if (conflict) throw new Error("GAME_INVENTORY_SLOT_OCCUPIED");
  }

  const before = {
    location: row.location,
    equipped: Boolean(row.equipped),
    equippedSlot: row.equippedSlot,
    notes: row.notes,
  };
  const after = { location, equipped, equippedSlot, notes };
  if (
    before.location === after.location &&
    before.equipped === after.equipped &&
    before.equippedSlot === after.equippedSlot &&
    before.notes === after.notes
  ) {
    return {
      changed: false,
      inventoryId: row.id,
      itemId: row.itemId,
      itemName: row.itemName,
      before,
      after,
    };
  }

  const eventId = deps.createId?.() ?? crypto.randomUUID();
  const occurredAt = deps.now?.() ?? new Date();
  const timestamp = Math.floor(occurredAt.getTime() / 1000);
  const targetIds = JSON.stringify([input.actorId]);
  const payload = JSON.stringify({
    inventoryId: row.id,
    itemId: row.itemId,
    itemName: row.itemName,
    before,
    after,
    reason: input.reason,
  });
  const deltas = JSON.stringify([
    {
      id: `${eventId}:inventory`,
      entityId: row.id,
      path: ["dnd35", "inventory", "placement"],
      before,
      after,
      reason: input.reason,
    },
  ]);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const event = deps.binding
        .prepare(
          `INSERT INTO game_events (
             id, campaign_id, session_id, sequence, event_type, occurred_at,
             actor_id, source_id, target_ids, payload, deltas, created_at
           )
           SELECT ?, ?, ?,
             (SELECT COALESCE(MAX(sequence), 0) + 1 FROM game_events WHERE campaign_id = ?),
             'inventory.item.configured', ?, ?, ?, ?, ?, ?, ?
           WHERE EXISTS (
             SELECT 1 FROM dnd35_character_inventory
             WHERE id = ? AND character_id = ? AND location = ? AND equipped = ?
               AND equipped_slot IS ? AND notes IS ?
           )`,
        )
        .bind(
          eventId,
          context.campaignId,
          context.sessionId,
          context.campaignId,
          timestamp,
          input.actorId,
          row.itemId,
          targetIds,
          payload,
          deltas,
          timestamp,
          row.id,
          actor.characterId,
          row.location,
          row.equipped,
          row.equippedSlot,
          row.notes,
        );
      const update = deps.binding
        .prepare(
          `UPDATE dnd35_character_inventory
           SET location = ?, equipped = ?, equipped_slot = ?, notes = ?, updated_at = ?
           WHERE id = ? AND character_id = ? AND location = ? AND equipped = ?
             AND equipped_slot IS ? AND notes IS ?
             AND EXISTS (SELECT 1 FROM game_events WHERE id = ?)`,
        )
        .bind(
          location,
          equipped ? 1 : 0,
          equippedSlot,
          notes,
          timestamp,
          row.id,
          actor.characterId,
          row.location,
          row.equipped,
          row.equippedSlot,
          row.notes,
          eventId,
        );
      const results = await deps.binding.batch([event, update]);
      if (changed(results[0]) !== 1 || changed(results[1]) !== 1) {
        throw new Error("GAME_STATE_CONFLICT");
      }
      return {
        changed: true,
        eventId,
        sessionId: context.sessionId,
        inventoryId: row.id,
        itemId: row.itemId,
        itemName: row.itemName,
        before,
        after,
      };
    } catch (error) {
      if (attempt === 0 && sequenceConflict(error)) continue;
      throw error;
    }
  }

  throw new Error("GAME_STATE_CONFLICT");
}
