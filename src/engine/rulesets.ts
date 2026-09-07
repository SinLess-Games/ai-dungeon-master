import { engineFailure, engineSuccess, type EngineResult } from "./result";

export interface RulesetDescriptor {
  id: string;
  version: string;
  name: string;
  capabilities?: readonly string[];
}

export interface RulesetAdapter<Context = unknown> {
  descriptor: RulesetDescriptor;
  createContext?: () => Context;
}

export interface RegisteredRuleset<Context = unknown> extends RulesetAdapter<Context> {
  key: string;
}

function normalizeToken(value: string, name: string): string {
  const normalized = value.trim();
  if (!normalized) throw new RangeError(`${name} cannot be empty.`);
  return normalized;
}

export function rulesetKey(id: string, version: string): string {
  return `${normalizeToken(id, "Ruleset id")}@${normalizeToken(version, "Ruleset version")}`;
}

export class RulesetRegistry {
  private readonly entries = new Map<string, RegisteredRuleset>();
  private readonly versionsById = new Map<string, Set<string>>();

  register<Context>(adapter: RulesetAdapter<Context>): RegisteredRuleset<Context> {
    const id = normalizeToken(adapter.descriptor.id, "Ruleset id");
    const version = normalizeToken(adapter.descriptor.version, "Ruleset version");
    const name = normalizeToken(adapter.descriptor.name, "Ruleset name");
    const key = rulesetKey(id, version);
    if (this.entries.has(key)) throw new Error(`Ruleset already registered: ${key}`);

    const entry: RegisteredRuleset<Context> = {
      ...adapter,
      key,
      descriptor: {
        id,
        version,
        name,
        ...(adapter.descriptor.capabilities
          ? { capabilities: [...adapter.descriptor.capabilities] }
          : {}),
      },
    };
    this.entries.set(key, entry as RegisteredRuleset);
    const versions = this.versionsById.get(id) ?? new Set<string>();
    versions.add(version);
    this.versionsById.set(id, versions);
    return entry;
  }

  has(id: string, version: string): boolean {
    return this.entries.has(rulesetKey(id, version));
  }

  get(id: string, version: string): RegisteredRuleset | undefined {
    return this.entries.get(rulesetKey(id, version));
  }

  require(id: string, version: string): EngineResult<RegisteredRuleset> {
    const key = rulesetKey(id, version);
    const entry = this.entries.get(key);
    return entry
      ? engineSuccess(entry)
      : engineFailure("RULESET_NOT_REGISTERED", `Ruleset ${key} is not registered.`);
  }

  list(): readonly RegisteredRuleset[] {
    return [...this.entries.values()].sort((left, right) => left.key.localeCompare(right.key));
  }

  versions(id: string): readonly string[] {
    const normalized = normalizeToken(id, "Ruleset id");
    return [...(this.versionsById.get(normalized) ?? [])].sort();
  }
}

export function createRulesetRegistry(
  adapters: readonly RulesetAdapter[] = [],
): RulesetRegistry {
  const registry = new RulesetRegistry();
  for (const adapter of adapters) registry.register(adapter);
  return registry;
}
