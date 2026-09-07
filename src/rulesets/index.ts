import { createRulesetRegistry, type RulesetRegistry } from "@/engine";
import { dnd35Ruleset } from "./dnd35";

export * from "./dnd35";

/**
 * Construct the built-in ruleset registry for application/server consumers.
 *
 * Keep this composition root outside `src/engine`: the generic engine knows
 * how to host rulesets, while this package decides which concrete rulesets ship
 * with The Endless Codex.
 */
export function createBuiltInRulesetRegistry(): RulesetRegistry {
  return createRulesetRegistry([dnd35Ruleset]);
}
