import { sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { jsonCheck } from "./schemaUtils";
import { contentColumns, contentChecks } from "./contentReference";
import { specialAbilities } from "./specialAbility";
import type { GrantParameters } from "./primitives";

export const domains = sqliteTable(
  "dnd35_domains",
  {
    ...contentColumns(),
    grantedPowerText: text("granted_power_text"),
  },
  (t) => [...contentChecks("dnd35_domains", t)],
);
export type Domain = typeof domains.$inferSelect;
export type NewDomain = typeof domains.$inferInsert;
export const domainGrantedPowers = sqliteTable(
  "dnd35_domain_granted_powers",
  {
    domainId: text("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "cascade" }),
    specialAbilityId: text("special_ability_id")
      .notNull()
      .references(() => specialAbilities.id, { onDelete: "cascade" }),
    parameters: text("parameters", { mode: "json" }).$type<GrantParameters>(),
  },
  (t) => [
    primaryKey({ columns: [t.domainId, t.specialAbilityId] }),
    jsonCheck("dnd35_domain_powers_parameters_json", t.parameters),
  ],
);
export type DomainGrantedPower = typeof domainGrantedPowers.$inferSelect;
export type NewDomainGrantedPower = typeof domainGrantedPowers.$inferInsert;
