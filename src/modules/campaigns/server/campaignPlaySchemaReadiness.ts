/// <reference types="@cloudflare/workers-types" />

const REQUIRED_STRUCTURED_DM_TABLES = [
  "campaign_dm_actions",
  "runtime_dnd35_alignment_states",
] as const;

export interface CampaignPlaySchemaReadiness {
  dmActions: boolean;
  initiativeActions: boolean;
  alignmentTracking: boolean;
  structuredDm: boolean;
  missingTables: string[];
}

/**
 * Detects whether the migrations required by the structured AI-DM play loop
 * are present in the active D1 database. Deploying Worker code does not apply
 * D1 migrations automatically, so production can temporarily lag the code.
 *
 * Keep this check read-only and cheap: it is used to degrade campaign chat to
 * narration instead of turning a schema mismatch into a generic 500 response.
 */
export async function loadCampaignPlaySchemaReadiness(
  binding: D1Database,
): Promise<CampaignPlaySchemaReadiness> {
  const result = await binding
    .prepare(
      `SELECT name, sql
       FROM sqlite_master
       WHERE type = 'table'
         AND name IN (?, ?)`,
    )
    .bind(...REQUIRED_STRUCTURED_DM_TABLES)
    .all<{ name: string; sql: string | null }>();

  const available = new Map(result.results.map((row) => [row.name, row.sql]));
  const dmActions = available.has("campaign_dm_actions");
  const dmActionSql = available.get("campaign_dm_actions") ?? "";
  const initiativeActions =
    dmActions && typeof dmActionSql === "string" && dmActionSql.includes("'check.initiative'");
  const alignmentTracking = available.has("runtime_dnd35_alignment_states");
  const missingTables = REQUIRED_STRUCTURED_DM_TABLES.filter(
    (table) => !available.has(table),
  );

  return {
    dmActions,
    initiativeActions,
    alignmentTracking,
    structuredDm: dmActions && initiativeActions && alignmentTracking,
    missingTables: [...missingTables],
  };
}
