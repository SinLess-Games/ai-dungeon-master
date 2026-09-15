/// <reference types="@cloudflare/workers-types" />

/**
 * Read-only catalog access for the AI Dungeon Master.
 *
 * Canonical rules/content live in D1. The model should retrieve those rows when
 * it needs rules text or source-backed entities instead of relying on training
 * memory. Only explicitly whitelisted ruleset tables are queryable here.
 */
export const SYSTEM_CATALOG_CATEGORIES = [
  "all",
  "rule",
  "item",
  "race",
  "class",
  "skill",
  "feat",
  "condition",
  "spell",
  "spell_school",
  "power",
  "power_discipline",
  "deity",
  "domain",
  "language",
  "creature_type",
  "creature_subtype",
  "special_ability",
  "class_feature",
  "template",
  "monster",
] as const;

export type SystemCatalogCategory = (typeof SYSTEM_CATALOG_CATEGORIES)[number];
type ConcreteSystemCatalogCategory = Exclude<SystemCatalogCategory, "all">;

const DND35_TABLES: Record<ConcreteSystemCatalogCategory, string> = {
  rule: "dnd35_rules",
  item: "dnd35_items",
  race: "dnd35_races",
  class: "dnd35_classes",
  skill: "dnd35_skills",
  feat: "dnd35_feats",
  condition: "dnd35_conditions",
  spell: "dnd35_spells",
  spell_school: "dnd35_spell_schools",
  power: "dnd35_powers",
  power_discipline: "dnd35_power_disciplines",
  deity: "dnd35_deities",
  domain: "dnd35_domains",
  language: "dnd35_languages",
  creature_type: "dnd35_creature_types",
  creature_subtype: "dnd35_creature_subtypes",
  special_ability: "dnd35_special_abilities",
  class_feature: "dnd35_class_features",
  template: "dnd35_templates",
  monster: "dnd35_monsters",
};

interface RelatedTable {
  key: string;
  table: string;
  foreignKey: string;
}

const RELATED_TABLES: Partial<Record<ConcreteSystemCatalogCategory, readonly RelatedTable[]>> = {
  item: [
    { key: "weapon", table: "dnd35_weapons", foreignKey: "item_id" },
    { key: "weaponDamage", table: "dnd35_weapon_damage", foreignKey: "weapon_id" },
    { key: "weaponDamageTypes", table: "dnd35_weapon_damage_types", foreignKey: "weapon_id" },
    { key: "armor", table: "dnd35_armors", foreignKey: "item_id" },
    { key: "shield", table: "dnd35_shields", foreignKey: "item_id" },
    { key: "ammunition", table: "dnd35_ammunition", foreignKey: "item_id" },
    { key: "magicItem", table: "dnd35_magic_items", foreignKey: "item_id" },
  ],
  race: [
    { key: "traits", table: "dnd35_race_traits", foreignKey: "race_id" },
    { key: "movements", table: "dnd35_race_movements", foreignKey: "race_id" },
    { key: "subtypes", table: "dnd35_race_subtypes", foreignKey: "race_id" },
  ],
  class: [
    { key: "levels", table: "dnd35_class_levels", foreignKey: "class_id" },
    { key: "skills", table: "dnd35_class_skills", foreignKey: "class_id" },
    { key: "spellcasting", table: "dnd35_class_spellcasting", foreignKey: "class_id" },
  ],
  spell: [
    { key: "classLevels", table: "dnd35_spell_class_levels", foreignKey: "spell_id" },
    { key: "domainLevels", table: "dnd35_spell_domain_levels", foreignKey: "spell_id" },
    { key: "components", table: "dnd35_spell_components", foreignKey: "spell_id" },
    { key: "descriptors", table: "dnd35_spell_descriptor_assignments", foreignKey: "spell_id" },
    { key: "schools", table: "dnd35_spell_school_assignments", foreignKey: "spell_id" },
  ],
  power: [
    { key: "classLevels", table: "dnd35_power_class_levels", foreignKey: "power_id" },
    { key: "displays", table: "dnd35_power_display_assignments", foreignKey: "power_id" },
    { key: "descriptors", table: "dnd35_power_descriptor_assignments", foreignKey: "power_id" },
  ],
  deity: [{ key: "domains", table: "dnd35_deity_domains", foreignKey: "deity_id" }],
  domain: [{ key: "spells", table: "dnd35_spell_domain_levels", foreignKey: "domain_id" }],
  monster: [
    { key: "attacks", table: "dnd35_monster_attacks", foreignKey: "monster_id" },
    { key: "abilities", table: "dnd35_monster_abilities", foreignKey: "monster_id" },
    { key: "movements", table: "dnd35_monster_movements", foreignKey: "monster_id" },
    { key: "skills", table: "dnd35_monster_skills", foreignKey: "monster_id" },
    { key: "feats", table: "dnd35_monster_feats", foreignKey: "monster_id" },
    { key: "templates", table: "dnd35_monster_templates", foreignKey: "monster_id" },
    { key: "subtypes", table: "dnd35_monster_subtypes", foreignKey: "monster_id" },
  ],
};

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "against",
  "also",
  "because",
  "before",
  "could",
  "does",
  "from",
  "have",
  "into",
  "just",
  "like",
  "make",
  "more",
  "should",
  "that",
  "their",
  "there",
  "these",
  "this",
  "through",
  "what",
  "when",
  "where",
  "which",
  "with",
  "would",
  "your",
]);

