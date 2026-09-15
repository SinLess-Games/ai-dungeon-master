# AI prompts

AI system messages, user-message templates, and shared instruction sections live
here as individual TypeScript modules. Static text is exported as a constant;
dynamic templates are pure functions with typed inputs. Import the needed module
directly with `@/prompts/...`.

| Files                                                    | Purpose                                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------- |
| `dmReplySystem.ts`, `dmReplyUser.ts`                     | Campaign and private OOC replies, including paused campaigns              |
| `dmTurnSystem.ts`, `dmTurnUser.ts`                       | Structured planning over authoritative game commands                      |
| `legacyDmReply*.ts`, `legacyDmTurn*.ts`                  | Existing compatibility reply and check-only planning paths                |
| `dmSystemReferenceSystem.ts`, `dmSystemReferenceUser.ts` | Source-backed rules catalog lookup planning                               |
| `alignmentSystem.ts`, `alignmentUser.ts`                 | Bounded alignment adjudication                                            |
| `dmNarrationSystem.ts`, `dmNarrationUser.ts`             | Streaming approved narration                                              |
| `weeklyDevblogSystem.ts`, `weeklyDevblogUser.ts`         | Weekly development journal generation                                     |
| `campaignNarrationPolicy.ts`, `campaignPacing.ts`        | Shared narration and pacing instructions                                  |
| `dmConversationContext.ts`, `dmTurnContext.ts`           | Character sheets, NPC memory, private conversation, and reference context |
| `dmNarrationRetry.ts`, `dmRepeatedCheckCorrection.ts`    | Corrective instructions after rejected output or repeated checks          |

Keep database reads, provider calls/options, response validation, authorization,
and state changes in their existing feature services. Pass already-loaded context
to these templates. Preserve serialization limits and private-context boundaries
when editing prompts. Types imported from feature services use `import type`.

Tests keep independent fixture strings and expected-output assertions. They are
not application prompts. Prompt-related tests include `dm-ai-provider-contract`,
`dm-tool-planner`, `dm-system-reference-planner`, `dm-streaming`,
`dm-character-profiles`, `campaign-duration`, and `devblog-ai` under `tests/unit/`.
