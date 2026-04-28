/**
 * adapters/detect — Auto-detect which platform is running.
 *
 * Detection priority:
 *   1. Environment variables (high confidence)
 *   2. Config directory existence (medium confidence)
 *   3. Fallback to Claude Code (low confidence — most common)
 *
 * Verified env vars per platform (from source code audit):
 *   - Claude Code:    CLAUDE_PROJECT_DIR, CLAUDE_SESSION_ID | ~/.claude/
 *   - Gemini CLI:     GEMINI_PROJECT_DIR (hooks), GEMINI_CLI (MCP) | ~/.gemini/
 *   - KiloCode:       KILO, KILO_PID | ~/.config/kilo/
 *   - OpenCode:       OPENCODE, OPENCODE_PID | ~/.config/opencode/
 *   - OpenClaw:       OPENCLAW_HOME, OPENCLAW_CLI | ~/.openclaw/
 *   - Codex CLI:      CODEX_CI, CODEX_THREAD_ID | ~/.codex/
 *   - Cursor:         CURSOR_TRACE_ID (MCP), CURSOR_CLI (terminal) | ~/.cursor/
 *   - VS Code Copilot: VSCODE_PID, VSCODE_CWD | ~/.vscode/
 *   - JetBrains Copilot: IDEA_INITIAL_DIRECTORY, IDEA_HOME, JETBRAINS_CLIENT_ID | ~/.config/JetBrains/
 */
import type { PlatformId, DetectionSignal, HookAdapter } from "./types.js";
/**
 * High-confidence env vars per platform, checked in priority order.
 * Single source of truth — consumed by detectPlatform() below and by
 * tests that need to clear platform-related env vars deterministically.
 */
export declare const PLATFORM_ENV_VARS: readonly [readonly ["claude-code", readonly ["CLAUDE_PROJECT_DIR", "CLAUDE_SESSION_ID"]], readonly ["gemini-cli", readonly ["GEMINI_PROJECT_DIR", "GEMINI_CLI"]], readonly ["openclaw", readonly ["OPENCLAW_HOME", "OPENCLAW_CLI"]], readonly ["kilo", readonly ["KILO", "KILO_PID"]], readonly ["opencode", readonly ["OPENCODE", "OPENCODE_PID"]], readonly ["codex", readonly ["CODEX_CI", "CODEX_THREAD_ID"]], readonly ["cursor", readonly ["CURSOR_TRACE_ID", "CURSOR_CLI"]], readonly ["vscode-copilot", readonly ["VSCODE_PID", "VSCODE_CWD"]], readonly ["jetbrains-copilot", readonly ["IDEA_INITIAL_DIRECTORY", "IDEA_HOME", "JETBRAINS_CLIENT_ID"]], readonly ["qwen-code", readonly ["QWEN_PROJECT_DIR", "QWEN_SESSION_ID"]]];
/**
 * Detect the current platform by checking env vars and config dirs.
 *
 * @param clientInfo - Optional MCP clientInfo from initialize handshake.
 *   When provided, takes highest priority (zero-config detection).
 */
export declare function detectPlatform(clientInfo?: {
    name: string;
    version?: string;
}): DetectionSignal;
/**
 * Get the adapter instance for a given platform.
 * Lazily imports platform-specific adapter modules.
 */
export declare function getAdapter(platform?: PlatformId): Promise<HookAdapter>;
