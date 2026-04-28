/**
 * AnalyticsEngine — Runtime savings + session continuity reporting.
 *
 * Computes context-window savings from runtime stats and queries
 * session continuity data from SessionDB.
 *
 * Usage:
 *   const engine = new AnalyticsEngine(sessionDb);
 *   const report = engine.queryAll(runtimeStats);
 */
function semverNewer(a, b) {
    const pa = a.split(".").map(Number);
    const pb = b.split(".").map(Number);
    for (let i = 0; i < 3; i++) {
        if ((pa[i] ?? 0) > (pb[i] ?? 0))
            return true;
        if ((pa[i] ?? 0) < (pb[i] ?? 0))
            return false;
    }
    return false;
}
// ─────────────────────────────────────────────────────────
// Category labels and hints for session continuity display
// ─────────────────────────────────────────────────────────
/** Human-readable labels for event categories. */
export const categoryLabels = {
    file: "Files tracked",
    rule: "Project rules (CLAUDE.md)",
    prompt: "Your requests saved",
    mcp: "Plugin tools used",
    git: "Git operations",
    env: "Environment setup",
    error: "Errors caught",
    task: "Tasks in progress",
    decision: "Your decisions",
    cwd: "Working directory",
    skill: "Skills used",
    subagent: "Delegated work",
    intent: "Session mode",
    data: "Data references",
    role: "Behavioral directives",
};
/** Explains why each category matters for continuity. */
export const categoryHints = {
    file: "Restored after compact \u2014 no need to re-read",
    rule: "Your project instructions survive context resets",
    prompt: "Continues exactly where you left off",
    decision: "Applied automatically \u2014 won\u2019t ask again",
    task: "Picks up from where it stopped",
    error: "Tracked and monitored across compacts",
    git: "Branch, commit, and repo state preserved",
    env: "Runtime config carried forward",
    mcp: "Tool usage patterns remembered",
    subagent: "Delegation history preserved",
    skill: "Skill invocations tracked",
};
// ─────────────────────────────────────────────────────────
// AnalyticsEngine
// ─────────────────────────────────────────────────────────
export class AnalyticsEngine {
    db;
    /**
     * Create an AnalyticsEngine.
     *
     * Accepts either a SessionDB instance (extracts internal db via
     * the protected getter — use the static fromDB helper for raw adapters)
     * or any object with a prepare() method for direct usage.
     */
    constructor(db) {
        this.db = db;
    }
    // ═══════════════════════════════════════════════════════
    // GROUP 3 — Runtime (4 metrics, stubs)
    // ═══════════════════════════════════════════════════════
    /**
     * #1 Context Savings Total — bytes kept out of context window.
     *
     * Stub: requires server.ts to accumulate rawBytes and contextBytes
     * during a live session. Call with tracked values.
     */
    static contextSavingsTotal(rawBytes, contextBytes) {
        const savedBytes = rawBytes - contextBytes;
        const savedPercent = rawBytes > 0
            ? Math.round((savedBytes / rawBytes) * 1000) / 10
            : 0;
        return { rawBytes, contextBytes, savedBytes, savedPercent };
    }
    /**
     * #2 Think in Code Comparison — ratio of file size to sandbox output size.
     *
     * Stub: requires server.ts tracking of execute/execute_file calls.
     */
    static thinkInCodeComparison(fileBytes, outputBytes) {
        const ratio = outputBytes > 0
            ? Math.round((fileBytes / outputBytes) * 10) / 10
            : 0;
        return { fileBytes, outputBytes, ratio };
    }
    /**
     * #3 Tool Savings — per-tool breakdown of context savings.
     *
     * Stub: requires per-tool accumulators in server.ts.
     */
    static toolSavings(tools) {
        return tools.map((t) => ({
            ...t,
            savedBytes: t.rawBytes - t.contextBytes,
        }));
    }
    /**
     * #19 Sandbox I/O — total input/output bytes processed by the sandbox.
     *
     * Stub: requires PolyglotExecutor byte counters.
     */
    static sandboxIO(inputBytes, outputBytes) {
        return { inputBytes, outputBytes };
    }
    // ═══════════════════════════════════════════════════════
    // queryAll — single unified report from ONE source
    // ═══════════════════════════════════════════════════════
    /**
     * Build a FullReport by merging runtime stats (passed in)
     * with continuity data from the DB.
     *
     * This is the ONE call that ctx_stats should use.
     */
    queryAll(runtimeStats) {
        // ── Resolve latest session ID ──
        const latestSession = this.db.prepare("SELECT session_id FROM session_meta ORDER BY started_at DESC LIMIT 1").get();
        const sid = latestSession?.session_id ?? "";
        // ── Runtime savings ──
        const totalBytesReturned = Object.values(runtimeStats.bytesReturned).reduce((sum, b) => sum + b, 0);
        const totalCalls = Object.values(runtimeStats.calls).reduce((sum, c) => sum + c, 0);
        const keptOut = runtimeStats.bytesIndexed + runtimeStats.bytesSandboxed;
        const totalProcessed = keptOut + totalBytesReturned;
        const savingsRatio = totalProcessed / Math.max(totalBytesReturned, 1);
        const reductionPct = totalProcessed > 0
            ? Math.round((1 - totalBytesReturned / totalProcessed) * 100)
            : 0;
        const toolNames = new Set([
            ...Object.keys(runtimeStats.calls),
            ...Object.keys(runtimeStats.bytesReturned),
        ]);
        const byTool = Array.from(toolNames).sort().map((tool) => ({
            tool,
            calls: runtimeStats.calls[tool] || 0,
            context_kb: Math.round((runtimeStats.bytesReturned[tool] || 0) / 1024 * 10) / 10,
            tokens: Math.round((runtimeStats.bytesReturned[tool] || 0) / 4),
        }));
        const uptimeMs = Date.now() - runtimeStats.sessionStart;
        const uptimeMin = (uptimeMs / 60_000).toFixed(1);
        // ── Cache ──
        let cache;
        if (runtimeStats.cacheHits > 0 || runtimeStats.cacheBytesSaved > 0) {
            const totalWithCache = totalProcessed + runtimeStats.cacheBytesSaved;
            const totalSavingsRatio = totalWithCache / Math.max(totalBytesReturned, 1);
            const ttlHoursLeft = Math.max(0, 24 - Math.floor((Date.now() - runtimeStats.sessionStart) / (60 * 60 * 1000)));
            cache = {
                hits: runtimeStats.cacheHits,
                bytes_saved: runtimeStats.cacheBytesSaved,
                ttl_hours_left: ttlHoursLeft,
                total_with_cache: totalWithCache,
                total_savings_ratio: totalSavingsRatio,
            };
        }
        // ── Continuity data (scoped to current session) ──
        const eventTotal = this.db.prepare("SELECT COUNT(*) as cnt FROM session_events WHERE session_id = ?").get(sid).cnt;
        const byCategory = this.db.prepare("SELECT category, COUNT(*) as cnt FROM session_events WHERE session_id = ? GROUP BY category ORDER BY cnt DESC").all(sid);
        const meta = this.db.prepare("SELECT compact_count FROM session_meta WHERE session_id = ?").get(sid);
        const compactCount = meta?.compact_count ?? 0;
        const resume = this.db.prepare("SELECT event_count, consumed FROM session_resume WHERE session_id = ? ORDER BY created_at DESC LIMIT 1").get(sid);
        const resumeReady = resume ? !resume.consumed : false;
        // Build category previews (current session only)
        const previewRows = this.db.prepare("SELECT category, type, data FROM session_events WHERE session_id = ? ORDER BY id DESC").all(sid);
        const previews = new Map();
        for (const row of previewRows) {
            if (!previews.has(row.category))
                previews.set(row.category, new Set());
            const set = previews.get(row.category);
            if (set.size < 5) {
                let display = row.data;
                if (row.category === "file") {
                    display = row.data.split("/").pop() || row.data;
                }
                else if (row.category === "prompt") {
                    display = display.length > 50 ? display.slice(0, 47) + "..." : display;
                }
                if (display.length > 40)
                    display = display.slice(0, 37) + "...";
                set.add(display);
            }
        }
        const continuityByCategory = byCategory.map((row) => ({
            category: row.category,
            count: row.cnt,
            label: categoryLabels[row.category] || row.category,
            preview: previews.get(row.category)
                ? Array.from(previews.get(row.category)).join(", ")
                : "",
            why: categoryHints[row.category] || "Survives context resets",
        }));
        // ── Project-wide persistent memory (all sessions, no session_id filter) ──
        const projectTotals = this.db.prepare("SELECT COUNT(*) as cnt, COUNT(DISTINCT session_id) as sessions FROM session_events").get();
        const projectByCategory = this.db.prepare("SELECT category, COUNT(*) as cnt FROM session_events GROUP BY category ORDER BY cnt DESC").all();
        const projectMemoryByCategory = projectByCategory
            .filter((row) => row.cnt > 0)
            .map((row) => ({
            category: row.category,
            count: row.cnt,
            label: categoryLabels[row.category] || row.category,
        }));
        return {
            savings: {
                processed_kb: Math.round(totalProcessed / 1024 * 10) / 10,
                entered_kb: Math.round(totalBytesReturned / 1024 * 10) / 10,
                saved_kb: Math.round(keptOut / 1024 * 10) / 10,
                pct: reductionPct,
                savings_ratio: Math.round(savingsRatio * 10) / 10,
                by_tool: byTool,
                total_calls: totalCalls,
                total_bytes_returned: totalBytesReturned,
                kept_out: keptOut,
                total_processed: totalProcessed,
            },
            cache,
            session: {
                id: sid,
                uptime_min: uptimeMin,
            },
            continuity: {
                total_events: eventTotal,
                by_category: continuityByCategory,
                compact_count: compactCount,
                resume_ready: resumeReady,
            },
            projectMemory: {
                total_events: projectTotals.cnt,
                session_count: projectTotals.sessions,
                by_category: projectMemoryByCategory,
            },
        };
    }
}
// ─────────────────────────────────────────────────────────
// formatReport — renders FullReport as sales-grade savings dashboard
// ─────────────────────────────────────────────────────────
/** Format bytes as human-readable KB or MB. */
function kb(b) {
    if (b >= 1024 * 1024)
        return `${(b / 1024 / 1024).toFixed(1)} MB`;
    if (b >= 1024)
        return `${(b / 1024).toFixed(1)} KB`;
    return `${Math.round(b)} B`;
}
/** Format session uptime as human-readable duration. */
function formatDuration(uptimeMin) {
    const min = parseFloat(uptimeMin);
    if (isNaN(min) || min < 1)
        return "< 1 min";
    if (min < 60)
        return `${Math.round(min)} min`;
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
/** Format large numbers with K/M suffixes */
function fmtNum(n) {
    if (n >= 1_000_000)
        return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)
        return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}
