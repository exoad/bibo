import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { assessResponse, buildCorrectionMessage, type ToolCall } from "./quality.ts";
import { state as sharedState } from "../shared-state";

// Port of local/quality.py. Hooks turn_end, inspects the assistant message
// + previous turn's tool calls, and — if we detect a failure mode — queues
// a correction user message via session.followUp() so the model gets a
// chance to recover on its next turn.

// Session-scoped state. Pi reuses extensions across turns within a session;
// a fresh extension instance is loaded per session via the session lifecycle.
let previousToolCalls: ToolCall[] = [];
let consecutiveFailures = 0;
let lastCorrectionTime = 0;
const MAX_CONSECUTIVE_CORRECTIONS = 1; // stop nudging after 1 failed correction
const CORRECTION_COOLDOWN_MS = 30000; // minimum 30s between corrections to prevent spam

export default function (pi: ExtensionAPI) {
  // Populate the known-tools set lazily by observing tool_execution events.
  // This avoids needing to read pi's tool registry directly.
  const knownTools = new Set<string>();
  pi.on("tool_execution_start", async (event) => {
    const name = (event as any).toolName;
    if (typeof name === "string") knownTools.add(name);
  });

  pi.on("session_start", async () => {
    previousToolCalls = [];
    consecutiveFailures = 0;
  });

  pi.on("turn_end", async (event, ctx) => {
    const message = (event as any).message;
    if (!message) return;

    // Extract assistant text + tool calls from pi's content-block format
    const content = Array.isArray(message.content) ? message.content : [];
    const text = content
      .filter((c: any) => c?.type === "text")
      .map((c: any) => c.text ?? "")
      .join("\n");
    const currentCalls: ToolCall[] = content
      .filter((c: any) => c?.type === "toolCall")
      .map((c: any) => ({ name: c.name, input: c.arguments ?? c.input ?? {} }));

    const verdict = assessResponse(text, currentCalls, previousToolCalls, knownTools);

    // Update rolling state for next turn regardless of verdict
    previousToolCalls = currentCalls;

    if (verdict.ok) {
      consecutiveFailures = 0;
      return;
    }

    // Cap corrections so we don't burn turns in a correction loop
    consecutiveFailures++;
    if (consecutiveFailures > MAX_CONSECUTIVE_CORRECTIONS) {
      ctx.ui.notify(
        `quality-monitor: ${verdict.reason} (suppressed after ${consecutiveFailures} in a row)`,
        "warning",
      );
      return;
    }

    // Cooldown: don't send corrections more frequently than every 30 seconds
    const now = Date.now();
    if (now - lastCorrectionTime < CORRECTION_COOLDOWN_MS) {
      ctx.ui.notify(
        `quality-monitor: ${verdict.reason} (cooldown: ${Math.ceil((CORRECTION_COOLDOWN_MS - (now - lastCorrectionTime)) / 1000)}s remaining)`,
        "warning",
      );
      return;
    }
    lastCorrectionTime = now;

    // Track the last tool call name for better correction messages
    const lastToolName = currentCalls.length > 0 ? currentCalls[0].name : undefined;
    const correction = buildCorrectionMessage(verdict.reason, lastToolName);
    ctx.ui.notify(
      `quality-monitor: ${verdict.reason} → queued correction`,
      "warning",
    );
    // Signal skill-inject that a correction was sent, so it can inject
    // anti-loop guidance on the next turn.
    sharedState.correctionSent = true;
    pi.sendUserMessage(correction, { deliverAs: "followUp" });
  });
}
