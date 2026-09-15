import { dmSystemReferenceUserPrompt } from "@/prompts/dmSystemReferenceUser";
import { dmSystemReferenceSystemPrompt } from "@/prompts/dmSystemReferenceSystem";
import { z } from "zod";
import {
  generateOpenAICompatibleText,
  type OpenAICompatibleEnv,
} from "@/infrastructure/ai/openaiCompatible";
import {
  lookupSystemCatalog,
  SYSTEM_CATALOG_CATEGORIES,
  type SystemCatalogLookupResult,
} from "./dmSystemCatalog";

const lookupSchema = z.object({
  category: z.enum(SYSTEM_CATALOG_CATEGORIES),
  query: z.string().trim().min(1).max(240),
  limit: z.number().int().min(1).max(12).optional(),
});

const planSchema = z.object({
  lookups: z.array(lookupSchema).max(4),
});

function extractJsonObject(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  return first >= 0 && last > first ? trimmed.slice(first, last + 1) : trimmed;
}

function dnd35CatalogSupported(rulesetId: string): boolean {
  const normalized = rulesetId.trim().toLowerCase().replaceAll("_", "-");
  return normalized === "dnd35" || normalized === "dnd-3.5" || normalized === "dnd3.5";
}

async function systemCatalogReady(binding: D1Database): Promise<boolean> {
  try {
    const result = await binding
      .prepare(
        `SELECT count(*) AS count
         FROM sqlite_master
         WHERE type = 'table' AND name IN ('dnd35_sources', 'dnd35_rules')`,
      )
      .first<{ count: number }>();
    return Number(result?.count ?? 0) === 2;
  } catch {
    return false;
  }
}

export interface DmSystemReferenceInput {
  signal?: AbortSignal;
  env: OpenAICompatibleEnv;
  binding: D1Database;
  userId: string;
  rulesetId: string;
  rulesetVersion: string;
  campaignName: string;
  campaignDescription: string | null;
  playerText: string;
  conversation?: string;
}

/**
 * Lets a small AI planning pass decide which source-backed D1 catalog rows the
 * DM needs before the actual turn planner/narrator answers.
 *
 * The model never receives SQL access or table names. It selects only from a
 * fixed catalog-category enum; the server performs bounded, ownership-filtered,
 * edition-filtered reads. A failed planning pass falls back to lexical retrieval
 * from the player's text so catalog access degrades safely rather than vanishing.
 */
export async function loadDmSystemReferences(
  input: DmSystemReferenceInput,
): Promise<SystemCatalogLookupResult[]> {
  if (!dnd35CatalogSupported(input.rulesetId) || !input.playerText.trim()) return [];
  if (!(await systemCatalogReady(input.binding))) return [];

  let planned: z.infer<typeof planSchema> | null = null;
  try {
    const response = await generateOpenAICompatibleText(input.env, {
      ...(input.signal ? { signal: input.signal } : {}),
      system: dmSystemReferenceSystemPrompt(input),
      prompt: dmSystemReferenceUserPrompt(input),
      temperature: 0,
      maxTokens: 350,
      ...(input.env.AI && input.env.AI_GAME_MODEL ? { model: input.env.AI_GAME_MODEL } : {}),
    });
    planned = planSchema.parse(JSON.parse(extractJsonObject(response)) as unknown);
  } catch (error) {
    console.warn("AI DM system-reference planning failed; using lexical fallback", {
      rulesetId: input.rulesetId,
      error,
    });
  }

  const lookups = planned?.lookups.length
    ? planned.lookups
    : [{ category: "all" as const, query: input.playerText.slice(0, 240), limit: 8 }];

  const results: SystemCatalogLookupResult[] = [];
  const seen = new Set<string>();
  for (const lookup of lookups) {
    const key = `${lookup.category}:${lookup.query.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      results.push(
        await lookupSystemCatalog({
          binding: input.binding,
          rulesetId: input.rulesetId,
          rulesetVersion: input.rulesetVersion,
          userId: input.userId,
          category: lookup.category,
          query: lookup.query,
          ...(lookup.limit === undefined ? {} : { limit: lookup.limit }),
        }),
      );
    } catch (error) {
      console.error("AI DM system catalog lookup failed", {
        rulesetId: input.rulesetId,
        category: lookup.category,
        query: lookup.query,
        error,
      });
    }
  }
  return results.filter((result) => result.entries.length > 0);
}

export function serializeDmSystemReferences(results: readonly SystemCatalogLookupResult[]): string {
  return JSON.stringify(results).slice(0, 30_000);
}
