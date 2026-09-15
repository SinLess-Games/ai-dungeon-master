import { useId } from "react";
import { campaignLengthOptions } from "../domain/duration";
import { parseDurationDraft, type CampaignDurationDraft } from "./durationDraft";

const fieldClass =
  "w-full rounded-xl border border-border bg-background/60 px-3.5 py-3 text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

export function CampaignDurationFields({
  value,
  onChange,
  disabled = false,
}: {
  value: CampaignDurationDraft;
  onChange: (value: CampaignDurationDraft) => void;
  disabled?: boolean;
}) {
  const hintId = useId();
  const errorId = useId();
  const parsed = parseDurationDraft(value);
  const endless = value.length === "endless";
  const selectedLength = campaignLengthOptions.find((option) => option.id === value.length);
  return (
    <fieldset disabled={disabled} className="space-y-4" aria-describedby={hintId}>
      <legend className="mb-2 font-display text-xl">Campaign duration</legend>
      <p id={hintId} className="text-sm text-muted-foreground">
        Length shapes the story's overall arc; pace controls individual scenes. Optional targets
        guide the DM without changing character levels or forcing an ending.
      </p>
      <label className="block space-y-2 text-sm font-medium">
        <span>Campaign length</span>
        <select
          aria-label="Campaign length"
          className={fieldClass}
          value={value.length}
          onChange={(event) => onChange({ ...value, length: event.target.value })}
        >
          <option value="">Unspecified</option>
          {campaignLengthOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>
      {selectedLength?.description && (
        <p className="text-sm text-muted-foreground">{selectedLength?.description}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ["estimatedSessions", endless ? "Estimated arc sessions" : "Estimated sessions", 1000],
            ["startLevel", "Starting level target", 100],
            ["endLevel", "Ending level target", 100],
          ] as const
        ).map(([key, label, maximum]) => {
          const invalid =
            !parsed.success && parsed.error.issues.some((issue) => issue.path[0] === key);
          return (
            <label key={key} className="block space-y-2 text-sm font-medium">
              <span>{label} (optional)</span>
              <input
                className={fieldClass}
                type="number"
                min={1}
                max={maximum}
                step={1}
                placeholder="Unspecified"
                value={value[key]}
                aria-invalid={invalid}
                aria-describedby={invalid ? errorId : undefined}
                onChange={(event) => onChange({ ...value, [key]: event.target.value })}
              />
            </label>
          );
        })}
      </div>
      <label className="block space-y-2 text-sm font-medium">
        <span>{endless ? "Arc ending target" : "Ending target"} (optional)</span>
        <textarea
          className={fieldClass}
          rows={3}
          maxLength={1000}
          placeholder="For example: resolve the succession crisis and return home."
          value={value.endingTarget}
          onChange={(event) => onChange({ ...value, endingTarget: event.target.value })}
        />
      </label>
      {!parsed.success && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {value.length === ""
            ? "Choose a campaign length before adding optional targets."
            : parsed.error.issues[0]?.message}
        </p>
      )}
    </fieldset>
  );
}
