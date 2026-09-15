import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Backpack,
  BookOpen,
  Gauge,
  Heart,
  PackagePlus,
  Save,
  Scale,
  Shield,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCampaignCharacterSheet,
  grantCampaignInventoryItem,
  removeCampaignInventoryItem,
  searchCampaignItemCatalog,
  updateCampaignCharacterSheet,
  updateCampaignInventoryEntry,
  type CampaignCharacterInventoryEntry,
  type CampaignCharacterSheet as CampaignCharacterSheetData,
  type CampaignEquipmentSlot,
  type CampaignInventoryLocation,
} from "../client/campaignPlayApi";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The character sheet could not be updated.";
}

function signed(value: number) {
  return value >= 0 ? `+${value}` : String(value);
}

function pounds(value: number) {
  return Number.isInteger(value) ? `${value} lb` : `${value.toFixed(2)} lb`;
}

function labelize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function CampaignCharacterSheet({
  campaignId,
  characterId,
  onChanged,
}: {
  campaignId: string;
  characterId: string | null;
  onChanged: () => Promise<unknown> | unknown;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [playerNotes, setPlayerNotes] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogQuantity, setCatalogQuantity] = useState("1");
  const [catalogLocation, setCatalogLocation] = useState<CampaignInventoryLocation>("carried");

  const sheet = useQuery({
    queryKey: ["campaigns", "play", campaignId, "character-sheet", characterId],
    queryFn: () => getCampaignCharacterSheet(campaignId, characterId!),
    enabled: Boolean(characterId),
    refetchInterval: 8_000,
  });

  useEffect(() => {
    if (!sheet.data) return;
    setName(sheet.data.character.name);
    setPronouns(sheet.data.character.pronouns ?? "");
    setPlayerNotes(sheet.data.character.playerNotes);
  }, [sheet.data?.character.name, sheet.data?.character.playerNotes, sheet.data?.character.pronouns]);

  const refresh = async () => {
    await Promise.all([
      sheet.refetch(),
      queryClient.invalidateQueries({ queryKey: ["campaigns", "play", campaignId, "state"] }),
      queryClient.invalidateQueries({ queryKey: ["campaigns", "play", campaignId, "checks"] }),
      onChanged(),
    ]);
  };

  const profile = useMutation({
    mutationFn: async () => {
      if (!characterId) throw new Error("Choose a character first.");
      return updateCampaignCharacterSheet(campaignId, characterId, {
        name: name.trim(),
        pronouns: pronouns.trim() || null,
        playerNotes: playerNotes.trim() || null,
      });
    },
    onSuccess: async () => {
      toast.success("Character sheet saved.");
      await refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const encumbranceToggle = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!characterId) throw new Error("Choose a character first.");
      return updateCampaignCharacterSheet(campaignId, characterId, {
        encumbranceEnabled: enabled,
      });
    },
    onSuccess: async (_result, enabled) => {
      toast.success(enabled ? "Encumbrance rules enabled." : "Encumbrance rules disabled.");
      await refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const arrange = useMutation({
    mutationFn: async (input: {
      inventoryId: string;
      update: {
        location?: CampaignInventoryLocation;
        equippedSlot?: CampaignEquipmentSlot | null;
        notes?: string | null;
      };
    }) => {
      if (!characterId) throw new Error("Choose a character first.");
      return updateCampaignInventoryEntry(
        campaignId,
        characterId,
        input.inventoryId,
        input.update,
      );
    },
    onSuccess: async () => {
      await refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const catalog = useQuery({
    queryKey: [
      "campaigns",
      "play",
      campaignId,
      "character-sheet",
      characterId,
      "item-catalog",
      catalogSearch.trim(),
    ],
    queryFn: () => searchCampaignItemCatalog(campaignId, characterId!, catalogSearch.trim()),
    enabled: Boolean(
      characterId &&
        sheet.data?.permissions.canManageInventory &&
        catalogSearch.trim().length >= 2,
    ),
    staleTime: 30_000,
  });

  const grant = useMutation({
    mutationFn: async (itemId: string) => {
      const actorId = sheet.data?.character.actorId;
      if (!actorId) throw new Error("This character does not have a live actor yet.");
      const quantity = Number(catalogQuantity);
      if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1_000_000) {
        throw new Error("Quantity must be a whole number from 1 to 1,000,000.");
      }
      return grantCampaignInventoryItem(
        campaignId,
        actorId,
        itemId,
        quantity,
        catalogLocation,
      );
    },
    onSuccess: async () => {
      toast.success("Item added to inventory.");
      setCatalogSearch("");
      setCatalogQuantity("1");
      await refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: async (input: { inventoryId: string; quantity: number }) => {
      const actorId = sheet.data?.character.actorId;
      if (!actorId) throw new Error("This character does not have a live actor yet.");
      return removeCampaignInventoryItem(
        campaignId,
        actorId,
        input.inventoryId,
        input.quantity,
      );
    },
    onSuccess: async () => {
      toast.success("Item removed from inventory.");
      await refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (!characterId) {
    return (
      <section className="mt-5 rounded-xl border border-border bg-card/60 p-5">
        <h3 className="font-display text-xl">Character sheet</h3>
        <p className="mt-2 text-sm text-muted-foreground">Choose a character from the party first.</p>
      </section>
    );
  }

  if (sheet.isLoading) {
    return (
      <section className="mt-5 rounded-xl border border-border bg-card/60 p-5">
        <p className="text-sm text-muted-foreground">Loading the authoritative character sheet…</p>
      </section>
    );
  }

  if (sheet.error || !sheet.data) {
    return (
      <section className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <h3 className="font-display text-xl">Character sheet unavailable</h3>
        <p className="mt-2 text-sm text-destructive">{errorMessage(sheet.error)}</p>
      </section>
    );
  }

  const data = sheet.data;
  const active = data.campaignStatus === "active";
  const abilities = ["str", "dex", "con", "int", "wis", "cha"] as const;
  const classSummary = data.character.classes.length
    ? data.character.classes
        .map((entry) => `${entry.name} ${entry.level}${entry.track > 1 ? ` (track ${entry.track})` : ""}`)
        .join(" / ")
    : "No class progression";

  return (
    <div className="mt-5 space-y-5">
      <section className="rounded-xl border border-border bg-card/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Live character sheet</p>
            <h3 className="mt-1 font-display text-2xl">{data.character.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.character.race?.name ?? "Unknown race"} · {classSummary} · {data.character.alignment} · {data.character.experiencePoints.toLocaleString()} XP
            </p>
          </div>
          {!data.permissions.canEdit ? (
            <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
              View only
            </span>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <label className="text-xs font-semibold text-muted-foreground">
            Character name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={!data.permissions.canEdit}
              maxLength={120}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-60"
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Pronouns
            <input
              value={pronouns}
              onChange={(event) => setPronouns(event.target.value)}
              disabled={!data.permissions.canEdit}
              maxLength={120}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-60"
            />
          </label>
        </div>
        <label className="mt-4 block text-xs font-semibold text-muted-foreground">
          Player notes
          <textarea
            value={playerNotes}
            onChange={(event) => setPlayerNotes(event.target.value)}
            disabled={!data.permissions.canEdit}
            maxLength={20_000}
            rows={4}
            className="mt-1.5 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-60"
          />
        </label>
        {data.permissions.canEdit ? (
          <button
            type="button"
            disabled={profile.isPending || !name.trim()}
            onClick={() => profile.mutate()}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            <Save className="h-4 w-4" /> {profile.isPending ? "Saving…" : "Save sheet"}
          </button>
        ) : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {abilities.map((ability) => {
          const value = data.abilities[ability];
          return (
            <div key={ability} className="rounded-xl border border-border bg-card/60 p-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {ability}
              </p>
              <strong className="mt-1 block font-display text-2xl">{value.score}</strong>
              <span className="text-sm font-semibold text-gold">{signed(value.modifier)}</span>
            </div>
          );
        })}
      </section>

      <section className="rounded-xl border border-border bg-card/60 p-5">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-gold" />
          <h3 className="font-display text-xl">Combat & defenses</h3>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <SheetMetric label="Level" value={data.combat.characterLevel} />
          <SheetMetric label="BAB" value={signed(data.combat.baseAttackBonus)} />
          <SheetMetric label="AC" value={data.combat.armorClass.normal} detail={`Touch ${data.combat.armorClass.touch} · Flat ${data.combat.armorClass.flatFooted}`} />
          <SheetMetric label="Fort" value={signed(data.combat.saves.fort)} />
          <SheetMetric label="Ref" value={signed(data.combat.saves.ref)} />
          <SheetMetric label="Will" value={signed(data.combat.saves.will)} />
          <SheetMetric label="Initiative" value={signed(data.combat.initiative)} />
          <SheetMetric label="Grapple" value={signed(data.combat.grapple)} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SheetMetric
            label="Hit points"
            value={`${data.combat.health.currentHitPoints}/${data.combat.health.maximumHitPoints}`}
            detail={`${data.combat.health.temporaryHitPoints} temp · ${data.combat.health.nonlethalDamage} nonlethal`}
            icon={<Heart className="h-4 w-4" />}
          />
          <SheetMetric
            label="Land speed"
            value={`${data.encumbrance.landSpeedFeet} ft`}
            detail={`Base ${data.encumbrance.baseLandSpeedFeet} ft`}
            icon={<Gauge className="h-4 w-4" />}
          />
          <SheetMetric
            label="Max Dex"
            value={data.combat.armorClass.maximumDexterityBonus === null ? "—" : `+${data.combat.armorClass.maximumDexterityBonus}`}
            detail="Worse of armor and load"
          />
          <SheetMetric
            label="Check penalty"
            value={signed(data.encumbrance.armorCheckPenalty)}
            detail="Worse of armor and load"
          />
        </div>
      </section>

      <EncumbranceCard
        data={data}
        pending={encumbranceToggle.isPending}
        onToggle={(enabled) => encumbranceToggle.mutate(enabled)}
      />

      <InventoryEditor
        data={data}
        active={active}
        catalogSearch={catalogSearch}
        setCatalogSearch={setCatalogSearch}
        catalogQuantity={catalogQuantity}
        setCatalogQuantity={setCatalogQuantity}
        catalogLocation={catalogLocation}
        setCatalogLocation={setCatalogLocation}
        catalogItems={catalog.data ?? []}
        catalogLoading={catalog.isFetching}
        arrangePending={arrange.isPending}
        grantPending={grant.isPending}
        removePending={remove.isPending}
        onUpdate={(inventoryId, update) => arrange.mutate({ inventoryId, update })}
        onGrant={(itemId) => grant.mutate(itemId)}
        onRemove={(entry) => remove.mutate({ inventoryId: entry.id, quantity: entry.quantity })}
      />

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card/60 p-5">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gold" />
            <h3 className="font-display text-xl">Skills</h3>
          </div>
          <div className="mt-4 max-h-[440px] space-y-2 overflow-y-auto pr-1">
            {data.skills.length ? (
              data.skills.map((skill) => (
                <div key={`${skill.id}:${skill.specialization}`} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/35 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {skill.name}{skill.specialization ? ` (${skill.specialization})` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {skill.ranks} ranks · {skill.ability?.toUpperCase() ?? "—"}{skill.trainedOnly ? " · trained" : ""}
                    </p>
                  </div>
                  <strong className="shrink-0 text-gold">{signed(skill.total)}</strong>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No trained skills recorded.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/60 p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            <h3 className="font-display text-xl">Feats</h3>
          </div>
          <div className="mt-4 max-h-[440px] space-y-2 overflow-y-auto pr-1">
            {data.feats.length ? (
              data.feats.map((feat) => (
                <div key={feat.id} className="rounded-lg border border-border bg-background/35 px-3 py-2">
                  <p className="text-sm font-semibold">
                    {feat.name}{feat.occurrence > 1 ? ` ×${feat.occurrence}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {labelize(feat.grantKind)}{feat.gainedAtLevel ? ` · level ${feat.gainedAtLevel}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No feats recorded.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function EncumbranceCard({
  data,
  pending,
  onToggle,
}: {
  data: CampaignCharacterSheetData;
  pending: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  const value = data.encumbrance;
  const percent =
    value.capacity.heavyMaximum > 0
      ? Math.min(100, (value.carriedWeight / value.capacity.heavyMaximum) * 100)
      : value.carriedWeight > 0
        ? 100
        : 0;
  return (
    <section className="rounded-xl border border-border bg-card/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Scale className="mt-0.5 h-5 w-5 text-gold" />
          <div>
            <h3 className="font-display text-xl">Encumbrance</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {pounds(value.carriedWeight)} carried · actual {value.actualLoad} load · {value.capacity.heavyMaximum} lb heavy maximum
            </p>
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={value.enabled}
            disabled={!data.permissions.canEdit || pending}
            onChange={(event) => onToggle(event.target.checked)}
            className="h-4 w-4 accent-[hsl(var(--primary))]"
          />
          Apply encumbrance
        </label>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
        <span>Light ≤ {value.capacity.lightMaximum} lb</span>
        <span>Medium ≤ {value.capacity.mediumMaximum} lb</span>
        <span>Heavy ≤ {value.capacity.heavyMaximum} lb</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SheetMetric label="Applied load" value={value.enabled ? labelize(value.load) : "Disabled"} />
        <SheetMetric label="Speed" value={`${value.landSpeedFeet} ft`} detail={labelize(value.movement)} />
        <SheetMetric label="Max Dex" value={value.maxDexterityBonus === null ? "—" : `+${value.maxDexterityBonus}`} />
        <SheetMetric label="ACP" value={signed(value.armorCheckPenalty)} />
        <SheetMetric label="Run" value={value.runMultiplier > 0 ? `×${value.runMultiplier}` : "No run"} />
      </div>

      {!value.weightComplete ? (
        <p className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          {value.unknownWeightItems} carried item{value.unknownWeightItems === 1 ? " has" : "s have"} no catalog weight, so the displayed carried weight is incomplete.
        </p>
      ) : null}
      {!value.enabled && value.actualLoad !== "light" ? (
        <p className="mt-3 text-xs text-muted-foreground">
          The character is actually {value.actualLoad} by carried weight. Encumbrance penalties are disabled, but armor and other equipment restrictions still apply.
        </p>
      ) : null}
    </section>
  );
}

function InventoryEditor({
  data,
  active,
  catalogSearch,
  setCatalogSearch,
  catalogQuantity,
  setCatalogQuantity,
  catalogLocation,
  setCatalogLocation,
  catalogItems,
  catalogLoading,
  arrangePending,
  grantPending,
  removePending,
  onUpdate,
  onGrant,
  onRemove,
}: {
  data: CampaignCharacterSheetData;
  active: boolean;
  catalogSearch: string;
  setCatalogSearch: (value: string) => void;
  catalogQuantity: string;
  setCatalogQuantity: (value: string) => void;
  catalogLocation: CampaignInventoryLocation;
  setCatalogLocation: (value: CampaignInventoryLocation) => void;
  catalogItems: Array<{ id: string; name: string; category: string; weightPounds: number | null }>;
  catalogLoading: boolean;
  arrangePending: boolean;
  grantPending: boolean;
  removePending: boolean;
  onUpdate: (
    inventoryId: string,
    update: {
      location?: CampaignInventoryLocation;
      equippedSlot?: CampaignEquipmentSlot | null;
      notes?: string | null;
    },
  ) => void;
  onGrant: (itemId: string) => void;
  onRemove: (entry: CampaignCharacterInventoryEntry) => void;
}) {
  const byLocation = useMemo(
    () => ({
      carried: data.inventory.filter((entry) => entry.location === "carried"),
      stored: data.inventory.filter((entry) => entry.location === "stored"),
      party: data.inventory.filter((entry) => entry.location === "party"),
    }),
    [data.inventory],
  );

  return (
    <section className="rounded-xl border border-border bg-card/60 p-5">
      <div className="flex items-center gap-2">
        <Backpack className="h-5 w-5 text-gold" />
        <h3 className="font-display text-xl">Inventory & equipment</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Moving an item out of carried inventory automatically unequips it. Equipped armor and carried load immediately feed the authoritative rules engine.
      </p>

      {data.permissions.canManageInventory ? (
        <div className="mt-4 rounded-xl border border-gold/25 bg-gold/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gold">
            <PackagePlus className="h-4 w-4" /> Add catalog item
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_110px_140px]">
            <input
              value={catalogSearch}
              onChange={(event) => setCatalogSearch(event.target.value)}
              placeholder="Search item name or slug…"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              value={catalogQuantity}
              onChange={(event) => setCatalogQuantity(event.target.value)}
              type="number"
              min={1}
              step={1}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              aria-label="Item quantity"
            />
            <select
              value={catalogLocation}
              onChange={(event) => setCatalogLocation(event.target.value as CampaignInventoryLocation)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              aria-label="New item location"
            >
              <option value="carried">Carried</option>
              <option value="stored">Stored</option>
              <option value="party">Party</option>
            </select>
          </div>
          {!active ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Resume the campaign to add or remove items. Arrangement remains editable while paused.
            </p>
          ) : null}
          {catalogSearch.trim().length >= 2 ? (
            <div className="mt-3 max-h-52 space-y-1 overflow-y-auto">
              {catalogLoading ? (
                <p className="p-2 text-xs text-muted-foreground">Searching catalog…</p>
              ) : catalogItems.length ? (
                catalogItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!active || grantPending}
                    onClick={() => onGrant(item.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2 text-left text-sm transition hover:border-gold/40 disabled:opacity-40"
                  >
                    <span>
                      <strong>{item.name}</strong>
                      <span className="ml-2 text-xs text-muted-foreground">{labelize(item.category)}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {item.weightPounds === null ? "weight —" : pounds(item.weightPounds)}
                    </span>
                  </button>
                ))
              ) : (
                <p className="p-2 text-xs text-muted-foreground">No matching catalog items.</p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 space-y-5">
        {(["carried", "stored", "party"] as const).map((location) => (
          <div key={location}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold">{labelize(location)}</h4>
              <span className="text-xs text-muted-foreground">{byLocation[location].length} stack{byLocation[location].length === 1 ? "" : "s"}</span>
            </div>
            <div className="space-y-2">
              {byLocation[location].length ? (
                byLocation[location].map((entry) => (
                  <InventoryRow
                    key={entry.id}
                    entry={entry}
                    equipmentSlots={data.equipmentSlots}
                    canArrange={data.permissions.canArrangeInventory}
                    canRemove={data.permissions.canManageInventory && active && Boolean(data.character.actorId)}
                    pending={arrangePending || removePending}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                  />
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                  No {location} items.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function InventoryRow({
  entry,
  equipmentSlots,
  canArrange,
  canRemove,
  pending,
  onUpdate,
  onRemove,
}: {
  entry: CampaignCharacterInventoryEntry;
  equipmentSlots: CampaignEquipmentSlot[];
  canArrange: boolean;
  canRemove: boolean;
  pending: boolean;
  onUpdate: (
    inventoryId: string,
    update: {
      location?: CampaignInventoryLocation;
      equippedSlot?: CampaignEquipmentSlot | null;
      notes?: string | null;
    },
  ) => void;
  onRemove: (entry: CampaignCharacterInventoryEntry) => void;
}) {
  const [notes, setNotes] = useState(entry.notes ?? "");
  useEffect(() => setNotes(entry.notes ?? ""), [entry.notes]);

  return (
    <div className="rounded-lg border border-border bg-background/35 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{entry.name}</p>
            <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {entry.category}
            </span>
            {entry.equipped ? (
              <span className="rounded-full border border-gold/30 bg-gold/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-gold">
                {labelize(entry.equippedSlot ?? "equipped")}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Qty {entry.quantity} · {entry.weightPounds === null ? "unknown weight" : `${pounds(entry.weightPounds)} each`} · {entry.totalWeightPounds === null ? "total —" : `${pounds(entry.totalWeightPounds)} total`}
          </p>
        </div>
        {canRemove ? (
          <button
            type="button"
            title={entry.equipped ? "Unequip this item before removing it." : "Remove this inventory stack"}
            disabled={pending || entry.equipped}
            onClick={() => onRemove(entry)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-destructive/30 text-destructive transition hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={`Remove ${entry.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-[140px_180px_minmax(0,1fr)_auto]">
        <select
          value={entry.location}
          disabled={!canArrange || pending}
          onChange={(event) =>
            onUpdate(entry.id, { location: event.target.value as CampaignInventoryLocation })
          }
          className="rounded-lg border border-border bg-background px-2.5 py-2 text-xs disabled:opacity-50"
          aria-label={`${entry.name} location`}
        >
          <option value="carried">Carried</option>
          <option value="stored">Stored</option>
          <option value="party">Party</option>
        </select>
        <select
          value={entry.equippedSlot ?? ""}
          disabled={!canArrange || pending || entry.location !== "carried"}
          onChange={(event) =>
            onUpdate(entry.id, {
              equippedSlot: event.target.value ? (event.target.value as CampaignEquipmentSlot) : null,
            })
          }
          className="rounded-lg border border-border bg-background px-2.5 py-2 text-xs disabled:opacity-50"
          aria-label={`${entry.name} equipment slot`}
        >
          <option value="">Not equipped</option>
          {equipmentSlots.map((slot) => (
            <option key={slot} value={slot}>
              {labelize(slot)}{entry.suggestedSlot === slot ? " · suggested" : ""}
            </option>
          ))}
        </select>
        <input
          value={notes}
          disabled={!canArrange || pending}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Inventory notes…"
          maxLength={4000}
          className="rounded-lg border border-border bg-background px-2.5 py-2 text-xs disabled:opacity-50"
          aria-label={`${entry.name} notes`}
        />
        <button
          type="button"
          disabled={!canArrange || pending || notes === (entry.notes ?? "")}
          onClick={() => onUpdate(entry.id, { notes: notes.trim() || null })}
          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:border-gold/40 hover:text-gold disabled:opacity-30"
        >
          Save notes
        </button>
      </div>
    </div>
  );
}

function SheetMetric({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/35 p-3">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {icon} {label}
      </p>
      <strong className="mt-1 block text-lg">{value}</strong>
      {detail ? <span className="mt-0.5 block text-[11px] text-muted-foreground">{detail}</span> : null}
    </div>
  );
}
