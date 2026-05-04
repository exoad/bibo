// Port of local/quality.py::assess_response + build_correction_message.
// TUNED for efficiency: works well across all model sizes (local, cloud, big, small).
// Key principles: don't spam, allow legitimate repeats, keep corrections actionable.

export interface ToolCall {
  name: string;
  input: unknown;
}

export type QualityResult =
  | { ok: true }
  | { ok: false; reason: string };

/** Deep equality that ignores key ordering and whitespace differences in JSON.
 *  Models may produce slightly different JSON formatting for the same semantic call. */
function inputsEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (a === null || b === null) return false;
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const aKeys = Object.keys(ao).sort();
  const bKeys = Object.keys(bo).sort();
  if (aKeys.length !== bKeys.length) return false;
  for (let i = 0; i < aKeys.length; i++) {
    if (aKeys[i] !== bKeys[i]) return false;
    if (!inputsEqual(ao[aKeys[i]], bo[bKeys[i]])) return false;
  }
  return true;
}

export function assessResponse(
  text: string,
  toolCalls: ToolCall[],
  recentToolCalls: ToolCall[],
  knownTools: Set<string>,
): QualityResult {
  const trimmedText = text.trim();

  // 1. Empty response with no tool calls
  if (!trimmedText && toolCalls.length === 0) {
    return { ok: false, reason: "empty_response" };
  }

  // 2. Hallucinated tool names (only checked when registry has enough tools)
  const hasToolRegistry = knownTools.size >= 5;
  for (const tc of toolCalls) {
    if (!tc.name) return { ok: false, reason: "empty_tool_name" };
    if (hasToolRegistry) {
      const nameLower = tc.name.toLowerCase();
      const knownLower = Array.from(knownTools).map(k => k.toLowerCase());
      if (!knownLower.includes(nameLower)) {
        return { ok: false, reason: `unknown_tool:${tc.name}` };
      }
    }
  }

  // 3. Repeated tool call loop — TUNED:
  //   - Only flag if ALL tool calls in this turn exactly match ALL in previous turn
  //   - Allow commonly repeated tools (read/edit/bash/grep/glob) with any text
  //   - Require some explanation text (>30 chars) to avoid false positives
  if (toolCalls.length > 0 && recentToolCalls.length > 0) {
    const commonlyRepeated = new Set([
      "read", "edit", "bash", "Bash", "glob", "grep", "find",
      "Read", "Edit", "Glob", "Grep", "Find",
    ]);
    const allCommon = toolCalls.every(tc => commonlyRepeated.has(tc.name));

    if (toolCalls.length === recentToolCalls.length) {
      let allMatch = true;
      for (let i = 0; i < toolCalls.length; i++) {
        if (toolCalls[i].name !== recentToolCalls[i].name ||
            !inputsEqual(toolCalls[i].input, recentToolCalls[i].input)) {
          allMatch = false;
          break;
        }
      }

      if (allMatch) {
        // If model provided explanation text, likely not a loop
        if (trimmedText.length > 30) {
          return { ok: true };
        }
        // Allow commonly repeated tools if there's ANY text
        if (allCommon && trimmedText.length > 0) {
          return { ok: true };
        }
        return { ok: false, reason: "repeated_tool_call" };
      }
    }
  }

  // 4. Malformed arguments sentinel from repairJson fallback
  for (const tc of toolCalls) {
    if (tc.input && typeof tc.input === "object" && "_raw" in tc.input) {
      return { ok: false, reason: `malformed_args:${tc.name || "?"}` };
    }
  }

  return { ok: true };
}

export function buildCorrectionMessage(reason: string, lastTool?: string): string {
  // Universal corrections — concise, actionable, not condescending.
  // Works for all model sizes from 3B local to cloud APIs.
  const corrections: Record<string, string> = {
    empty_response:
      "Please respond with text or a tool call to continue.",
    empty_tool_name:
      "Tool name missing. Try: Read, Write, Edit, Bash, Glob, or Grep.",
    repeated_tool_call:
      "Same tool calls as last turn. Try a different approach or explain your plan. " +
      (lastTool
        ? `You used ${lastTool} repeatedly. Consider: Bash, Glob, Grep, or text.`
        : "Consider a different tool or answering with text."),
  };

  if (reason.startsWith("unknown_tool:")) {
    const toolName = reason.slice("unknown_tool:".length);
    return `Tool '${toolName}' not found. Use: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch.`;
  }
  if (reason.startsWith("malformed_args:")) {
    const toolName = reason.slice("malformed_args:".length);
    return `Tool '${toolName}' args malformed. Provide valid JSON.`;
  }

  return corrections[reason] ?? `Issue: ${reason}. Please try again.`;
}
