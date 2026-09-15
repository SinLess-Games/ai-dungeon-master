# Campaign length and pacing

The campaign wizard's Concept step and the draft editor support **short**, **medium**,
**long**, and **endless** campaigns. The Review step summarizes the selection and
optional targets before saving. New wizard drafts default to medium; players may
choose Unspecified. Older campaigns remain unspecified until a length is selected.
As with other campaign setup settings, editing is locked after campaign start.

Optional targets are:

- Estimated sessions: an integer from 1 to 1,000.
- Starting and/or ending level: integers from 1 to 100; when both are supplied,
  the ending level must be at least the starting level.
- Ending target: up to 1,000 characters describing the desired resolution.

These are planning preferences, not character-creation settings or progression
rules. Level targets do not create higher-level characters or grant XP. For endless
campaigns, session estimates and ending targets apply to the current story arc;
the overall campaign has no planned finale. Blank optional fields are omitted.
Choose a length before adding targets, or clear all duration fields to leave the
plan unspecified.

## Persistence and validation

The existing campaign settings JSON stores the plan at `settings.duration`:

```json
{
  "duration": {
    "length": "short",
    "estimatedSessions": 6,
    "startLevel": 1,
    "endLevel": 5,
    "endingTarget": "Resolve the succession crisis and return home."
  },
  "pace": "moderate"
}
```

No database migration is required. Both `POST /api/campaigns` and
`PATCH /api/campaigns/:campaignId` validate supplied duration settings, including
legacy/unversioned settings payloads. Invalid values return HTTP 400 before a write.
Existing payloads without duration remain valid. The draft editor retains duration
through unrelated edits and trims the ending target when saving.

## AI DM behavior

`src/modules/campaigns/domain/duration.ts` supplies a dedicated pacing section to
ordinary campaign/OOC replies and both turn-planner modes, including planning after
an authoritative action. This section is separate from the general settings JSON's
truncation budget, so a long description or house-rule block cannot remove it.

- Short: focus on one conflict, give actionable clues early, limit detours, and
  advance toward resolution.
- Medium: develop connected adventures with escalation and payoffs leading to a finale.
- Long: allow multiple arcs, character development, and distant consequences, with
  regular intermediate payoffs.
- Endless: resolve individual arcs and introduce new opportunities without forcing
  an overall finale.

The existing slow/moderate/fast pace setting separately controls scene rhythm.
Session estimates are flexible budgets. The DM must not count chat messages as
sessions or invent elapsed session counts. Ending targets remain story preferences;
player agency, validated rules, and authoritative state take precedence. This does
not add a session counter, automatic campaign completion, or a guarantee that every
model response follows the requested pacing.

## Verification

- `tests/unit/campaign-duration.test.ts`: validation, legacy defaults, form round trips,
  distinct pacing guidance, and advisory target semantics.
- `tests/unit/dm-ai-provider-contract.test.ts`: both planners receive pacing even
  with oversized general settings.
- `npm run test:e2e:campaign`: wizard save, draft reload/edit, and rejection of
  invalid duration values through both API write paths.
- `npm run test:e2e:campaign-play`: persisted duration reaches the mocked AI provider
  through the active campaign conversation flow.
