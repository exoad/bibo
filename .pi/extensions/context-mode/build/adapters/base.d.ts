/**
 * BaseAdapter — shared implementation for methods identical across all adapters.
 *
 * Eliminates ~288 lines of duplication across 12 adapters.
 * Each concrete adapter extends this and provides platform-specific logic.
 *
 * Shared methods:
 *   - getSessionDir()       — builds session dir from sessionDirSegments
 *   - getSessionDBPath()    — SHA-256 hash of projectDir → .db file
 *   - getSessionEventsPath()— SHA-256 hash of projectDir → -events.md file
 *   - backupSettings()      — copies settings file to .bak
 *
 * Adapters with custom logic override the relevant method:
 *   - vscode-copilot: overrides getSessionDir (checks .github dir)
 *   - opencode: overrides getSessionDir (XDG_CONFIG_HOME / APPDATA)
 *              and backupSettings (calls checkPluginRegistration first)
 *   - openclaw: overrides backupSettings (searches 3 config paths)
 */
export declare abstract class BaseAdapter {
    protected readonly sessionDirSegments: string[];
    constructor(sessionDirSegments: string[]);
    getSessionDir(): string;
    getSessionDBPath(projectDir: string): string;
    getSessionEventsPath(projectDir: string): string;
    backupSettings(): string | null;
    abstract getSettingsPath(): string;
}
