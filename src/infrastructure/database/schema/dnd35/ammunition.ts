import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { nonEmpty, positive } from "./schemaUtils";
import { items } from "./item";
import { weapons } from "./weapon";

export const ammunition = sqliteTable(
  "dnd35_ammunition",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    quantityPerPackage: integer("quantity_per_package").notNull().default(1),
    specialText: text("special_text"),
  },
  (t) => [
    check(
      "dnd35_ammunition_quantity_per_package_integer",
      sql`${t.quantityPerPackage} is null or typeof(${t.quantityPerPackage}) = 'integer'`,
    ),
    primaryKey({ columns: [t.itemId] }),
    nonEmpty("dnd35_ammunition_kind_nonempty", t.kind),
    positive("dnd35_ammunition_package_valid", t.quantityPerPackage),
  ],
);
export type Ammunition = typeof ammunition.$inferSelect;
export type NewAmmunition = typeof ammunition.$inferInsert;
export const ammunitionWeapons = sqliteTable(
  "dnd35_ammunition_weapons",
  {
    ammunitionId: text("ammunition_id")
      .notNull()
      .references(() => ammunition.itemId, { onDelete: "cascade" }),
    weaponId: text("weapon_id")
      .notNull()
      .references(() => weapons.itemId, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.ammunitionId, t.weaponId] }),
    index("dnd35_ammunition_weapons_reverse_idx").on(t.weaponId),
  ],
);
export type AmmunitionWeapon = typeof ammunitionWeapons.$inferSelect;
export type NewAmmunitionWeapon = typeof ammunitionWeapons.$inferInsert;
