import type { DmPlannerCommand, DmTurnDecision } from "./dmToolPlanner";

export interface DmToolExecutionRecord {
  command: DmPlannerCommand;
  result: unknown;
}

export interface DmToolLoopResult {
  decision: Extract<DmTurnDecision, { kind: "narration" | "check" }>;
  executions: DmToolExecutionRecord[];
}

/**
 * Runs immediate authoritative DM commands until the planner reaches narration
 * or a player-supplied check. The bound prevents a malformed model from
 * creating an unbounded command loop.
 */
export async function runDmToolLoop(input: {
  plan: (executions: readonly DmToolExecutionRecord[]) => Promise<DmTurnDecision>;
  execute: (command: DmPlannerCommand) => Promise<unknown>;
  initialExecutions?: readonly DmToolExecutionRecord[];
  maxCommands?: number;
}): Promise<DmToolLoopResult> {
  const executions = [...(input.initialExecutions ?? [])];
  const maxCommands = input.maxCommands ?? 4;
  if (!Number.isSafeInteger(maxCommands) || maxCommands < 1 || maxCommands > 12) {
    throw new RangeError("AI DM tool loop maxCommands must be between 1 and 12.");
  }

  for (let step = 0; step <= maxCommands; step += 1) {
    const decision = await input.plan(executions);
    if (decision.kind !== "command") return { decision, executions };
    if (step === maxCommands) throw new Error("AI_DM_TOOL_LOOP_LIMIT");
    const result = await input.execute(decision.command);
    executions.push({ command: decision.command, result });
  }

  throw new Error("AI_DM_TOOL_LOOP_LIMIT");
}
