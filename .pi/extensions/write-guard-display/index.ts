import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  Container,
  Spacer,
  Text,
} from "@mariozechner/pi-tui";
import {
  loadToolDisplayConfig,
  normalizeToolDisplayConfig,
  saveToolDisplayConfig,
} from "./config-store.js";
import {
  applyCapabilityConfigGuards,
  detectToolDisplayCapabilities,
  type ToolDisplayCapabilities,
} from "./capabilities.js";
import { registerToolDisplayCommand } from "./config-modal.js";
import { registerThinkingLabeling } from "./thinking-label.js";
import registerNativeUserMessageBox from "./user-message-box-native.js";
import {
  BUILT_IN_TOOL_OVERRIDE_NAMES,
  type ToolDisplayConfig,
} from "./types.js";
import { renderEditDiffResult, renderWriteDiffResult } from "./diff-renderer.js";
import {
  extractTextOutput,
  shortenPath,
} from "./render-utils.js";

// === Write Guard + Display Extension ===
// Merges write-guard's protection (refuse write on existing files)
// with pi-tool-display's visual enhancements

function ownershipChanged(
  previous: ToolDisplayConfig,
  next: ToolDisplayConfig,
): boolean {
  return BUILT_IN_TOOL_OVERRIDE_NAMES.some(
    (toolName) =>
      previous.registerToolOverrides[toolName] !==
      next.registerToolOverrides[toolName],
  );
}

interface RenderTheme {
  fg(color: string, text: string): string;
  bg?(color: string, text: string): string;
  bold(text: string): string;
  getBgAnsi?(color: string): string;
}

// Removed ToolRenderResult interface - renderers should return Component directly

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function writeGuardDisplayExtension(pi: ExtensionAPI): void {
  const initial = loadToolDisplayConfig();
  let config: ToolDisplayConfig = initial.config;
  let pendingLoadError = initial.error;
  let capabilities: ToolDisplayCapabilities = {
    hasMcpTooling: false,
    hasRtkOptimizer: false,
  };

  const refreshCapabilities = (): void => {
    capabilities = detectToolDisplayCapabilities(pi, process.cwd());
  };

  const getConfig = (): ToolDisplayConfig => config;
  const getCapabilities = (): ToolDisplayCapabilities => capabilities;
  const getEffectiveConfig = (): ToolDisplayConfig =>
    applyCapabilityConfigGuards(config, capabilities);

  const setConfig = (
    next: ToolDisplayConfig,
    ctx: ExtensionCommandContext,
  ): void => {
    const normalized = normalizeToolDisplayConfig(next);
    const requiresReload = ownershipChanged(config, normalized);
    config = normalized;

    const saved = saveToolDisplayConfig(normalized);
    if (!saved.success && saved.error) {
      ctx.ui.notify(saved.error, "error");
    }

    if (requiresReload) {
      ctx.ui.notify(
        "Tool ownership updates apply after /reload.",
        "warning",
      );
    }
  };

  // Register tool overrides with write-guard protection
  registerToolOverrides(pi, getEffectiveConfig);
  registerNativeUserMessageBox(pi, getConfig);
  registerToolDisplayCommand(pi, { getConfig, setConfig, getCapabilities });
  registerThinkingLabeling(pi);

  pi.on("session_start", async (_event, ctx) => {
    refreshCapabilities();
    if (pendingLoadError) {
      ctx.ui.notify(pendingLoadError, "warning");
      pendingLoadError = undefined;
    }
  });

  pi.on("before_agent_start", async () => {
    refreshCapabilities();
  });
}

// === Tool Overrides with Write Guard ===