export interface SystemCatalogEntry {
  category: ConcreteSystemCatalogCategory;
  id: string;
  slug: string;
  name: string;
  description: string;
  rulesText: string;
  sourcePage: string | null;
  isHomebrew: boolean;
  source: {
    id: string;
    name: string;
    abbreviation: string | null;
    system: string;
    edition: string;
  };
  data: Record<string, unknown>;
  related?: Record<string, readonly Record<string, unknown>[]>;
}

export interface SystemCatalogLookupResult {
  kind: "system.catalog.lookup";
  supported: boolean;
  rulesetId: string;
  rulesetVersion: string;
  category: SystemCatalogCategory;
  query: string;
  entries: SystemCatalogEntry[];
  note: string;
}

interface RawCatalogRow extends Record<string, unknown> {
  id: string;
  slug: string;
  name: string;
  description: string;
  rules_text: string;
  source_page: string | null;
  is_homebrew: number | boolean;
  __source_id: string;
  __source_name: string;
  __source_abbreviation: string | null;
  __source_system: string;
  __source_edition: string;
  __match_score: number;
}

function dnd35Ruleset(rulesetId: string): boolean {
  const normalized = rulesetId.trim().toLowerCase().replaceAll("_", "-");
  return normalized === "dnd35" || normalized === "dnd-3.5" || normalized === "dnd3.5";
}

function normalizeEdition(version: string): string {
  const normalized = version.trim().toLowerCase();
  if (normalized.includes("3.5")) return "3.5";
  if (normalized.includes("3.0")) return "3.0";
  return version.trim();
}

/** Exported for focused tests and for one-shot OOC catalog prefetching. */
export function systemCatalogSearchTerms(query: string): string[] {
  const normalized = query
    .toLowerCase()
    .replace(/[^a-z0-9.+_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return [];

  const tokens = normalized
    .split(" ")
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
  const terms = new Set<string>();
  if (normalized.length <= 100) terms.add(normalized);
  for (const token of tokens) {
    terms.add(token);
    // Prefix fragments make natural-language questions such as "grappling"
    // retrieve source rows containing "grapple" without a vector dependency.
    if (token.length >= 7) terms.add(token.slice(0, 5));
    if (terms.size >= 8) break;
  }
  return [...terms].slice(0, 8);
}

function maybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) return value;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

function sanitizeData(row: Record<string, unknown>): Record<string, unknown> {
  const excluded = new Set([
    "id",
    "slug",
    "name",
    "description",
    "rules_text",
    "source_id",
    "source_page",
    "owner_user_id",
    "is_homebrew",
    "is_enabled",
    "created_at",
    "updated_at",
  ]);
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (excluded.has(key) || key.startsWith("__")) continue;
    data[key] = maybeJson(value);
  }
  return data;
}

function missingTable(error: unknown): boolean {
  return error instanceof Error && /no such table/i.test(error.message);
}

async function loadRelated(
  binding: D1Database,
  category: ConcreteSystemCatalogCategory,
  id: string,
): Promise<Record<string, readonly Record<string, unknown>[]> | undefined> {
  const definitions = RELATED_TABLES[category];
  if (!definitions?.length) return undefined;
  const related: Record<string, readonly Record<string, unknown>[]> = {};
  for (const definition of definitions) {
    try {
      const result = await binding
        .prepare(`SELECT * FROM ${definition.table} WHERE ${definition.foreignKey} = ? LIMIT 100`)
        .bind(id)
        .all<Record<string, unknown>>();
      if (result.results.length) {
        related[definition.key] = result.results.map((row) => sanitizeData(row));
      }
    } catch (error) {
      if (!missingTable(error)) throw error;
    }
  }
  return Object.keys(related).length ? related : undefined;
}

