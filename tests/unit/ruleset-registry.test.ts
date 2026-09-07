import { describe, expect, it } from "vitest";
import {
  RulesetRegistry,
  createRulesetRegistry,
  rulesetKey,
  type RulesetAdapter,
} from "@/engine";
import {
  DND35_RULESET_ID,
  DND35_RULESET_VERSION,
  createBuiltInRulesetRegistry,
  dnd35Ruleset,
} from "@/rulesets";

describe("ruleset registry", () => {
  it("registers and resolves the built-in D&D 3.5 adapter", () => {
    const registry = createBuiltInRulesetRegistry();

    expect(rulesetKey(DND35_RULESET_ID, DND35_RULESET_VERSION)).toBe("dnd35@3.5");
    expect(registry.has("dnd35", "3.5")).toBe(true);
    expect(registry.versions("dnd35")).toEqual(["3.5"]);
    expect(registry.list().map((entry) => entry.key)).toEqual(["dnd35@3.5"]);

    const result = registry.require("dnd35", "3.5");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.key).toBe("dnd35@3.5");
    expect(result.value.descriptor.name).toBe("Dungeons & Dragons 3.5");
    expect(result.value.descriptor.capabilities).toEqual(
      expect.arrayContaining(["combat", "spellcasting", "psionics", "character-creation"]),
    );
  });

  it("returns a structured failure when a requested ruleset is unavailable", () => {
    const registry = createBuiltInRulesetRegistry();
    const result = registry.require("pathfinder", "1e");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.code).toBe("RULESET_NOT_REGISTERED");
  });

  it("rejects duplicate id/version registrations", () => {
    const registry = new RulesetRegistry();
    registry.register(dnd35Ruleset);

    expect(() => registry.register(dnd35Ruleset)).toThrow("Ruleset already registered: dnd35@3.5");
  });

  it("keeps multiple versions of one ruleset independently addressable", () => {
    const alternate: RulesetAdapter = {
      descriptor: {
        id: "dnd35",
        version: "3.5-homebrew",
        name: "D&D 3.5 Homebrew",
      },
    };
    const registry = createRulesetRegistry([dnd35Ruleset, alternate]);

    expect(registry.versions("dnd35")).toEqual(["3.5", "3.5-homebrew"]);
    expect(registry.get("dnd35", "3.5")?.descriptor.name).toBe("Dungeons & Dragons 3.5");
    expect(registry.get("dnd35", "3.5-homebrew")?.descriptor.name).toBe("D&D 3.5 Homebrew");
  });
});