/**
 * Build a proportional bar using █ chars, scaled to a fixed width.
 * Returns e.g. "████████████████████████████████████████" for full width.
 */
function dataBar(bytes, maxBytes, width = 40) {
    if (maxBytes <= 0)
        return "░".repeat(width);
    const filled = Math.max(1, Math.round((bytes / maxBytes) * width));
    return "█".repeat(Math.min(filled, width)) + "░".repeat(Math.max(0, width - filled));
}
/**
 * Render project memory section with category bars.
 * Shows persistent event data across all sessions.
 */
function renderProjectMemory(pm) {
    if (pm.total_events === 0)
        return [];
    const out = [];
    out.push("");
    const sessionLabel = pm.session_count === 1 ? "1 session" : `${pm.session_count} sessions`;
    out.push(`${fmtNum(pm.total_events)} events remembered across ${sessionLabel} \u2014 searchable after compact & restart`);
    out.push("");
    const maxCount = pm.by_category.length > 0 ? pm.by_category[0].count : 1;
    for (const cat of pm.by_category) {
        out.push(`  ${cat.label.padEnd(18)} ${String(cat.count).padStart(5)}   ${dataBar(cat.count, maxCount, 30)}`);
    }
    return out;
}
/**
 * Render a FullReport as a visual savings dashboard designed for screenshotting.
 *
 * Design principles:
 * - Before/After comparison bar is the HERO — one glance = "wow"
 * - "tokens saved" is the number people share
 * - Per-tool breakdown shows what each tool SAVED, sorted by impact
 * - Project memory: category bars showing persistent data across sessions
 * - No: Pct column, category tables, tips, jargon
 */
