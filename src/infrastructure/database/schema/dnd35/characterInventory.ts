import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  primaryKey,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/sqlite-core";
import {
  uuid,
  timestamps,
  enumCheck,
  nonNegative,
  positive,
  booleanCheck,
  jsonCheck,
} from "./schemaUtils";
import { dnd35Characters } from "./character";
import { items } from "./item";
import { itemProperties } from "./itemProperty";
import { equipmentSlots } from "./primitives";
import type { GrantParameters } from "./primitives";

/** Only individualized objects get an instance. Ordinary identical items remain stacks. */
export const itemInstances = sqliteTable(
  "dnd35_item_instances",
  {
    id: uuid(),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "restrict" }),
    customName: text("custom_name"),
    remainingCharges: integer("remaining_charges"),
    currentHitPoints: integer("current_hit_points"),
    /** An additive enhancement override for customized equipment. */
    enhancementBonus: integer("enhancement_bonus"),
    notes: text("notes"),
    ...timestamps(),
  },
  (t) => [
    check(
      "dnd35_item_instances_remaining_charges_integer",
      sql`${t.remainingCharges} is null or typeof(${t.remainingCharges}) = 'integer'`,
    ),
    check(
      "dnd35_item_instances_current_hit_points_integer",
      sql`${t.currentHitPoints} is null or typeof(${t.currentHitPoints}) = 'integer'`,
    ),
    check(
      "dnd35_item_instances_enhancement_bonus_integer",
      sql`${t.enhancementBonus} is null or typeof(${t.enhancementBonus}) = 'integer'`,
    ),
    uniqueIndex("dnd35_item_instances_definition_uq").on(t.id, t.itemId),
    index("dnd35_item_instances_item_idx").on(t.itemId),
    nonNegative("dnd35_item_instances_charges_valid", t.remainingCharges),
    nonNegative("dnd35_item_instances_hp_valid", t.currentHitPoints),
    nonNegative("dnd35_item_instances_enhancement_valid", t.enhancementBonus),
  ],
);
export type ItemInstance = typeof itemInstances.$inferSelect;
export type NewItemInstance = typeof itemInstances.$inferInsert;
export const itemInstanceProperties = sqliteTable(
  "dnd35_item_instance_properties",
  {
    instanceId: text("instance_id")
      .notNull()
      .references(() => itemInstances.id, { onDelete: "cascade" }),
    propertyId: text("property_id")
      .notNull()
      .references(() => itemProperties.id, { onDelete: "restrict" }),
    parameters: text("parameters", { mode: "json" }).$type<GrantParameters>(),
  },
  (t) => [
    primaryKey({ columns: [t.instanceId, t.propertyId] }),
    jsonCheck("dnd35_instance_properties_parameters_json", t.parameters),
  ],
);
export type ItemInstanceProperty = typeof itemInstanceProperties.$inferSelect;
export type NewItemInstanceProperty = typeof itemInstanceProperties.$inferInsert;
export const characterInventory = sqliteTable(
  "dnd35_character_inventory",
  {
    id: uuid(),
    characterId: text("character_id")
      .notNull()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "restrict" }),
    instanceId: text("instance_id"),
    quantity: integer("quantity").notNull().default(1),
    equipped: integer("equipped", { mode: "boolean" }).notNull().default(false),
    equippedSlot: text("equipped_slot", { enum: equipmentSlots }),
    containerInventoryId: text("container_inventory_id"),
    location: text("location", { enum: ["carried", "stored", "party"] })
      .notNull()
      .default("carried"),
    /** Optional generic storage/world location; no invented world table FK. */
    locationId: text("location_id"),
    notes: text("notes"),
    ...timestamps(),
  },
  (t) => [
    check(
      "dnd35_character_inventory_quantity_integer",
      sql`${t.quantity} is null or typeof(${t.quantity}) = 'integer'`,
    ),
    check(
      "dnd35_character_inventory_equipped_integer",
      sql`${t.equipped} is null or typeof(${t.equipped}) = 'integer'`,
    ),
    uniqueIndex("dnd35_character_inventory_owner_uq").on(t.id, t.characterId),
    index("dnd35_character_inventory_character_idx").on(t.characterId, t.equipped),
    uniqueIndex("dnd35_character_inventory_instance_uq")
      .on(t.instanceId)
      .where(sql`${t.instanceId} is not null`),
    index("dnd35_character_inventory_container_idx").on(t.containerInventoryId, t.characterId),
    foreignKey({
      columns: [t.instanceId, t.itemId],
      foreignColumns: [itemInstances.id, itemInstances.itemId],
    }),
    /** NO ACTION allows deleting all owned rows together; a nonempty container must be emptied first. */
    foreignKey({
      columns: [t.containerInventoryId, t.characterId],
      foreignColumns: [t.id, t.characterId],
    }),
    positive("dnd35_character_inventory_quantity_valid", t.quantity),
    booleanCheck("dnd35_character_inventory_equipped_bool", t.equipped),
    enumCheck("dnd35_character_inventory_slot_valid", t.equippedSlot, equipmentSlots),
    enumCheck("dnd35_character_inventory_location_valid", t.location, [
      "carried",
      "stored",
      "party",
    ]),
    check(
      "dnd35_character_inventory_instance_quantity_valid",
      sql`${t.instanceId} is null or ${t.quantity} = 1`,
    ),
    check(
      "dnd35_character_inventory_equipped_state_valid",
      sql`(${t.equipped} = 0 and ${t.equippedSlot} is null) or (${t.equipped} = 1 and ${t.equippedSlot} is not null and ${t.location} = 'carried' and ${t.containerInventoryId} is null)`,
    ),
    check(
      "dnd35_character_inventory_container_not_self",
      sql`${t.containerInventoryId} is null or ${t.containerInventoryId} != ${t.id}`,
    ),
  ],
);
export type CharacterInventory = typeof characterInventory.$inferSelect;
export type NewCharacterInventory = typeof characterInventory.$inferInsert;
