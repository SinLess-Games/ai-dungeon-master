# AI DM token streaming

Campaign and private OOC DM replies render progressively in the campaign play screen.
Roll-resolution follow-up narration also streams. A thinking indicator covers source
lookups and structured planning; a temporary DM card displays arriving provider text.
The feed follows new text while the player is near the bottom and preserves their
position while reading older messages. Drafts stay scoped to the requesting player's
selected channel and are never published through campaign live events.

## Processing and persistence

Authentication, campaign access, character control, input validation, and outstanding
roll checks remain server-side. The player message is saved before generation. The
client clears the submitted composer when it receives confirmation of that save.

Structured turns still run the bounded planner and validated deterministic commands
first, including inventory awards, NPC memory, and alignment adjudication. Once the
turn is accepted, a presentation-only streaming model call renders its approved
narration, instructed to preserve facts, outcomes, and pacing. This adds one inference
call to a structured narration turn. Planning/tool JSON never reaches the browser;
player-roll requests are returned whole after validation and persistence. Private
OOC and basic narration stream their existing generation call directly.

Provider completion and campaign narration policy validation are required before
saving a DM reply. A rejected basic campaign draft is cleared before a corrective
retry. Partial, empty, truncated, and failed replies do not become saved DM messages.
Streamed prose has no game-state write capability. Already committed commands and
resolved rolls remain authoritative even if later narration fails or disconnects.

Navigation aborts the browser request. Reader cancellation propagates to the provider
stream, and cancellation checks stop subsequent planner calls/commands. An in-flight
D1 command is allowed to finish; cancellation never attempts to undo committed state.
The stream has a three-minute deadline. A Workers AI binding call awaiting its initial
response cannot be aborted through its current binding API; its returned reader is
cancelled once available. Refreshing history recovers completed writes if the final
network event was lost. The client never automatically retries a mutating POST.

## API and providers

These existing same-origin POST routes negotiate SSE with `Accept: text/event-stream`:

- `/api/campaigns/:campaignId/play/messages`
- `/api/campaigns/:campaignId/play/dm-actions/:actionId/resolve`

Without that header, existing JSON responses and status codes are retained. SSE
responses use HTTP 200 and `Cache-Control: private, no-store, no-transform`. Auth and
validation failures before streaming retain their normal HTTP error responses.

Events carry JSON data:

| Event      | Data                  | Meaning                                         |
| ---------- | --------------------- | ----------------------------------------------- |
| `status`   | string                | Initial thinking indicator                      |
| `saved`    | null                  | Player message or submitted roll committed      |
| `delta`    | string                | Temporary narration fragment                    |
| `reset`    | null                  | Discard the current draft                       |
| `complete` | existing response DTO | Finished result, including any `aiError`        |
| `error`    | public error string   | Stream interrupted; refetch authoritative state |

The shared provider adapter supports Workers AI `response` SSE fragments and
OpenAI-compatible `choices[].delta.content` fragments. It excludes reasoning and
provider metadata, bounds event/reply sizes, and rejects truncated finishes.
No new bindings, secrets, packages, or migrations are required. See
[Workers AI configuration](cloudflare-workers-ai.md).

## Verification

- `npm run test:unit -- tests/unit/dm-streaming.test.ts`
- `npm run test:e2e:campaign-play`: held-open mock proves partial text is visible
  before completion and only the final response is saved once.
- `npm run test:e2e:ai-dm-tools`: streaming preserves state commands, pending-roll
  enforcement, and continued narration after roll resolution; JSON clients remain covered.

Tests use disposable local D1 databases and mock providers. They do not certify live
provider availability or production proxy behavior.
