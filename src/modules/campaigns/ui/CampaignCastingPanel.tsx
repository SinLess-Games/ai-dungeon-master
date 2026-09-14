import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BookOpen, Brain, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  castPreparedCampaignSpell,
  castSpontaneousCampaignSpell,
  getCampaignCastingCatalog,
  getCampaignCastingState,
  manifestCampaignPower,
  type CampaignCastingCatalogTrack,
  type CampaignGameActor,
  type CampaignPowerOption,
  type CampaignPreparedSpellOption,
  type CampaignSpontaneousSpellOption,
} from "../client/campaignPlayApi";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The casting action could not be completed.";
}

function trackLabel(track: CampaignCastingCatalogTrack) {
  const mode = track.mode === "psionic" ? "Psionics" : track.mode === "prepared" ? "Prepared" : track.mode === "spontaneous" ? "Spontaneous" : "Casting";
  return `${track.tradition[0]?.toUpperCase() ?? ""}${track.tradition.slice(1)} · ${mode}`;
}

export function CampaignCastingPanel({
  campaignId,
  actor,
  actors,
  enabled,
  onResolved,
}: {
  campaignId: string;
  actor: CampaignGameActor | null;
  actors: CampaignGameActor[];
  enabled: boolean;
  onResolved: () => Promise<unknown> | unknown;
}) {
  const characterId = actor?.characterId ?? null;
  const [targetId, setTargetId] = useState("");

  const catalog = useQuery({
    queryKey: ["campaigns", "play", campaignId, "casting-catalog", characterId],
    queryFn: () => getCampaignCastingCatalog(campaignId, characterId!),
    enabled: Boolean(characterId),
  });
  const castingState = useQuery({
    queryKey: ["campaigns", "play", campaignId, "casting-state", characterId],
    queryFn: () => getCampaignCastingState(campaignId, characterId!),
    enabled: Boolean(characterId && enabled),
  });

  const targets = useMemo(
    () => actors.filter((entry) => entry.status === "active"),
    [actors],
  );
  const targetIds = targetId ? [targetId] : undefined;

  async function refreshAfterAction() {
    await Promise.all([catalog.refetch(), castingState.refetch(), Promise.resolve(onResolved())]);
  }

  const preparedCast = useMutation({
    mutationFn: ({ track, spell }: { track: CampaignCastingCatalogTrack; spell: CampaignPreparedSpellOption }) => {
      if (!actor) throw new Error("No active character actor is available.");
      return castPreparedCampaignSpell(campaignId, {
        actorId: actor.id,
        castingTrackId: track.id,
        spellId: spell.spellId,
        preparationId: spell.preparationId,
        ...(targetIds ? { targetIds } : {}),
      });
    },
    onSuccess: async (_result, input) => {
      toast.success(`${input.spell.name} cast.`);
      await refreshAfterAction();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const spontaneousCast = useMutation({
    mutationFn: ({ track, spell }: { track: CampaignCastingCatalogTrack; spell: CampaignSpontaneousSpellOption }) => {
      if (!actor) throw new Error("No active character actor is available.");
      return castSpontaneousCampaignSpell(campaignId, {
        actorId: actor.id,
        castingTrackId: track.id,
        spellId: spell.spellId,
        ...(targetIds ? { targetIds } : {}),
      });
    },
    onSuccess: async (_result, input) => {
      toast.success(`${input.spell.name} cast.`);
      await refreshAfterAction();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const manifestPower = useMutation({
    mutationFn: ({ track, power }: { track: CampaignCastingCatalogTrack; power: CampaignPowerOption }) => {
      if (!actor) throw new Error("No active character actor is available.");
      return manifestCampaignPower(campaignId, {
        actorId: actor.id,
        castingTrackId: track.id,
        powerId: power.powerId,
        ...(targetIds ? { targetIds } : {}),
      });
    },
    onSuccess: async (_result, input) => {
      toast.success(`${input.power.name} manifested.`);
      await refreshAfterAction();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (!characterId) return null;
  if (catalog.isLoading) {
    return (
      <section className="mt-5 rounded-xl border border-border bg-card/60 p-5">
        <p className="text-sm text-muted-foreground">Loading spells and powers…</p>
      </section>
    );
  }
  if (catalog.error) {
    return (
      <section className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <h3 className="font-display text-xl">Spells & powers</h3>
        <p className="mt-2 text-sm text-destructive">{errorMessage(catalog.error)}</p>
      </section>
    );
  }
  if (!catalog.data?.tracks.length) return null;

  return (
    <section className="mt-5 rounded-xl border border-border bg-card/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Casting & psionics</p>
          <h3 className="mt-1 font-display text-xl">Spells and powers</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Resources, action economy, saves, damage, and effects resolve through the authoritative D&D 3.5 casting pipeline.
          </p>
        </div>
        {!enabled ? (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-600 dark:text-amber-400">
            Resume campaign to cast
          </span>
        ) : null}
      </div>

      <div className="mt-4 rounded-lg border border-border bg-background/35 p-4">
        <label className="text-xs font-semibold text-muted-foreground" htmlFor="campaign-casting-target">
          Explicit target (optional)
        </label>
        <select
          id="campaign-casting-target"
          value={targetId}
          onChange={(event) => setTargetId(event.target.value)}
          disabled={!enabled}
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
        >
          <option value="">No explicit target / area / DM-directed</option>
          {targets.map((target) => (
            <option key={target.id} value={target.id}>
              {target.name} · {target.kind}{target.id === actor?.id ? " · self" : ""}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">
          Select a target when the spell or power requires one. Area and non-targeted effects can leave this blank.
        </p>
      </div>

      {castingState.error && enabled ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {errorMessage(castingState.error)}
        </div>
      ) : null}

      <div className="mt-4 space-y-4">
        {catalog.data.tracks.map((track) => {
          const state = castingState.data?.tracks.find((entry) => entry.id === track.id);
          return (
            <div key={track.id} className="rounded-lg border border-border bg-background/35 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {track.mode === "psionic" ? (
                    <Brain className="h-4 w-4 text-gold" />
                  ) : track.mode === "prepared" ? (
                    <BookOpen className="h-4 w-4 text-gold" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-gold" />
                  )}
                  {trackLabel(track)}
                </div>
                {state ? (
                  <span className="text-xs text-muted-foreground">
                    {track.mode === "psionic" ? "ML" : "CL"} {state.casterOrManifesterLevel}
                  </span>
                ) : null}
              </div>

              {track.mode === "prepared" ? (
                <div className="mt-3 grid gap-2 lg:grid-cols-2">
                  {track.prepared.length ? (
                    track.prepared.map((spell) => {
                      const runtime = state?.prepared?.find((entry) => entry.id === spell.preparationId);
                      const remaining = runtime?.remaining ?? spell.remaining;
                      const busy = preparedCast.isPending && preparedCast.variables?.spell.preparationId === spell.preparationId;
                      return (
                        <ActionCard
                          key={spell.preparationId}
                          name={spell.name}
                          meta={`Level ${spell.slotLevel} slot · ${remaining}/${runtime?.preparedCount ?? spell.preparedCount} prepared`}
                          detail={[spell.actionType, spell.rangeText, spell.targetText].filter(Boolean).join(" · ")}
                          disabled={!enabled || remaining < 1 || preparedCast.isPending}
                          pending={busy}
                          actionLabel={remaining < 1 ? "Expended" : "Cast"}
                          onClick={() => preparedCast.mutate({ track, spell })}
                        />
                      );
                    })
                  ) : (
                    <EmptyTrack text="No prepared spells are currently recorded on this track." />
                  )}
                </div>
              ) : null}

              {track.mode === "spontaneous" ? (
                <div className="mt-3 grid gap-2 lg:grid-cols-2">
                  {track.spontaneous.length ? (
                    track.spontaneous.map((spell) => {
                      const slots = state?.spontaneous?.find((entry) => entry.spellLevel === spell.spellLevel);
                      const remaining = slots?.remaining ?? 0;
                      const busy = spontaneousCast.isPending && spontaneousCast.variables?.spell.spellId === spell.spellId;
                      return (
                        <ActionCard
                          key={spell.spellId}
                          name={spell.name}
                          meta={`Spell level ${spell.spellLevel} · ${remaining}${slots ? `/${slots.maximum}` : ""} slots`}
                          detail={[spell.actionType, spell.rangeText, spell.targetText].filter(Boolean).join(" · ")}
                          disabled={!enabled || remaining < 1 || spontaneousCast.isPending}
                          pending={busy}
                          actionLabel={remaining < 1 ? "No slots" : "Cast"}
                          onClick={() => spontaneousCast.mutate({ track, spell })}
                        />
                      );
                    })
                  ) : (
                    <EmptyTrack text="No known spontaneous spells are recorded on this track." />
                  )}
                </div>
              ) : null}

              {track.mode === "psionic" ? (
                <div className="mt-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border border-border px-2 py-1">
                      PP {castingState.data?.psionics.currentPowerPoints ?? 0}/{castingState.data?.psionics.maximumPowerPoints ?? 0}
                    </span>
                    <span className="rounded-full border border-border px-2 py-1">
                      Focus {castingState.data?.psionics.focused ? "✓" : "—"}
                    </span>
                  </div>
                  <div className="grid gap-2 lg:grid-cols-2">
                    {track.powers.length ? (
                      track.powers.map((power) => {
                        const current = castingState.data?.psionics.currentPowerPoints ?? 0;
                        const busy = manifestPower.isPending && manifestPower.variables?.power.powerId === power.powerId;
                        return (
                          <ActionCard
                            key={power.powerId}
                            name={power.name}
                            meta={`Power level ${power.powerLevel} · ${power.powerPoints} PP`}
                            detail={[power.actionType, power.rangeText, power.targetText, power.augmentationText].filter(Boolean).join(" · ")}
                            disabled={!enabled || current < power.powerPoints || manifestPower.isPending}
                            pending={busy}
                            actionLabel={current < power.powerPoints ? "Not enough PP" : "Manifest"}
                            onClick={() => manifestPower.mutate({ track, power })}
                          />
                        );
                      })
                    ) : (
                      <EmptyTrack text="No known powers are recorded on this track." />
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ActionCard({
  name,
  meta,
  detail,
  disabled,
  pending,
  actionLabel,
  onClick,
}: {
  name: string;
  meta: string;
  detail: string;
  disabled: boolean;
  pending: boolean;
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{name}</p>
          <p className="mt-0.5 text-xs text-gold">{meta}</p>
          {detail ? <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{detail}</p> : null}
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          className="shrink-0 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold transition hover:bg-gold/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Resolving…" : actionLabel}
        </button>
      </div>
    </div>
  );
}

function EmptyTrack({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground lg:col-span-2">
      {text}
    </div>
  );
}
