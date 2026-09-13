import { describe, expect, it } from "vitest";
import { buildSeedBatch, normalizeD1SeedSql } from "../../scripts/seed-content.mjs";

describe("D1 seed SQL normalization", () => {
  it("converts TEMP and TEMPORARY staging tables to regular tables", () => {
    const source = [
      "CREATE TEMP TABLE _first (id TEXT);",
      "CREATE TEMPORARY TABLE _second (id TEXT);",
      "DROP TABLE _second;",
      "DROP TABLE _first;",
    ].join("\n");

    const normalized = normalizeD1SeedSql(source);

    expect(normalized).toContain("CREATE TABLE _first");
    expect(normalized).toContain("CREATE TABLE _second");
    expect(normalized).not.toMatch(/\bCREATE\s+(?:TEMP|TEMPORARY)\s+TABLE\b/iu);
  });

  it("writes only D1-compatible staging-table statements to the executable batch", () => {
    const batch = buildSeedBatch(
      "CREATE TEMP TABLE _seed_stage (value TEXT);\nDROP TABLE _seed_stage;",
      "dnd3-5/test/00.sql",
      "deadbeef",
    );

    expect(batch).toContain("CREATE TABLE _seed_stage");
    expect(batch).not.toContain("CREATE TEMP TABLE");
    expect(batch).toContain("UPDATE codex_seed_history SET status = 'applied'");
  });
});
