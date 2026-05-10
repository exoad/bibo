/**
 * Activity Indicator - Shows what the agent is currently doing
 *
 * Colored bar indicator that reflects agent activity type:
 * - Tool calls (bash, read, edit, write, etc.)
 * - Web search / fetch
 * - Browser actions
 * - Shell sessions
 * - Code reasoning
 * - Skill usage
 * - Evidence actions
 * - File operations
 *
 * Uses ctx.ui.setStatus() with theme colors for safe TUI rendering.
 * All handlers are wrapped in try-catch to never crash sessions.
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";

const BAR_WIDTH = 12;
const BAR = "█".repeat(BAR_WIDTH);

// Activity definitions with theme-safe color names (no raw ANSI codes)
const ACTIVITIES: Record<string, { themeColor: string; label: string }> = {
  idle: { themeColor: "dim", label: "IDLE" },
  ready: { themeColor: "green", label: "READY" },
  thinking: { themeColor: "yellow", label: "THINKING" },
  streaming: { themeColor: "magenta", label: "STREAMING" },
  tool_bash: { themeColor: "blue", label: "BASH" },
  tool_read: { themeColor: "green", label: "READ" },
  tool_edit: { themeColor: "yellow", label: "EDIT" },
  tool_write: { themeColor: "red", label: "WRITE" },
  tool_glob: { themeColor: "cyan", label: "GLOB" },
  tool_grep: { themeColor: "yellow", label: "GREP" },
  tool_webfetch: { themeColor: "blue", label: "WEB" },
  tool_websearch: { themeColor: "green", label: "SEARCH" },
  tool_browser: { themeColor: "cyan", label: "BROWSER" },
  tool_shell_session: { themeColor: "yellow", label: "SHELL" },
  tool_code_reasoning: { themeColor: "magenta", label: "REASON" },
  tool_skill: { themeColor: "cyan", label: "SKILL" },
  tool_evidence: { themeColor: "magenta", label: "EVIDENCE" },
  tool_file: { themeColor: "red", label: "FILE" },
  tool_other: { themeColor: "dim", label: "TOOL" },
};

// State tracking
let currentActivity = "idle";
let activityHistory: string[] = [];
let lastActivityTime = Date.now();
let lastStatusUpdate = 0;
const STATUS_THROTTLE_MS = 200; // Prevent rapid flickering

function getActivityInfo(activity: string): { themeColor: string; label: string } {
  return ACTIVITIES[activity] || ACTIVITIES.tool_other;
}

function safeSetActivity(ctx: ExtensionContext, activity: string): void {
  try {
    if (activity === currentActivity) return;

    // Throttle status updates to prevent flickering
    const now = Date.now();
    if (now - lastStatusUpdate < STATUS_THROTTLE_MS && currentActivity !== "idle") {
      currentActivity = activity;
      return;
    }
    lastStatusUpdate = now;

    const prevActivity = currentActivity;
    currentActivity = activity;
    lastActivityTime = now;

    // Track activity history
    if (prevActivity !== activity) {
      activityHistory.push(`${prevActivity}→${activity} @ ${new Date().toLocaleTimeString()}`);
      if (activityHistory.length > 20) {
        activityHistory = activityHistory.slice(-20);
      }
    }

    const info = getActivityInfo(activity);
    const coloredBar = ctx.ui.theme.fg(info.themeColor, BAR);
    const coloredLabel = ctx.ui.theme.fg(info.themeColor, info.label);
    const statusText = `${coloredBar} ${coloredLabel}`;

    ctx.ui.setStatus("activity-indicator", statusText);
  } catch (_err) {
    // Never crash the session - silently fail
    currentActivity = activity;
  }
}

function getActivityFromToolName(toolName: string): string {
  try {
    if (!toolName) return "tool_other";
    const name = toolName.toLowerCase().replace(/[_-]/g, "");

    if (name === "bash" || name === "shellsession") return "tool_bash";
    if (name === "read") return "tool_read";
    if (name === "edit" || name === "editdiff") return "tool_edit";
    if (name === "write") return "tool_write";
    if (name === "glob") return "tool_glob";
    if (name === "grep") return "tool_grep";
    if (name === "webfetch") return "tool_webfetch";
    if (name === "websearch" || name === "bravesearch") return "tool_websearch";
    if (name.startsWith("browser")) return "tool_browser";
    if (name === "headlessnavigate" || name === "headlessextract" || name === "headlesssearch" || name === "headlessback" || name === "headlesshistory") return "tool_browser";
    if (name === "codereasoning" || name === "reasoning") return "tool_code_reasoning";
    if (name.startsWith("skill")) return "tool_skill";
    if (name.startsWith("evidence")) return "tool_evidence";
    if (name.startsWith("file") || name === "ls" || name === "find") return "tool_file";

    return "tool_other";
  } catch {
    return "tool_other";
  }
}

// Wrap handler to never crash the session
function safeHandler(handler: (event: any, ctx: ExtensionContext) => void) {
  return async (event: any, ctx: ExtensionContext) => {
    try {
      handler(event, ctx);
    } catch (_err) {
      // Silently swallow errors to protect the session
    }
  };
}

export default function (pi: ExtensionAPI) {
  // Session begins - agent is ready
  pi.on("session_start", safeHandler((_event, ctx) => {
    safeSetActivity(ctx, "ready");
  }));

  // Agent starts processing
  pi.on("agent_start", safeHandler((_event, ctx) => {
    safeSetActivity(ctx, "thinking");
  }));

  // Agent done - back to ready
  pi.on("agent_end", safeHandler((_event, ctx) => {
    safeSetActivity(ctx, "ready");
  }));

  // Turn boundaries
  pi.on("turn_start", safeHandler((_event, ctx) => {
    if (currentActivity !== "streaming") {
      safeSetActivity(ctx, "thinking");
    }
  }));

  pi.on("turn_end", safeHandler((_event, ctx) => {
    safeSetActivity(ctx, "ready");
  }));

  // Tool execution start - show what tool is being used
  pi.on("tool_execution_start", safeHandler((event, ctx) => {
    const toolName = event?.toolName || event?.name || event?.tool?.name || "unknown";
    const activity = getActivityFromToolName(toolName);
    safeSetActivity(ctx, activity);
  }));

  // Tool execution end - return to thinking
  pi.on("tool_execution_end", safeHandler((_event, ctx) => {
    safeSetActivity(ctx, "thinking");
  }));

  // Message streaming
  pi.on("message_update", safeHandler((event, ctx) => {
    const msgEvent = event?.assistantMessageEvent;
    if (
      msgEvent?.type === "text_delta" ||
      msgEvent?.type === "thinking_delta" ||
      msgEvent?.type === "toolcall_delta"
    ) {
      safeSetActivity(ctx, "streaming");
    }
  }));

  pi.on("message_start", safeHandler((_event, ctx) => {
    safeSetActivity(ctx, "thinking");
  }));

  pi.on("message_end", safeHandler((_event, ctx) => {
    safeSetActivity(ctx, "ready");
  }));

  // Register command to view activity history
  pi.registerCommand("activity-history", {
    description: "Show recent activity history",
    handler: async (_args, ctx) => {
      try {
        if (activityHistory.length === 0) {
          ctx.ui.notify("No activity recorded yet.", "info");
          return;
        }
        const historyText = activityHistory.join("\n");
        ctx.ui.notify(`Activity History:\n${historyText}`, "info");
      } catch {
        // Silently fail
      }
    },
  });

  // Register command to show current activity
  pi.registerCommand("activity-status", {
    description: "Show current agent activity",
    handler: async (_args, ctx) => {
      try {
        const info = getActivityInfo(currentActivity);
        const timeSince = Math.round((Date.now() - lastActivityTime) / 1000);
        ctx.ui.notify(`Current activity: ${info.label}\nTime since change: ${timeSince}s`, "info");
      } catch {
        // Silently fail
      }
    },
  });
}
