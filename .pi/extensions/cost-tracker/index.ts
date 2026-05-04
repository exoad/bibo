import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { readFileSync, writeFileSync, existsSync, watch } from "fs";
import { join } from "path";
import { execSync } from "child_process";

// Cost-tracker extension — simulates Claude API pricing in real-time.
// Tracks token usage from message_update events (text_delta, thinking_delta)
// and tool calls from tool_call events. Displays a running cost widget
// in the TUI. All costs are fake — you're running locally for free.
//
// STATE PERSISTENCE: Cost is saved to disk and accumulates across sessions.
// It NEVER resets — CostReset is now a no-op (just reports current total).

const STATE_FILE = join(
  process.env.HOME ?? "/tmp",
  ".pi",
  "extensions",
  "cost-tracker",
  "state.json",
);

// ── Claude Sonnet pricing (per 1M tokens) ──────────────────────────────
const PRICING = {
  input_per_m: 3,       // $3 per 1M input tokens
  output_per_m: 15,     // $15 per 1M output tokens
  thinking_per_m: 3,    // $3 per 1M thinking tokens (same as input)
  cache_read_per_m: 0.3, // $0.30 per 1M cache-read tokens
  cache_write_per_m: 3.75, // $3.75 per 1M cache-write tokens (5m TTL)
  tool_call_base: 0.005, // $0.005 per tool call
} as const;

// ── Per-tool call surcharges (fake, for drama) ─────────────────────────
const TOOL_SURCHARGES: Record<string, number> = {
  read: 0.001,
  write: 0.003,
  edit: 0.005,
  bash: 0.002,
  grep: 0.001,
  find: 0.001,
  glob: 0.001,
  webfetch: 0.01,
  websearch: 0.05,
  BrowserNavigate: 0.02,
  BrowserClick: 0.01,
  BrowserType: 0.01,
  BrowserExtract: 0.02,
  ShellSession: 0.005,
};

interface CostState {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  toolCalls: number;
  toolSurchargeTotal: number;
  totalCost: number;
}

function loadState(): CostState {
  try {
    if (existsSync(STATE_FILE)) {
      const raw = readFileSync(STATE_FILE, "utf-8");
      return JSON.parse(raw) as CostState;
    }
  } catch {
    // Corrupt file — start fresh
  }
  return {
    inputTokens: 0,
    outputTokens: 0,
    thinkingTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    toolCalls: 0,
    toolSurchargeTotal: 0,
    totalCost: 0,
  };
}

function saveState(): void {
  try {
    const dir = STATE_FILE.split("/").slice(0, -1).join("/");
    if (!existsSync(dir)) {
      execSync(`mkdir -p "${dir}"`);
    }
    // Atomic write to avoid corruption when multiple instances write simultaneously
    const tmpFile = STATE_FILE + ".tmp";
    writeFileSync(tmpFile, JSON.stringify(state, null, 2), "utf-8");
    execSync(`mv -f "${tmpFile}" "${STATE_FILE}"`);
  } catch {
    // Silently fail — we don't want disk errors to crash the agent
  }
}

// Load persisted state on init (accumulates across sessions)
const state: CostState = loadState();

// ── Multi-instance sync ──────────────────────────────────────────────
let watcher: ReturnType<typeof watch> | null = null;
let isExternalUpdate = false;
let lastMtime = 0;

function reloadState(): void {
  try {
    if (!existsSync(STATE_FILE)) return;
    const stat = require("fs").statSync(STATE_FILE);
    if (stat.mtimeMs === lastMtime) return;
    lastMtime = stat.mtimeMs;

    const raw = readFileSync(STATE_FILE, "utf-8");
    const fresh = JSON.parse(raw) as CostState;

    // Only sync TOKEN counters (global across all instances).
    // toolCalls and toolSurchargeTotal are SESSION-SPECIFIC and must NOT
    // be merged — otherwise each instance sees all other instances' tool
    // calls in its widget and cost breakdown.
    state.inputTokens = Math.max(state.inputTokens, fresh.inputTokens);
    state.outputTokens = Math.max(state.outputTokens, fresh.outputTokens);
    state.thinkingTokens = Math.max(state.thinkingTokens, fresh.thinkingTokens);
    state.cacheReadTokens = Math.max(state.cacheReadTokens, fresh.cacheReadTokens);
    state.cacheWriteTokens = Math.max(state.cacheWriteTokens, fresh.cacheWriteTokens);
    // NOTE: toolCalls and toolSurchargeTotal are NOT synced — they are
    // per-session counters. Each instance tracks its own tool usage.
    recalcCost();
  } catch {
    // Ignore read/parse errors
  }
}

