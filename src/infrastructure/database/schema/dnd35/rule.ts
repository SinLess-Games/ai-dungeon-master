import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { contentColumns, contentChecks } from "./contentReference";
import { booleanCheck, enumCheck, jsonCheck, nonEmpty } from "./schemaUtils";
import type { JsonValue } from "./primitives";

export const ruleKinds = ["rule", "procedure", "subsystem", "table", "guidance"] as const;
export type RuleKind = (typeof ruleKinds)[number];

/**
 * Source-backed rules that do not naturally belong to a more specific entity table.
 *
 * This is intentionally a catalog/index layer rather than an executable rules DSL.
 * Deterministic engine code can consume structured `mechanics`, while irregular or
 * DM-facing procedures remain source-cited rules text instead of being flattened into
 * inaccurate hard-coded logic.
 */
export const rules = sqliteTable(
  "dnd35_rules",
  {
    ...contentColumns(),
    category: text("category").notNull(),
    kind: text("kind", { enum: ruleKinds }).notNull().default("rule"),
    isVariant: integer("is_variant", { mode: "boolean" }).notNull().default(false),
    defaultEnabled: integer("default_enabled", { mode: "boolean" }).notNull().default(true),
    /** Optional canonical parent/superseded rule slugs, resolved at the service layer. */
    parentSlug: text("parent_slug"),
    supersedesSlug: text("supersedes_slug"),
    /** Search/retrieval tags and a small structured payload for deterministic consumers. */
    tags: text("tags", { mode: "json" }).$type<string[]>(),
    mechanics: text("mechanics", { mode: "json" }).$type<Record<string, JsonValue>>(),
  },
  (t) => [
    ...contentChecks("dnd35_rules", t),
    index("dnd35_rules_category_idx").on(t.category),
    index("dnd35_rules_kind_idx").on(t.kind),
    index("dnd35_rules_parent_slug_idx").on(t.parentSlug),
    index("dnd35_rules_supersedes_slug_idx").on(t.supersedesSlug),
    nonEmpty("dnd35_rules_category_nonempty", t.category),
    enumCheck("dnd35_rules_kind_valid", t.kind, ruleKinds),
    booleanCheck("dnd35_rules_variant_bool", t.isVariant),
    booleanCheck("dnd35_rules_default_enabled_bool", t.defaultEnabled),
    jsonCheck("dnd35_rules_tags_json", t.tags, "array"),
    jsonCheck("dnd35_rules_mechanics_json", t.mechanics),
  ],
);

export type Rule = typeof rules.$inferSelect;
export type NewRule = typeof rules.$inferInsert;
