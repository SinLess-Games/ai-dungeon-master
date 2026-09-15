import { describe, expect, it } from "vitest";
import {
  lookupSystemCatalog,
  SYSTEM_CATALOG_CATEGORIES,
  systemCatalogSearchTerms,
} from "@/modules/campaigns/server/dmSystemCatalog";

describe("AI DM system catalog access", () => {
  it("extracts useful lexical terms for source-backed rule lookup", () => {
    const terms = systemCatalogSearchTerms("How does grappling work against a prone creature?");
    expect(terms).toContain("grappling");
    expect(terms).toContain("grapp");
    expect(terms).toContain("prone");
    expect(terms).not.toContain("does");
    expect(terms.length).toBeLessThanOrEqual(8);
  });

  it("exposes the major D&D catalog families to the reference planner", () => {
    expect(SYSTEM_CATALOG_CATEGORIES).toEqual(
      expect.arrayContaining([
        "rule",
        "item",
        "race",
        "class",
        "skill",
        "feat",
        "condition",
        "spell",
        "power",
        "deity",
        "domain",
        "template",
        "monster",
      ]),
    );
  });

  it("does not query D&D tables for a ruleset without a catalog adapter", async () => {
    const prepare = () => {
      throw new Error("Database should not be touched for an unsupported system.");
    };
    const result = await lookupSystemCatalog({
      binding: { prepare } as unknown as D1Database,
      rulesetId: "pathfinder2e",
      rulesetVersion: "2e",
      userId: "user-1",
      category: "all",
      query: "grapple",
    });

    expect(result.supported).toBe(false);
    expect(result.entries).toEqual([]);
  });
});
