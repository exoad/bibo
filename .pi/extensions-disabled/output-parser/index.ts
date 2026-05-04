import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { parseTextToolCalls } from "./parser.ts";

// Detects malformed/fenced tool calls in assistant text and nudges the model
// back onto native tool-calling. Active-repair (executing extracted calls
// and synthesizing tool_result messages) is intentionally not attempted on
// the headline Qwen3.6-35B-A3B path, which uses native tool calling. When
// extracted calls ARE detected, we log them via ctx.ui.notify and queue a
// follow-up nudge for the next turn.

function extractAssistantText(message: any): string {
  if (!message) return "";
  const content = message.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.filter((c) => c?.type === "text").map((c) => c.text).join("\n");
  }
  return "";
}

function hasNativeToolCalls(message: any): boolean {
  const content = message?.content;
  if (!Array.isArray(content)) return false;
  return content.some((c: any) => c?.type === "toolCall");
}

export default function (pi: ExtensionAPI) {
  pi.on("turn_end", async (event, ctx) => {
    const message = (event as any).message;
    if (!message) return;
    // If pi already detected native tool calls, nothing to rescue.
    if (hasNativeToolCalls(message)) return;
    const text = extractAssistantText(message);
    if (!text) return;

    const calls = parseTextToolCalls(text);
    if (calls.length === 0) return;

    const names = calls.map((c) => c.name).join(", ");
    ctx.ui.notify(
      `Detected ${calls.length} text-embedded tool call(s) [${names}] — nudging model to native tool calling`,
      "warning",
    );

    // Queue a follow-up that will be delivered after the agent finishes.
    // This nudges the model to use native tool calling on its next turn
    // rather than emitting fenced blocks in text.
    // Concise nudge — works for all model sizes.
    pi.sendUserMessage(
      "Use native tool calls, not text blocks. Call tools directly instead of writing fenced code blocks.",
      { deliverAs: "followUp" },
    );
  });
}
