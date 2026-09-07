export interface Dnd35Modifier {
  id: string;
  source: string;
  kind: string;
  value: number;
  enabled?: boolean;
  /** Override normal type behavior for exceptional rules text. */
  stacking?: "stack" | "overlap";
}

export interface ResolvedDnd35Modifier extends Dnd35Modifier {
  selected: boolean;
  reason: "selected" | "disabled" | "overlapped";
}

export interface Dnd35ModifierResolution {
  base: number;
  modifierTotal: number;
  total: number;
  modifiers: readonly ResolvedDnd35Modifier[];
}

const ALWAYS_STACKING_MODIFIER_TYPES = new Set(["circumstance", "dodge", "untyped", "unnamed"]);

/** Normalize persisted snake_case bonus types and runtime kebab-case aliases. */
export function normalizeDnd35ModifierKind(kind: string): string {
  const normalized = kind.trim().toLowerCase().replaceAll("_", "-");
  if (!normalized) throw new RangeError("Modifier kind cannot be empty.");
  return normalized;
}

function validateModifier(modifier: Dnd35Modifier): void {
  if (!modifier.id.trim()) throw new RangeError("Modifier id cannot be empty.");
  if (!modifier.source.trim()) throw new RangeError("Modifier source cannot be empty.");
  normalizeDnd35ModifierKind(modifier.kind);
  if (!Number.isFinite(modifier.value)) {
    throw new RangeError(`Modifier ${modifier.id} value must be finite.`);
  }
}

function selectBestPositive(group: readonly Dnd35Modifier[]): Dnd35Modifier | undefined {
  let best: Dnd35Modifier | undefined;
  for (const modifier of group) {
    if (modifier.value <= 0) continue;
    if (!best || modifier.value > best.value) best = modifier;
  }
  return best;
}

function selectWorstPenalty(group: readonly Dnd35Modifier[]): Dnd35Modifier | undefined {
  let worst: Dnd35Modifier | undefined;
  for (const modifier of group) {
    if (modifier.value >= 0) continue;
    if (!worst || modifier.value < worst.value) worst = modifier;
  }
  return worst;
}

/**
 * Resolve the default D&D 3.5 stacking rules.
 *
 * Typed modifiers that do not stack keep the best positive bonus and the worst
 * penalty of that type. Dodge, circumstance, and untyped/unnamed modifiers
 * normally stack, while exceptional rules text can explicitly force either
 * stacking or overlap behavior.
 *
 * Callers should avoid emitting duplicate untyped/circumstance modifiers from
 * the same underlying source; the content/effect layer owns same-source
 * deduplication because display `source` text is not a stable source identity.
 */
export function resolveDnd35Modifiers(
  input: readonly Dnd35Modifier[],
  base = 0,
): Dnd35ModifierResolution {
  if (!Number.isFinite(base)) throw new RangeError("Modifier base must be finite.");

  const seenIds = new Set<string>();
  for (const modifier of input) {
    validateModifier(modifier);
    if (seenIds.has(modifier.id)) throw new Error(`Duplicate modifier id: ${modifier.id}`);
    seenIds.add(modifier.id);
  }

  const selectedIds = new Set<string>();
  const overlapGroups = new Map<string, Dnd35Modifier[]>();

  for (const modifier of input) {
    if (modifier.enabled === false) continue;

    const kind = normalizeDnd35ModifierKind(modifier.kind);
    const stacksByDefault = ALWAYS_STACKING_MODIFIER_TYPES.has(kind);
    const stacks = modifier.stacking === "stack" || (modifier.stacking !== "overlap" && stacksByDefault);

    if (stacks || modifier.value === 0) {
      selectedIds.add(modifier.id);
      continue;
    }

    const group = overlapGroups.get(kind);
    if (group) group.push(modifier);
    else overlapGroups.set(kind, [modifier]);
  }

  for (const group of overlapGroups.values()) {
    const bestPositive = selectBestPositive(group);
    const worstPenalty = selectWorstPenalty(group);
    if (bestPositive) selectedIds.add(bestPositive.id);
    if (worstPenalty) selectedIds.add(worstPenalty.id);
  }

  const modifiers: ResolvedDnd35Modifier[] = input.map((modifier) => {
    if (modifier.enabled === false) return { ...modifier, selected: false, reason: "disabled" };
    const selected = selectedIds.has(modifier.id);
    return { ...modifier, selected, reason: selected ? "selected" : "overlapped" };
  });

  const modifierTotal = modifiers.reduce(
    (sum, modifier) => sum + (modifier.selected ? modifier.value : 0),
    0,
  );

  return { base, modifierTotal, total: base + modifierTotal, modifiers };
}
