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

const ALWAYS_STACKING_BONUS_TYPES = new Set(["circumstance", "dodge", "untyped", "unnamed"]);

function normalizeKind(kind: string): string {
  const normalized = kind.trim().toLowerCase();
  if (!normalized) throw new RangeError("Modifier kind cannot be empty.");
  return normalized;
}

function validateModifier(modifier: Dnd35Modifier): void {
  if (!modifier.id.trim()) throw new RangeError("Modifier id cannot be empty.");
  if (!modifier.source.trim()) throw new RangeError("Modifier source cannot be empty.");
  normalizeKind(modifier.kind);
  if (!Number.isFinite(modifier.value)) {
    throw new RangeError(`Modifier ${modifier.id} value must be finite.`);
  }
}

/**
 * Resolve the default D&D 3.5 stacking rule.
 *
 * Positive bonuses of the same type overlap; only the highest applies. Dodge,
 * circumstance, and untyped/unnamed bonuses stack. Penalties stack unless a
 * specific rules effect says otherwise. Exceptional effects may explicitly
 * request `stack` or `overlap`.
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
  const overlappingPositiveGroups = new Map<string, Dnd35Modifier[]>();

  for (const modifier of input) {
    if (modifier.enabled === false) continue;

    const kind = normalizeKind(modifier.kind);
    const stacks =
      modifier.stacking === "stack" ||
      (modifier.stacking !== "overlap" && ALWAYS_STACKING_BONUS_TYPES.has(kind));

    // D&D penalties normally stack. Zero-value entries are harmless and retained
    // for auditability. Explicit `overlap` can still force overlap behavior.
    if ((modifier.value <= 0 && modifier.stacking !== "overlap") || stacks) {
      selectedIds.add(modifier.id);
      continue;
    }

    const group = overlappingPositiveGroups.get(kind);
    if (group) group.push(modifier);
    else overlappingPositiveGroups.set(kind, [modifier]);
  }

  for (const group of overlappingPositiveGroups.values()) {
    let best = group[0];
    for (const modifier of group.slice(1)) {
      if (best === undefined || modifier.value > best.value) best = modifier;
    }
    if (best) selectedIds.add(best.id);
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