function registerToolOverrides(
  pi: ExtensionAPI,
  getEffectiveConfig: () => ToolDisplayConfig,
): void {
  // Write tool with guard protection AND display enhancements
  pi.registerTool({
    name: "write",
    label: "Write",
    description:
      "Create a NEW file with the given content. Refuses if the file already exists — use edit to modify existing files. Parent directories are created automatically.",
    parameters: Type.Object({
      file_path: Type.String({ description: "Absolute file path" }),
      content: Type.String({ description: "Full file content" }),
    }),
    renderCall: (args, theme, context) => {
      const cfg = getEffectiveConfig();
      const filePath = String(args?.file_path ?? "");
      const content = String(args?.content ?? "");
      
      // Check if file exists for guard warning
      const fileExists = existsSync(filePath);
      
      const themeObj = theme as RenderTheme;
      const pathDisplay = shortenPath(filePath);
      const lineCount = content.split("\n").length;
      const sizeBytes = Buffer.byteLength(content, "utf8");
      
      const container = new Container();
      
      // Guard warning if file exists
      if (fileExists) {
        container.addChild(
          new Text(themeObj.fg("yellow", "⚠️ "), 0, 0),
        );
      }
      
      container.addChild(
        new Text(themeObj.bold("Write"), 0, 0),
      );
      container.addChild(new Spacer(1));
      container.addChild(
        new Text(themeObj.fg("cyan", pathDisplay), 0, 0),
      );
      container.addChild(new Spacer(1));
      container.addChild(
        new Text(
          themeObj.fg(
            "dim",
            `(${lineCount} lines, ${formatSize(sizeBytes)})`,
          ),
          0, 0,
        ),
      );
      
      if (fileExists) {
        container.addChild(new Spacer(1));
        container.addChild(
          new Text(themeObj.fg("red", "[WILL REFUSE - use Edit]"), 0, 0),
        );
      }
      
      return container;
    },
    async execute(_id, { file_path, content }) {
      // === WRITE GUARD PROTECTION ===
      if (existsSync(file_path)) {
        const recipe =
          `Error: Write refused — ${file_path} already exists.\n` +
          `\n` +
          `Write is only for creating NEW files. To change an existing file, use Edit:\n` +
          `  {"name": "Edit", "input": {"file_path": "${file_path}", ` +
          `"old_string": "<exact text currently in the file>", ` +
          `"new_string": "<replacement text>"}}\n` +
          `\n` +
          `If you do not already know the file's current content, Read it first to ` +
          `get the exact text for old_string. Include enough surrounding context ` +
          `(2-3 lines) to make old_string unique in the file.\n` +
          `\n` +
          `For multiple changes, emit multiple Edit calls — one per location. Do NOT ` +
          `retry Write; it will be refused again.`;
        return {
          content: [{ type: "text", text: recipe }],
          details: {},
          isError: true,
        };
      }

      try {
        mkdirSync(dirname(file_path), { recursive: true });
        writeFileSync(file_path, content, { encoding: "utf-8" });
        const lc =
          content.split("\n").length -
          (content.endsWith("\n") ? 1 : 0) +
          (content.length > 0 && !content.endsWith("\n") ? 1 : 0);
        return {
          content: [{ type: "text", text: `Created ${file_path} (${lc} lines)` }],
          details: {},
        };
      } catch (e) {
        return {
          content: [{ type: "text", text: `Error: ${(e as Error).message}` }],
          details: {},
          isError: true,
        };
      }
    },
    renderResult: (result, options, theme, context) => {
      const cfg = getEffectiveConfig();
      const themeObj = theme as RenderTheme;
      
      if (context.isError) {
        return new Text(extractTextOutput(result.content) ?? "Error", 0, 0);
      }
      
      // Use pi-tool-display style diff rendering for new files
      const text = extractTextOutput(result.content) ?? "";
      const match = text.match(/Created (.+) \((\d+) lines\)/);
      
      if (match && cfg.showWriteDiff) {
        const filePath = match[1];
        
        try {
          const content = readFileSync(filePath, "utf-8");
          return renderWriteDiffResult(filePath, "", content, themeObj, cfg);
        } catch {
          // Fallback to simple text
        }
      }
      
      return new Text(text, 0, 0);
    },
  });

}
