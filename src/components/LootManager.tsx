import { useMemo, useState } from "react";
import { ArrowRightLeft, Coins, History, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { listCharacters, saveCharacter } from "@/lib/storage";
import {
  LOOT_LOCATIONS,
  addItem,
  moveItem,
  newItem,
  planEqualSplit,
  removeItem,
  splitGold,
  totalValue,
  totalWeight,
  transferItem,
  updateItem,
} from "@/lib/loot";
import type { Character, InventoryItem, LootLocation } from "@/lib/rules/character";

interface Props {
  character: Character;
  onChange: (next: Character) => void;
}

export function LootManager({ character, onChange }: Props) {
  const [draft, setDraft] = useState({ name: "", quantity: 1, weight: 0, cost: 0, container: "", note: "" });
  const [addTo, setAddTo] = useState<LootLocation>("person");
  const [shareIds, setShareIds] = useState<string[]>([]);

  const others = useMemo(
    () => listCharacters().filter((c) => c.id !== character.id),
    [character.id],
  );

  const byLocation = (loc: LootLocation) => character.inventory.filter((i) => i.location === loc);

  function handleAdd() {
    if (!draft.name.trim()) return;
    const item = newItem({
      name: draft.name.trim(),
      quantity: Math.max(1, Number(draft.quantity) || 1),
      weight: Number(draft.weight) || 0,
      cost: Number(draft.cost) || 0,
      location: addTo,
      ...(addTo === "stored" && draft.container.trim() ? { container: draft.container.trim() } : {}),
      ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
    });
    onChange(addItem(character, item));
    setDraft({ name: "", quantity: 1, weight: 0, cost: 0, container: draft.container, note: "" });
    toast.success(`${item.name} added to ${addTo === "person" ? "your pack" : addTo === "stored" ? "storage" : "the party pool"}`);
  }

  function handleGive(item: InventoryItem, heroId: string) {
    const hero = others.find((o) => o.id === heroId);
    if (!hero) return undefined;
    const { from, to } = transferItem(character, hero, item.id);
    saveCharacter(to);
    onChange(from);
    toast.success(`${item.name} handed to ${to.name || "your ally"}`);
  }

  function handleEqualSplit() {
    const pool = byLocation("party");
    if (pool.length === 0) {
      toast.error("The party pool is empty.");
      return;
    }
    const heroes = [character, ...others.filter((o) => shareIds.includes(o.id))];
    if (heroes.length < 2) {
      toast.error("Pick at least one other hero to share with.");
      return;
    }

    const plan = planEqualSplit(pool, heroes.map((h) => h.id));
    let self = character;

    for (const hero of heroes) {
      const allocation = plan.get(hero.id) ?? [];
      if (hero.id === character.id) {
        for (const a of allocation) self = moveItem(self, a.itemId, "person", { quantity: a.quantity });
        continue;
      }
      let target = hero;
      for (const a of allocation) {
        const res = transferItem(self, target, a.itemId, a.quantity);
        self = res.from;
        target = res.to;
      }
      saveCharacter(target);
    }

    // Gold splits with the same shares; the remainder stays with the holder.
    const { each } = splitGold(self.gold, heroes.length);
    if (each > 0) {
      for (const hero of heroes) {
        if (hero.id === character.id) continue;
        const fresh = listCharacters().find((c) => c.id === hero.id);
        if (fresh) saveCharacter({ ...fresh, gold: fresh.gold + each });
      }
      self = { ...self, gold: self.gold - each * (heroes.length - 1) };
    }

    onChange(self);
    toast.success(`Split the party pool between ${heroes.length} heroes.`);
  }

  return (
    <div className="space-y-4">
      <Card className="card-etched bg-card/70">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="size-4" /> Add loot
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <Label className="text-xs">Item</Label>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Masterwork longsword" />
          </div>
          <div>
            <Label className="text-xs">Qty</Label>
            <Input type="number" min={1} value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">Weight (lb)</Label>
            <Input type="number" min={0} step="0.1" value={draft.weight} onChange={(e) => setDraft({ ...draft, weight: Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">Value (gp)</Label>
            <Input type="number" min={0} step="0.1" value={draft.cost} onChange={(e) => setDraft({ ...draft, cost: Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">Pool</Label>
            <Select value={addTo} onValueChange={(v) => setAddTo(v as LootLocation)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOOT_LOCATIONS.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {addTo === "stored" ? (
            <div className="sm:col-span-3">
              <Label className="text-xs">Stash / container</Label>
              <Input value={draft.container} onChange={(e) => setDraft({ ...draft, container: e.target.value })} placeholder="Wagon, vault, pack mule…" />
            </div>
          ) : null}
          <div className={addTo === "stored" ? "sm:col-span-2" : "sm:col-span-5"}>
            <Label className="text-xs">Where it came from</Label>
            <Input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="Looted from the hobgoblin captain" />
          </div>
          <div className="flex items-end sm:col-span-1">
            <Button className="w-full" onClick={handleAdd}>Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="card-etched bg-card/70">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base"><Coins className="size-4" /> Gold</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm">
          <Input
            type="number"
            className="w-32 font-mono"
            value={character.gold}
            onChange={(e) => onChange({ ...character, gold: Number(e.target.value) || 0 })}
          />
          <span className="text-muted-foreground">gp on hand</span>
          {[-100, -10, 10, 100].map((n) => (
            <Button key={n} size="sm" variant="outline" onClick={() => onChange({ ...character, gold: Math.max(0, character.gold + n) })}>
              {n > 0 ? `+${n}` : n}
            </Button>
          ))}
        </CardContent>
      </Card>

      {LOOT_LOCATIONS.map((loc) => {
        const items = byLocation(loc.id);
        return (
          <Card key={loc.id} className="card-etched bg-card/70">
            <CardHeader className="pb-2">
              <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                <span>{loc.label}</span>
                <span className="font-mono text-xs font-normal text-muted-foreground">
                  {items.length} entries · {totalWeight(items).toFixed(1)} lb · {totalValue(items).toFixed(1)} gp
                </span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">{loc.blurb}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing here yet.</p>
              ) : (
                items.map((item) => (
                  <LootRow
                    key={item.id}
                    item={item}
                    others={others}
                    onPatch={(patch) => onChange(updateItem(character, item.id, patch))}
                    onMove={(to, quantity) => onChange(moveItem(character, item.id, to, quantity ? { quantity } : {}))}
                    onGive={(heroId) => handleGive(item, heroId)}
                    onDelete={() => onChange(removeItem(character, item.id))}
                  />
                ))
              )}

              {loc.id === "party" ? (
                <div className="mt-3 rounded border border-primary/30 bg-primary/5 p-3">
                  <p className="flex items-center gap-2 text-sm font-medium"><Users className="size-4" /> Split & assign</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Deal the pool out evenly — coins included — between you and the heroes you tick.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {others.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No other heroes saved on this account yet.</span>
                    ) : (
                      others.map((o) => (
                        <label key={o.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={shareIds.includes(o.id)}
                            onCheckedChange={(v) =>
                              setShareIds((s) => (v ? [...s, o.id] : s.filter((x) => x !== o.id)))
                            }
                          />
                          {o.name || "Unnamed hero"}
                        </label>
                      ))
                    )}
                  </div>
                  <Button className="mt-3" size="sm" onClick={handleEqualSplit} disabled={others.length === 0}>
                    Split equally
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function LootRow({
  item,
  others,
  onPatch,
  onMove,
  onGive,
  onDelete,
}: {
  item: InventoryItem;
  others: Character[];
  onPatch: (patch: Partial<InventoryItem>) => void;
  onMove: (to: LootLocation, quantity?: number) => void;
  onGive: (heroId: string) => void;
  onDelete: () => void;
}) {
  const [moveQty, setMoveQty] = useState(1);

  return (
    <div className="rounded border border-border/50 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input className="h-8 min-w-40 flex-1" value={item.name} onChange={(e) => onPatch({ name: e.target.value })} />
        <Input
          className="h-8 w-16 font-mono"
          type="number"
          min={1}
          value={item.quantity}
          onChange={(e) => onPatch({ quantity: Math.max(1, Number(e.target.value) || 1) })}
        />
        <Input
          className="h-8 w-20 font-mono"
          type="number"
          min={0}
          step="0.1"
          value={item.weight}
          onChange={(e) => onPatch({ weight: Number(e.target.value) || 0 })}
          title="Weight per unit (lb)"
        />
        <Input
          className="h-8 w-20 font-mono"
          type="number"
          min={0}
          step="0.1"
          value={item.cost}
          onChange={(e) => onPatch({ cost: Number(e.target.value) || 0 })}
          title="Value per unit (gp)"
        />
        <Button size="icon" variant="ghost" onClick={onDelete} aria-label={`Remove ${item.name}`}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>

      {item.location === "stored" ? (
        <Input
          className="mt-2 h-8"
          value={item.container ?? ""}
          placeholder="Stash name (vault, wagon, pack mule…)"
          onChange={(e) => onPatch({ container: e.target.value })}
        />
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="flex items-center gap-1 text-muted-foreground"><ArrowRightLeft className="size-3" /> Move</span>
        <Input
          className="h-7 w-16 font-mono"
          type="number"
          min={1}
          max={item.quantity}
          value={moveQty}
          onChange={(e) => setMoveQty(Math.max(1, Number(e.target.value) || 1))}
        />
        {LOOT_LOCATIONS.filter((l) => l.id !== item.location).map((l) => (
          <Button key={l.id} size="sm" variant="outline" className="h-7" onClick={() => onMove(l.id, moveQty)}>
            {l.label}
          </Button>
        ))}
        {others.length > 0 ? (
          <Select onValueChange={onGive}>
            <SelectTrigger className="h-7 w-40 text-xs"><SelectValue placeholder="Give to hero…" /></SelectTrigger>
            <SelectContent>
              {others.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.name || "Unnamed hero"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="mt-1 h-7 px-2 text-xs text-muted-foreground">
            <History className="mr-1 size-3" /> History ({item.history?.length ?? 0})
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1 space-y-1">
          {(item.history ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No recorded movements yet.</p>
          ) : (
            [...(item.history ?? [])].reverse().map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded bg-muted/40 px-2 py-1 text-xs">
                <span>{h.text}</span>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {new Date(h.at).toLocaleString()}
                </Badge>
              </div>
            ))
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