async function searchCategory(input: {
  binding: D1Database;
  category: ConcreteSystemCatalogCategory;
  query: string;
  userId: string;
  edition: string;
  limit: number;
}): Promise<Array<SystemCatalogEntry & { __score: number }>> {
  const table = DND35_TABLES[input.category];
  const terms = systemCatalogSearchTerms(input.query);
  if (!terms.length) return [];

  const normalized = input.query.trim().toLowerCase();
  const patterns = terms.map((term) => `%${term}%`);
  const searchable =
    "lower(coalesce(c.id,'') || ' ' || coalesce(c.slug,'') || ' ' || coalesce(c.name,'') || ' ' || coalesce(c.description,'') || ' ' || coalesce(c.rules_text,''))";
  const searchClause = patterns.map(() => `${searchable} LIKE ?`).join(" OR ");
  const sql = `SELECT c.*,
                      s.id AS __source_id,
                      s.name AS __source_name,
                      s.abbreviation AS __source_abbreviation,
                      s.system AS __source_system,
                      s.edition AS __source_edition,
                      CASE
                        WHEN lower(c.name) = ? THEN 0
                        WHEN lower(c.slug) = ? THEN 0
                        WHEN lower(c.name) LIKE ? THEN 1
                        WHEN lower(c.slug) LIKE ? THEN 1
                        ELSE 2
                      END AS __match_score
               FROM ${table} c
               JOIN dnd35_sources s ON s.id = c.source_id
               WHERE c.is_enabled = 1
                 AND (c.owner_user_id IS NULL OR c.owner_user_id = ?)
                 AND (s.owner_user_id IS NULL OR s.owner_user_id = ?)
                 AND s.system = 'dnd'
                 AND s.edition = ?
                 AND (${searchClause})
               ORDER BY __match_score ASC, c.name COLLATE NOCASE ASC, c.slug ASC
               LIMIT ?`;
  let result: D1Result<RawCatalogRow>;
  try {
    result = await input.binding
      .prepare(sql)
      .bind(
        normalized,
        normalized,
        `%${normalized}%`,
        `%${normalized}%`,
        input.userId,
        input.userId,
        input.edition,
        ...patterns,
        input.limit,
      )
      .all<RawCatalogRow>();
  } catch (error) {
    if (missingTable(error)) return [];
    throw error;
  }

  const entries: Array<SystemCatalogEntry & { __score: number }> = [];
  for (const row of result.results) {
    const related = await loadRelated(input.binding, input.category, row.id);
    entries.push({
      category: input.category,
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      rulesText: row.rules_text,
      sourcePage: row.source_page,
      isHomebrew: Boolean(row.is_homebrew),
      source: {
        id: row.__source_id,
        name: row.__source_name,
        abbreviation: row.__source_abbreviation,
        system: row.__source_system,
        edition: row.__source_edition,
      },
      data: sanitizeData(row),
      ...(related ? { related } : {}),
      __score: Number(row.__match_score) || 0,
    });
  }
  return entries;
}

export async function lookupSystemCatalog(input: {
  binding: D1Database;
  rulesetId: string;
  rulesetVersion: string;
  userId: string;
  category: SystemCatalogCategory;
  query: string;
  limit?: number;
}): Promise<SystemCatalogLookupResult> {
  const limit = Math.max(1, Math.min(12, Math.trunc(input.limit ?? 8)));
  const query = input.query.trim().slice(0, 240);
  if (!dnd35Ruleset(input.rulesetId)) {
    return {
      kind: "system.catalog.lookup",
      supported: false,
      rulesetId: input.rulesetId,
      rulesetVersion: input.rulesetVersion,
      category: input.category,
      query,
      entries: [],
      note: "This ruleset does not yet expose a database catalog adapter to the AI DM.",
    };
  }

  const edition = normalizeEdition(input.rulesetVersion);
  const categories: ConcreteSystemCatalogCategory[] =
    input.category === "all"
      ? (SYSTEM_CATALOG_CATEGORIES.filter(
          (category): category is ConcreteSystemCatalogCategory => category !== "all",
        ) as ConcreteSystemCatalogCategory[])
      : [input.category];
  const perCategoryLimit = input.category === "all" ? 2 : limit;
  const groups = await Promise.all(
    categories.map((category) =>
      searchCategory({
        binding: input.binding,
        category,
        query,
        userId: input.userId,
        edition,
        limit: perCategoryLimit,
      }),
    ),
  );

  const ranked = groups
    .flat()
    .sort((a, b) => a.__score - b.__score || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map(({ __score: _score, ...entry }) => entry);

  return {
    kind: "system.catalog.lookup",
    supported: true,
    rulesetId: input.rulesetId,
    rulesetVersion: input.rulesetVersion,
    category: input.category,
    query,
    entries: ranked,
    note:
      "These are source-backed database rows for DM reference. Catalog text informs adjudication, but only deterministic game commands may mutate authoritative game state.",
  };
}
