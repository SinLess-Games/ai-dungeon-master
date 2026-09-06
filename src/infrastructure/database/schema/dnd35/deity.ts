import { index, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { enumCheck } from "./schemaUtils";
import { contentColumns, contentChecks } from "./contentReference";
import { alignments } from "./primitives";
import { domains } from "./domain";
import { weapons } from "./weapon";

export const deities = sqliteTable(
  "dnd35_deities",
  {
    ...contentColumns(),
    alignment: text("alignment", { enum: alignments }),
    portfolio: text("portfolio"),
    symbol: text("symbol"),
  },
  (t) => [
    ...contentChecks("dnd35_deities", t),
    enumCheck("dnd35_deities_alignment_valid", t.alignment, alignments),
  ],
);
export type Deity = typeof deities.$inferSelect;
export type NewDeity = typeof deities.$inferInsert;
export const deityDomains = sqliteTable(
  "dnd35_deity_domains",
  {
    deityId: text("deity_id")
      .notNull()
      .references(() => deities.id, { onDelete: "cascade" }),
    domainId: text("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.deityId, t.domainId] }),
    index("dnd35_deity_domains_reverse_idx").on(t.domainId),
  ],
);
export type DeityDomain = typeof deityDomains.$inferSelect;
export type NewDeityDomain = typeof deityDomains.$inferInsert;
export const deityFavoredWeapons = sqliteTable(
  "dnd35_deity_favored_weapons",
  {
    deityId: text("deity_id")
      .notNull()
      .references(() => deities.id, { onDelete: "cascade" }),
    weaponId: text("weapon_id")
      .notNull()
      .references(() => weapons.itemId, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.deityId, t.weaponId] }),
    index("dnd35_deity_weapons_reverse_idx").on(t.weaponId),
  ],
);
export type DeityFavoredWeapon = typeof deityFavoredWeapons.$inferSelect;
export type NewDeityFavoredWeapon = typeof deityFavoredWeapons.$inferInsert;