export function formatReport(report, version, latestVersion) {
    const lines = [];
    const duration = formatDuration(report.session.uptime_min);
    // ── Compute real savings ──
    const totalKeptOut = report.savings.kept_out + (report.cache ? report.cache.bytes_saved : 0);
    const totalReturned = report.savings.total_bytes_returned;
    const totalCalls = report.savings.total_calls;
    const grandTotal = totalKeptOut + totalReturned;
    const savingsPct = grandTotal > 0 ? (totalKeptOut / grandTotal) * 100 : 0;
    const tokensSaved = Math.round(totalKeptOut / 4);
    // ── Fresh session: no savings yet ──
    if (totalKeptOut === 0) {
        lines.push(`context-mode  ${duration}  ${totalCalls} calls`);
        lines.push("");
        if (totalCalls === 0) {
            lines.push("No tool calls yet. Use batch_execute or execute to start saving tokens.");
        }
        else {
            lines.push(`${kb(totalReturned)} entered context  |  0 tokens saved`);
        }
        // Project memory
        lines.push(...renderProjectMemory(report.projectMemory));
        // Footer
        lines.push("");
        const versionStr = version ? `v${version}` : "context-mode";
        lines.push(versionStr);
        if (version && latestVersion && latestVersion !== "unknown" && semverNewer(latestVersion, version)) {
            lines.push(`Update available: v${version} -> v${latestVersion}  |  ctx_upgrade`);
        }
        return lines.join("\n");
    }
    // ── Active session: visual savings dashboard ──
    // Line 1: Hero metric — the screenshottable number
    lines.push(`${fmtNum(tokensSaved)} tokens saved  ·  ${savingsPct.toFixed(1)}% reduction  ·  ${duration}`);
    lines.push("");
    // Lines 2-3: Before/After comparison bars — the visual proof
    lines.push(`Without context-mode  |${dataBar(grandTotal, grandTotal)}| ${kb(grandTotal)}`);
    lines.push(`With context-mode     |${dataBar(totalReturned, grandTotal)}| ${kb(totalReturned)}`);
    lines.push("");
    // Value statement — the line people share
    lines.push(`${kb(totalKeptOut)} kept out of your conversation. Never entered context.`);
    lines.push("");
    // Compact stats row
    const statParts = [`${totalCalls} calls`];
    if (report.cache && report.cache.hits > 0) {
        statParts.push(`${report.cache.hits} cache hits (+${kb(report.cache.bytes_saved)})`);
    }
    lines.push(statParts.join("  ·  "));
    // ── Per-tool breakdown (only if 2+ tools, sorted by saved) ──
    const activatedTools = report.savings.by_tool.filter((t) => t.calls > 0);
    if (activatedTools.length >= 2) {
        lines.push("");
        // Estimate per-tool saved using global savings ratio
        const toolRows = activatedTools.map((t) => {
            const returnedBytes = t.context_kb * 1024;
            const estimatedTotal = savingsPct < 100
                ? returnedBytes / (1 - savingsPct / 100)
                : returnedBytes;
            const estimatedSaved = Math.max(0, estimatedTotal - returnedBytes);
            return { ...t, returnedBytes, estimatedSaved };
        }).sort((a, b) => b.estimatedSaved - a.estimatedSaved);
        // Compact table: tool name, calls, saved
        for (const t of toolRows) {
            const name = t.tool.length > 22 ? t.tool.slice(0, 19) + "..." : t.tool;
            lines.push(`  ${name.padEnd(22)}  ${String(t.calls).padStart(4)} calls  ${kb(t.estimatedSaved).padStart(8)} saved`);
        }
    }
    // ── Project memory — persistent across sessions ──
    lines.push(...renderProjectMemory(report.projectMemory));
    // ── Footer ──
    lines.push("");
    const versionStr = version ? `v${version}` : "context-mode";
    lines.push(versionStr);
    if (version && latestVersion && latestVersion !== "unknown" && latestVersion !== version) {
        lines.push(`Update available: v${version} -> v${latestVersion}  |  ctx_upgrade`);
    }
    return lines.join("\n");
}
