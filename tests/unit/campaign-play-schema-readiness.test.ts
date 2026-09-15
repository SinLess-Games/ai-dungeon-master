import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";
import { findPendingDmAction } from "@/modules/campaigns/server/dmActionService";
import { loadCampaignPlaySchemaReadiness } from "@/modules/campaigns/server/campaignPlaySchemaReadiness";
import { createSqliteD1 } from "../helpers/sqliteD1";

const databases: DatabaseSync[] = [];

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function database() {
  const sqlite = new DatabaseSync(":memory:");
  databases.push(sqlite);
  return { sqlite, binding: createSqliteD1(sqlite) };
}

describe("campaign play schema readiness", () => {
  it("reports structured DM migrations independently", async () => {
    const { sqlite, binding } = database();

    await expect(loadCampaignPlaySchemaReadiness(binding)).resolves.toEqual({
      dmActions: false,
      alignmentTracking: false,
      structuredDm: false,
      missingTables: ["campaign_dm_actions", "runtime_dnd35_alignment_states"],
    });

    sqlite.exec("CREATE TABLE campaign_dm_actions (id TEXT PRIMARY KEY)");
    await expect(loadCampaignPlaySchemaReadiness(binding)).resolves.toEqual({
      dmActions: true,
      alignmentTracking: false,
      structuredDm: false,
      missingTables: ["runtime_dnd35_alignment_states"],
    });

    sqlite.exec("CREATE TABLE runtime_dnd35_alignment_states (character_id TEXT PRIMARY KEY)");
    await expect(loadCampaignPlaySchemaReadiness(binding)).resolves.toEqual({
      dmActions: true,
      alignmentTracking: true,
      structuredDm: true,
      missingTables: [],
    });
  });

  it("treats a missing DM-action migration as no pending action instead of throwing", async () => {
    const { binding } = database();

    await expect(findPendingDmAction(binding, "campaign-1", "user-1")).resolves.toBeNull();
  });
});