function startWatcher(): void {
  if (watcher) return;
  try {
    const dir = STATE_FILE.split("/").slice(0, -1).join("/");
    if (!existsSync(dir)) {
      execSync(`mkdir -p "${dir}"`);
    }
    watcher = watch(dir, { persistent: false, recursive: false }, (eventType, filename) => {
      if (filename === "state.json" && eventType === "change") {
        isExternalUpdate = true;
        reloadState();
        isExternalUpdate = false;
      }
    });
  } catch {
    // fs.watch may not work on all platforms — periodic poll is the fallback
  }
}

function stopWatcher(): void {
  if (watcher) {
    try { watcher.close(); } catch {}
    watcher = null;
  }
}

function markDirty(): void {
  if (isExternalUpdate) return; // Don't re-save when reacting to external changes
  saveState();
}

function formatCost(cents: number): string {
  const dollars = cents / 100;
  if (dollars < 0.01) return `$${cents.toFixed(2)}`;
  if (dollars < 1) return `$${dollars.toFixed(2)}`;
  return `$${dollars.toFixed(2)}`;
}

// Per-session counters (NOT synced across instances)
let sessionToolCalls = 0;
let sessionToolSurchargeTotal = 0;

function recalcCost(): void {
  // totalCost only includes synced token counters.
  // Tool call surcharges are session-local and shown in the widget separately.
  state.totalCost =
    (state.inputTokens / 1_000_000) * PRICING.input_per_m +
    (state.outputTokens / 1_000_000) * PRICING.output_per_m +
    (state.thinkingTokens / 1_000_000) * PRICING.thinking_per_m +
    (state.cacheReadTokens / 1_000_000) * PRICING.cache_read_per_m +
    (state.cacheWriteTokens / 1_000_000) * PRICING.cache_write_per_m +
    sessionToolCalls * PRICING.tool_call_base +
    sessionToolSurchargeTotal;
  markDirty();
}

function costLine(): string {
  return formatCost(state.totalCost * 100);
}

let sessionStart = Date.now();
let widgetTimer: ReturnType<typeof setInterval> | undefined;
let syncTimer: ReturnType<typeof setInterval> | undefined;

