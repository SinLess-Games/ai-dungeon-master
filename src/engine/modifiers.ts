export type ModifierStackingMode =
  | "sum"
  | "highest"
  | "lowest"
  | "highest-absolute"
  | "first";

export interface Modifier<Kind extends string = string> {
  id: string;
  source: string;
  kind: Kind;
  value: number;
  enabled?: boolean;
}

export interface ResolveModifiersOptions<Kind extends string> {
  base?: number;
  defaultMode?: ModifierStackingMode;
  rules?: Partial<Record<Kind, ModifierStackingMode>>;
}

export interface ResolvedModifier<Kind extends string> extends Modifier<Kind> {
  selected: boolean;
}

export interface ModifierResolution<Kind extends string> {
  base: number;
  modifierTotal: number;
  total: number;
  modifiers: readonly ResolvedModifier<Kind>[];
}

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite.`);
  }
}

function selectIndices(
  values: readonly number[],
  mode: ModifierStackingMode,
): ReadonlySet<number> {
  if (values.length === 0) {
    return new Set<number>();
  }

  if (mode === "sum") {
    return new Set(values.map((_, index) => index));
  }

  if (mode === "first") {
    return new Set([0]);
  }

  let selectedIndex = 0;

  for (let index = 1; index < values.length; index += 1) {
    const current = values[index];
    const selected = values[selectedIndex];

    if (current === undefined || selected === undefined) {
      continue;
    }

    const replace =
      mode === "highest"
        ? current > selected
        : mode === "lowest"
          ? current < selected
          : Math.abs(current) > Math.abs(selected);

    if (replace) {
      selectedIndex = index;
    }
  }

  return new Set([selectedIndex]);
}

/**
 * Resolve a set of numeric modifiers without encoding any particular game
 * system's stacking rules.
 *
 * A ruleset supplies the stacking mode for each modifier kind. This keeps
 * concepts such as D&D bonus types out of the generic engine while still
 * providing a reusable and auditable resolution pipeline.
 */
export function resolveModifiers<Kind extends string>(
  input: readonly Modifier<Kind>[],
  options: ResolveModifiersOptions<Kind> = {},
): ModifierResolution<Kind> {
  const base = options.base ?? 0;
  const defaultMode = options.defaultMode ?? "sum";

  assertFinite(base, "Modifier base");

  const seenIds = new Set<string>();
  const active = input.filter((modifier) => modifier.enabled !== false);

  for (const modifier of input) {
    if (seenIds.has(modifier.id)) {
      throw new Error(`Duplicate modifier id: ${modifier.id}`);
    }

    seenIds.add(modifier.id);
    assertFinite(modifier.value, `Modifier ${modifier.id}`);
  }

  const grouped = new Map<Kind, Modifier<Kind>[]>();

  for (const modifier of active) {
    const group = grouped.get(modifier.kind);

    if (group) {
      group.push(modifier);
    } else {
      grouped.set(modifier.kind, [modifier]);
    }
  }

  const selectedIds = new Set<string>();

  for (const [kind, group] of grouped) {
    const mode = options.rules?.[kind] ?? defaultMode;
    const selected = selectIndices(
      group.map((modifier) => modifier.value),
      mode,
    );

    for (const index of selected) {
      const modifier = group[index];

      if (modifier) {
        selectedIds.add(modifier.id);
      }
    }
  }

  const modifiers: ResolvedModifier<Kind>[] = input.map((modifier) => ({
    ...modifier,
    selected: modifier.enabled !== false && selectedIds.has(modifier.id),
  }));

  const modifierTotal = modifiers.reduce(
    (total, modifier) => total + (modifier.selected ? modifier.value : 0),
    0,
  );

  return {
    base,
    modifierTotal,
    total: base + modifierTotal,
    modifiers,
  };
}
