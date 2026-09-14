import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dices, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  getCampaignPlayCheckOptions,
  performCampaignSave,
  performCampaignSkillCheck,
  type CampaignGameActor,
  type CampaignSaveKind,
} from "../client/campaignPlayApi";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The rules check could not be completed.";
}

function saveLabel(save: CampaignSaveKind) {
  if (save === "fort") return "Fortitude";
  if (save === "ref") return "Reflex";
  return "Will";
}

export function CampaignResolutionPanel({
  campaignId,
  actor,
  enabled,
  onResolved,
}: {
  campaignId: string;
  actor: CampaignGameActor | null;
  enabled: boolean;
  onResolved: () => Promise<unknown> | unknown;
}) {
  const characterId = actor?.characterId ?? null;
  const [skillKey, setSkillKey] = useState("");
  const [skillDc, setSkillDc] = useState("10");
  const [saveDc, setSaveDc] = useState("10");

  const options = useQuery({
    queryKey: ["campaigns", "play", campaignId, "checks", characterId],
    queryFn: () => getCampaignPlayCheckOptions(campaignId, characterId!),
    enabled: Boolean(characterId),
  });

  useEffect(() => {
    if (!options.data?.skills.length) {
      setSkillKey("");
      return;
    }
    setSkillKey((current) => {
      if (options.data!.skills.some((skill) => `${skill.id}\u0000${skill.specialization}` === current)) {
        return current;
      }
      const first = options.data!.skills[0]!;
      return `${first.id}\u0000${first.specialization}`;
    });
  }, [options.data]);

  const selectedSkill = useMemo(
    () =>
      options.data?.skills.find((skill) => `${skill.id}\u0000${skill.specialization}` === skillKey) ??
      null,
    [options.data?.skills, skillKey],
  );

  const skillCheck = useMutation({
    mutationFn: async () => {
      if (!actor || !selectedSkill) throw new Error("Choose a skill first.");
      const dc = Number(skillDc);
      if (!Number.isInteger(dc) || dc < 0 || dc > 1_000_000) {
        throw new Error("Skill DC must be a whole number from 0 to 1,000,000.");
      }
      return performCampaignSkillCheck(
        campaignId,
        actor.id,
        selectedSkill.id,
        dc,
        selectedSkill.specialization || undefined,
      );
    },
    onSuccess: async () => {
      toast.success(`${selectedSkill?.name ?? "Skill"} check resolved.`);
      await onResolved();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const saveCheck = useMutation({
    mutationFn: async (save: CampaignSaveKind) => {
      if (!actor) throw new Error("No live character actor is available.");
      const dc = Number(saveDc);
      if (!Number.isInteger(dc) || dc < 0 || dc > 1_000_000) {
        throw new Error("Save DC must be a whole number from 0 to 1,000,000.");
      }
      return performCampaignSave(campaignId, actor.id, save, dc);
    },
    onSuccess: async (_result, save) => {
      toast.success(`${saveLabel(save)} save resolved.`);
      await onResolved();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (!actor?.characterId) {
    return (
      <section className="mt-5 rounded-xl border border-border bg-card/60 p-5">
        <h3 className="font-display text-xl">Rules checks</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          This character does not have an active runtime actor yet.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-xl border border-border bg-card/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Authoritative rolls</p>
          <h3 className="mt-1 font-display text-xl">Resolve a check</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Use these when the Dungeon Master calls for a skill check or saving throw. The server rolls and records the result in campaign events.
          </p>
        </div>
        {!enabled ? (
          <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
            View only
          </span>
        ) : null}
      </div>

      {options.error ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {errorMessage(options.error)}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-border bg-background/35 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Dices className="h-4 w-4 text-gold" /> Skill check
          </div>
          <label className="mt-3 block text-xs font-semibold text-muted-foreground" htmlFor="campaign-skill-check">
            Skill
          </label>
          <select
            id="campaign-skill-check"
            value={skillKey}
            onChange={(event) => setSkillKey(event.target.value)}
            disabled={!enabled || options.isLoading || !options.data?.skills.length}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
          >
            {options.data?.skills.map((skill) => {
              const key = `${skill.id}\u0000${skill.specialization}`;
              return (
                <option key={key} value={key}>
                  {skill.name}{skill.specialization ? ` (${skill.specialization})` : ""} · {skill.ranks} ranks
                </option>
              );
            })}
          </select>
          <label className="mt-3 block text-xs font-semibold text-muted-foreground" htmlFor="campaign-skill-dc">
            DC
          </label>
          <input
            id="campaign-skill-dc"
            type="number"
            min={0}
            max={1_000_000}
            step={1}
            value={skillDc}
            onChange={(event) => setSkillDc(event.target.value)}
            disabled={!enabled}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
          />
          <button
            type="button"
            disabled={!enabled || !selectedSkill || skillCheck.isPending}
            onClick={() => skillCheck.mutate()}
            className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {skillCheck.isPending ? "Rolling…" : "Roll skill check"}
          </button>
        </div>

        <div className="rounded-lg border border-border bg-background/35 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-gold" /> Saving throw
          </div>
          <label className="mt-3 block text-xs font-semibold text-muted-foreground" htmlFor="campaign-save-dc">
            DC
          </label>
          <input
            id="campaign-save-dc"
            type="number"
            min={0}
            max={1_000_000}
            step={1}
            value={saveDc}
            onChange={(event) => setSaveDc(event.target.value)}
            disabled={!enabled}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
          />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["fort", "ref", "will"] as const).map((save) => (
              <button
                key={save}
                type="button"
                disabled={!enabled || saveCheck.isPending}
                onClick={() => saveCheck.mutate(save)}
                className="rounded-lg border border-gold/30 bg-gold/10 px-2 py-2 text-xs font-semibold text-gold transition hover:bg-gold/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saveCheck.isPending && saveCheck.variables === save ? "Rolling…" : saveLabel(save)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