function uptimeLine(): string {
  const s = Math.floor((Date.now() - sessionStart) / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return ` ${h}h ${m % 60}m`;
  if (m > 0) return ` ${m}m ${s % 60}s`;
  return ` ${s}s`;
}

function costWidgetCompact(): string {
  const parts: string[] = [costLine()];
  if (state.inputTokens > 0) parts.push(`in:${(state.inputTokens / 1000).toFixed(0)}K`);
  if (state.outputTokens > 0) parts.push(`out:${(state.outputTokens / 1000).toFixed(0)}K`);
  if (state.thinkingTokens > 0) parts.push(`th:${(state.thinkingTokens / 1000).toFixed(0)}K`);
  // Show session-local tool call count (not synced)
  if (sessionToolCalls > 0) parts.push(`tc:${sessionToolCalls}`);
  parts.push(uptimeLine().trim());
  return parts.join(" ");
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    // NOTE: Cost state is NEVER reset — it accumulates across all sessions.
    // sessionStart tracks per-session uptime for the widget.
    sessionStart = Date.now();

    // Start file watcher for multi-instance sync
    startWatcher();
    // Fallback: poll every 2s to catch changes from other instances
    // (fs.watch is unreliable on some platforms / network drives)
    syncTimer = setInterval(() => {
      reloadState();
    }, 2000);

    if (!ctx.hasUI) return;
    // Update widget every 1s
    widgetTimer = setInterval(() => {
      ctx.ui.setWidget("cost", [costWidgetCompact()]);
    }, 1000);
    ctx.ui.setWidget("cost", [costWidgetCompact()]);
    // Cleanup on session end
    pi.on("session_shutdown", () => {
      if (widgetTimer) clearInterval(widgetTimer);
      if (syncTimer) clearInterval(syncTimer);
      stopWatcher();
      ctx.ui.setWidget("cost", undefined);
    });
  });

  // Track token usage from message updates
  pi.on("message_update", async (event) => {
    const ev: any = (event as any).assistantMessageEvent;
    if (!ev || !ev.delta) return;

    if (ev.type === "text_delta") {
      state.outputTokens += ev.delta.length;
      recalcCost();
    } else if (ev.type === "thinking_delta") {
      state.thinkingTokens += ev.delta.length;
      recalcCost();
    }
  });

  // Track tool calls
  pi.on("tool_call", async (event) => {
    const toolName = (event as any).toolName;
    if (typeof toolName !== "string") return;

    // Session-local counters (not synced across instances)
    sessionToolCalls++;
    sessionToolSurchargeTotal += TOOL_SURCHARGES[toolName] || 0;

    // Estimate input tokens from tool call argument size (synced)
    const input: any = (event as any).input ?? (event as any).args;
    const argStr = typeof input === "string" ? input : JSON.stringify(input);
    state.inputTokens += argStr.length;

    recalcCost();
  });

  // Track tool results (output tokens from tool responses)
  pi.on("tool_result", async (event) => {
    const result: any = (event as any).result;
    if (!result) return;
    const content: any = result?.content;
    if (!content || !Array.isArray(content)) return;
    for (const block of content) {
      if (block.type === "text" && typeof block.text === "string") {
        state.outputTokens += block.text.length;
      }
    }
    recalcCost();
  });

  // Track done events for usage info if available
  pi.on("message_end", async (event) => {
    const msg: any = (event as any).message;
    if (!msg || !msg.usage) return;
    const u = msg.usage;
    if (u.input) state.inputTokens += u.input;
    if (u.output) state.outputTokens += u.output;
    if (u.cache_read) state.cacheReadTokens += u.cache_read;
    if (u.cache_write) state.cacheWriteTokens += u.cache_write;
    recalcCost();
  });

  // Register a CostReset tool — now a no-op since cost never resets.
  // It reports the current accumulated total instead.
  pi.registerTool({
    name: "CostReset",
    label: "CostReset",
    description:
      "Cost is now global and never resets. This tool reports the current accumulated total.",
    parameters: Type.Object({}),
    async execute() {
      return {
        content: [
          {
            type: "text",
            text: `💸 Cost is global and never resets. Current accumulated total: ${formatCost(state.totalCost * 100)}`,
          },
        ],
        details: {},
      };
    },
  });

  // Register a CostReport tool — shows full breakdown
  pi.registerTool({
    name: "CostReport",
    label: "CostReport",
    description:
      "Print a detailed breakdown of the accumulated fake billing.",
    parameters: Type.Object({}),
    async execute() {
      const c = formatCost(state.totalCost * 100);
      const lines = [
        `=== Fake Billing Report (Accumulated) ===`,
        `Total cost: ${c}`,
        ``,
        `Token breakdown (synced across all instances):`,
        `  Input:     ${(state.inputTokens / 1000).toFixed(0)}K tokens  →  $${((state.inputTokens / 1_000_000) * PRICING.input_per_m).toFixed(4)}`,
        `  Output:    ${(state.outputTokens / 1000).toFixed(0)}K tokens  →  $${((state.outputTokens / 1_000_000) * PRICING.output_per_m).toFixed(4)}`,
        `  Thinking:  ${(state.thinkingTokens / 1000).toFixed(0)}K tokens  →  $${((state.thinkingTokens / 1_000_000) * PRICING.thinking_per_m).toFixed(4)}`,
        `  Cache read: ${(state.cacheReadTokens / 1000).toFixed(0)}K tokens  →  $${((state.cacheReadTokens / 1_000_000) * PRICING.cache_read_per_m).toFixed(4)}`,
        `  Cache write: ${(state.cacheWriteTokens / 1000).toFixed(0)}K tokens  →  $${((state.cacheWriteTokens / 1_000_000) * PRICING.cache_write_per_m).toFixed(4)}`,
        ``,
        `Tool calls (this session only): ${sessionToolCalls}  →  $${(sessionToolCalls * PRICING.tool_call_base).toFixed(4)}`,
        `Tool surcharges (this session only): $${sessionToolSurchargeTotal.toFixed(4)}`,
        ``,
        `⚠️  All costs are fake. You're running locally for free.`,
        `💾 Token state synced to: ${STATE_FILE}`,
      ];
      return {
        content: [{ type: "text", text: lines.join("\n") }],
        details: {},
      };
    },
  });
}
