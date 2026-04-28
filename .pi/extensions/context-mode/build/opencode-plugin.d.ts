/**
 * OpenCode / KiloCode TypeScript plugin entry point for context-mode.
 *
 * Provides three hooks:
 *   - tool.execute.before  — Routing enforcement (deny/modify/passthrough)
 *   - tool.execute.after   — Session event capture
 *   - experimental.session.compacting — Compaction snapshot generation
 *
 * KiloCode loads this via: import("context-mode") → expects default export
 * with shape { server: (input) => Promise<Hooks> } (PluginModule).
 *
 * OpenCode loads this via: import("context-mode/plugin") → also supports
 * the named export ContextModePlugin for backward compat.
 *
 * Constraints:
 *   - No SessionStart hook (OpenCode doesn't support it — #14808, #5409)
 *   - No context injection (canInjectSessionContext: false)
 *   - No routing file auto-write (avoid dirtying project trees)
 *   - Session cleanup happens at plugin init (no SessionStart)
 */
/** KiloCode/OpenCode plugin input — both platforms pass at least `directory`. */
interface PluginContext {
    directory: string;
    [key: string]: unknown;
}
/** OpenCode tool.execute.before — first parameter */
interface BeforeHookInput {
    tool: string;
    sessionID: string;
    callID: string;
}
/** OpenCode tool.execute.before — second parameter */
interface BeforeHookOutput {
    args: any;
}
/** OpenCode tool.execute.after — first parameter */
interface AfterHookInput {
    tool: string;
    sessionID: string;
    callID: string;
    args: any;
}
/** OpenCode tool.execute.after — second parameter */
interface AfterHookOutput {
    title: string;
    output: string;
    metadata: any;
}
/** OpenCode experimental.session.compacting — first parameter */
interface CompactingHookInput {
    sessionID: string;
}
/** OpenCode experimental.session.compacting — second parameter */
interface CompactingHookOutput {
    context: string[];
    prompt?: string;
}
/**
 * Plugin factory. Called once when KiloCode/OpenCode loads the plugin.
 * Returns an object mapping hook event names to async handler functions.
 *
 * KiloCode expects: export default { server: (input) => Promise<Hooks> }
 * OpenCode expects: export const ContextModePlugin = (ctx) => Promise<Hooks>
 */
declare function createContextModePlugin(ctx: PluginContext): Promise<{
    "tool.execute.before": (input: BeforeHookInput, output: BeforeHookOutput) => Promise<void>;
    "tool.execute.after": (input: AfterHookInput, output: AfterHookOutput) => Promise<void>;
    "experimental.session.compacting": (input: CompactingHookInput, output: CompactingHookOutput) => Promise<string>;
}>;
declare const _default: {
    server: typeof createContextModePlugin;
};
export default _default;
export { createContextModePlugin as ContextModePlugin };
