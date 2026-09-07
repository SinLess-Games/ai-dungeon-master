import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { powers } from "./dnd35/power";
import { spells } from "./dnd35/spell";

export type RuntimeDnd35SaveEffect = "none" | "negates" | "half" | "partial";
export type RuntimeDnd35EffectTarget = "targets" | "caster";

export interface RuntimeDnd35ScaledAmount {
  /** Optional fixed dice expression, for example `2d6`. */
  dice?: string;
  /** Optional fixed numeric adjustment applied after dice. */
  flat?: number;
  /**
   * Additional dice granted from caster/manifester level. Fireball is modeled
   * as dice=`1d6`, everyLevels=1, maxApplications=10.
   */
  scalingDice?: {
    dice: string;
    everyLevels: number;
    maxApplications?: number;
  };
}

export type RuntimeDnd35ResolvedEffect =
  | {
      kind: "damage";
      target: RuntimeDnd35EffectTarget;
      amount: RuntimeDnd35ScaledAmount;
      damageType?: string;
      saveEffect?: RuntimeDnd35SaveEffect;
    }
  | {
      kind: "healing";
      target: RuntimeDnd35EffectTarget;
      amount: RuntimeDnd35ScaledAmount;
      saveEffect?: RuntimeDnd35SaveEffect;
    }
  | {
      kind: "condition";
      target: RuntimeDnd35EffectTarget;
      conditionId: string;
      duration:
        | { kind: "rounds"; rounds: number; roundsPerLevel?: number; maxRounds?: number }
        | { kind: "permanent" }
        | { kind: "special" };
      saveEffect?: RuntimeDnd35SaveEffect;
    }
  | {
      /** Deliberate extension point for content that needs a named rules adapter. */
      kind: "custom";
      target: RuntimeDnd35EffectTarget;
      handler: string;
      data?: Record<string, unknown>;
      saveEffect?: RuntimeDnd35SaveEffect;
    };

/**
 * Structured, engine-consumable effect profile for a spell or power.
 *
 * Rules text remains in the canonical D&D content tables. This table only
 * stores effects that the deterministic runtime knows how to execute. It lives
 * outside the 93-table canonical content contract because it is an application
 * runtime adapter rather than a new D&D sourcebook entity.
 */
export const runtimeDnd35EffectProfiles = sqliteTable(
  "runtime_dnd35_effect_profiles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sourceKind: text("source_kind").$type<"spell" | "power">().notNull(),
    spellId: text("spell_id").references(() => spells.id, { onDelete: "cascade" }),
    powerId: text("power_id").references(() => powers.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull().default(0),
    effect: text("effect", { mode: "json" }).$type<RuntimeDnd35ResolvedEffect>().notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("runtime_dnd35_effect_profiles_spell_idx").on(table.spellId, table.sequence),
    index("runtime_dnd35_effect_profiles_power_idx").on(table.powerId, table.sequence),
    uniqueIndex("runtime_dnd35_effect_profiles_spell_sequence_uidx").on(
      table.spellId,
      table.sequence,
    ),
    uniqueIndex("runtime_dnd35_effect_profiles_power_sequence_uidx").on(
      table.powerId,
      table.sequence,
    ),
    check(
      "runtime_dnd35_effect_profiles_source_kind_valid",
      sql`${table.sourceKind} IN ('spell', 'power')`,
    ),
    check("runtime_dnd35_effect_profiles_sequence_non_negative", sql`${table.sequence} >= 0`),
    check(
      "runtime_dnd35_effect_profiles_source_link_valid",
      sql`(${table.sourceKind} = 'spell' AND ${table.spellId} IS NOT NULL AND ${table.powerId} IS NULL) OR (${table.sourceKind} = 'power' AND ${table.powerId} IS NOT NULL AND ${table.spellId} IS NULL)`,
    ),
    check("runtime_dnd35_effect_profiles_effect_json", sql`json_valid(${table.effect})`),
  ],
);

export type RuntimeDnd35EffectProfile = typeof runtimeDnd35EffectProfiles.$inferSelect;
export type NewRuntimeDnd35EffectProfile = typeof runtimeDnd35EffectProfiles.$inferInsert;
